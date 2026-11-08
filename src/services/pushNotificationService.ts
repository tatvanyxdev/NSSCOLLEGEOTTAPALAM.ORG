import {
  PushNotificationMessage,
  SendPushNotificationPayload,
  PushSenderRole,
  PushTargetAudience,
  PushPriority,
  PushCategory
} from '../types/pushNotification';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';

const STORAGE_KEY = 'nss_college_push_notifications_v1';
const READ_STORAGE_KEY = 'nss_college_push_read_ids_v1';
const FIRESTORE_COLLECTION = 'push_notifications';

// Clean initial push notification list with zero demo items
const INITIAL_PUSH_NOTIFICATIONS: PushNotificationMessage[] = [];

// In-memory subscribers
type PushListener = (notifications: PushNotificationMessage[]) => void;
type NewArrivalListener = (notification: PushNotificationMessage) => void;

class PushNotificationService {
  private notifications: PushNotificationMessage[] = [];
  private readIds: Set<string> = new Set();
  private subscribers: Set<PushListener> = new Set();
  private newArrivalSubscribers: Set<NewArrivalListener> = new Set();
  private isFirestoreInitialized = false;
  private unsubscribeFirestore: (() => void) | null = null;
  private lastKnownIdSet: Set<string> = new Set();

  constructor() {
    this.purgeLegacySeedDocs();
    this.loadFromStorage();
    this.loadReadIds();
    this.initFirestoreListener();
  }

