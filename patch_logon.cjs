const fs = require('fs');
let content = fs.readFileSync('src/components/LogonPage.tsx', 'utf8');

// 1. Remove rememberMe prop from onLogin type if there, but it's optional so it's fine. 
content = content.replace("onLogin: (role: 'admin' | 'user', username: string, userData?: any, rememberMe?: boolean) => void;", "onLogin: (role: 'admin' | 'user', username: string, userData?: any) => void;");

// 2. Remove state
content = content.replace("const [rememberMe, setRememberMe] = useState(false);\\n", "");

// 3. Remove from onLogin calls
content = content.replace(/onLogin\(userRole, userData\.username, userData, rememberMe\);/g, "onLogin(userRole, userData.username, userData);");
content = content.replace(/onLogin\('admin', adminUser\.username, adObj, rememberMe\);/g, "onLogin('admin', adminUser.username, adObj);");
content = content.replace(/onLogin\(userRole as any, regUser\.username, regObj, rememberMe\);/g, "onLogin(userRole as any, regUser.username, regObj);");

// 4. Remove checkbox
const checkbox = `            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-700 rounded bg-slate-900 cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs font-medium text-slate-300 cursor-pointer">
                Remember me on this browser
              </label>
            </div>`;
content = content.replace(checkbox, "");

fs.writeFileSync('src/components/LogonPage.tsx', content);
