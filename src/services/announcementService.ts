import { supabase } from '../lib/supabase';
import { Announcement } from '../types';
import { mapAnnouncementFromDb } from '../lib/dataMappers';

export const announcementService = {
  async getAnnouncements(): Promise<{ data: Announcement[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      return { data: (data || []).map(mapAnnouncementFromDb), error: null };
    } catch (err: any) {
      console.warn('announcementService.getAnnouncements fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async createAnnouncement(announcement: Omit<Announcement, 'id'>): Promise<{ data: Announcement | null; error: Error | null }> {
    try {
      const annAny = announcement as any;
      const payload = {
        title: announcement.title,
        content: announcement.content || announcement.message || '',
        category: announcement.category || 'GENERAL',
        published_at: announcement.publishedAt || announcement.publishDate || new Date().toISOString(),
        expiry_date: announcement.expiryDate || null,
        author_id: annAny.authorFacultyId || annAny.authorId || null,
        target_roles: announcement.targetRoles || ['ALL'],
        department_id: announcement.targetDepartmentId || null,
        is_pinned: !!announcement.isPinned,
        is_active: annAny.isActive !== undefined ? annAny.isActive : true
      };
      const { data, error } = await supabase.from('announcements').insert([payload]).select().single();
      if (error) throw error;
      return { data: data ? mapAnnouncementFromDb(data) : null, error: null };
    } catch (err: any) {
      console.warn('announcementService.createAnnouncement fallback:', err?.message || err);
      return { data: null, error: err };
    }
  },

  async deleteAnnouncement(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.warn('announcementService.deleteAnnouncement fallback:', err?.message || err);
      return { success: false, error: err };
    }
  }
};
