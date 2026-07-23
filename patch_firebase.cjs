const fs = require('fs');

let content = fs.readFileSync('src/utils/firebase.ts', 'utf8');

const replacements = [
  {
    regex: /export async function loadUsersFromFirestore\(\): Promise<UserAccount\[\]> \{\s+const path = 'users';\s+try \{\s+const snap = await getDocs\(collection\(db, 'users'\)\);\s+const users: UserAccount\[\] = \[\];\s+snap\.forEach\(\(doc\) => \{\s+users\.push\(doc\.data\(\) as UserAccount\);\s+\}\);\s+return users;\s+\} catch \(error\) \{/g,
    replacement: `export async function loadUsersFromFirestore(lastDoc?: QueryDocumentSnapshot | null): Promise<{ data: UserAccount[], lastDoc: QueryDocumentSnapshot | null, hasMore: boolean }> {
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
  } catch (error) {`
  },
  {
    regex: /export async function loadActivityLogsFromFirestore\(\): Promise<ActivityLog\[\]> \{\s+const path = 'activity_logs';\s+try \{\s+const snap = await getDocs\(collection\(db, 'activity_logs'\)\);\s+const logs: ActivityLog\[\] = \[\];\s+snap\.forEach\(\(doc\) => \{\s+logs\.push\(doc\.data\(\) as ActivityLog\);\s+\}\);\s+return logs;\s+\} catch \(error\) \{/g,
    replacement: `export async function loadActivityLogsFromFirestore(lastDoc?: QueryDocumentSnapshot | null): Promise<{ data: ActivityLog[], lastDoc: QueryDocumentSnapshot | null, hasMore: boolean }> {
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
  } catch (error) {`
  },
  {
    regex: /export async function loadLeaveLogsFromFirestore\(\): Promise<LeaveLog\[\]> \{\s+const path = 'leave_logs';\s+try \{\s+const snap = await getDocs\(collection\(db, 'leave_logs'\)\);\s+const logs: LeaveLog\[\] = \[\];\s+snap\.forEach\(\(doc\) => \{\s+logs\.push\(doc\.data\(\) as LeaveLog\);\s+\}\);\s+return logs;\s+\} catch \(error\) \{/g,
    replacement: `export async function loadLeaveLogsFromFirestore(lastDoc?: QueryDocumentSnapshot | null): Promise<{ data: LeaveLog[], lastDoc: QueryDocumentSnapshot | null, hasMore: boolean }> {
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
  } catch (error) {`
  },
  {
    regex: /export async function loadAuditLogsFromFirestore\(\): Promise<SystemAuditLog\[\]> \{\s+const path = 'audit_logs';\s+try \{\s+const snap = await getDocs\(collection\(db, 'audit_logs'\)\);\s+const logs: SystemAuditLog\[\] = \[\];\s+snap\.forEach\(\(doc\) => \{\s+logs\.push\(doc\.data\(\) as SystemAuditLog\);\s+\}\);\s+\/\/ Sort by timestamp descending\s+logs\.sort\(\(a, b\) => b\.timestamp\.localeCompare\(a\.timestamp\)\);\s+return logs;\s+\} catch \(error\) \{/g,
    replacement: `export async function loadAuditLogsFromFirestore(lastDoc?: QueryDocumentSnapshot | null): Promise<{ data: SystemAuditLog[], lastDoc: QueryDocumentSnapshot | null, hasMore: boolean }> {
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
  } catch (error) {`
  },
  {
    regex: /export async function loadSystemLogsFromFirestore\(\): Promise<\(SystemLog & \{ id: string \}\)\[\]> \{\s+const path = 'system_logs';\s+try \{\s+const snap = await getDocs\(collection\(db, 'system_logs'\)\);\s+const logs: \(SystemLog & \{ id: string \}\)\[\] = \[\];\s+snap\.forEach\(\(doc\) => \{\s+logs\.push\(\{ id: doc\.id, \.\.\.\(doc\.data\(\) as SystemLog\) \}\);\s+\}\);\s+return logs;\s+\} catch \(error\) \{/g,
    replacement: `export async function loadSystemLogsFromFirestore(lastDoc?: QueryDocumentSnapshot | null): Promise<{ data: (SystemLog & { id: string })[], lastDoc: QueryDocumentSnapshot | null, hasMore: boolean }> {
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
  } catch (error) {`
  }
];

let newContent = content;
for (const r of replacements) {
  if (!r.regex.test(newContent)) {
    console.error("Regex did not match for one item!");
    console.log(r.regex);
  }
  newContent = newContent.replace(r.regex, r.replacement);
}

fs.writeFileSync('src/utils/firebase.ts', newContent);
console.log('firebase.ts updated successfully.');
