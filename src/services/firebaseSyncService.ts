import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  deleteDoc
} from 'firebase/firestore';
import {
  auth as firebaseAuth,
  db,
  isFirestoreQuotaBlocked,
  isQuotaExhaustedError,
  markFirestoreQuotaBlocked,
  isFirestoreOffline,
  isConnectivityError,
  markFirestoreTemporarilyOffline
} from '../lib/firebase';
import { SpecialAttendanceEvent, SpecialAttendanceStatus, Announcement } from '../types';

const SPECIAL_EVENTS_COLLECTION = 'special_attendance_events';
const ANNOUNCEMENTS_COLLECTION = 'announcements';
const GOOGLE_LINKS_COLLECTION = 'google_account_links';

export interface GoogleAccountLink {
  id: string;
  email: string;
  userType: 'STUDENT' | 'STAFF' | 'SUPER_ADMIN';
  profileId: string;
  name?: string;
  identifier?: string;
  linkedAt: string;
}

export interface FreeTierHealthStats {
  estimatedStudents: number;
  dailyReadUsagePercent: number;
  dailyWriteUsagePercent: number;
  storageUsageMb: number;
  maxFreeStorageMb: number;
  maxDailyReads: number;
  maxDailyWrites: number;
  status: 'EXCELLENT' | 'OPTIMAL' | 'ELEVATED';
  strategySummary: string;
}

function hasVerifiedFirebaseUser(): boolean {
  return Boolean(
    firebaseAuth.currentUser &&
      firebaseAuth.currentUser.email &&
      firebaseAuth.currentUser.emailVerified
  );
}

// Clear any legacy local Google link PII cache on load or logout
function purgeLegacyGoogleLinkCache(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('nss_google_account_links');
  } catch {
    // ignore storage errors
  }
}

if (typeof window !== 'undefined') {
  purgeLegacyGoogleLinkCache();
  window.addEventListener('nss-auth-logout', purgeLegacyGoogleLinkCache);
}

