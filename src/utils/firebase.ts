import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore,
  doc, 
  getDoc, 
  getDocFromServer,
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc,
  writeBatch,
  setLogLevel,
  query,
  limit,
  startAfter,
  orderBy,
  QueryDocumentSnapshot
} from 'firebase/firestore';

setLogLevel('silent');
import { getAuth } from 'firebase/auth';
import { MasterData, ActivityLog, LeaveLog, SystemAuditLog, UserAccount, SystemLog } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Safe Firebase App Initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Safe, idempotent Firestore retrieval (Official Web SDK pattern)
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

export const auth = getAuth(app);

// Operation types for Firestore error reporting
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Error metadata interface matching the mandated security guidelines
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
  }
}

/**
 * Standardized Firestore Error Handler
 * Mandated by the firebase-integration security skill
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connection to Cloud Firestore safely
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'settings', 'master_data'));
    console.log('Firebase Cloud Firestore connection successfully verified.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration or network status.');
    } else {
      console.error('Firestore connection test error:', error);
    }
    return false;
  }
}

// ==========================================
// 1. MASTER DATA CONFIGURATION
// ==========================================

export async function saveMasterDataToFirestore(masterData: MasterData): Promise<void> {
  const path = 'settings/master_data';
  try {
    const dataRef = doc(db, 'settings', 'master_data');
    const sanitized = JSON.parse(JSON.stringify(masterData));
    await setDoc(dataRef, sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadMasterDataFromFirestore(): Promise<MasterData | null> {
  const path = 'settings/master_data';
  try {
    const dataRef = doc(db, 'settings', 'master_data');
    const snap = await getDoc(dataRef);
    if (snap.exists()) {
      return snap.data() as MasterData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// ==========================================
// 2. USER ACCOUNTS
// ==========================================

export async function saveUserToFirestore(user: UserAccount): Promise<void> {
  const docId = user.username ? user.username.toLowerCase().trim() : '';
  const path = `users/${docId}`;
  try {
    if (!user.username) return;
    const userRef = doc(db, 'users', docId);
    await setDoc(userRef, user);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserFromFirestore(username: string): Promise<void> {
  const docId = username.toLowerCase().trim();
  const path = `users/${docId}`;
  try {
    const userRef = doc(db, 'users', docId);
    await deleteDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function loadUsersFromFirestore(lastDoc?: QueryDocumentSnapshot | null): Promise<{ data: UserAccount[], lastDoc: QueryDocumentSnapshot | null, hasMore: boolean }> {
  const path = 'users';
  try {
    let q = query(collection(db, 'users'), limit(20));
    if (lastDoc) {
      q = query(collection(db, 'users'), startAfter(lastDoc), limit(20));
    }
    const snap = await getDocs(q);
    const users: UserAccount[] = [];
    snap.forEach((doc) => {
      users.push(doc.data() as UserAccount);
    });
    const lastVisible = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return { data: users, lastDoc: lastVisible, hasMore: snap.docs.length === 20 };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ==========================================
// 3. ACTIVITY LOGS
// ==========================================

export async function saveActivityLogToFirestore(log: ActivityLog): Promise<void> {
  const path = `activity_logs/${log.id}`;
  try {
    if (!log.id) return;
    const logRef = doc(db, 'activity_logs', log.id);
    const cleanLog = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
    await setDoc(logRef, cleanLog);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveActivityLogsBatch(logs: ActivityLog[]): Promise<void> {
  const path = 'activity_logs/batch';
  try {
    const batch = writeBatch(db);
    logs.forEach((log) => {
      if (log.id) {
        const logRef = doc(db, 'activity_logs', log.id);
        const cleanLog = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
        batch.set(logRef, cleanLog);
      }
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteActivityLogFromFirestore(logId: string): Promise<void> {
  const path = `activity_logs/${logId}`;
  try {
    const logRef = doc(db, 'activity_logs', logId);
    await deleteDoc(logRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function loadActivityLogsFromFirestore(lastDoc?: QueryDocumentSnapshot | null): Promise<{ data: ActivityLog[], lastDoc: QueryDocumentSnapshot | null, hasMore: boolean }> {
  const path = 'activity_logs';
  try {
    let q = query(collection(db, 'activity_logs'), limit(20));
    if (lastDoc) {
      q = query(collection(db, 'activity_logs'), startAfter(lastDoc), limit(20));
    }
    const snap = await getDocs(q);
    const logs: ActivityLog[] = [];
    snap.forEach((doc) => {
      logs.push(doc.data() as ActivityLog);
    });
    const lastVisible = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return { data: logs, lastDoc: lastVisible, hasMore: snap.docs.length === 20 };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ==========================================
// 4. LEAVE LOGS
// ==========================================

export async function saveLeaveLogToFirestore(log: LeaveLog): Promise<void> {
  const path = `leave_logs/${log.id}`;
  try {
    if (!log.id) return;
    const logRef = doc(db, 'leave_logs', log.id);
    const cleanLog = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
    await setDoc(logRef, cleanLog);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteLeaveLogFromFirestore(logId: string): Promise<void> {
  const path = `leave_logs/${logId}`;
  try {
    const logRef = doc(db, 'leave_logs', logId);
    await deleteDoc(logRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function loadLeaveLogsFromFirestore(lastDoc?: QueryDocumentSnapshot | null): Promise<{ data: LeaveLog[], lastDoc: QueryDocumentSnapshot | null, hasMore: boolean }> {
  const path = 'leave_logs';
  try {
    let q = query(collection(db, 'leave_logs'), limit(20));
    if (lastDoc) {
      q = query(collection(db, 'leave_logs'), startAfter(lastDoc), limit(20));
    }
    const snap = await getDocs(q);
    const logs: LeaveLog[] = [];
    snap.forEach((doc) => {
      logs.push(doc.data() as LeaveLog);
    });
    const lastVisible = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return { data: logs, lastDoc: lastVisible, hasMore: snap.docs.length === 20 };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ==========================================
// 5. AUDIT LOGS
// ==========================================

export async function saveAuditLogToFirestore(log: SystemAuditLog): Promise<void> {
  const path = `audit_logs/${log.id}`;
  try {
    if (!log.id) return;
    const logRef = doc(db, 'audit_logs', log.id);
    const cleanLog = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
    await setDoc(logRef, cleanLog);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadAuditLogsFromFirestore(lastDoc?: QueryDocumentSnapshot | null): Promise<{ data: SystemAuditLog[], lastDoc: QueryDocumentSnapshot | null, hasMore: boolean }> {
  const path = 'audit_logs';
  try {
    let q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(20));
    if (lastDoc) {
      q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), startAfter(lastDoc), limit(20));
    }
    const snap = await getDocs(q);
    const logs: SystemAuditLog[] = [];
    snap.forEach((doc) => {
      logs.push(doc.data() as SystemAuditLog);
    });
    const lastVisible = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return { data: logs, lastDoc: lastVisible, hasMore: snap.docs.length === 20 };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function clearAllAuditLogsInFirestore(): Promise<void> {
  const path = 'audit_logs/clear-all';
  try {
    const snap = await getDocs(collection(db, 'audit_logs'));
    const batch = writeBatch(db);
    snap.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// 6. SYSTEM DIAGNOSTIC LOGS
// ==========================================

export async function saveSystemLogToFirestore(log: SystemLog): Promise<void> {
  const id = `SYS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const path = `system_logs/${id}`;
  try {
    const logRef = doc(db, 'system_logs', id);
    const cleanLog = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
    await setDoc(logRef, cleanLog);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadSystemLogsFromFirestore(lastDoc?: QueryDocumentSnapshot | null): Promise<{ data: (SystemLog & { id: string })[], lastDoc: QueryDocumentSnapshot | null, hasMore: boolean }> {
  const path = 'system_logs';
  try {
    let q = query(collection(db, 'system_logs'), limit(20));
    if (lastDoc) {
      q = query(collection(db, 'system_logs'), startAfter(lastDoc), limit(20));
    }
    const snap = await getDocs(q);
    const logs: (SystemLog & { id: string })[] = [];
    snap.forEach((doc) => {
      logs.push({ id: doc.id, ...(doc.data() as SystemLog) });
    });
    const lastVisible = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return { data: logs, lastDoc: lastVisible, hasMore: snap.docs.length === 20 };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteSystemLogFromFirestore(logId: string): Promise<void> {
  const path = `system_logs/${logId}`;
  try {
    const logRef = doc(db, 'system_logs', logId);
    await deleteDoc(logRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearAllSystemLogsInFirestore(): Promise<void> {
  const path = 'system_logs/clear-all';
  try {
    const snap = await getDocs(collection(db, 'system_logs'));
    const batch = writeBatch(db);
    snap.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
