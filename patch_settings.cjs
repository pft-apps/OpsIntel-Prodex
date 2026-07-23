const fs = require('fs');
let content = fs.readFileSync('src/components/SettingsTab.tsx', 'utf8');

content = content.replace(
  /const allUsers = await loadUsersFromFirestore\(\);/g,
  'const { data: allUsers } = await loadUsersFromFirestore();'
);

content = content.replace(
  /const \[master, users, activities, leaves, audits\] = await Promise\.all\(\[\s+loadMasterDataFromFirestore\(\),\s+loadUsersFromFirestore\(\),\s+loadActivityLogsFromFirestore\(\),\s+loadLeaveLogsFromFirestore\(\),\s+loadAuditLogsFromFirestore\(\)\s+\]\);/g,
  `const [master, usersData, activitiesData, leavesData, auditsData] = await Promise.all([
        loadMasterDataFromFirestore(),
        loadUsersFromFirestore(),
        loadActivityLogsFromFirestore(),
        loadLeaveLogsFromFirestore(),
        loadAuditLogsFromFirestore()
      ]);
      const users = usersData.data;
      const activities = activitiesData.data;
      const leaves = leavesData.data;
      const audits = auditsData.data;`
);

fs.writeFileSync('src/components/SettingsTab.tsx', content);
console.log('SettingsTab.tsx updated successfully.');
