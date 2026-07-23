const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "accumulatedSeconds: isSim ? Math.round((totalAccumulatedHours || 0) * 60) : Math.round((totalAccumulatedHours || 0) * 3600),\\n        validationError: ''\\n      };",
  "accumulatedSeconds: isSim ? Math.round((totalAccumulatedHours || 0) * 60) : Math.round((totalAccumulatedHours || 0) * 3600),\\n        validationError: '',\\n        consideredAccurate: false,\\n        remarks: ''\\n      };"
);

fs.writeFileSync('src/App.tsx', content);