export const firebaseSyncService = {
  // ---------------------------------------------------------------------------
  // 1. Special & Union Attendance Events Sync
  // Authoritative writes happen in PostgreSQL via RLS/RPCs.
  // ---------------------------------------------------------------------------
  async syncSpecialAttendanceEvent(_event: SpecialAttendanceEvent): Promise<boolean> {
    return false;
  },

  async updateSpecialAttendanceStatus(
    _eventId: string,
    _status: SpecialAttendanceStatus,
    _principalRemarks?: string,
    _approvedBy?: string,
    _approvedByName?: string
  ): Promise<boolean> {
    return false;
  },

  subscribeSpecialEvents(callback: (events: SpecialAttendanceEvent[]) => void): () => void {
    if (isFirestoreOffline() || !hasVerifiedFirebaseUser()) return () => {};
    try {
      const q = query(
        collection(db, SPECIAL_EVENTS_COLLECTION),
        orderBy('eventDate', 'desc'),
        limit(50)
      );
      return onSnapshot(
        q,
        (snapshot) => {
          const events: SpecialAttendanceEvent[] = [];
          snapshot.forEach((d) => {
            events.push(d.data() as SpecialAttendanceEvent);
          });
          callback(events);
        },
        (error) => {
          if (isQuotaExhaustedError(error)) {
            markFirestoreQuotaBlocked(error);
          } else if (isConnectivityError(error)) {
            markFirestoreTemporarilyOffline();
          } else {
            console.warn('Firebase special events subscription warning (handled):', error?.message || error);
          }
        }
      );
    } catch (err) {
      console.warn('Firebase subscribeSpecialEvents setup fallback:', err);
      return () => {};
    }
  },

  async deleteSpecialAttendanceEvent(_eventId: string): Promise<boolean> {
    return false;
  },

  // ---------------------------------------------------------------------------
  // 2. Announcements & Digital Notice Board Real-time Sync
  // Authoritative writes happen in PostgreSQL via RLS/RPCs.
  // ---------------------------------------------------------------------------
  async syncAnnouncement(_ann: Announcement): Promise<boolean> {
    return false;
  },

  async deleteAnnouncement(_annId: string): Promise<boolean> {
    return false;
  },

  subscribeAnnouncements(callback: (announcements: Announcement[]) => void): () => void {
    if (isFirestoreOffline() || !hasVerifiedFirebaseUser()) return () => {};
    try {
      const q = query(
        collection(db, ANNOUNCEMENTS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(25)
      );
      return onSnapshot(
        q,
        (snapshot) => {
          const list: Announcement[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as Announcement);
          });
          callback(list);
        },
        (err) => {
          if (isQuotaExhaustedError(err)) {
            markFirestoreQuotaBlocked(err);
          } else if (isConnectivityError(err)) {
            markFirestoreTemporarilyOffline();
          } else {
            console.warn('Firebase announcements subscription warning (handled):', err?.message || err);
          }
        }
      );
    } catch (err) {
      console.warn('Firebase subscribeAnnouncements setup fallback:', err);
      return () => {};
    }
  },

  // ---------------------------------------------------------------------------
  // 3. Pre-Aggregated Student Attendance Ledger (Disabled in Firestore for PII protection)
  // ---------------------------------------------------------------------------
  async syncStudentAttendanceSummary(_summary: {
    studentId: string;
    rollNumber: string;
    admissionNumber?: string;
    fullName: string;
    regularPercentage: number;
    consolidatedPercentage: number;
    hourWisePercentage?: number;
    attendancePolicy?: 'HOUR_WISE' | 'SESSION_STRICT';
    totalConducted: number;
    totalPresent: number;
    totalWorkingDays?: number;
    awardedDays?: number;
    specialDutyApprovedCount: number;
    specialDutyPendingCount: number;
  }): Promise<boolean> {
    return false;
  },

  // ---------------------------------------------------------------------------
  // 4. Free-Plan Economics & Quota Health Calculator
  // ---------------------------------------------------------------------------
  getFreePlanHealthStats(studentCount: number = 400): FreeTierHealthStats {
    const estimatedDailyReads = studentCount * 1.5 + 150;
    const maxDailyReads = 50000;
    const dailyReadUsagePercent = Number(((estimatedDailyReads / maxDailyReads) * 100).toFixed(2));

    const estimatedDailyWrites = 45;
    const maxDailyWrites = 20000;
    const dailyWriteUsagePercent = Number(((estimatedDailyWrites / maxDailyWrites) * 100).toFixed(2));

    const storageUsageMb = Number((1.2 + studentCount * 0.002).toFixed(2));
    const maxFreeStorageMb = 1024;

    return {
      estimatedStudents: studentCount,
      dailyReadUsagePercent,
      dailyWriteUsagePercent,
      storageUsageMb,
      maxFreeStorageMb,
      maxDailyReads,
      maxDailyWrites,
      status: dailyReadUsagePercent < 5 ? 'EXCELLENT' : 'OPTIMAL',
      strategySummary:
        'PostgreSQL RLS Primary Store Active; Firestore scoped exclusively to verified Google Auth owner links.'
    };
  },

  // ---------------------------------------------------------------------------
  // 5. Google Account Links (Verified Owner-Scoped Firestore Sync; Zero Local PII Cache)
  // ---------------------------------------------------------------------------
  async syncGoogleAccountLink(link: GoogleAccountLink): Promise<boolean> {
    purgeLegacyGoogleLinkCache();
    if (isFirestoreQuotaBlocked() || !hasVerifiedFirebaseUser()) return false;

    const authedEmail = firebaseAuth.currentUser?.email?.toLowerCase().trim();
    const targetEmail = link.email.toLowerCase().trim();
    if (!authedEmail || authedEmail !== targetEmail) {
      return false;
    }

    try {
      const docId = link.id || targetEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
      const docRef = doc(db, GOOGLE_LINKS_COLLECTION, docId);
      await setDoc(
        docRef,
        {
          id: docId,
          email: targetEmail,
          userType: link.userType,
          profileId: link.profileId,
          name: link.name || '',
          identifier: link.identifier || '',
          linkedAt: link.linkedAt || new Date().toISOString()
        },
        { merge: true }
      );
      return true;
    } catch (err) {
      if (isQuotaExhaustedError(err)) {
        markFirestoreQuotaBlocked(err);
      } else {
        console.warn('Firebase syncGoogleAccountLink error (handled):', err);
      }
      return false;
    }
  },

  async getGoogleAccountLink(email: string): Promise<GoogleAccountLink | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || isFirestoreOffline() || !hasVerifiedFirebaseUser()) return null;

    const authedEmail = firebaseAuth.currentUser?.email?.toLowerCase().trim();
    if (!authedEmail || authedEmail !== cleanEmail) return null;

    try {
      const docId = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
      const docRef = doc(db, GOOGLE_LINKS_COLLECTION, docId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as GoogleAccountLink;
      }
    } catch (err) {
      if (isQuotaExhaustedError(err)) {
        markFirestoreQuotaBlocked(err);
      } else if (isConnectivityError(err)) {
        markFirestoreTemporarilyOffline();
      } else {
        console.warn('Firebase getGoogleAccountLink query error (handled):', err);
      }
    }
    return null;
  },

  async deleteGoogleAccountLink(email: string): Promise<boolean> {
    purgeLegacyGoogleLinkCache();
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || isFirestoreQuotaBlocked() || !hasVerifiedFirebaseUser()) return false;

    const authedEmail = firebaseAuth.currentUser?.email?.toLowerCase().trim();
    if (!authedEmail || authedEmail !== cleanEmail) return false;

    try {
      const docId = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
      const docRef = doc(db, GOOGLE_LINKS_COLLECTION, docId);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      if (isQuotaExhaustedError(err)) {
        markFirestoreQuotaBlocked(err);
      } else {
        console.warn('Firebase deleteGoogleAccountLink error (handled):', err);
      }
      return false;
    }
  },

  getLocalGoogleLinks(): Record<string, GoogleAccountLink> {
    return {};
  }
};
