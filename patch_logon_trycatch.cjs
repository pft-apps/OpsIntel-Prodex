const fs = require('fs');
let text = fs.readFileSync('src/components/LogonPage.tsx', 'utf8');

const target1 = `          await setDoc(userRef, adObj);
          onLogin('admin', adminUser.username, adObj, rememberMe);
          return;`;

const rep1 = `          try {
            await setDoc(userRef, adObj);
          } catch (e) {
            console.warn('Failed to seed admin user, continuing login:', e);
          }
          onLogin('admin', adminUser.username, adObj, rememberMe);
          return;`;

const target2 = `          await setDoc(userRef, regObj);
          onLogin(userRole as any, regUser.username, regObj, rememberMe);
          return;`;

const rep2 = `          try {
            await setDoc(userRef, regObj);
          } catch (e) {
            console.warn('Failed to seed regular user, continuing login:', e);
          }
          onLogin(userRole as any, regUser.username, regObj, rememberMe);
          return;`;

text = text.replace(target1, rep1).replace(target2, rep2);
fs.writeFileSync('src/components/LogonPage.tsx', text);
