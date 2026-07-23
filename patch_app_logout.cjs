const fs = require('fs');
let text = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    setLoggedInUser(null);
    sessionStorage.removeItem('logged_in_user');`;

const rep = `    setLoggedInUser(null);
    sessionStorage.removeItem('logged_in_user');
    localStorage.removeItem('logged_in_user');`;

text = text.replace(target, rep);
fs.writeFileSync('src/App.tsx', text);
