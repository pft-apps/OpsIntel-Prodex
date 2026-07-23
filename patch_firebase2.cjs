const fs = require('fs');
let content = fs.readFileSync('src/utils/firebase.ts', 'utf8');

content = content.replace(/QueryDocumentSnapshot\n\s+setLogLevel/, 'QueryDocumentSnapshot');
content = content.replace(/setLogLevel\('silent'\);\n\nsetLogLevel\('silent'\);/, "setLogLevel('silent');");

fs.writeFileSync('src/utils/firebase.ts', content);
console.log('firebase.ts updated.');
