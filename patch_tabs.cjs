const fs = require('fs');
let text = fs.readFileSync('src/components/SettingsTab.tsx', 'utf8');

text = text.replace(
  "<button\\n          onClick={() => setActiveTab('branding')}",
  "{loggedInUser?.role === 'admin' && (\\n        <button\\n          onClick={() => setActiveTab('branding')}"
);

text = text.replace(
  "Branding & Customization\\n        </button>\\n        <button\\n          onClick={() => setActiveTab('master')}",
  "Branding & Customization\\n        </button>\\n        )}\\n        {loggedInUser?.role === 'admin' && (\\n        <button\\n          onClick={() => setActiveTab('master')}"
);

text = text.replace(
  "Master Data\\n        </button>\\n        <button\\n          onClick={() => setActiveTab('access')}",
  "Master Data\\n        </button>\\n        )}\\n        <button\\n          onClick={() => setActiveTab('access')}"
);

fs.writeFileSync('src/components/SettingsTab.tsx', text);
