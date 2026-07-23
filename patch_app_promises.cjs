const fs = require('fs');
let text = fs.readFileSync('src/App.tsx', 'utf8');

text = text.replace(/saveMasterDataToFirestore\(masterData\);/g, "saveMasterDataToFirestore(masterData).catch(() => {});");
text = text.replace(/saveActivityLogsBatch\(activityLogs\);/g, "saveActivityLogsBatch(activityLogs).catch(() => {});");
text = text.replace(/saveSystemLogToFirestore\(\{\s*timestamp,\s*message,\s*type\s*\}\);/g, "saveSystemLogToFirestore({ timestamp, message, type }).catch(() => {});");

fs.writeFileSync('src/App.tsx', text);
