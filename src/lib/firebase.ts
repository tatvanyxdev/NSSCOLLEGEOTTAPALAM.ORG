import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  disableNetwork,
  enableNetwork,
  doc,
  getDocFromServer,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Force long-polling to prevent 10s WebChannel stalls behind proxies, iframes, and mobile/campus networks
let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = dbInstance;
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

const QUOTA_COOLDOWN_STORAGE_KEY = 'nss_firestore_quota_blocked_until';
let memoryQuotaBlockedUntil = 0;
let hasLoggedQuotaNotice = false;

/**
 * Returns the timestamp (ms) for the next daily Firestore quota reset.
 * Google Cloud / Firebase daily quotas reset at midnight Pacific Time (UTC-8 / UTC-7).
 * Using next 08:00 UTC ensures cooldown covers the Spark daily reset window without premature retry storms.
 */
function getNextDailyResetTimestampMs(): number {
  const now = new Date();
  const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 8, 5, 0, 0));
  if (reset.getTime() <= now.getTime()) {
    reset.setUTCDate(reset.getUTCDate() + 1);
  }
  return reset.getTime();
}

export function isQuotaExhaustedError(error: unknown): boolean {
  if (!error) return false;
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as any).code) : '';
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as any).message)
      : String(error);

  return (
    code === 'resource-exhausted' ||
    /resource-exhausted|quota limit exceeded|free daily write units/i.test(message)
  );
}

export function isFirestoreQuotaBlocked(): boolean {
  const now = Date.now();
  if (memoryQuotaBlockedUntil > now) return true;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(QUOTA_COOLDOWN_STORAGE_KEY);
      if (raw) {
        const until = Number(raw);
        if (Number.isFinite(until) && until > now) {
          memoryQuotaBlockedUntil = until;
          return true;
        }
        localStorage.removeItem(QUOTA_COOLDOWN_STORAGE_KEY);
      }
    } catch {
      // ignore storage access issues
    }
  }
  return false;
}

export function markFirestoreQuotaBlocked(error?: unknown): void {
  const until = getNextDailyResetTimestampMs();
  memoryQuotaBlockedUntil = until;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(QUOTA_COOLDOWN_STORAGE_KEY, String(until));
    } catch {
      // ignore
    }
  }
  if (!hasLoggedQuotaNotice) {
    hasLoggedQuotaNotice = true;
    console.warn(
      'Firestore daily free-tier quota reached; pausing secondary Firestore writes until daily quota reset while primary Supabase & local persistence remain active.',
      error instanceof Error ? error.message : ''
    );
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  if (isQuotaExhaustedError(error)) {
    markFirestoreQuotaBlocked(error);
  }
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let firestoreOfflineUntil = 0;
let hasLoggedOfflineNotice = false;

export function isFirestoreOffline(): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true;
  }
  return firestoreOfflineUntil > Date.now();
}

export function isConnectivityError(error: unknown): boolean {
  if (!error) return false;
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as any).code) : '';
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as any).message)
      : String(error);
  return (
    code === 'unavailable' ||
    /the client is offline|could not reach cloud firestore backend|didn't respond within|network/i.test(message)
  );
}

export function markFirestoreTemporarilyOffline(durationMs: number = 5 * 60 * 1000): void {
  firestoreOfflineUntil = Date.now() + durationMs;
  if (!hasLoggedOfflineNotice) {
    hasLoggedOfflineNotice = true;
    console.warn('Cloud Firestore backend is temporarily unreachable; operating cleanly on Supabase & local cache.');
  }
  disableNetwork(db).catch(() => {});
}

// Test connection on startup
async function testConnection() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    markFirestoreTemporarilyOffline(60 * 1000);
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    firestoreOfflineUntil = 0;
  } catch (error) {
    if (isQuotaExhaustedError(error)) {
      markFirestoreQuotaBlocked(error);
    } else if (isConnectivityError(error)) {
      markFirestoreTemporarilyOffline();
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
  window.addEventListener('offline', () => {
    markFirestoreTemporarilyOffline(60 * 1000);
  });
  window.addEventListener('online', () => {
    firestoreOfflineUntil = 0;
    hasLoggedOfflineNotice = false;
    enableNetwork(db).catch(() => {});
  });
}
