const fs = require('fs');
let text = fs.readFileSync('src/components/LogTab.tsx', 'utf8');

text = text.replace(/selectedBu: masterData\.bu\?\.\[0\] \|\| '',/g, "selectedBu: '',");
text = text.replace(/updateContainer\(c\.id, \{ type: 'Core', activityName: '', selectedBu: masterData\.bu\?\.\[0\] \|\| '' \}\)/g, "updateContainer(c.id, { type: 'Core', activityName: '', selectedBu: '' })");

fs.writeFileSync('src/components/LogTab.tsx', text);
