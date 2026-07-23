const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /const cloudUsers = await loadUsersFromFirestore\(\);/g,
  'const { data: cloudUsers } = await loadUsersFromFirestore();'
);

content = content.replace(
  /finalActivityLogs = await loadActivityLogsFromFirestore\(\);/g,
  'finalActivityLogs = (await loadActivityLogsFromFirestore()).data;'
);

content = content.replace(
  /finalLeaveLogs = await loadLeaveLogsFromFirestore\(\);/g,
  'finalLeaveLogs = (await loadLeaveLogsFromFirestore()).data;'
);

content = content.replace(
  /finalSystemLogs = await loadSystemLogsFromFirestore\(\);/g,
  'finalSystemLogs = (await loadSystemLogsFromFirestore()).data;'
);

content = content.replace(
  /finalAuditLogs = await loadAuditLogsFromFirestore\(\);/g,
  'finalAuditLogs = (await loadAuditLogsFromFirestore()).data;'
);

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx updated successfully.');
