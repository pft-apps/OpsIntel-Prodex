const fs = require('fs');
let text = fs.readFileSync('src/components/LogTab.tsx', 'utf8');

text = text.replace(`            isRework: null,
        consideredAccurate: null,
        remarks: "",
            consideredAccurate: null,
            remarks: '',`, `            isRework: null,
            consideredAccurate: null,
            remarks: '',`);

fs.writeFileSync('src/components/LogTab.tsx', text);
