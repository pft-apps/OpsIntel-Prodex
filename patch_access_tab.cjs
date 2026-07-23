const fs = require('fs');
let text = fs.readFileSync('src/components/SettingsTab.tsx', 'utf8');

text = text.replace(
  "{activeTab === 'access' && loggedInUser?.role === 'admin' && (\\n        <div className=\\"space-y-6\\">\\n        <div id=\\"operational-settings-card\\"",
  "{activeTab === 'access' && (\\n        <div className=\\"space-y-6\\">\\n        {loggedInUser?.role === 'admin' && (\\n        <div id=\\"operational-settings-card\\""
);

text = text.replace(
  "          </div>\\n        </div>\\n      {/* Embedded Section: Maintenance of User Data */}",
  "          </div>\\n        </div>\\n        )}\\n      {/* Embedded Section: Maintenance of User Data */}"
);

fs.writeFileSync('src/components/SettingsTab.tsx', text);
