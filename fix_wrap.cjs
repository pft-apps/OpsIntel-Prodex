const fs = require('fs');
let lines = fs.readFileSync('src/components/SettingsTab.tsx', 'utf8').split('\n');

const idx = lines.indexOf("                        )}");
if (idx > -1) {
  lines.splice(idx, 1);
}
lines.splice(3673, 0, "                        )}");

fs.writeFileSync('src/components/SettingsTab.tsx', lines.join('\n'));
