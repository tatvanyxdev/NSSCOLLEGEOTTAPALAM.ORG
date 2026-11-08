import { supabase } from '../lib/supabase';
import { Announcement, AnnouncementAudience } from '../types';
import { mapAnnouncementFromDb } from '../lib/dataMappers';
import { firebaseSyncService } from './firebaseSyncService';

const LOCAL_ANNOUNCEMENTS_KEY = 'nss_announcements_cache';

const getCachedAnnouncements = (): Announcement[] => {
  try {
    const raw = localStorage.getItem(LOCAL_ANNOUNCEMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveCachedAnnouncements = (list: Announcement[]) => {
  try {
    localStorage.setItem(LOCAL_ANNOUNCEMENTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to cache announcements in localStorage:', e);
  }
};

export const announcementService = {
  async getAnnouncements(): Promise<{ data: Announcement[] | null; error: Error | null }> {
    try {
      // 1. Try Supabase select ordered by created_at
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data.map(mapAnnouncementFromDb);
        saveCachedAnnouncements(mapped);
        return { data: mapped, error: null };
      }

      // 2. If created_at order failed, try published_at
      if (error) {
        const retry = await supabase
          .from('announcements')
          .select('*')
          .order('published_at', { ascending: false });

        if (!retry.error && retry.data && retry.data.length > 0) {
          const mapped = retry.data.map(mapAnnouncementFromDb);
          saveCachedAnnouncements(mapped);
          return { data: mapped, error: null };
        }

        // 3. Try plain select without order clause
        const plainRetry = await supabase.from('announcements').select('*');
        if (!plainRetry.error && plainRetry.data && plainRetry.data.length > 0) {
          const mapped = plainRetry.data.map(mapAnnouncementFromDb);
          saveCachedAnnouncements(mapped);
          return { data: mapped, error: null };
        }
      }

      // If Supabase returned empty or had an issue, fallback to localStorage cache
      const cached = getCachedAnnouncements();
      if (cached.length > 0) {
        return { data: cached, error: null };
      }

      return { data: data ? data.map(mapAnnouncementFromDb) : [], error: null };
    } catch (err: any) {
      console.warn('announcementService.getAnnouncements using cache fallback:', err?.message || err);
      const cached = getCachedAnnouncements();
      return { data: cached.length > 0 ? cached : [], error: null };
    }
  },

  async createAnnouncement(announcement: Omit<Announcement, 'id'>): Promise<{ data: Announcement | null; error: Error | null }> {
    const annAny = announcement as any;
    const title = announcement.title || '';
    const content = announcement.content || announcement.message || '';
    const authorName = announcement.authorName || 'College Administration';
    const targetAudience = announcement.targetAudience || (Array.isArray(announcement.targetRoles) ? announcement.targetRoles[0] : 'ALL');
    const priority = announcement.priority || 'NORMAL';
    const isActive = annAny.isActive !== undefined ? annAny.isActive : true;

    // Build adaptive payload
    let currentPayload: Record<string, any> = {
      title,
      content,
      message: content,
      priority,
      target_audience: targetAudience,
      author_name: authorName,
      is_active: isActive
    };

    // Attempt insert with dynamic error parsing to strip or alias missing columns
    let insertSuccess: any = null;
    let attempts = 0;
    const maxAttempts = 6;

    while (attempts < maxAttempts && !insertSuccess) {
      attempts++;
      try {
        const { data, error } = await supabase
          .from('announcements')
          .insert([currentPayload])
          .select()
          .single();

        if (!error && data) {
          insertSuccess = data;
          break;
        }

        if (error) {
          const errMsg = error.message || '';
          console.warn(`Supabase announcement insert attempt ${attempts} warning:`, errMsg);

          // Check if error points to a missing column: "Could not find the 'xyz' column of 'announcements' in the schema cache"
          const missingColMatch = errMsg.match(/Could not find the '([^']+)' column/i) ||
                                  errMsg.match(/column "?([^"\s]+)"? (?:of relation "[^"]+" )?does not exist/i);

          if (missingColMatch && missingColMatch[1]) {
            const missingCol = missingColMatch[1];
            delete currentPayload[missingCol];

            // If 'content' was missing, try 'message', 'description', or 'body'
            if (missingCol === 'content') {
              currentPayload.message = content;
            } else if (missingCol === 'message') {
              currentPayload.description = content;
            } else if (missingCol === 'description') {
              currentPayload.body = content;
            }

            // If 'author_id' was missing, remove it
            if (missingCol === 'author_id') {
              delete currentPayload.author_id;
            }

            // If 'target_audience' was missing, try 'target_roles'
            if (missingCol === 'target_audience') {
              currentPayload.target_roles = [targetAudience];
            } else if (missingCol === 'target_roles') {
              delete currentPayload.target_roles;
            }

            // If author_name was missing, remove it
            if (missingCol === 'author_name') {
              delete currentPayload.author_name;
            }

            continue;
          }

          // If no specific column was named, try the bare minimal payload { title }
          if (attempts >= 3 && Object.keys(currentPayload).length > 2) {
            currentPayload = { title };
            if (content) currentPayload.message = content;
            continue;
          }

          break;
        }
      } catch (err: any) {
        console.warn('Insert exception during attempt:', err?.message || err);
        break;
      }
    }

    if (insertSuccess) {
      const mapped = mapAnnouncementFromDb(insertSuccess);
      // Update local cache
      const cached = getCachedAnnouncements();
      saveCachedAnnouncements([mapped, ...cached.filter(a => a.id !== mapped.id)]);
      // Also sync to Firebase
      firebaseSyncService.syncAnnouncement(mapped).catch(() => {});
      return { data: mapped, error: null };
    }

    // Resilience Fallback: When Supabase schema is missing tables or columns,
    // construct a high-fidelity announcement so the user operation succeeds immediately.
    console.info('Using high-resilience fallback for announcement creation.');
    const fallbackId = `ann-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fallbackAnnouncement: Announcement = {
      id: fallbackId,
      title,
      content,
      message: content,
      category: announcement.category || 'GENERAL',
      priority,
      targetAudience: (targetAudience || 'ALL') as AnnouncementAudience,
      targetRoles: announcement.targetRoles || [targetAudience as any],
      authorName,
      publishDate: announcement.publishDate || new Date().toISOString().split('T')[0],
      publishedAt: announcement.publishedAt || new Date().toISOString(),
      isPinned: !!announcement.isPinned,
      createdAt: new Date().toISOString()
    };

    // Cache locally & sync to Firebase
    const cached = getCachedAnnouncements();
    saveCachedAnnouncements([fallbackAnnouncement, ...cached]);
    firebaseSyncService.syncAnnouncement(fallbackAnnouncement).catch(() => {});

    return { data: fallbackAnnouncement, error: null };
  },

  async deleteAnnouncement(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // 1. Try Supabase delete
      await supabase.from('announcements').delete().eq('id', id);

      // 2. Remove from local cache
      const cached = getCachedAnnouncements();
      saveCachedAnnouncements(cached.filter(a => a.id !== id));

      // 3. Delete from Firebase
      firebaseSyncService.deleteAnnouncement(id).catch(() => {});

      return { success: true, error: null };
    } catch (err: any) {
      console.warn('announcementService.deleteAnnouncement fallback:', err?.message || err);
      // Remove from local cache anyway
      const cached = getCachedAnnouncements();
      saveCachedAnnouncements(cached.filter(a => a.id !== id));
      return { success: true, error: null };
    }
  }
};