  // ==========================================
  // Storage Management
  // ==========================================
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter((n: any) => n && n.id && !n.id.startsWith('push-seed-') && !n.id.includes('demo') && !n.id.includes('seed'));
          this.notifications = clean;
          this.lastKnownIdSet = new Set(clean.map((n: any) => n.id));
          return;
        }
      }
    } catch (e) {
      console.warn('Failed reading push notifications from localStorage:', e);
    }

    // Default to clean empty list
    this.notifications = [];
    this.saveToStorage();
    this.lastKnownIdSet = new Set();
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (e) {
      console.warn('Failed saving push notifications to localStorage:', e);
    }
  }

  private loadReadIds(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(READ_STORAGE_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          this.readIds = new Set(list);
        }
      }
    } catch (e) {
      console.warn('Failed reading read IDs:', e);
    }
  }

  private saveReadIds(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(this.readIds)));
    } catch (e) {
      console.warn('Failed saving read IDs:', e);
    }
  }

  // ==========================================
  // Browser Push API & Web Audio Chime
  // ==========================================
  isPushSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isPushSupported()) return 'unsupported';
    return Notification.permission;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isPushSupported()) return 'denied';
    try {
      const res = await Notification.requestPermission();
      return res;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return 'denied';
    }
  }

  playChime(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // First chord note
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      // Second chord note
      osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      // Audio playback suppressed or unsupported
    }
  }

  triggerBrowserNotification(message: PushNotificationMessage): void {
    if (!this.isPushSupported() || Notification.permission !== 'granted') {
      return;
    }

    try {
      const badgeIcon = '/vite.svg';
      const notification = new Notification(`NSS College: ${message.title}`, {
        body: `${message.senderName}: ${message.body}`,
        icon: badgeIcon,
        tag: message.id,
        badge: badgeIcon,
        requireInteraction: message.priority === 'EMERGENCY'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.warn('Browser push notification error:', e);
    }
  }

  // ==========================================
  // Firestore Synchronization
  // ==========================================
  private initFirestoreListener(): void {
    if (typeof window === 'undefined') return;
    try {
      const q = query(
        collection(db, FIRESTORE_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      this.unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          this.isFirestoreInitialized = true;
          if (snapshot.empty) {
            return;
          }

          const remoteList: PushNotificationMessage[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as PushNotificationMessage;
            if (data && data.id && data.title) {
              if (data.id.startsWith('push-seed-') || data.id.includes('demo') || data.id.includes('seed')) {
                // Asynchronously purge obsolete demo seed doc from Firestore
                deleteDoc(doc(db, FIRESTORE_COLLECTION, data.id)).catch(() => {});
              } else {
                remoteList.push(data);
              }
            }
          });

          // Check for newly arrived messages that weren't in memory
          let hasNewItem = false;
          let latestNewItem: PushNotificationMessage | null = null;

          for (const item of remoteList) {
            if (!this.lastKnownIdSet.has(item.id)) {
              this.lastKnownIdSet.add(item.id);
              hasNewItem = true;
              latestNewItem = item;
            }
          }

          // Merge and deduplicate
          const map = new Map<string, PushNotificationMessage>();
          [...remoteList, ...this.notifications].forEach((n) => {
            if (!n.id.startsWith('push-seed-') && !n.id.includes('demo') && !map.has(n.id)) {
              map.set(n.id, n);
            }
          });

          this.notifications = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          this.saveToStorage();
          this.notifySubscribers();

          // If a new arrival came via Firestore, trigger notification & chime
          if (hasNewItem && latestNewItem) {
            this.playChime();
            this.triggerBrowserNotification(latestNewItem);
            this.newArrivalSubscribers.forEach((cb) => cb(latestNewItem!));
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, FIRESTORE_COLLECTION);
        }
      );
    } catch (err) {
      console.warn('Could not initialize push notification Firestore listener:', err);
    }
  }

  // Purge any legacy demo push seed docs from Firestore
  private purgeLegacySeedDocs(): void {
    const seedIds = ['push-seed-001', 'push-seed-002', 'push-seed-003', 'push-seed-004'];
    seedIds.forEach(id => {
      deleteDoc(doc(db, FIRESTORE_COLLECTION, id)).catch(() => {});
    });
  }

  // ==========================================
  // Public API: Sending Messages
  // ==========================================
  async sendPushNotification(payload: SendPushNotificationPayload): Promise<{
    success: boolean;
    notification?: PushNotificationMessage;
    error?: string;
  }> {
    try {
      const id = `push-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newNotification: PushNotificationMessage = {
        id,
        title: payload.title.trim(),
        body: payload.body.trim(),
        senderRole: payload.senderRole,
        senderName: payload.senderName.trim(),
        senderDepartmentId: payload.senderDepartmentId,
        senderDepartmentName: payload.senderDepartmentName,
        targetAudience: payload.targetAudience,
        targetDepartmentId: payload.targetDepartmentId,
        targetDepartmentName: payload.targetDepartmentName,
        targetBatch: payload.targetBatch,
        priority: payload.priority,
        category: payload.category,
        actionUrl: payload.actionUrl,
        createdAt: new Date().toISOString(),
        deliveredCount: 1
      };

      // Add to local state first for instant responsiveness
      this.lastKnownIdSet.add(id);
      this.notifications = [newNotification, ...this.notifications];
      this.saveToStorage();
      this.notifySubscribers();

      // Trigger instant sound & desktop notification for sender verification
      this.playChime();
      this.triggerBrowserNotification(newNotification);
      this.newArrivalSubscribers.forEach((cb) => cb(newNotification));

      // Persist to Firebase Firestore for cross-client real-time delivery
      try {
        await setDoc(doc(db, FIRESTORE_COLLECTION, id), newNotification);
      } catch (firestoreErr) {
        console.warn('Firestore write failed, falling back to local sync:', firestoreErr);
      }

      return { success: true, notification: newNotification };
    } catch (err: any) {
      console.error('Error sending push notification:', err);
      return { success: false, error: err.message || 'Failed to dispatch push notification.' };
    }
  }

  // ==========================================
  // Filtering & Audience Matching
  // ==========================================
  isNotificationForUser(
    notif: PushNotificationMessage,
    userRole?: string,
    userDeptId?: string
  ): boolean {
    // Principal and Super Admin can inspect all communications
    if (userRole === 'SUPER_ADMIN' || userRole === 'PRINCIPAL') {
      return true;
    }

    // Sender always sees their own notification
    if (userRole === notif.senderRole) {
      if (notif.senderRole === 'HOD' && userDeptId && notif.senderDepartmentId === userDeptId) {
        return true;
      }
    }

    switch (notif.targetAudience) {
      case 'ALL_CAMPUS':
        return true;

      case 'ALL_STUDENTS':
        return userRole === 'STUDENT';

      case 'ALL_FACULTY':
        return userRole === 'TEACHER' || userRole === 'HOD' || userRole === 'PRINCIPAL';

      case 'ALL_HODS':
        return userRole === 'HOD';

      case 'MY_DEPARTMENT':
      case 'SPECIFIC_DEPARTMENT':
        if (!userDeptId) return false;
        const targetDept = notif.targetDepartmentId || notif.senderDepartmentId;
        return userDeptId === targetDept;

      case 'DEPARTMENT_STUDENTS':
        if (userRole !== 'STUDENT') return false;
        return userDeptId === (notif.targetDepartmentId || notif.senderDepartmentId);

      case 'DEPARTMENT_FACULTY':
        if (userRole !== 'TEACHER' && userRole !== 'HOD') return false;
        return userDeptId === (notif.targetDepartmentId || notif.senderDepartmentId);

      default:
        return true;
    }
  }

  getAllNotifications(): PushNotificationMessage[] {
    return [...this.notifications];
  }

  getNotificationsForUser(userRole?: string, userDeptId?: string): PushNotificationMessage[] {
    return this.notifications.filter((n) =>
      this.isNotificationForUser(n, userRole, userDeptId)
    );
  }

  getUnreadCount(userRole?: string, userDeptId?: string): number {
    const list = this.getNotificationsForUser(userRole, userDeptId);
    return list.filter((n) => !this.readIds.has(n.id)).length;
  }

  isRead(id: string): boolean {
    return this.readIds.has(id);
  }

  markAsRead(id: string): void {
    if (!this.readIds.has(id)) {
      this.readIds.add(id);
      this.saveReadIds();
      this.notifySubscribers();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach((n) => this.readIds.add(n.id));
    this.saveReadIds();
    this.notifySubscribers();
  }

  clearAllNotifications(): void {
    this.notifications = [];
    this.readIds = new Set();
    this.lastKnownIdSet = new Set();
    this.saveToStorage();
    this.saveReadIds();
    this.notifySubscribers();
  }

  // ==========================================
  // Subscriptions
  // ==========================================
  subscribe(callback: PushListener): () => void {
    this.subscribers.add(callback);
    callback(this.getAllNotifications());
    return () => this.subscribers.delete(callback);
  }

  subscribeToNewArrivals(callback: NewArrivalListener): () => void {
    this.newArrivalSubscribers.add(callback);
    return () => this.newArrivalSubscribers.delete(callback);
  }

  private notifySubscribers(): void {
    const list = this.getAllNotifications();
    this.subscribers.forEach((cb) => cb(list));
  }
}

export const pushNotificationService = new PushNotificationService();
