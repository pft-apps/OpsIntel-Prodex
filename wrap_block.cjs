const fs = require('fs');
let lines = fs.readFileSync('src/components/SettingsTab.tsx', 'utf8').split('\n');

// 3568 is <div className="border-t border-slate-200/85 pt-4 space-y-4">
lines.splice(3567, 0, "                        {(!selectedUserForEdit || selectedUserForEdit.username.toLowerCase() !== (loggedInUser?.username || '').toLowerCase()) && (");
// 3672 is </div>
lines.splice(3674, 0, "                        )}");

fs.writeFileSync('src/components/SettingsTab.tsx', lines.join('\n'));
