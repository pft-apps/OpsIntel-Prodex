const fs = require('fs');
let lines = fs.readFileSync('src/components/SettingsTab.tsx', 'utf8').split('\n');

const bIdx = lines.findIndex(l => l.includes("onClick={() => setActiveTab('branding')}"));
if (bIdx > -1) {
  lines.splice(bIdx - 1, 0, "        {loggedInUser?.role === 'admin' && (");
}

const mIdx = lines.findIndex(l => l.includes("onClick={() => setActiveTab('master')}"));
if (mIdx > -1) {
  lines.splice(mIdx - 1, 0, "        )}", "        {loggedInUser?.role === 'admin' && (");
}

const aIdx = lines.findIndex(l => l.includes("onClick={() => setActiveTab('access')}"));
if (aIdx > -1) {
  lines.splice(aIdx - 1, 0, "        )}");
}

fs.writeFileSync('src/components/SettingsTab.tsx', lines.join('\n'));
