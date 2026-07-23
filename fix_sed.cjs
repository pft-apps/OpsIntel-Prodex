const fs = require('fs');
let lines = fs.readFileSync('src/components/SettingsTab.tsx', 'utf8').split('\n');

lines.splice(3324, 0, "        )}");

fs.writeFileSync('src/components/SettingsTab.tsx', lines.join('\n'));
