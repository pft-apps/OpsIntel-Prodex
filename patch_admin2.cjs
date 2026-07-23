const fs = require('fs');
let content = fs.readFileSync('src/components/AdminCloudTab.tsx', 'utf8');

content = content.replace(
  /<\/div>\n\s+\{hasMore\[selectedCollection\] && !search && \(/,
  `\n                {hasMore[selectedCollection] && !search && (`
);

fs.writeFileSync('src/components/AdminCloudTab.tsx', content);
console.log('Fixed div');
