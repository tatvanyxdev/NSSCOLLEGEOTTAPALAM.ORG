import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { SpecialAttendanceEvent, SpecialAttendanceStatus, Announcement } from '../types';

const SPECIAL_EVENTS_COLLECTION = 'special_attendance_events';
const ANNOUNCEMENTS_COLLECTION = 'announcements';
const STUDENT_SUMMARIES_COLLECTION = 'student_attendance_summaries';
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

export const firebaseSyncService = {
  // ---------------------------------------------------------------------------
  // 1. Special & Union Attendance Events Sync
  // ---------------------------------------------------------------------------
  async syncSpecialAttendanceEvent(event: SpecialAttendanceEvent): Promise<boolean> {
    try {
      const docRef = doc(db, SPECIAL_EVENTS_COLLECTION, event.id);
      await setDoc(docRef, {
        id: event.id,
        title: event.title,
        description: event.description || '',
        eventType: event.eventType,
        eventDate: event.eventDate,
        periodIds: event.periodIds || [],
        isFullDay: !!event.isFullDay,
        scopeType: event.scopeType,
        departmentId: event.departmentId || null,
        studentCoverage: event.studentCoverage || 'ALL_ELIGIBLE',
        selectedStudentIds: event.selectedStudentIds || [],
        reason: event.reason,
        dutyCertificateRef: event.dutyCertificateRef || null,
        forwardedByHodId: event.forwardedByHodId || null,
        forwardedByHodName: event.forwardedByHodName || null,
        forwardedAt: event.forwardedAt || null,
        approvedBy: event.approvedBy || null,
        approvedByName: event.approvedByName || null,
        principalRemarks: event.principalRemarks || null,
        principalActionAt: event.principalActionAt || null,
        status: event.status,
        createdBy: event.createdBy || null,
        createdByName: event.createdByName || null,
        createdByRole: event.createdByRole || null,
        createdAt: event.createdAt || new Date().toISOString(),
        updatedAt: event.updatedAt || new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (err) {
      console.warn('Firebase syncSpecialAttendanceEvent error (handled):', err);
      return false;
    }
  },

  async updateSpecialAttendanceStatus(
    eventId: string,
    status: SpecialAttendanceStatus,
    principalRemarks?: string,
    approvedBy?: string,
    approvedByName?: string
  ): Promise<boolean> {
    try {
      const docRef = doc(db, SPECIAL_EVENTS_COLLECTION, eventId);
      const timestamp = new Date().toISOString();
      await setDoc(docRef, {
        status,
        principalRemarks: principalRemarks || null,
        approvedBy: approvedBy || null,
        approvedByName: approvedByName || null,
        principalActionAt: timestamp,
        updatedAt: timestamp
      }, { merge: true });
      return true;
    } catch (err) {
      console.warn('Firebase updateSpecialAttendanceStatus error (handled):', err);
      return false;
    }
  },

  subscribeSpecialEvents(callback: (events: SpecialAttendanceEvent[]) => void): () => void {
    try {
      const q = query(
        collection(db, SPECIAL_EVENTS_COLLECTION),
        orderBy('eventDate', 'desc'),
        limit(50)
      );
      return onSnapshot(q, (snapshot) => {
        const events: SpecialAttendanceEvent[] = [];
        snapshot.forEach((d) => {
          events.push(d.data() as SpecialAttendanceEvent);
        });
        callback(events);
      }, (error) => {
        console.warn('Firebase special events subscription warning (handled):', error?.message || error);
      });
    } catch (err) {
      console.warn('Firebase subscribeSpecialEvents setup fallback:', err);
      return () => {};
    }
  },

  async deleteSpecialAttendanceEvent(eventId: string): Promise<boolean> {
    try {
      const docRef = doc(db, SPECIAL_EVENTS_COLLECTION, eventId);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.warn('Firebase deleteSpecialAttendanceEvent error (handled):', err);
      return false;
    }
  },

  // ---------------------------------------------------------------------------
  // 2. Announcements & Digital Notice Board Real-time Sync
  // ---------------------------------------------------------------------------
  async syncAnnouncement(ann: Announcement): Promise<boolean> {
    try {
      const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, ann.id);
      await setDoc(docRef, {
        id: ann.id,
        title: ann.title,
        content: ann.content || ann.message || '',
        authorName: ann.authorName || 'College Administration',
        authorRole: (ann as any).authorRole || 'PRINCIPAL',
        targetAudience: ann.targetRoles ? ann.targetRoles[0] : (ann.targetAudience || 'ALL'),
        priority: ann.priority || 'NORMAL',
        departmentId: ann.targetDepartmentId || null,
        isPinned: !!(ann as any).isPinned || !!ann.isImportant,
        createdAt: ann.publishDate || ann.publishedAt || new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (err) {
      console.warn('Firebase syncAnnouncement error (handled):', err);
      return false;
    }
  },

  async deleteAnnouncement(annId: string): Promise<boolean> {
    try {
      const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, annId);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.warn('Firebase deleteAnnouncement error (handled):', err);
      return false;
    }
  },

  subscribeAnnouncements(callback: (announcements: Announcement[]) => void): () => void {
    try {
      const q = query(
        collection(db, ANNOUNCEMENTS_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(25)
      );
      return onSnapshot(q, (snapshot) => {
        const list: Announcement[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Announcement);
        });
        callback(list);
      }, (err) => {
        console.warn('Firebase announcements subscription warning (handled):', err?.message || err);
      });
    } catch (err) {
      console.warn('Firebase subscribeAnnouncements setup fallback:', err);
      return () => {};
    }
  },

  // ---------------------------------------------------------------------------
  // 3. Pre-Aggregated Student Attendance Ledger (Free-Plan Optimizer)
  // ---------------------------------------------------------------------------
  // Storing pre-calculated rollups ensures 400 students consume only ~400 single-document
  // reads per day, utilizing <1% of the 50,000 daily free limit for decades.
  async syncStudentAttendanceSummary(summary: {
    studentId: string;
    rollNumber: string;
    admissionNumber?: string;
    fullName: string;
    regularPercentage: number;
    consolidatedPercentage: number;
    totalConducted: number;
    totalPresent: number;
    specialDutyApprovedCount: number;
    specialDutyPendingCount: number;
  }): Promise<boolean> {
    try {
      const docRef = doc(db, STUDENT_SUMMARIES_COLLECTION, summary.studentId);
      await setDoc(docRef, {
        ...summary,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (err) {
      console.warn('Firebase syncStudentAttendanceSummary error (handled):', err);
      return false;
    }
  },

  // ---------------------------------------------------------------------------
  // 4. Free-Plan Economics & Quota Health Calculator
  // ---------------------------------------------------------------------------
  getFreePlanHealthStats(studentCount: number = 400): FreeTierHealthStats {
    // 400 students checking attendance ~1-2 times daily = ~600 reads
    // Faculty & HOD operations = ~150 reads
    const estimatedDailyReads = studentCount * 1.5 + 150;
    const maxDailyReads = 50000; // Firebase Spark plan free tier
    const dailyReadUsagePercent = Number(((estimatedDailyReads / maxDailyReads) * 100).toFixed(2));

    // Daily attendance sessions, duty requests, notices = ~40 writes
    const estimatedDailyWrites = 45;
    const maxDailyWrites = 20000;
    const dailyWriteUsagePercent = Number(((estimatedDailyWrites / maxDailyWrites) * 100).toFixed(2));

    // 400 student documents + announcements + events ~ 1.5 MB total
    const storageUsageMb = Number((1.2 + (studentCount * 0.002)).toFixed(2));
    const maxFreeStorageMb = 1024; // 1 GB free on Spark

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
        'Dual-Sync & Document Aggregation Active. Operating at ~1.5% of free daily read quotas. System engineered to run indefinitely at $0.00.'
    };
  },

  // ---------------------------------------------------------------------------
  // 5. Google Account Links (Persistent Student / Staff Google Sign-In Mapping)
  // ---------------------------------------------------------------------------
  async syncGoogleAccountLink(link: GoogleAccountLink): Promise<boolean> {
    try {
      // 1. Update localStorage cache for instant offline & zero-latency reads
      const localMap = this.getLocalGoogleLinks();
      localMap[link.email.toLowerCase()] = link;
      try {
        localStorage.setItem('nss_google_account_links', JSON.stringify(localMap));
      } catch (e) {
        // storage quota fallback
      }

      // 2. Persist to Firestore
      const docId = link.id || link.email.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
      const docRef = doc(db, GOOGLE_LINKS_COLLECTION, docId);
      await setDoc(docRef, {
        id: docId,
        email: link.email.toLowerCase(),
        userType: link.userType,
        profileId: link.profileId,
        name: link.name || '',
        identifier: link.identifier || '',
        linkedAt: link.linkedAt || new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (err) {
      console.warn('Firebase syncGoogleAccountLink error (handled):', err);
      return false;
    }
  },

  async getGoogleAccountLink(email: string): Promise<GoogleAccountLink | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) return null;

    // 1. Check local cache first
    const localMap = this.getLocalGoogleLinks();
    if (localMap[cleanEmail]) {
      return localMap[cleanEmail];
    }

    // 2. Check Firestore
    try {
      const docId = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
      const docRef = doc(db, GOOGLE_LINKS_COLLECTION, docId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as GoogleAccountLink;
        // cache in localStorage
        localMap[cleanEmail] = data;
        try {
          localStorage.setItem('nss_google_account_links', JSON.stringify(localMap));
        } catch (e) {
          // ignore
        }
        return data;
      }
    } catch (err) {
      console.warn('Firebase getGoogleAccountLink query error (handled):', err);
    }
    return null;
  },

  async deleteGoogleAccountLink(email: string): Promise<boolean> {
    const cleanEmail = email.toLowerCase().trim();
    try {
      const localMap = this.getLocalGoogleLinks();
      delete localMap[cleanEmail];
      localStorage.setItem('nss_google_account_links', JSON.stringify(localMap));

      const docId = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
      const docRef = doc(db, GOOGLE_LINKS_COLLECTION, docId);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.warn('Firebase deleteGoogleAccountLink error (handled):', err);
      return false;
    }
  },

  getLocalGoogleLinks(): Record<string, GoogleAccountLink> {
    try {
      const raw = localStorage.getItem('nss_google_account_links');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
};
