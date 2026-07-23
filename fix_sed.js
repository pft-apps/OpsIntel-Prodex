const fs = require('fs');
let content = fs.readFileSync('src/components/SettingsTab.tsx', 'utf8');

content = content.replace(
  "{activeTab === 'access' {activeTab === 'access' && loggedInUser?.role === 'admin' && ({activeTab === 'access' && loggedInUser?.role === 'admin' && ( (\\n        {loggedInUser?.role === 'admin' {activeTab === 'access' && loggedInUser?.role === 'admin' && ({activeTab === 'access' && loggedInUser?.role === 'admin' && ( (\\n        <div className=\\"space-y-6\\">",
  "{activeTab === 'access' && (\\n        <div className=\\"space-y-6\\">\\n        {loggedInUser?.role === 'admin' && ("
);

fs.writeFileSync('src/components/SettingsTab.tsx', content);
