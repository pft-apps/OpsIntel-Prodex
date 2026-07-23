const fs = require('fs');
let content = fs.readFileSync('src/components/LogTab.tsx', 'utf8');

// 1. Update validation logic for start/resume button
content = content.replace(
  "if (!c.refNumber || !c.refNumber.trim()) {\\n      updateContainer(id, { validationError: 'Please enter an Activity Reference Number/Code.' });\\n      return;\\n    }",
  "if (c.type === 'Core' && (!c.refNumber || !c.refNumber.trim())) {\\n      updateContainer(id, { validationError: 'Please enter an Activity Reference Number/Code.' });\\n      return;\\n    }"
);

// 2. Update isStartDisabled definition
content = content.replace(
  "const isStartDisabled = !c.date || !c.activityName || !c.desc.trim() || !c.refNumber.trim() || !hasEffectiveEmployee || !c.selectedBu || isRefDup;",
  "const isStartDisabled = !c.date || !c.activityName || !c.desc.trim() || (c.type === 'Core' && !c.refNumber.trim()) || !hasEffectiveEmployee || !c.selectedBu || (c.type === 'Core' && isRefDup);"
);

// 3. Update the type buttons to set/reset refNumber
content = content.replace(
  "onClick={() => { updateContainer(c.id, { type: 'Core', activityName: '', selectedBu: '' }); }}",
  "onClick={() => { updateContainer(c.id, { type: 'Core', activityName: '', selectedBu: '', refNumber: c.refNumber === 'N/A' ? '' : c.refNumber }); }}"
);

content = content.replace(
  "onClick={() => { updateContainer(c.id, { type: 'Non-Core', activityName: '', selectedBu: 'N/A' }); }}",
  "onClick={() => { updateContainer(c.id, { type: 'Non-Core', activityName: '', selectedBu: 'N/A', refNumber: 'N/A' }); }}"
);

fs.writeFileSync('src/components/LogTab.tsx', content);
