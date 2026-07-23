const fs = require('fs');
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const idx = lines.findIndex(l => l.includes("validationError: ''") && lines[l - 1]?.includes("accumulatedSeconds:"));
if (idx > -1) {
  lines[idx] = "        validationError: '', consideredAccurate: false, remarks: ''";
}

// Just find the line 2141
lines[2141] = "        validationError: '', consideredAccurate: false, remarks: ''";

fs.writeFileSync('src/App.tsx', lines.join('\n'));
