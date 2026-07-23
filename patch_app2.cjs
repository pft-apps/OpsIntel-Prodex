const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  const handleLogin = (role: 'admin' | 'user', username: string, userData?: any, rememberMe?: boolean) => {
    const user = { role, username };
    setLoggedInUser(user);
    if (rememberMe) {
      localStorage.setItem('logged_in_user', JSON.stringify(user));
      sessionStorage.removeItem('logged_in_user');
    } else {
      sessionStorage.setItem('logged_in_user', JSON.stringify(user));
      localStorage.removeItem('logged_in_user');
    }`;

const replacement = `  const handleLogin = (role: 'admin' | 'user', username: string, userData?: any) => {
    const user = { role, username };
    setLoggedInUser(user);
    sessionStorage.setItem('logged_in_user', JSON.stringify(user));
    localStorage.removeItem('logged_in_user');`;

content = content.replace(target, replacement);

fs.writeFileSync('src/App.tsx', content);
