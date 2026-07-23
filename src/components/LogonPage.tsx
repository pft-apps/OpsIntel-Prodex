import React, { useState } from 'react';
import { Lock, User, LogIn, ShieldAlert, Key, Eye, EyeOff } from 'lucide-react';
import { MasterData } from '../types';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';

interface LogonPageProps {
  masterData: MasterData;
  onLogin: (role: 'admin' | 'user', username: string, userData?: any) => void;
}

export default function LogonPage({ masterData, onLogin }: LogonPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const docId = username.toLowerCase().trim();
      const userRef = doc(db, 'users', docId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.password === password) {
          const userRole = userData.userLevel === 'Administrator' || docId === 'admin' ? 'admin' : 'user';
          onLogin(userRole, userData.username, userData);
          return;
        }
      } else {
        // Fallback & Auto-seeding
        const adminUser = masterData.adminAccount || { username: 'admin', password: 'admin123' };
        if (username === adminUser.username && password === adminUser.password) {
          const adObj = {
            username: adminUser.username,
            password: adminUser.password,
            userLevel: 'Administrator',
            employeeName: 'Administrator'
          };
          try {
            await setDoc(userRef, adObj);
          } catch (e) {
            console.warn('Failed to seed admin user, continuing login:', e);
          }
          onLogin('admin', adminUser.username, adObj);
          return;
        }

        const regUser = masterData.regularUserAccount;
        if (regUser && username === regUser.username && password === regUser.password) {
          const regObj = {
            username: regUser.username,
            password: regUser.password,
            userLevel: regUser.userLevel || 'General User',
            employeeName: regUser.employeeName || 'Staff',
            group: regUser.group || '',
            assignedGroups: regUser.assignedGroups || [],
            assignedServices: regUser.assignedServices || [],
            accessGroupAnalytics: regUser.accessGroupAnalytics || false,
            accessPeriodClosing: regUser.accessPeriodClosing || false
          };
          const userRole = regObj.userLevel === 'Administrator' ? 'admin' : 'user';
          try {
            await setDoc(userRef, regObj);
          } catch (e) {
            console.warn('Failed to seed regular user, continuing login:', e);
          }
          onLogin(userRole as any, regUser.username, regObj);
          return;
        }
      }

      setError('Invalid username or password.');
    } catch (err) {
      console.error('Firestore login error:', err);
      setError('Database error or offline. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-slate-800 p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-700/50 relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex flex-col items-center">
            {masterData.logo ? (
              <div className="p-2 bg-slate-900 rounded-2xl border border-slate-700 shadow-lg mb-2">
                <img src={masterData.logo} alt="OpsIntel Prodex" className="h-16 w-auto max-w-[200px] object-contain rounded-xl" />
              </div>
            ) : (
              <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shadow-lg shadow-indigo-500/5">
                <Lock className="h-8 w-8" />
              </div>
            )}
            <h2 className="mt-6 text-center text-2xl font-extrabold tracking-tight text-white">
              OpsIntel Prodex Secure Portal
            </h2>
            <p className="mt-2 text-center text-xs text-slate-400">
              Please enter your credentials to authenticate
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 flex items-start gap-2 text-xs text-red-200 animate-shake">
                <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                    placeholder="e.g. admin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Key className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium font-mono"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer bg-transparent border-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            


            <button
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 cursor-pointer flex items-center justify-center gap-2 border-none mt-2"
            >
              <LogIn className="h-4 w-4" /> Sign In
            </button>
          </form>

          {/* Prompt/Info for user help removed */}
        </div>
      </div>
    </div>
  );
}
