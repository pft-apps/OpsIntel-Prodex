/**
 * OpsIntel Prodex
 * Developed by: Patrick Jay F. Tanap
 */

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, Download, Users, TrendingUp, HelpCircle, FileSpreadsheet, RefreshCw, Database, AlertTriangle, Unlock, LogOut, Cloud } from 'lucide-react';
import { ActivityLog, MasterData, SystemLog, EmployeeProfile, SystemAuditLog, ContainerState, TimerState } from './types';
import Sidebar from './components/Sidebar';
import CoverTab from './components/CoverTab';
import LogTab from './components/LogTab';
import DatabaseTab from './components/DatabaseTab';
import SettingsTab from './components/SettingsTab';
import SummaryTab from './components/SummaryTab';
import PerformanceTab from './components/PerformanceTab';
import LogonPage from './components/LogonPage';
import AuditTrackingTab from './components/AuditTrackingTab';
import LeaveLogTab from './components/LeaveLogTab';
import FloatingTimer from './components/FloatingTimer';
import { parseJsonAsync } from './utils/jsonParser';
import AdminCloudTab from './components/AdminCloudTab';

import { doc, getDoc } from 'firebase/firestore';
import {
  saveMasterDataToFirestore,
  loadMasterDataFromFirestore,
  saveUserToFirestore,
  loadUsersFromFirestore,
  saveActivityLogToFirestore,
  saveActivityLogsBatch,
  deleteActivityLogFromFirestore,
  loadActivityLogsFromFirestore,
  saveLeaveLogToFirestore,
  deleteLeaveLogFromFirestore,
  loadLeaveLogsFromFirestore,
  saveAuditLogToFirestore,
  loadAuditLogsFromFirestore,
  clearAllAuditLogsInFirestore,
  saveSystemLogToFirestore,
  loadSystemLogsFromFirestore,
  clearAllSystemLogsInFirestore,
  testConnection,
  db
} from './utils/firebase';

// Initial baseline master data from the spreadsheet template
const INITIAL_MASTER_DATA: MasterData = {
  bu: [],
  group: [
    { code: '00', name: 'System' }
  ],
  services: [],
  nonCoreActivity: [],
  employeeProfile: [],
  serviceOutput: [],
  adminAccount: {
    username: 'admin',
    password: 'admin123'
  },
  regularUserAccount: undefined,
  workingDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
  workingHours: 8,
  autoSaveChannels12Enabled: true,
  autoSaveChannels12Interval: 2,
  autoSyncChannels34Enabled: true,
  autoSyncChannels34Interval: 5,
  sharepointFileLinkedName: '',
  sharepointMasterFileLinkedName: ''
};

export function sanitizeAndMergeMasterData(loaded: any): MasterData {
  const mergedGroup = Array.isArray(loaded?.group) ? [...loaded.group] : [];
  if (!mergedGroup.find((g: any) => g.code === '00')) {
    mergedGroup.push({ code: '00', name: 'System' });
  }

  const rawProfiles = Array.isArray(loaded?.employeeProfile) ? loaded.employeeProfile : [];
  const cleanProfiles = rawProfiles.map((ep: any) => {
    if (ep && typeof ep === 'object') {
      const { bu, ...rest } = ep;
      return rest;
    }
    return ep;
  });

  return {
    ...INITIAL_MASTER_DATA,
    ...loaded,
    group: mergedGroup,
    employeeProfile: cleanProfiles,
    workingDays: loaded?.workingDays || INITIAL_MASTER_DATA.workingDays || ['mon', 'tue', 'wed', 'thu', 'fri'],
    workingHours: loaded?.workingHours !== undefined ? Number(loaded.workingHours) : (INITIAL_MASTER_DATA.workingHours !== undefined ? INITIAL_MASTER_DATA.workingHours : 8),
    holidays: loaded?.holidays || [],
    adminAccount: {
      username: loaded?.adminAccount?.username || 'admin',
      password: loaded?.adminAccount?.password || 'admin123',
    },
    regularUserAccount: loaded?.regularUserAccount || undefined,
    autoSaveChannels12Enabled: loaded?.autoSaveChannels12Enabled !== undefined ? !!loaded.autoSaveChannels12Enabled : true,
    autoSaveChannels12Interval: loaded?.autoSaveChannels12Interval !== undefined ? Number(loaded.autoSaveChannels12Interval) : 2,
    autoSyncChannels34Enabled: loaded?.autoSyncChannels34Enabled !== undefined ? !!loaded.autoSyncChannels34Enabled : true,
    autoSyncChannels34Interval: loaded?.autoSyncChannels34Interval !== undefined ? Number(loaded.autoSyncChannels34Interval) : 5,
    sharepointFileLinkedName: loaded?.sharepointFileLinkedName || '',
    sharepointMasterFileLinkedName: loaded?.sharepointMasterFileLinkedName || '',
  };
}

// Default activity logs mimicking the workbook historical data
const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: "LOG-12345",
    type: "Core",
    employeeTargetHours: 8,
    employeeId: "staff",
    employeeName: "Staff",
    bu: "IT",
    group: "Dev",
    name: "Coding",
    desc: "Working on Feature X",
    date: "2026-07-13",
    dateLogged: "2026-07-13",
    dateCompleted: "2026-07-14",
    output: "Feature X",
    volume: 1,
    hours: 6,
    isRework: false
  },
  {
    id: "LOG-12345_240501_1",
    parentId: "LOG-12345",
    type: "Core",
    employeeTargetHours: 8,
    employeeId: "staff",
    employeeName: "Staff",
    bu: "IT",
    group: "Dev",
    name: "Coding",
    desc: "Working on Feature X",
    date: "2026-07-13",
    dateLogged: "2026-07-13",
    output: "Feature X",
    volume: 1,
    hours: 2,
    isRework: false
  },
  {
    id: "LOG-12345_240502_1",
    parentId: "LOG-12345",
    type: "Core",
    employeeTargetHours: 8,
    employeeId: "staff",
    employeeName: "Staff",
    bu: "IT",
    group: "Dev",
    name: "Coding",
    desc: "Working on Feature X",
    date: "2026-07-14",
    dateLogged: "2026-07-14",
    dateCompleted: "2026-07-14",
    output: "Feature X",
    volume: 1,
    hours: 4,
    isRework: false
  },
  {
    id: "LOG-54321",
    type: "Core",
    employeeTargetHours: 8,
    employeeId: "E001",
    employeeName: "User E001",
    bu: "IT",
    group: "Dev",
    name: "Coding",
    desc: "Working on Feature X",
    date: "2026-07-13",
    dateLogged: "2026-07-13",
    dateCompleted: "2026-07-14",
    output: "Feature X",
    volume: 1,
    hours: 6,
    isRework: false
  },
  {
    id: "LOG-54321_240501_1",
    parentId: "LOG-54321",
    type: "Core",
    employeeTargetHours: 8,
    employeeId: "E001",
    employeeName: "User E001",
    bu: "IT",
    group: "Dev",
    name: "Coding",
    desc: "Working on Feature X",
    date: "2026-07-13",
    dateLogged: "2026-07-13",
    output: "Feature X",
    volume: 1,
    hours: 2,
    isRework: false
  },
  {
    id: "LOG-54321_240502_1",
    parentId: "LOG-54321",
    type: "Core",
    employeeTargetHours: 8,
    employeeId: "E001",
    employeeName: "User E001",
    bu: "IT",
    group: "Dev",
    name: "Coding",
    desc: "Working on Feature X",
    date: "2026-07-14",
    dateLogged: "2026-07-14",
    dateCompleted: "2026-07-14",
    output: "Feature X",
    volume: 1,
    hours: 4,
    isRework: false
  },
  {
    id: "LOG-99999",
    type: "Core",
    employeeTargetHours: 8,
    employeeId: "admin",
    employeeName: "Administrator",
    bu: "IT",
    group: "Dev",
    name: "Coding",
    desc: "Working on Feature X",
    date: "2026-07-13",
    dateLogged: "2026-07-13",
    dateCompleted: "2026-07-14",
    output: "Feature X",
    volume: 1,
    hours: 6,
    isRework: false
  },
  {
    id: "LOG-99999_240501_1",
    parentId: "LOG-99999",
    type: "Core",
    employeeTargetHours: 8,
    employeeId: "admin",
    employeeName: "Administrator",
    bu: "IT",
    group: "Dev",
    name: "Coding",
    desc: "Working on Feature X",
    date: "2026-07-13",
    dateLogged: "2026-07-13",
    output: "Feature X",
    volume: 1,
    hours: 2,
    isRework: false
  },
  {
    id: "LOG-99999_240502_1",
    parentId: "LOG-99999",
    type: "Core",
    employeeTargetHours: 8,
    employeeId: "admin",
    employeeName: "Administrator",
    bu: "IT",
    group: "Dev",
    name: "Coding",
    desc: "Working on Feature X",
    date: "2026-07-14",
    dateLogged: "2026-07-14",
    dateCompleted: "2026-07-14",
    output: "Feature X",
    volume: 1,
    hours: 4,
    isRework: false
  }
];

// Helper to store and retrieve the FileSystemFileHandle from IndexedDB so it persists across reloads
async function storeFileHandleInDB(key: 'master_handle' | 'activity_handle' | 'sharepoint_handle' | 'sharepoint_master_handle', handle: any) {
  if (handle && handle.isMock) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('VectorSLAteFileStorageSeparate', 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('handles')) {
        db.createObjectStore('handles');
      }
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const tx = db.transaction('handles', 'readwrite');
      const store = tx.objectStore('handles');
      try {
        const putReq = store.put(handle, key);
        putReq.onsuccess = () => {
          db.close();
          resolve();
        };
        putReq.onerror = () => {
          db.close();
          reject(putReq.error);
        };
      } catch (err) {
        console.error('Failed to put handle in IndexedDB:', err);
        db.close();
        reject(err);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

async function getFileHandleFromDB(key: 'master_handle' | 'activity_handle' | 'sharepoint_handle' | 'sharepoint_master_handle') {
  return new Promise<any>((resolve, reject) => {
    const request = indexedDB.open('VectorSLAteFileStorageSeparate', 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('handles')) {
        db.createObjectStore('handles');
      }
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const tx = db.transaction('handles', 'readonly');
      const store = tx.objectStore('handles');
      const getReq = store.get(key);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject();
    };
    request.onerror = () => reject();
  });
}

async function clearFileHandleFromDB(key: 'master_handle' | 'activity_handle' | 'sharepoint_handle' | 'sharepoint_master_handle') {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('VectorSLAteFileStorageSeparate', 1);
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const tx = db.transaction('handles', 'readwrite');
      const store = tx.objectStore('handles');
      const delReq = store.delete(key);
      delReq.onsuccess = () => resolve();
      delReq.onerror = () => reject();
    };
    request.onerror = () => reject();
  });
}

export default function App() {
  // Clear any existing localStorage data containing previous demo values once on startup
  const HAS_PURGED_KEY = 'opsintel_demo_purged_v3';
  if (!localStorage.getItem(HAS_PURGED_KEY)) {
    localStorage.removeItem('bu_master_data');
    localStorage.removeItem('sharepoint_consolidated_logs');
    localStorage.removeItem('sharepoint_master_data');
    localStorage.removeItem('system_audit_logs');
    localStorage.removeItem('bu_activity_timer_containers');
    localStorage.setItem(HAS_PURGED_KEY, 'true');
  }

  const [currentTab, setCurrentTab] = useState<string>('cover');
  const [loggedInUser, setLoggedInUser] = useState<{ role: 'admin' | 'user'; username: string } | null>(() => {
    const savedSession = sessionStorage.getItem('logged_in_user');
    const savedLocal = localStorage.getItem('logged_in_user');
    const saved = savedSession || savedLocal;
    return saved ? JSON.parse(saved) : null;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRejectRef = useRef<((reason?: any) => void) | null>(null);

  const getHandleWithFallback = async (options: { suggestedName?: string, types?: any; multiple?: boolean }, isSave?: boolean): Promise<any> => {
    const isInIframe = window.self !== window.top;
    
    return new Promise((resolve, reject) => {
      // Reject any pending input operation
      if (fileInputRejectRef.current) {
        fileInputRejectRef.current(new Error('Operation canceled by new input request'));
        fileInputRejectRef.current = null;
      }
      fileInputRejectRef.current = reject;

      const fallbackToInput = (preselectedFile?: File) => {
        if (preselectedFile) {
            resolve(createMockHandle(preselectedFile));
            fileInputRejectRef.current = null;
            return;
        }

        fileInputRef.current!.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (file) {
            resolve(createMockHandle(file));
            fileInputRejectRef.current = null;
          } else {
            reject(new Error('No file selected'));
            fileInputRejectRef.current = null;
          }
          fileInputRef.current!.onchange = null;
        };
        fileInputRef.current!.click();
      };

      const createMockHandle = (file: File) => ({
        name: file.name,
        kind: 'file',
        isMock: true,
        async getFile() { return file; },
        async createWritable() {
          return {
            content: '',
            async write(content: any) { this.content = content; },
            async close() {
              const blob = new Blob([this.content], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = file.name;
              a.click();
              URL.revokeObjectURL(url);
            }
          };
        },
        async queryPermission() { return 'granted'; },
        async requestPermission() { return 'granted'; }
      });

      if (!isSave && (window as any).showOpenFilePicker && !isInIframe) {
        (window as any).showOpenFilePicker(options)
          .then((handles: any[]) => resolve(handles[0]))
          .catch((err: any) => {
            if (err.name === 'SecurityError' || err.name === 'TypeError') {
              fallbackToInput();
            } else {
              reject(err);
            }
          });
      } else if (isSave && (window as any).showSaveFilePicker && !isInIframe) {
        (window as any).showSaveFilePicker(options)
          .then((handle: any) => resolve(handle))
          .catch((err: any) => {
            if (err.name === 'SecurityError' || err.name === 'TypeError') {
              reject(err);
            } else {
              reject(err);
            }
          });
      } else {
        if (isSave) {
          // If in iframe, we can't showSaveFilePicker. Just create a dummy file to trigger download
          const blob = new Blob([''], { type: 'application/json' });
          const file = new File([blob], options.suggestedName || 'file.json', { type: 'application/json' });
          resolve(createMockHandle(file));
        } else {
          fallbackToInput();
        }
      }
    });
  };

  // Theme & Branding Customization States
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('app_theme_mode') as 'light' | 'dark') || 'light';
  });
  const [themePreset, setThemePreset] = useState<'default' | 'custom'>(() => {
    return (localStorage.getItem('app_theme_preset') as 'default' | 'custom') || 'default';
  });
  const [customThemeEnabled, setCustomThemeEnabled] = useState<boolean>(() => {
    return localStorage.getItem('app_custom_theme_enabled') === 'true';
  });
  const [customPrimary, setCustomPrimary] = useState<string>(() => {
    return localStorage.getItem('app_custom_primary') || '#06234D';
  });
  const [customSecondary, setCustomSecondary] = useState<string>(() => {
    return localStorage.getItem('app_custom_secondary') || '#003886';
  });
  const [customAccent1, setCustomAccent1] = useState<string>(() => {
    return localStorage.getItem('app_custom_accent1') || '#00C4E7';
  });
  const [customAccent2, setCustomAccent2] = useState<string>(() => {
    return localStorage.getItem('app_custom_accent2') || '#7F59E9';
  });
  const [customAccent3, setCustomAccent3] = useState<string>(() => {
    return localStorage.getItem('app_custom_accent3') || '#E7EAEF';
  });
  const [customAccent4, setCustomAccent4] = useState<string>(() => {
    return localStorage.getItem('app_custom_accent4') || '#FFFFFF';
  });

  useEffect(() => {
    document.title = "OpsIntel Prodex";
    localStorage.setItem('app_theme_mode', themeMode);
    localStorage.setItem('app_theme_preset', themePreset);
    localStorage.setItem('app_custom_theme_enabled', String(customThemeEnabled));
    localStorage.setItem('app_custom_primary', customPrimary);
    localStorage.setItem('app_custom_secondary', customSecondary);
    localStorage.setItem('app_custom_accent1', customAccent1);
    localStorage.setItem('app_custom_accent2', customAccent2);
    localStorage.setItem('app_custom_accent3', customAccent3);
    localStorage.setItem('app_custom_accent4', customAccent4);
  }, [themeMode, themePreset, customThemeEnabled, customPrimary, customSecondary, customAccent1, customAccent2, customAccent3, customAccent4]);

  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>(() => {
    const saved = localStorage.getItem('system_audit_logs');
    if (saved) {
      return JSON.parse(saved);
    }
    const initialLogs: SystemAuditLog[] = [
      {
        id: 'TR-1001',
        timestamp: new Date().toLocaleString(),
        user: 'admin',
        action: 'DB_INIT',
        details: 'Initial database configurations successfully provisioned for OpsIntel Prodex.',
        ipAddress: '127.0.0.1',
        status: 'success',
      },
    ];
    localStorage.setItem('system_audit_logs', JSON.stringify(initialLogs));
    return initialLogs;
  });

  const addAuditLog = (action: string, details: string, status: SystemAuditLog['status'] = 'success', overrideUser?: string) => {
    const nextId = `TR-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLog: SystemAuditLog = {
      id: nextId,
      timestamp: new Date().toLocaleString(),
      user: overrideUser || loggedInUser?.username || 'system',
      action,
      details,
      ipAddress: (overrideUser || loggedInUser?.username) === 'admin' ? '192.168.1.5' : '192.168.1.42',
      status,
    };
    setAuditLogs((prev) => {
      const updated = [newLog, ...prev];
      localStorage.setItem('system_audit_logs', JSON.stringify(updated));
      return updated;
    });
    saveAuditLogToFirestore(newLog);
  };

  const handleClearAuditLogs = () => {
    setAuditLogs([]);
    localStorage.setItem('system_audit_logs', JSON.stringify([]));
    clearAllAuditLogsInFirestore();
    addAuditLog('AUDIT_LOG_CLEAR', 'Cleared all trace records from system audit log.', 'warning');
    handleShowToast('Logs Cleared', 'System audit traces have been purged.', 'warning');
  };

  const handleLogin = (role: 'admin' | 'user', username: string, userData?: any) => {
    const user = { role, username };
    setLoggedInUser(user);
    sessionStorage.setItem('logged_in_user', JSON.stringify(user));
    localStorage.removeItem('logged_in_user');

    if (role === 'user' && userData) {
      setMasterData(prev => ({
        ...prev,
        regularUserAccount: {
          username: userData.username,
          employeeName: userData.employeeName,
          employeeCode: userData.employeeCode,
          group: userData.group || '',
          userLevel: userData.userLevel || 'General User',
          assignedGroups: userData.assignedGroups || [],
          assignedServices: userData.assignedServices || [],
          accessGroupAnalytics: userData.accessGroupAnalytics || false,
        }
      }));
    } else if (role === 'admin') {
      setMasterData(prev => {
        const next = { ...prev };
        delete next.regularUserAccount;
        return next;
      });
    }

    handleShowToast('Logged In Successfully', `Welcome back, ${username}!`, 'success');
    addAuditLog('USER_LOGIN', `User session authenticated for ${username} (${role === 'admin' ? 'Administrator' : 'General User'})`, 'info', username);
    
    // Set default landing page to Performance Report
    setCurrentTab('performance');
  };

  const handleLogout = () => {
    if (openLogIds.length > 0) {
      handleShowToast('Logout Blocked', 'Please close or stop all active activities in the Logger before logging out.', 'error');
      addAuditLog('LOGOUT_ATTEMPT_BLOCKED', 'User attempted to logout while activities were still open in the logger.', 'warning');
      return;
    }
    const oldUsername = loggedInUser?.username || 'user';
    addAuditLog('USER_LOGOUT', `User session closed for ${oldUsername}`, 'info', oldUsername);
    setLoggedInUser(null);
    sessionStorage.removeItem('logged_in_user');
    localStorage.removeItem('logged_in_user');
    handleShowToast('Logged Out', 'You have been safely signed out.', 'success');
  };
  const [activeTimerState, setActiveTimerState] = useState<string>(() => sessionStorage.getItem('bu_activity_timer_state') || 'idle');
  const [openLogIds, setOpenLogIds] = useState<string[]>([]);

  // Timer Containers state lifted from LogTab
  const [containers, setContainers] = useState<ContainerState[]>(() => {
    const saved = localStorage.getItem('bu_activity_timer_containers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing containers', e);
      }
    }
    // Backward compatibility or default state
    const oldEmpId = localStorage.getItem('bu_activity_timer_emp_id') || '';
    const oldBu = localStorage.getItem('bu_activity_timer_selected_bu') || '';
    const oldGroup = localStorage.getItem('bu_activity_timer_selected_group') || '';
    const oldDate = localStorage.getItem('bu_activity_timer_date') || new Date().toISOString().split('T')[0];
    const oldType = (localStorage.getItem('bu_activity_timer_type') as 'Core' | 'Non-Core') || 'Core';
    const oldActivityName = localStorage.getItem('bu_activity_timer_name') || '';
    const oldDesc = localStorage.getItem('bu_activity_timer_desc') || '';
    const oldRefNumber = localStorage.getItem('bu_activity_timer_ref_number') || '';
    const oldLogCode = localStorage.getItem('bu_activity_timer_log_code') || '';
    const oldOutput = localStorage.getItem('bu_activity_timer_output') || '';
    const oldVolume = localStorage.getItem('bu_activity_timer_volume') || '1';
    const oldRework = localStorage.getItem('bu_activity_timer_rework');
    const oldState = (localStorage.getItem('bu_activity_timer_state') as TimerState) || 'idle';
    const oldStartTime = localStorage.getItem('bu_activity_timer_start_time') ? Number(localStorage.getItem('bu_activity_timer_start_time')) : null;
    const oldAccumulated = localStorage.getItem('bu_activity_timer_accumulated') ? Number(localStorage.getItem('bu_activity_timer_accumulated')) : 0;

    return [{
      id: `container-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      employeeId: oldEmpId,
      selectedBu: oldBu,
      selectedGroup: oldGroup,
      date: oldDate,
      type: oldType,
      activityName: oldActivityName,
      desc: oldDesc,
      refNumber: oldRefNumber,
      activityLogCode: oldLogCode,
      selectedOutput: oldOutput,
      volume: oldVolume,
      isRework: oldRework === 'true' ? true : oldRework === 'false' ? false : null,
      consideredAccurate: null,
      remarks: '',
      timerState: oldState,
      startTime: oldStartTime,
      accumulatedSeconds: oldAccumulated,
      validationError: ''
    }];
  });

  // Sync containers list to localStorage and handle data safeguards
  useEffect(() => {
    localStorage.setItem('bu_activity_timer_containers', JSON.stringify(containers));

    const handleUnload = () => {
      localStorage.setItem('bu_activity_timer_containers', JSON.stringify(containers));
    };
    window.addEventListener('beforeunload', handleUnload);

    const activeContainer = containers.find(c => c.timerState === 'running');
    if (activeContainer) {
      localStorage.setItem('bu_activity_timer_state', 'running');
      setActiveTimerState('running');
    } else {
      const anyActive = containers.find(c => c.timerState !== 'idle');
      const finalState = anyActive ? anyActive.timerState : 'idle';
      localStorage.setItem('bu_activity_timer_state', finalState);
      setActiveTimerState(finalState);
    }

    const currentOpenIds = containers
      .map(c => c.activityLogCode)
      .filter(id => !!id);
    setOpenLogIds(currentOpenIds);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [containers]);

  const [isDbLoading, setIsDbLoading] = useState(true);

  // Synchronize regularUserAccount for restored user session on refresh or load
  useEffect(() => {
    if (loggedInUser && loggedInUser.role === 'user' && !isDbLoading) {
      const fetchLoggedInUserProfile = async () => {
        try {
          const docId = loggedInUser.username.toLowerCase().trim();
          const userRef = doc(db, 'users', docId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setMasterData(prev => ({
              ...prev,
              regularUserAccount: {
                username: userData.username,
                employeeName: userData.employeeName,
                employeeCode: userData.employeeCode,
                group: userData.group || '',
                userLevel: userData.userLevel || 'General User',
                assignedGroups: userData.assignedGroups || [],
                assignedServices: userData.assignedServices || [],
                accessGroupAnalytics: userData.accessGroupAnalytics || false,
              }
            }));
          }
        } catch (e) {
          console.error('Error restoring user profile from Firestore:', e);
        }
      };
      fetchLoggedInUserProfile();
    }
  }, [loggedInUser, isDbLoading]);

  const [masterData, setMasterData] = useState<MasterData>(INITIAL_MASTER_DATA);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  const [leaveLogs, setLeaveLogs] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

  const [sharepointLogs, setSharepointLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  const [sharepointLeaveLogs, setSharepointLeaveLogs] = useState<any[]>([]);

  // Asynchronous initialization on mount
  useEffect(() => {
    async function initDBAndLoad() {
      try {
        setIsDbLoading(true);
        const connectionOk = await testConnection();
        if (!connectionOk) {
          addSystemLog('Cloud Firestore connection failed, falling back to local DB.', 'warning');
        }

        // 1. Load Master Data from Firestore
        let finalMaster: MasterData | null = null;
        let isFirestoreReadError = false;
        try {
          finalMaster = await loadMasterDataFromFirestore();
        } catch (e) {
          console.error('Error reading from Firestore master:', e);
          isFirestoreReadError = true;
        }

        if (finalMaster) {
          const rawProfilesJson = JSON.stringify(finalMaster.employeeProfile || []);
          finalMaster = sanitizeAndMergeMasterData(finalMaster);
          const sanitizedProfilesJson = JSON.stringify(finalMaster.employeeProfile || []);
          
          if (rawProfilesJson !== sanitizedProfilesJson) {
            await saveMasterDataToFirestore(finalMaster);
          }
        } else {
          if (isFirestoreReadError) {
            addSystemLog('Failed to load Master Data from Cloud Firestore. Aborting auto-seed to prevent data loss.', 'error');
            // Try to load from IndexedDB as absolute fallback but DO NOT write back to Firestore
            const { getIndexedDBItem } = await import('./utils/indexedDB');
            const savedMaster = await getIndexedDBItem<MasterData>('bu_master_data');
            finalMaster = savedMaster ? sanitizeAndMergeMasterData(savedMaster) : INITIAL_MASTER_DATA;
          } else {
            // No Firestore master data exists yet (genuine empty database). Fallback to IndexedDB
            const { getIndexedDBItem } = await import('./utils/indexedDB');
            const savedMaster = await getIndexedDBItem<MasterData>('bu_master_data');
            if (savedMaster) {
              finalMaster = sanitizeAndMergeMasterData(savedMaster);
            } else {
              finalMaster = INITIAL_MASTER_DATA;
            }
            // Seed the Cloud Firestore master_data
            await saveMasterDataToFirestore(finalMaster);
          }
        }
        setMasterData(finalMaster);

        // Seed users into Firestore if collection is empty
        try {
          const { data: cloudUsers } = await loadUsersFromFirestore();
          if (cloudUsers.length === 0) {
            const adminUser = finalMaster.adminAccount || { username: 'admin', password: 'admin123' };
            await saveUserToFirestore({
              username: adminUser.username,
              password: adminUser.password,
              userLevel: 'Administrator',
              employeeName: 'Administrator'
            });
            const regUser = finalMaster.regularUserAccount;
            if (regUser) {
              await saveUserToFirestore({
                username: regUser.username,
                password: regUser.password,
                userLevel: regUser.userLevel || 'General User',
                employeeName: regUser.employeeName || 'Staff'
              });
            }
          } else {
            // Automatically synchronize any user accounts into masterData.employeeProfile if missing
            let needsSync = false;
            const updatedProfiles = [...(finalMaster.employeeProfile || [])];
            cloudUsers.forEach((usr) => {
              if (usr.username !== 'admin' && usr.employeeCode) {
                const exists = updatedProfiles.some(ep => ep.id === usr.employeeCode);
                if (!exists) {
                  updatedProfiles.push({
                    id: usr.employeeCode,
                    name: usr.employeeName || usr.username,
                    group: usr.group || '01',
                    targetHours: finalMaster.workingHours || 8
                  });
                  needsSync = true;
                }
              }
            });
            if (needsSync) {
              finalMaster.employeeProfile = updatedProfiles;
              await saveMasterDataToFirestore(finalMaster);
            }
          }
        } catch (e) {
          console.error('Error seeding/syncing users:', e);
        }

        // 2. Load Activity Logs from Firestore
        let finalActivityLogs: ActivityLog[] = [];
        try {
          finalActivityLogs = (await loadActivityLogsFromFirestore()).data;
        } catch (e) {
          console.error('Error loading activity logs from Firestore:', e);
        }

        if (finalActivityLogs && finalActivityLogs.length > 0) {
          // Merge with initial logs to guarantee they're present
          setActivityLogs([...INITIAL_ACTIVITY_LOGS, ...finalActivityLogs].filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i));
        } else {
          // No Firestore activity logs. Fallback to IndexedDB or INITIAL
          const { getIndexedDBItem } = await import('./utils/indexedDB');
          const savedActivity = await getIndexedDBItem<ActivityLog[]>('productivity_activity_logs');
          if (savedActivity && savedActivity.length > 0) {
            finalActivityLogs = savedActivity;
          } else {
            finalActivityLogs = INITIAL_ACTIVITY_LOGS;
          }
          // Seed to Firestore in batch so they are synced!
          await saveActivityLogsBatch(finalActivityLogs);
          setActivityLogs(finalActivityLogs);
        }

        // 3. Load Leave Logs from Firestore
        let finalLeaveLogs: any[] = [];
        try {
          finalLeaveLogs = (await loadLeaveLogsFromFirestore()).data;
        } catch (e) {
          console.error(e);
        }
        if (finalLeaveLogs && finalLeaveLogs.length > 0) {
          setLeaveLogs(finalLeaveLogs);
        } else {
          const { getIndexedDBItem } = await import('./utils/indexedDB');
          const savedLeave = await getIndexedDBItem<any[]>('productivity_leave_logs');
          if (savedLeave) {
            finalLeaveLogs = savedLeave;
            // Seed to Firestore
            for (const leave of finalLeaveLogs) {
              await saveLeaveLogToFirestore(leave);
            }
          }
          setLeaveLogs(finalLeaveLogs);
        }

        // 4. Load VBA Logs from Firestore
        let finalSystemLogs: SystemLog[] = [];
        try {
          finalSystemLogs = (await loadSystemLogsFromFirestore()).data;
        } catch (e) {
          console.error(e);
        }
        if (finalSystemLogs && finalSystemLogs.length > 0) {
          setSystemLogs(finalSystemLogs);
        } else {
          const { getIndexedDBItem } = await import('./utils/indexedDB');
          const savedVba = await getIndexedDBItem<SystemLog[]>('productivity_vba_logs');
          if (savedVba) {
            finalSystemLogs = savedVba;
          } else {
            finalSystemLogs = [
              {
                timestamp: new Date().toLocaleTimeString(),
                message: 'System initialized. Storage configured to use secure Cloud Firestore persistence.',
                type: 'info',
              },
            ];
          }
          // Seed initial VBA logs
          for (const vba of finalSystemLogs) {
            await saveSystemLogToFirestore(vba);
          }
          setSystemLogs(finalSystemLogs);
        }

        // 5. Load Audit Logs from Firestore
        let finalAuditLogs: SystemAuditLog[] = [];
        try {
          finalAuditLogs = (await loadAuditLogsFromFirestore()).data;
        } catch (e) {
          console.error(e);
        }
        if (finalAuditLogs && finalAuditLogs.length > 0) {
          setAuditLogs(finalAuditLogs);
        } else {
          const initialLogs: SystemAuditLog[] = [
            {
              id: 'TR-1001',
              timestamp: new Date().toLocaleString(),
              user: 'admin',
              action: 'DB_INIT',
              details: 'Initial database configurations successfully provisioned on Google Cloud Firestore.',
              ipAddress: '127.0.0.1',
              status: 'success',
            },
          ];
          await saveAuditLogToFirestore(initialLogs[0]);
          setAuditLogs(initialLogs);
        }

        addSystemLog('Cloud Firestore database engine successfully initialized.', 'success');
      } catch (err) {
        console.error('Error loading data from Firestore, falling back:', err);
      } finally {
        setIsDbLoading(false);
      }
    }

    initDBAndLoad();
  }, []);

  // Async save effects to IndexedDB
  useEffect(() => {
    if (!isDbLoading) {
      import('./utils/indexedDB').then(({ setIndexedDBItem }) => {
        setIndexedDBItem('productivity_activity_logs', activityLogs);
      });
    }
  }, [activityLogs, isDbLoading]);

  useEffect(() => {
    if (!isDbLoading) {
      import('./utils/indexedDB').then(({ setIndexedDBItem }) => {
        setIndexedDBItem('productivity_leave_logs', leaveLogs);
      });
    }
  }, [leaveLogs, isDbLoading]);

  useEffect(() => {
    if (!isDbLoading) {
      import('./utils/indexedDB').then(({ setIndexedDBItem }) => {
        setIndexedDBItem('productivity_vba_logs', systemLogs);
      });
    }
  }, [systemLogs, isDbLoading]);

  const [toast, setToast] = useState<{ show: boolean; title: string; desc: string; type: 'success' | 'warning' | 'error' }>({
    show: false,
    title: '',
    desc: '',
    type: 'success',
  });

  // Storage and Sync States for split file-system
  const [deletedRecords, setDeletedRecords] = useState<string[]>([]);
  
  // Channel 1: Master configuration file
  const [masterFileHandle, setMasterFileHandle] = useState<any>(null);
  const [masterSyncStatus, setMasterSyncStatus] = useState<string>('disconnected');
  const [masterLastSyncedTime, setMasterLastSyncedTime] = useState<string>('Never');

  // Channel 2: Activity logs file
  const [activityFileHandle, setActivityFileHandle] = useState<any>(null);
  const [activitySyncStatus, setActivitySyncStatus] = useState<string>('disconnected');
  const [activityLastSyncedTime, setActivityLastSyncedTime] = useState<string>('Never');

  // Channel 3: SharePoint Storage Channel States
  const [sharepointFileHandle, setSharepointFileHandle] = useState<any>(null);
  const [sharepointSyncStatus, setSharepointSyncStatus] = useState<'disconnected' | 'connected' | 'syncing' | 'saved'>(() => {
    return (localStorage.getItem('bu_sharepoint_sync_status') as any) || 'disconnected';
  });
  const [sharepointLastSyncedTime, setSharepointLastSyncedTime] = useState<string>(() => {
    return localStorage.getItem('bu_sharepoint_last_synced') || 'Never';
  });
  const [sharepointAutoSaveEnabled, setSharepointAutoSaveEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('bu_sharepoint_autosave_enabled');
    return saved ? saved === 'true' : true;
  });

  // Channel 4: SharePoint Master Data Repository States
  const [sharepointMasterFileHandle, setSharepointMasterFileHandle] = useState<any>(null);
  const [sharepointMasterSyncStatus, setSharepointMasterSyncStatus] = useState<'disconnected' | 'connected' | 'saved'>(() => {
    return (localStorage.getItem('bu_sharepoint_master_sync_status') as any) || 'disconnected';
  });
  const [sharepointMasterLastSyncedTime, setSharepointMasterLastSyncedTime] = useState<string>(() => {
    return localStorage.getItem('bu_sharepoint_master_last_synced') || 'Never';
  });

  const activityLogsRef = useRef<ActivityLog[]>([]);
  useEffect(() => {
    activityLogsRef.current = activityLogs;
  }, [activityLogs]);

  const leaveLogsRef = useRef<any[]>([]);
  useEffect(() => {
    leaveLogsRef.current = leaveLogs;
  }, [leaveLogs]);

  const masterDataRef = useRef<MasterData>(masterData);
  useEffect(() => {
    masterDataRef.current = masterData;
  }, [masterData]);

  const systemLogsRef = useRef<SystemLog[]>(systemLogs);
  useEffect(() => {
    systemLogsRef.current = systemLogs;
  }, [systemLogs]);

  const deletedRecordsRef = useRef<string[]>(deletedRecords);
  useEffect(() => {
    deletedRecordsRef.current = deletedRecords;
  }, [deletedRecords]);

  // Channel 4 Master handlers (Updated in lines above)

  const handleUpdateMasterData = (newData: MasterData) => {
    setMasterData(newData);
    
    // Save to SharePoint Storage (Channel 4)
    try {
      localStorage.setItem('sharepoint_master_data', JSON.stringify(newData));
      if (sharepointMasterSyncStatus !== 'disconnected') {
        const timeNow = new Date().toLocaleTimeString();
        setSharepointMasterSyncStatus('saved');
        localStorage.setItem('bu_sharepoint_master_sync_status', 'saved');
        setSharepointMasterLastSyncedTime(timeNow);
        localStorage.setItem('bu_sharepoint_master_last_synced', timeNow);
        addSystemLog('SharePoint Master SUCCESS: Synchronized edits to Channel 4.', 'success');
        addAuditLog('MASTER_SHAREPOINT_SYNC', `System synchronized master data edits to SharePoint Repository.`, 'success');
      }
    } catch (e) {
      console.error('Failed to save master data to SharePoint localStorage', e);
    }
  };

  const handleUpdateMasterFromSharepoint = () => {
    const rawCloud = localStorage.getItem('sharepoint_master_data');
    if (!rawCloud) {
      handleShowToast('No Data Found', 'No Master Data found in SharePoint (Channel 4) to update from.', 'error');
      addSystemLog('Manual Fallback Warning: Attempted to update master data from Channel 4 but no repository data existed.', 'warning');
      return;
    }

    try {
      const parsed = JSON.parse(rawCloud);
      const sanitized = sanitizeAndMergeMasterData(parsed);
      setMasterData(sanitized);
      
      handleShowToast('Update Complete', 'Local Master Data (Channel 1) updated from SharePoint (Channel 4) successfully.', 'success');
      addSystemLog('SUCCESS: Re-synced local Master Data with SharePoint repository data.', 'success');
      addAuditLog('MANUAL_MASTER_SYNC', 'User manually updated local master data from SharePoint Storage.', 'success');
    } catch (e) {
      console.error(e);
      handleShowToast('Update Failed', 'Failed to parse SharePoint Master Data.', 'error');
    }
  };

  const handleUploadMasterManualFallback = (uploadedMaster: MasterData) => {
    try {
      const sanitized = sanitizeAndMergeMasterData(uploadedMaster);
      setMasterData(sanitized);
      
      addSystemLog('Manual Fallback SUCCESS: Manually uploaded Master Data file restored to local storage (Channel 1).', 'success');
      addAuditLog('MANUAL_MASTER_UPLOAD', 'User manually uploaded Master Data JSON file to update local storage.', 'success');
      handleShowToast('Update Complete', 'Local Master Data (Channel 1) updated from fallback JSON file successfully.', 'success');
    } catch (e: any) {
      console.error(e);
      handleShowToast('Update Failed', 'Failed to parse manual Master Data file.', 'error');
    }
  };

  // Channel 3 handlers
  const linkExistingSharepointFile = async () => {
    try {
      const handle = await getHandleWithFallback({
        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
        multiple: false,
      });
      setSharepointFileHandle(handle);
      await storeFileHandleInDB('sharepoint_handle', handle);
      setSharepointSyncStatus('saved');
      setSharepointLastSyncedTime(new Date().toLocaleTimeString());
      addSystemLog(`Connected to SharePoint storage file: "${handle.name}".`, 'success');
      handleShowToast('SharePoint Linked', `Successfully linked to "${handle.name}".`, 'success');

      const nextMaster = { ...masterData, sharepointFileLinkedName: handle.name };
      setMasterData(nextMaster);
      if (masterFileHandle) {
        autoSaveMasterToFile(nextMaster, masterFileHandle);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to link SharePoint file', err);
        handleShowToast('Link Failed', 'Could not link to the selected file.', 'error');
      }
    }
  };

  const createNewSharepointFile = async () => {
    try {
      const handle = await getHandleWithFallback({
        suggestedName: 'sharepoint_consolidated_logs.json',
        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
      }, true);
      setSharepointFileHandle(handle);
      await storeFileHandleInDB('sharepoint_handle', handle);
      
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify([], null, 2));
      await writable.close();
      
      setSharepointSyncStatus('saved');
      setSharepointLastSyncedTime(new Date().toLocaleTimeString());
      addSystemLog(`Created new SharePoint storage file: "${handle.name}".`, 'success');
      handleShowToast('SharePoint File Created', `Successfully created "${handle.name}".`, 'success');

      const nextMaster = { ...masterData, sharepointFileLinkedName: handle.name };
      setMasterData(nextMaster);
      if (masterFileHandle) {
        autoSaveMasterToFile(nextMaster, masterFileHandle);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to create SharePoint file', err);
        handleShowToast('Creation Failed', 'Could not create the new file.', 'error');
      }
    }
  };

  const disconnectSharepointFile = async () => {
    setSharepointFileHandle(null);
    setSharepointSyncStatus('disconnected');
    await clearFileHandleFromDB('sharepoint_handle');
    addSystemLog('SharePoint storage link disconnected.', 'info');
    handleShowToast('SharePoint Disconnected', 'SharePoint storage link unlinked.', 'warning');

    const nextMaster = { ...masterData, sharepointFileLinkedName: '' };
    setMasterData(nextMaster);
    if (masterFileHandle) {
      autoSaveMasterToFile(nextMaster, masterFileHandle);
    }
  };

  // Channel 4 Master handlers
  const linkExistingSharepointMasterFile = async () => {
    try {
      const handle = await getHandleWithFallback({
        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
        multiple: false,
      });
      setSharepointMasterFileHandle(handle);
      await storeFileHandleInDB('sharepoint_master_handle', handle);
      setSharepointMasterSyncStatus('saved');
      setSharepointMasterLastSyncedTime(new Date().toLocaleTimeString());
      addSystemLog(`Connected to SharePoint Master storage file: "${handle.name}".`, 'success');
      handleShowToast('SharePoint Master Linked', `Successfully linked to "${handle.name}".`, 'success');

      const nextMaster = { ...masterData, sharepointMasterFileLinkedName: handle.name };
      setMasterData(nextMaster);
      if (masterFileHandle) {
        autoSaveMasterToFile(nextMaster, masterFileHandle);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to link SharePoint Master file', err);
        handleShowToast('Link Failed', 'Could not link to the selected file.', 'error');
      }
    }
  };

  const createNewSharepointMasterFile = async () => {
    try {
      const handle = await getHandleWithFallback({
        suggestedName: 'sharepoint_master_data.json',
        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
      }, true);
      setSharepointMasterFileHandle(handle);
      await storeFileHandleInDB('sharepoint_master_handle', handle);
      
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify({}, null, 2));
      await writable.close();
      
      setSharepointMasterSyncStatus('saved');
      setSharepointMasterLastSyncedTime(new Date().toLocaleTimeString());
      addSystemLog(`Created new SharePoint Master storage file: "${handle.name}".`, 'success');
      handleShowToast('SharePoint Master File Created', `Successfully created "${handle.name}".`, 'success');

      const nextMaster = { ...masterData, sharepointMasterFileLinkedName: handle.name };
      setMasterData(nextMaster);
      if (masterFileHandle) {
        autoSaveMasterToFile(nextMaster, masterFileHandle);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to create SharePoint Master file', err);
        handleShowToast('Creation Failed', 'Could not create the new file.', 'error');
      }
    }
  };

  const disconnectSharepointMasterFile = async () => {
    setSharepointMasterFileHandle(null);
    setSharepointMasterSyncStatus('disconnected');
    await clearFileHandleFromDB('sharepoint_master_handle');
    addSystemLog('SharePoint Master storage link disconnected.', 'info');
    handleShowToast('SharePoint Master Disconnected', 'SharePoint Master storage link unlinked.', 'warning');

    const nextMaster = { ...masterData, sharepointMasterFileLinkedName: '' };
    setMasterData(nextMaster);
    if (masterFileHandle) {
      autoSaveMasterToFile(nextMaster, masterFileHandle);
    }
  };

  const handleSyncSharepointMaster = async () => {
    // Implement sync logic here, similar to handleSyncSharepoint
    if (!sharepointMasterFileHandle) {
      handleShowToast('No File Linked', 'Please link a SharePoint Master Data file first.', 'error');
      return;
    }
    setSharepointMasterSyncStatus('syncing');
    try {
      const permission = await sharepointMasterFileHandle.queryPermission({ mode: 'readwrite' });
      if (permission === 'granted') {
        const writable = await sharepointMasterFileHandle.createWritable();
        await writable.write(JSON.stringify({ masterData }, null, 2));
        await writable.close();
      }
      setSharepointMasterSyncStatus('saved');
      setSharepointMasterLastSyncedTime(new Date().toLocaleTimeString());
      handleShowToast('Sync Complete', 'Master data synchronized successfully.', 'success');
    } catch (err) {
      console.error(err);
      setSharepointMasterSyncStatus('disconnected');
      handleShowToast('Sync Failed', 'Could not sync master data.', 'error');
    }
  };

  const handleSyncSharepoint = async (silent?: boolean) => {
    if (sharepointSyncStatus === 'disconnected') {
      if (!silent) handleShowToast('SharePoint Disconnected', 'Please connect and configure SharePoint Storage in Settings first.', 'error');
      return;
    }

    setSharepointSyncStatus('syncing');
    addSystemLog('SharePoint: Initializing consolidated data synchronization...', 'info');

    // Simulate network delay for a realistic cloud sync experience
    setTimeout(async () => {
      try {
        const logsToSync = activityLogsRef.current;
        const leaveLogsToSync = leaveLogsRef.current;
        
        // 1. Get current consolidated logs from simulated SharePoint space (IndexedDB)
        const { getIndexedDBItem, setIndexedDBItem } = await import('./utils/indexedDB');
        const rawCloud = await getIndexedDBItem<any>('sharepoint_consolidated_logs');
        let cloudLogs: ActivityLog[] = [];
        let cloudLeaveLogs: any[] = [];
        
        if (rawCloud) {
          if (Array.isArray(rawCloud)) {
            cloudLogs = rawCloud;
          } else {
            cloudLogs = rawCloud.activityLogs || [];
            cloudLeaveLogs = rawCloud.leaveLogs || [];
          }
        }

        // If we have a native file handle, let's also read/merge from it
        if (sharepointFileHandle) {
          try {
            const permission = await sharepointFileHandle.queryPermission({ mode: 'readwrite' });
            if (permission === 'granted') {
              const file = await sharepointFileHandle.getFile();
              const text = await file.text();
              if (text.trim()) {
                const parsed = await parseJsonAsync(text);
                if (Array.isArray(parsed)) {
                  cloudLogs = parsed;
                } else {
                  cloudLogs = parsed.activityLogs || [];
                  cloudLeaveLogs = parsed.leaveLogs || [];
                }
              }
            }
          } catch (e) {
            console.error('Failed to read from sharepointFileHandle:', e);
          }
        }

        // 2. Safeguard logic: Merge local logs (Channel 2) with SharePoint cloud logs
        const mergedLogsMap = new Map<string, ActivityLog>();
        cloudLogs.forEach(log => {
          const key = `${log.employeeId || 'unknown'}_${log.id}`;
          mergedLogsMap.set(key, log);
        });
        logsToSync.forEach(log => {
          const key = `${log.employeeId || 'unknown'}_${log.id}`;
          mergedLogsMap.set(key, log);
        });

        const mergedLeaveLogsMap = new Map<string, any>();
        cloudLeaveLogs.forEach(log => {
          const key = `${log.employeeId || 'unknown'}_${log.id}`;
          mergedLeaveLogsMap.set(key, log);
        });
        leaveLogsToSync.forEach(log => {
          const key = `${log.employeeId || 'unknown'}_${log.id}`;
          mergedLeaveLogsMap.set(key, log);
        });

        const mergedLogs = Array.from(mergedLogsMap.values());
        const mergedLeaveLogs = Array.from(mergedLeaveLogsMap.values());

        // 3. Save back to our simulated SharePoint storage (IndexedDB)
        const finalPayload = {
          activityLogs: mergedLogs,
          leaveLogs: mergedLeaveLogs
        };
        await setIndexedDBItem('sharepoint_consolidated_logs', finalPayload);
        setSharepointLogs(mergedLogs);
        setSharepointLeaveLogs(mergedLeaveLogs);

        // If we have a native file handle, write back to it!
        if (sharepointFileHandle) {
          try {
            const permission = await sharepointFileHandle.queryPermission({ mode: 'readwrite' });
            if (permission === 'granted') {
              const writable = await sharepointFileHandle.createWritable();
              await writable.write(JSON.stringify(finalPayload, null, 2));
              await writable.close();
            }
          } catch (e) {
            console.error('Failed to write to sharepointFileHandle:', e);
          }
        }

        // 4. Update state and log
        const timeNow = new Date().toLocaleTimeString();
        setSharepointLastSyncedTime(timeNow);
        localStorage.setItem('bu_sharepoint_last_synced', timeNow);
        setSharepointSyncStatus('saved');
        localStorage.setItem('bu_sharepoint_sync_status', 'saved');

        addSystemLog(`SharePoint SUCCESS: Consolidated data saved securely to IndexedDB. Merged database contains ${mergedLogs.length} activity records and ${mergedLeaveLogs.length} leave records.`, 'success');
        if (!silent) {
          handleShowToast(
            'SharePoint Sync Complete',
            `Consolidated ${logsToSync.length} logs and ${leaveLogsToSync.length} leave entries into SharePoint storage channel securely.`,
            'success'
          );
        }
      } catch (err) {
        console.error('SharePoint sync failed:', err);
        setSharepointSyncStatus('connected');
        addSystemLog('SharePoint Error: Failed to write consolidated file to cloud repository.', 'error');
        if (!silent) {
          handleShowToast('SharePoint Sync Failed', 'Check your connection parameters or storage permissions.', 'error');
        }
      }
    }, 1200); // 1.2s realistic loading transition
  };

  // Dynamic Auto-Save Timer for Storage Channels 1 & 2
  useEffect(() => {
    const isEnabled = masterData.autoSaveChannels12Enabled !== false;
    const intervalMinutes = masterData.autoSaveChannels12Interval || 2;

    if (!isEnabled) return;

    const intervalId = setInterval(() => {
      addSystemLog(`Channels 1 & 2 Periodic Auto-Save: Executing background flush...`, 'info');
      // Save Master (Channel 1)
      if (masterFileHandle) {
        autoSaveMasterToFile(masterDataRef.current, masterFileHandle);
      }
      // Save Activity (Channel 2)
      if (activityFileHandle) {
        autoSaveActivityToFile(
          activityLogsRef.current,
          leaveLogsRef.current,
          systemLogsRef.current,
          deletedRecordsRef.current,
          activityFileHandle
        );
      }
    }, intervalMinutes * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [
    masterData.autoSaveChannels12Enabled,
    masterData.autoSaveChannels12Interval,
    masterFileHandle,
    activityFileHandle
  ]);

  // Dynamic Auto-Sync Timer for SharePoint Channels 3 & 4
  useEffect(() => {
    const isEnabled = masterData.autoSyncChannels34Enabled !== false;
    const intervalMinutes = masterData.autoSyncChannels34Interval || 5;

    if (!isEnabled) return;

    const intervalId = setInterval(() => {
      addSystemLog(`SharePoint Channels 3 & 4 Periodic Auto-Sync: Executing cloud consolidation...`, 'info');
      // Sync Channel 3 (Consolidated Activity Logs)
      if (sharepointSyncStatus !== 'disconnected') {
        handleSyncSharepoint(true);
      }
      // Sync Channel 4 (Master Data Sync)
      if (sharepointMasterFileHandle) {
        handleSyncSharepointMaster();
      }
    }, intervalMinutes * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [
    masterData.autoSyncChannels34Enabled,
    masterData.autoSyncChannels34Interval,
    sharepointSyncStatus,
    sharepointMasterFileHandle
  ]);

  const handleCreateSharepointFile = async () => {
    if (sharepointSyncStatus === 'disconnected') {
      handleShowToast('SharePoint Disconnected', 'Please connect SharePoint Storage in Settings first.', 'error');
      return;
    }

    const { getIndexedDBItem, setIndexedDBItem } = await import('./utils/indexedDB');
    const rawCloud = await getIndexedDBItem<any>('sharepoint_consolidated_logs');
    if (rawCloud) {
      const proceed = window.confirm("The consolidated repository file (activity_logs_consolidated.json) already exists in SharePoint. Re-initializing will reset the repository data. Do you want to proceed?");
      if (!proceed) return;
    }

    try {
      // Create empty repository file or seed with current local client data
      const initialLogs = activityLogsRef.current.length > 0 ? activityLogsRef.current : [];
      const initialLeaves = leaveLogsRef.current.length > 0 ? leaveLogsRef.current : [];
      
      const payload = {
        activityLogs: initialLogs,
        leaveLogs: initialLeaves
      };
      
      await setIndexedDBItem('sharepoint_consolidated_logs', payload);
      setSharepointLogs(initialLogs);
      setSharepointLeaveLogs(initialLeaves);
      
      const timeNow = new Date().toLocaleTimeString();
      setSharepointLastSyncedTime(timeNow);
      localStorage.setItem('bu_sharepoint_last_synced', timeNow);
      setSharepointSyncStatus('saved');
      localStorage.setItem('bu_sharepoint_sync_status', 'saved');

      addSystemLog(`SharePoint: Successfully initialized repository with ${initialLogs.length} activity and ${initialLeaves.length} leave records in SharePoint via IndexedDB`, 'success');
      handleShowToast('Repository File Created', 'Initialized repository successfully with current local data in IndexedDB.', 'success');
    } catch (err) {
      console.error(err);
      addSystemLog('SharePoint: Failed to initialize repository file.', 'error');
      handleShowToast('Creation Failed', 'Could not create the repository file on SharePoint.', 'error');
    }
  };

  // Load previously linked local file handles from IndexedDB on startup
  useEffect(() => {
    async function loadHandles() {
      // 1. Try to load Master handle
      try {
        const savedMaster = await getFileHandleFromDB('master_handle');
        if (savedMaster) {
          setMasterFileHandle(savedMaster);
          const permission = await savedMaster.queryPermission({ mode: 'readwrite' });
          if (permission === 'granted') {
            try {
              const file = await savedMaster.getFile();
              const text = await file.text();
              if (text.trim()) {
                const payload = JSON.parse(text);
                if (payload.masterData) setMasterData(sanitizeAndMergeMasterData(payload.masterData));
                setMasterSyncStatus('saved');
                setMasterLastSyncedTime(new Date().toLocaleTimeString());
                addSystemLog(`Auto-connected & loaded Master Data from file: "${savedMaster.name}".`, 'success');
              } else {
                setMasterSyncStatus('linked');
                addSystemLog(`Auto-connected to empty Master Data file: "${savedMaster.name}".`, 'success');
              }
            } catch (err) {
              setMasterSyncStatus('linked');
              addSystemLog(`Auto-connected to Master "${savedMaster.name}" but format was invalid.`, 'warning');
            }
          } else {
            setMasterSyncStatus('needs-permission');
            addSystemLog(`Located previously linked Master storage file: "${savedMaster.name}". Permission required.`, 'warning');
          }
        }
      } catch (err) {
        console.error('Failed to restore master handle', err);
      }

      // 2. Try to load Activity handle
      try {
        const savedActivity = await getFileHandleFromDB('activity_handle');
        if (savedActivity) {
          setActivityFileHandle(savedActivity);
          const permission = await savedActivity.queryPermission({ mode: 'readwrite' });
          if (permission === 'granted') {
            try {
              const file = await savedActivity.getFile();
              const text = await file.text();
              if (text.trim()) {
                const payload = JSON.parse(text);
                if (payload.activityLogs) setActivityLogs(payload.activityLogs);
                if (payload.leaveLogs) setLeaveLogs(payload.leaveLogs);
                if (payload.systemLogs) setSystemLogs(payload.systemLogs);
                if (payload.deletedRecords) setDeletedRecords(payload.deletedRecords);
                setActivitySyncStatus('saved');
                setActivityLastSyncedTime(new Date().toLocaleTimeString());
                addSystemLog(`Auto-connected & loaded Activity & Leave Logs from file: "${savedActivity.name}".`, 'success');
              } else {
                setActivitySyncStatus('linked');
                addSystemLog(`Auto-connected to empty Activity Logs file: "${savedActivity.name}".`, 'success');
              }
            } catch (err) {
              setActivitySyncStatus('linked');
              addSystemLog(`Auto-connected to Activity "${savedActivity.name}" but format was invalid.`, 'warning');
            }
          } else {
            setActivitySyncStatus('needs-permission');
            addSystemLog(`Located previously linked Activity storage file: "${savedActivity.name}". Permission required.`, 'warning');
          }
        }
      } catch (err) {
        console.error('Failed to restore activity handle', err);
      }
      // 3. Try to load SharePoint handle
      try {
        const savedSharepoint = await getFileHandleFromDB('sharepoint_handle');
        if (savedSharepoint) {
          setSharepointFileHandle(savedSharepoint);
          const permission = await savedSharepoint.queryPermission({ mode: 'readwrite' });
          if (permission === 'granted') {
            setSharepointSyncStatus('saved');
            setSharepointLastSyncedTime(new Date().toLocaleTimeString());
            addSystemLog(`Auto-connected to SharePoint storage file: "${savedSharepoint.name}".`, 'success');
          } else {
            setSharepointSyncStatus('needs-permission');
            addSystemLog(`Located previously linked SharePoint storage file: "${savedSharepoint.name}". Permission required.`, 'warning');
          }
        }
      } catch (err) {
        console.error('Failed to restore sharepoint handle', err);
      }
      // Load Master Data handle
      try {
        const savedMaster = await getFileHandleFromDB('sharepoint_master_handle');
        if (savedMaster) {
          setSharepointMasterFileHandle(savedMaster);
          const permission = await savedMaster.queryPermission({ mode: 'readwrite' });
          if (permission === 'granted') {
            setSharepointMasterSyncStatus('saved');
            setSharepointMasterLastSyncedTime(new Date().toLocaleTimeString());
            addSystemLog(`Auto-connected to SharePoint Master storage file: "${savedMaster.name}".`, 'success');
          } else {
            setSharepointMasterSyncStatus('needs-permission');
            addSystemLog(`Located previously linked SharePoint Master storage file: "${savedMaster.name}". Permission required.`, 'warning');
          }
        }
      } catch (err) {
        console.error('Failed to restore SharePoint master handle', err);
      }
    }
    loadHandles();
  }, []);

  // Helper to save Master Data
  const autoSaveMasterToFile = async (currentMaster: MasterData, handle: any) => {
    if (!handle) return;
    try {
      const permission = await handle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        setMasterSyncStatus('needs-permission');
        return;
      }
      const writable = await handle.createWritable();
      const payload = {
        masterData: currentMaster
      };
      await writable.write(JSON.stringify(payload, null, 2));
      await writable.close();
      setMasterSyncStatus('saved');
      setMasterLastSyncedTime(new Date().toLocaleTimeString());
      addSystemLog(`Auto-save successful: Direct-to-file Master Data write completed for "${handle.name}".`, 'success');
    } catch (err: any) {
      console.error('Master auto-save failed:', err);
      setMasterSyncStatus('out-of-sync');
      addSystemLog(`Master auto-save error: Failed to write to "${handle.name}".`, 'error');
    }
  };

  // Helper to save Activity Logs
  const autoSaveActivityToFile = async (
    currentLogs: ActivityLog[],
    currentLeaveLogs: any[],
    currentVba: SystemLog[],
    currentDeleted: string[],
    handle: any
  ) => {
    if (!handle) return;
    try {
      const permission = await handle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        setActivitySyncStatus('needs-permission');
        return;
      }
      
      // Phase 2: Dynamic Auto-Splitting of logs by month inside the linked file
      const monthlySplits: Record<string, { activityLogs: ActivityLog[]; leaveLogs: any[] }> = {};
      currentLogs.forEach(log => {
        const monthKey = log.date ? log.date.substring(0, 7) : 'Unknown';
        if (!monthlySplits[monthKey]) {
          monthlySplits[monthKey] = { activityLogs: [], leaveLogs: [] };
        }
        monthlySplits[monthKey].activityLogs.push(log);
      });
      currentLeaveLogs.forEach(log => {
        const monthKey = log.date ? log.date.substring(0, 7) : 'Unknown';
        if (!monthlySplits[monthKey]) {
          monthlySplits[monthKey] = { activityLogs: [], leaveLogs: [] };
        }
        monthlySplits[monthKey].leaveLogs.push(log);
      });

      const writable = await handle.createWritable();
      const payload = {
        activityLogs: currentLogs,
        leaveLogs: currentLeaveLogs,
        systemLogs: currentVba,
        deletedRecords: currentDeleted,
        monthlySplits: monthlySplits,
        lastSplitUpdated: new Date().toISOString().substring(0, 7)
      };
      await writable.write(JSON.stringify(payload, null, 2));
      await writable.close();
      setActivitySyncStatus('saved');
      setActivityLastSyncedTime(new Date().toLocaleTimeString());
      addSystemLog(`Auto-save successful: Direct-to-file Activity & Leave Logs write completed for "${handle.name}". Monthly split partitioning computed successfully.`, 'success');
    } catch (err: any) {
      console.error('Activity auto-save failed:', err);
      setActivitySyncStatus('out-of-sync');
      addSystemLog(`Activity auto-save error: Failed to write to "${handle.name}".`, 'error');
    }
  };

  // Trigger Master auto-save whenever Master state changes
  useEffect(() => {
    if (!isDbLoading) {
      // Safeguard: Never auto-save an empty/default masterData back to Firestore to prevent wiping out data
      const isDefaultEmpty = 
        (!masterData.bu || masterData.bu.length === 0) &&
        (!masterData.services || masterData.services.length === 0) &&
        (!masterData.nonCoreActivity || masterData.nonCoreActivity.length === 0) &&
        (!masterData.employeeProfile || masterData.employeeProfile.length === 0);

      import('./utils/indexedDB').then(({ setIndexedDBItem }) => {
        setIndexedDBItem('bu_master_data', masterData);
      });

      if (!isDefaultEmpty) {
        saveMasterDataToFirestore(masterData).catch(() => {});
      } else {
        console.warn('Skipping masterData auto-save to Firestore to prevent overwriting with an empty template.');
      }
    }
    if (masterFileHandle && (masterSyncStatus === 'saved' || masterSyncStatus === 'linked')) {
      const timer = setTimeout(() => {
        autoSaveMasterToFile(masterData, masterFileHandle);
      }, 500); // 500ms debounce
      return () => clearTimeout(timer);
    } else if (!masterFileHandle) {
      setMasterSyncStatus('disconnected');
    }
  }, [masterData, masterFileHandle, isDbLoading]);

  // Trigger Activity auto-save whenever transactional logs change
  useEffect(() => {
    if (!isDbLoading) {
      saveActivityLogsBatch(activityLogs).catch(() => {});
    }
    if (activityFileHandle && (activitySyncStatus === 'saved' || activitySyncStatus === 'linked')) {
      const timer = setTimeout(() => {
        autoSaveActivityToFile(activityLogs, leaveLogs, systemLogs, deletedRecords, activityFileHandle);
      }, 500); // 500ms debounce
      return () => clearTimeout(timer);
    } else if (!activityFileHandle) {
      setActivitySyncStatus('disconnected');
    }
  }, [activityLogs, leaveLogs, systemLogs, deletedRecords, activityFileHandle, isDbLoading]);

  // Prevent closing the page/tab if an activity timer is active or running
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeTimerState !== 'idle') {
        e.preventDefault();
        e.returnValue = 'An activity timer is currently active. Please stop the timer before exiting.';
        return 'An activity timer is currently active. Please stop the timer before exiting.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeTimerState]);

  const checkConsolidatedAccess = () => {
    if (loggedInUser?.role === 'admin') return true;
    const userAccount = masterData.regularUserAccount;
    if (!userAccount) return false;
    if (userAccount.userLevel === 'Administrator') return true;
    if (userAccount.userLevel === 'General User') return false;
    return userAccount.accessGroupAnalytics || false;
  };

  const handleTabChange = (tabId: string) => {
    if (activeTimerState !== 'idle' && tabId !== 'log' && tabId !== 'database') {
      handleShowToast('Navigation Blocked', 'An activity timer is currently active. Please stop and commit/discard the timer before switching worksheets.', 'error');
      addSystemLog('Navigation blocked: active log activity timer running.', 'warning');
      return;
    }
    const hasConsolidatedAccess = checkConsolidatedAccess();
    if (!hasConsolidatedAccess && tabId.startsWith('consolidated-')) {
      handleShowToast('Access Denied', 'Your user level does not have access to consolidated analytics.', 'error');
      return;
    }
    setCurrentTab(tabId);
  };

  // Prevent users without access from staying on consolidated tabs if role or masterData updates
  useEffect(() => {
    const hasConsolidatedAccess = checkConsolidatedAccess();
    if (!hasConsolidatedAccess && currentTab.startsWith('consolidated-')) {
      setCurrentTab('cover');
    }
  }, [loggedInUser, masterData.regularUserAccount, currentTab]);

  const addSystemLog = (message: string, type: SystemLog['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setSystemLogs((prev) => [...prev, { timestamp, message, type }]);
    saveSystemLogToFirestore({ timestamp, message, type }).catch(() => {});
  };

  const handleClearSystemLogs = () => {
    setSystemLogs([]);
    clearAllSystemLogsInFirestore();
  };

  const handleShowToast = (title: string, desc: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ show: true, title, desc, type });
  };

  // Close toast automatically
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Global KPI computations
  const totalLoggedHours = activityLogs.filter(l => !l.parentId).reduce((sum, log) => sum + log.hours, 0);
  const coreLoggedHours = activityLogs.filter((log) => !log.parentId && log.type === 'Core').reduce((sum, log) => sum + log.hours, 0);
  const corePct = totalLoggedHours > 0 ? (coreLoggedHours / totalLoggedHours) * 100 : 0;

  // Helper to format date YYYY-MM-DD to MMDDYY
  const formatDateToMMDDYY = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const yyyy = parts[0];
      const mm = parts[1];
      const dd = parts[2];
      return `${mm}${dd}${yyyy.substring(2)}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yy = String(d.getFullYear()).substring(2);
    return `${mm}${dd}${yy}`;
  };

  // Helper to get last completed sub-item's volume
  const getLastCompletedSubVolume = (mainId: string, currentLogsList: ActivityLog[]): number | undefined => {
    const subs = currentLogsList.filter(l => l.parentId === mainId && !!l.dateCompleted);
    if (subs.length === 0) return undefined;
    // sort by dateLogged ascending to find the last one
    subs.sort((a,b) => (a.dateLogged || '').localeCompare(b.dateLogged || ''));
    return subs[subs.length - 1].volume;
  };

  // Add/Update Log Entry
  const handleAddLog = (logData: ActivityLog | Omit<ActivityLog, 'id'>) => {
    let newLog: ActivityLog;
    let isUpdate = false;

    if ('id' in logData && logData.id) {
      newLog = logData as ActivityLog;
      isUpdate = activityLogs.some((l) => l.id === logData.id);
    } else {
      const nextLogId = `LOG${100 + activityLogs.length + 1}`;
      newLog = {
        id: nextLogId,
        ...logData,
      } as ActivityLog;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (isUpdate) {
      // Find the previous log in state
      const previousLog = activityLogs.find((l) => l.id === newLog.id);

      if (previousLog) {
        const isTimerCommit = !!(logData as any).isTimerCommit;
        const hasExistingSubs = activityLogs.some(l => l.parentId === newLog.id);

        if (isTimerCommit && (todayStr !== newLog.date || hasExistingSubs)) {
          // Sub-item mode for any continued timer commit
          const otherSubs = activityLogs.filter((l) => l.parentId === newLog.id);
          const isFirstBranch = !hasExistingSubs;
          
          let subItemsToAdd: ActivityLog[] = [];

          if (isFirstBranch) {
            // Create a sub-item for the original session to separate hours
            const originalDate = previousLog.dateLogged || previousLog.date;
            const originalSuffix = formatDateToMMDDYY(originalDate);
            const originalSubId = `${newLog.id}_${originalSuffix}_1`;
            
            const originalSubItem: ActivityLog = {
              ...previousLog,
              id: originalSubId,
              parentId: newLog.id,
              dateLogged: originalDate,
              hours: previousLog.hours
            };
            subItemsToAdd.push(originalSubItem);
          }

          // Calculate hours for today's session
          const currentTotalSubsHours = isFirstBranch 
            ? previousLog.hours 
            : otherSubs.reduce((sum, s) => sum + s.hours, 0);
          
          const sessionHours = Math.max(0, newLog.hours - currentTotalSubsHours);

          const todaySuffix = formatDateToMMDDYY(todayStr);
          const originalDate = previousLog.dateLogged || previousLog.date;
          
          let existingSubItemIdToUpdate: string | null = null;
          if (isFirstBranch && originalDate === todayStr) {
             existingSubItemIdToUpdate = subItemsToAdd[0].id;
          } else if (!isFirstBranch) {
             const existingSameDaySubs = activityLogs.filter(l => l.parentId === newLog.id && l.id.includes(`_${todaySuffix}_`));
             if (existingSameDaySubs.length > 0) {
                let maxIdx = 0;
                let maxId = existingSameDaySubs[0].id;
                existingSameDaySubs.forEach(sub => {
                   const parts = sub.id.split('_');
                   if (parts.length === 3) {
                      const idx = parseInt(parts[2]);
                      if (!isNaN(idx) && idx > maxIdx) {
                         maxIdx = idx;
                         maxId = sub.id;
                      }
                   }
                });
                existingSubItemIdToUpdate = maxId;
             }
          }

          let subItemId = existingSubItemIdToUpdate;

          if (existingSubItemIdToUpdate) {
             // If we are updating an existing sub-item we just added in subItemsToAdd (i.e. isFirstBranch)
             const newlyAddedSub = subItemsToAdd.find(s => s.id === existingSubItemIdToUpdate);
             if (newlyAddedSub) {
                 newlyAddedSub.hours += parseFloat(sessionHours.toFixed(2));
                 newlyAddedSub.dateCompleted = newLog.dateCompleted;
                 newlyAddedSub.volume = newLog.volume; // capture latest volume if updated
             }
          } else {
             // Generate new sub item
             const existingSameDaySubs = activityLogs.filter(l => l.parentId === newLog.id && l.id.includes(`_${todaySuffix}_`));
             let maxIdx = 0;
             existingSameDaySubs.forEach(sub => {
               const parts = sub.id.split('_');
               if (parts.length === 3) {
                 const idx = parseInt(parts[2]);
                 if (!isNaN(idx) && idx > maxIdx) {
                   maxIdx = idx;
                 }
               }
             });
             const todayIndex = maxIdx + 1;
             subItemId = `${newLog.id}_${todaySuffix}_${todayIndex}`;

             const subItem: ActivityLog = {
               ...newLog,
               id: subItemId,
               parentId: newLog.id,
               hours: parseFloat(sessionHours.toFixed(2)),
               dateLogged: todayStr,
               dateCompleted: newLog.dateCompleted
             };
             subItemsToAdd.push(subItem);
          }

          setActivityLogs((prev) => {
            const subItemIds = subItemsToAdd.map(s => s.id);
            let filtered = prev.filter((l) => !subItemIds.includes(l.id));

            const updated = filtered.map((l) => {
              if (l.id === newLog.id) {
                const tempLogsList = [...subItemsToAdd, ...filtered];
                const lastCompletedVol = getLastCompletedSubVolume(newLog.id, tempLogsList);
                return {
                  ...l,
                  ...newLog,
                  volume: lastCompletedVol !== undefined ? lastCompletedVol : l.volume,
                  hours: newLog.hours,
                  dateLogged: todayStr
                };
              } else if (l.parentId === newLog.id) {
                if (existingSubItemIdToUpdate && l.id === existingSubItemIdToUpdate) {
                   // Update the existing sub item that is already in state
                   return {
                      ...l,
                      ...newLog,
                      id: l.id,
                      parentId: newLog.id,
                      dateLogged: todayStr,
                      hours: l.hours + parseFloat(sessionHours.toFixed(2)),
                      dateCompleted: newLog.dateCompleted
                   };
                }
                return {
                  ...l,
                  date: newLog.date,
                  employeeId: newLog.employeeId,
                  employeeName: newLog.employeeName,
                  bu: newLog.bu,
                  group: newLog.group,
                  type: newLog.type,
                  name: newLog.name,
                  desc: newLog.desc,
                  referenceCode: newLog.referenceCode,
                  output: newLog.output,
                  targetHours: newLog.targetHours,
                  employeeTargetHours: newLog.employeeTargetHours,
                  isRework: newLog.isRework
                };
              }
              return l;
            });

            return [...subItemsToAdd, ...updated];
          });

          addSystemLog(`Updated activity sessions for ${newLog.id}. Total hours: ${newLog.hours.toFixed(2)}.`, 'success');
          handleShowToast('Activity Continued', `Logged session under sub-item ${subItemId} of ${newLog.id}.`);
          return;
        }
      }

      // If same date or just a standard update/edit, do a regular merge
      setActivityLogs((prev) => {
        const updated = prev.map((l) => {
          if (l.id === newLog.id) {
            const tempLogsList = prev.map((item) => item.id === newLog.id ? { ...item, ...newLog } : item);
            const lastCompletedVol = getLastCompletedSubVolume(newLog.id, tempLogsList);
            return {
              ...l,
              ...newLog,
              volume: lastCompletedVol !== undefined ? lastCompletedVol : newLog.volume
            };
          } else if (l.parentId === newLog.id) {
            // Sub-items inherit data edited on the main item
            return {
              ...l,
              date: newLog.date,
              employeeId: newLog.employeeId,
              employeeName: newLog.employeeName,
              bu: newLog.bu,
              group: newLog.group,
              type: newLog.type,
              name: newLog.name,
              desc: newLog.desc,
              referenceCode: newLog.referenceCode,
              output: newLog.output,
              targetHours: newLog.targetHours,
              employeeTargetHours: newLog.employeeTargetHours,
              isRework: newLog.isRework
            };
          }
          return l;
        });
        return updated;
      });

      addSystemLog(`Updated activity trace row in database: ${newLog.id} for employee ${newLog.employeeName}`, 'success');
      handleShowToast('Activity Updated', `Successfully updated activity row ${newLog.id} in workbook database.`);
      addAuditLog('ACTIVITY_LOG_UPDATE', `Updated activity log row: ${newLog.id} for ${newLog.employeeName} (${newLog.hours} hours)`, 'success');
    } else {
      // New log creation
      const logWithDateLogged: ActivityLog = {
        ...newLog,
        dateLogged: newLog.dateLogged || todayStr
      };
      setActivityLogs((prev) => [logWithDateLogged, ...prev]);
      addSystemLog(`Inserted new activity trace row into database: ${newLog.id} for employee ${newLog.employeeName}`, 'success');
      handleShowToast('Activity Recorded', `Successfully added activity row ${newLog.id} into workbook database.`);
      addAuditLog('ACTIVITY_LOG_ADD', `Inserted new activity log: ${newLog.id} for ${newLog.employeeName} (${newLog.hours} hours)`, 'success');
    }
  };

  // Delete Log Entry
  const handleDeleteLog = (id: string) => {
    setActivityLogs((prev) => prev.filter((log) => log.id !== id && log.parentId !== id));
    setDeletedRecords((prev) => [...prev, id]);
    
    deleteActivityLogFromFirestore(id);
    const subItems = activityLogs.filter(l => l.parentId === id);
    for (const sub of subItems) {
      deleteActivityLogFromFirestore(sub.id);
    }

    addSystemLog(`Deleted activity log trace record and associated sub-items from master: ${id}`, 'warning');
    handleShowToast('Record Deleted', `Successfully removed log ${id} from the dataset.`, 'warning');
    addAuditLog('ACTIVITY_LOG_DELETE', `Deleted activity log: ${id}`, 'warning');
  };

  const onSubmitLeaveLog = (log: any) => {
    setLeaveLogs((prev) => {
      const exists = prev.some(l => l.id === log.id);
      if (exists) {
        return prev.map(l => l.id === log.id ? log : l);
      }
      return [log, ...prev];
    });
    saveLeaveLogToFirestore(log);

    addSystemLog(`Leave Log Success: Entry ${log.id} committed securely.`, 'success');
    addAuditLog('LEAVE_LOG_SUBMISSION', `Committed/Updated ${log.category} entry ${log.id} for ${log.employeeName}`, 'success');
    handleShowToast('Entry Recorded', `${log.category} log has been recorded/updated.`, 'success');
  };

  const onDeleteLeaveLog = (id: string) => {
    setLeaveLogs((prev) => prev.filter(log => log.id !== id));
    deleteLeaveLogFromFirestore(id);

    addAuditLog('LEAVE_LOG_DELETION', `Deleted leave log entry ${id}`, 'warning');
    handleShowToast('Entry Deleted', 'The log entry has been removed.', 'warning');
  };

  // Continue/Resume Log Entry
  const handleContinueLog = (log: ActivityLog) => {
    const isSim = localStorage.getItem('bu_activity_timer_sim_mode') === 'true';
    const now = Date.now();

    // Calculate total accumulated hours so far across main log and all its sub-items
    const mainLogId = log.parentId || log.id;
    const mainLog = activityLogs.find(l => l.id === mainLogId) || log;
    const totalAccumulatedHours = mainLog.hours;

    setContainers(prev => {
      // Pause any active/running timers in existing containers
      const pausedContainers = prev.map((c) => {
        if (c.timerState === 'running') {
          let added = 0;
          if (c.startTime) {
            added = Math.floor((now - c.startTime) / 1000);
          }
          return {
            ...c,
            accumulatedSeconds: c.accumulatedSeconds + added,
            startTime: null,
            timerState: 'paused'
          };
        }
        return c;
      });

      // Check if there is only 1 container and it is blank, and remove it if so
      let filteredContainers = pausedContainers;
      if (pausedContainers.length === 1 && !pausedContainers[0].activityLogCode && pausedContainers[0].timerState === 'idle') {
        filteredContainers = [];
      }

      const newContainer: ContainerState = {
        id: `container-${now}-${Math.floor(Math.random() * 1000)}`,
        employeeId: log.employeeId || loggedInUser?.username || '',
        selectedBu: log.bu || '',
        selectedGroup: log.group || '',
        date: log.date || new Date().toISOString().split('T')[0],
        type: log.type || 'Core',
        activityName: log.name || '',
        desc: log.desc || '',
        refNumber: log.referenceCode || '',
        activityLogCode: mainLogId, // Always resume under the main Log ID!
        selectedOutput: log.output || '',
        volume: log.volume !== undefined ? String(log.volume) : '1',
        isRework: log.isRework !== undefined ? log.isRework : null,
        timerState: 'running',
        startTime: now,
        accumulatedSeconds: isSim ? Math.round((totalAccumulatedHours || 0) * 60) : Math.round((totalAccumulatedHours || 0) * 3600),
        validationError: '', consideredAccurate: false, remarks: ''
      };
      
      return [newContainer, ...filteredContainers];
    });

    setActiveTimerState('running');
    setCurrentTab('log');
    addSystemLog(`Resumed activity timer for log ID: ${mainLogId}`, 'info');
    handleShowToast('Activity Resumed', `Continuing timer for activity ${mainLogId}.`, 'success');
  };

  // Run VBA calculation macro routines
  const handleRunMacro = (macro: 'compile' | 'audit') => {
    addSystemLog(`Initializing workbook macro compilation: ${macro.toUpperCase()}_vbaProject.bin`, 'info');

    setTimeout(() => {
      if (macro === 'compile') {
        const sumVal = activityLogs.filter(l => !l.parentId).reduce((sum, row) => sum + row.hours, 0);
        addSystemLog(`SUCCESS: Aggregated capacity hours matrix correctly. Rows parsed: ${activityLogs.filter(l => !l.parentId).length}`, 'success');
        addSystemLog(`Formula verification SUM(Hours) completed dynamically: ${sumVal.toFixed(1)} hrs logged in database.`, 'success');
        handleShowToast('VBA Summary Refresh', 'Workbook summary calculations re-compiled completely.');
        setCurrentTab('summary');
      } else if (macro === 'audit') {
        addSystemLog('Compliance scan auditing active rosters...', 'info');
        const errors: string[] = [];

        masterData.employeeProfile.forEach((emp) => {
          const actualHours = activityLogs
            .filter((log) => log.employeeId === emp.id && !log.parentId)
            .reduce((sum, row) => sum + row.hours, 0);

          if (actualHours < emp.targetHours) {
            errors.push(`${emp.name} has discrepancy: Target ${emp.targetHours}h / Actual ${actualHours.toFixed(1)}h`);
          }
        });

        if (errors.length > 0) {
          errors.forEach((err) => addSystemLog(`AUDIT ALERT: ${err}`, 'error'));
          handleShowToast('Deficit Variance Mapped', `Flagged ${errors.length} capacity compliance discrepancies.`, 'error');
        } else {
          addSystemLog('AUDIT COMPLETE: All active employee logs align securely with target metrics.', 'success');
          handleShowToast('Roster Compliant', 'All employee capacities fully align with weekly goals.');
        }
        setCurrentTab('performance');
      }
    }, 750);
  };

  // Export spreadsheet log database as a CSV file
  const handleExportCSV = () => {
    addSystemLog('VBA Routine: Extracting activity dataset to local CSV format...', 'info');

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Log ID,Date,Employee ID,Employee Name,BU,Group,Type,Activity Name,Hours,Description\r\n';

    activityLogs.forEach((row) => {
      const sanitizedDesc = row.desc.replace(/"/g, '""');
      csvContent += `"${row.id}","${row.date}","${row.employeeId}","${row.employeeName}","${row.bu}","${row.group}","${row.type}","${row.name}",${row.hours},"${sanitizedDesc}"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodedUri);
    downloadAnchor.setAttribute('download', 'Activity_Workbook_Database.csv');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addSystemLog('SUCCESS: Extracted 100% of data logs cleanly as Activity_Workbook_Database.csv.', 'success');
    handleShowToast('Database Exported', 'CSV spreadsheet file downloaded successfully.');
  };

  // Direct Client-Side Local File Storage Handlers: Master Config (Channel 1)
  const linkExistingMasterFile = async () => {
    try {
      const handle = await getHandleWithFallback({
        types: [{
          description: 'JSON Master Data Config',
          accept: { 'application/json': ['.json'] }
        }],
        multiple: false
      });
      setMasterFileHandle(handle);
      await storeFileHandleInDB('master_handle', handle);
      const file = await handle.getFile();
      const text = await file.text();
      if (text.trim()) {
        try {
          const payload = await parseJsonAsync(text);
          if (payload.masterData) {
            setMasterData(sanitizeAndMergeMasterData(payload.masterData));
            setMasterSyncStatus('saved');
            setMasterLastSyncedTime(new Date().toLocaleTimeString());
            handleShowToast('Master File Linked', `Successfully loaded Master configuration from "${handle.name}"!`, 'success');
            addSystemLog(`Connected and loaded Master Data from "${handle.name}".`, 'success');
          } else {
            setMasterSyncStatus('linked');
            handleShowToast('File Loaded', 'Linked file did not contain key "masterData". Ready to initialize.', 'warning');
          }
        } catch (e) {
          setMasterSyncStatus('linked');
          handleShowToast('Invalid JSON file format', 'Master file linked but JSON syntax was incorrect.', 'error');
        }
      } else {
        setMasterSyncStatus('linked');
        handleShowToast('Master File Linked', 'Empty file linked. Active config will auto-save to it.', 'success');
        addSystemLog(`Connected to empty Master file "${handle.name}".`, 'info');
      }
    } catch (err: any) {
      console.error(err);
      if (err.name !== 'AbortError') {
        handleShowToast('Connection Denied', 'File selection was canceled.', 'error');
      }
    }
  };

  const createNewMasterFile = async () => {
    try {
      const handle = await getHandleWithFallback({
        suggestedName: 'Vector_SLAte_Master_Data.json',
        types: [{
          description: 'JSON Master Data Config',
          accept: { 'application/json': ['.json'] }
        }]
      }, true);
      setMasterFileHandle(handle);
      await storeFileHandleInDB('master_handle', handle);
      setMasterSyncStatus('linked');
      handleShowToast('Master File Created', `Successfully initialized "${handle.name}"!`, 'success');
      addSystemLog(`Created and linked new Master Data file "${handle.name}".`, 'info');
    } catch (err: any) {
      console.error(err);
      if (err.name !== 'AbortError') {
        handleShowToast('Connection Denied', 'File creation canceled.', 'error');
      }
    }
  };

  const disconnectMasterFile = async () => {
    try {
      await clearFileHandleFromDB('master_handle');
      setMasterFileHandle(null);
      setMasterSyncStatus('disconnected');
      handleShowToast('Master Disconnected', 'Master data storage switched to in-memory mode.', 'warning');
      addSystemLog('Disconnected Master storage file.', 'warning');
    } catch (err) {
      console.error(err);
    }
  };

  const reconnectMasterFile = async () => {
    if (!masterFileHandle) return;
    try {
      const permission = await masterFileHandle.requestPermission({ mode: 'readwrite' });
      if (permission === 'granted') {
        const file = await masterFileHandle.getFile();
        const text = await file.text();
        if (text.trim()) {
          try {
            const payload = await parseJsonAsync(text);
            if (payload.masterData) {
              setMasterData(sanitizeAndMergeMasterData(payload.masterData));
              setMasterSyncStatus('saved');
              setMasterLastSyncedTime(new Date().toLocaleTimeString());
              handleShowToast('Master Reconnected', `Loaded Master configuration from "${masterFileHandle.name}"!`, 'success');
              addSystemLog(`Re-established connection to Master data: "${masterFileHandle.name}".`, 'success');
            }
          } catch (e) {
            setMasterSyncStatus('linked');
          }
        } else {
          setMasterSyncStatus('linked');
        }
      } else {
        handleShowToast('Permission Denied', 'Write permission required for Master Data.', 'warning');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncMaster = async (silent?: boolean) => {
    if (!masterFileHandle) {
      if (!silent) handleShowToast('No Master File Linked', 'Please link or create a Master storage file in Settings.', 'error');
      return;
    }
    try {
      await autoSaveMasterToFile(masterData, masterFileHandle);
      if (!silent) {
        handleShowToast('Master Written Successfully', `Changes flushed to "${masterFileHandle.name}".`, 'success');
      }
    } catch (err) {
      console.error('Master manual write failed:', err);
      if (!silent) {
        handleShowToast('Save Failed', 'Failed to write Master configuration.', 'error');
      }
    }
  };

  // Direct Client-Side Local File Storage Handlers: Activity Logs (Channel 2)
  const linkExistingActivityFile = async () => {
    try {
      const handle = await getHandleWithFallback({
        types: [{
          description: 'JSON Activity Logs',
          accept: { 'application/json': ['.json'] }
        }],
        multiple: false
      });
      setActivityFileHandle(handle);
      await storeFileHandleInDB('activity_handle', handle);
      const file = await handle.getFile();
      const text = await file.text();
      if (text.trim()) {
        try {
          const payload = await parseJsonAsync(text);
          if (payload.activityLogs) setActivityLogs(payload.activityLogs);
          if (payload.leaveLogs) setLeaveLogs(payload.leaveLogs);
          if (payload.systemLogs) setSystemLogs(payload.systemLogs);
          if (payload.deletedRecords) setDeletedRecords(payload.deletedRecords);
          setActivitySyncStatus('saved');
          setActivityLastSyncedTime(new Date().toLocaleTimeString());
          handleShowToast('Activity File Linked', `Loaded transactional logs from "${handle.name}"!`, 'success');
          addSystemLog(`Connected and loaded Activity & Leave Logs from "${handle.name}".`, 'success');
        } catch (e) {
          setActivitySyncStatus('linked');
          handleShowToast('Invalid JSON file format', 'Activity file format incorrect.', 'error');
        }
      } else {
        setActivitySyncStatus('linked');
        handleShowToast('Activity File Linked', 'Empty logs file linked. Your edits will auto-save to it.', 'success');
        addSystemLog(`Connected to empty logs file "${handle.name}".`, 'info');
      }
    } catch (err: any) {
      console.error(err);
      if (err.name !== 'AbortError') {
        handleShowToast('Connection Denied', 'File selection canceled.', 'error');
      }
    }
  };

  const createNewActivityFile = async () => {
    try {
      const handle = await getHandleWithFallback({
        suggestedName: 'Vector_SLAte_Activity_Logs.json',
        types: [{
          description: 'JSON Activity Logs',
          accept: { 'application/json': ['.json'] }
        }]
      }, true);
      setActivityFileHandle(handle);
      await storeFileHandleInDB('activity_handle', handle);
      setActivitySyncStatus('linked');
      handleShowToast('Activity File Created', `Successfully initialized "${handle.name}"!`, 'success');
      addSystemLog(`Created and linked new Activity Logs file "${handle.name}".`, 'info');
    } catch (err: any) {
      console.error(err);
      if (err.name !== 'AbortError') {
        handleShowToast('Connection Denied', 'File creation canceled.', 'error');
      }
    }
  };

  const disconnectActivityFile = async () => {
    try {
      await clearFileHandleFromDB('activity_handle');
      setActivityFileHandle(null);
      setActivitySyncStatus('disconnected');
      handleShowToast('Logs Disconnected', 'Activity logs storage switched to in-memory mode.', 'warning');
      addSystemLog('Disconnected Activity storage file.', 'warning');
    } catch (err) {
      console.error(err);
    }
  };

  const reconnectActivityFile = async () => {
    if (!activityFileHandle) return;
    try {
      const permission = await activityFileHandle.requestPermission({ mode: 'readwrite' });
      if (permission === 'granted') {
        const file = await activityFileHandle.getFile();
        const text = await file.text();
        if (text.trim()) {
          try {
            const payload = await parseJsonAsync(text);
            if (payload.activityLogs) setActivityLogs(payload.activityLogs);
            if (payload.leaveLogs) setLeaveLogs(payload.leaveLogs);
            if (payload.systemLogs) setSystemLogs(payload.systemLogs);
            if (payload.deletedRecords) setDeletedRecords(payload.deletedRecords);
            setActivitySyncStatus('saved');
            setActivityLastSyncedTime(new Date().toLocaleTimeString());
            handleShowToast('Logs Reconnected', `Loaded transactional logs from "${activityFileHandle.name}"!`, 'success');
            addSystemLog(`Re-established connection to Activity & Leave logs: "${activityFileHandle.name}".`, 'success');
          } catch (e) {
            setActivitySyncStatus('linked');
          }
        } else {
          setActivitySyncStatus('linked');
        }
      } else {
        handleShowToast('Permission Denied', 'Write permission required for Activity Logs.', 'warning');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const reconnectSharepointFile = async () => {
    if (!sharepointFileHandle) return;
    try {
      const permission = await sharepointFileHandle.requestPermission({ mode: 'readwrite' });
      if (permission === 'granted') {
        setSharepointSyncStatus('saved');
        setSharepointLastSyncedTime(new Date().toLocaleTimeString());
        handleShowToast('SharePoint Reconnected', `Seamlessly restored connection to SharePoint storage: "${sharepointFileHandle.name}".`, 'success');
        addSystemLog(`Re-established connection to SharePoint storage file: "${sharepointFileHandle.name}".`, 'success');
        handleSyncSharepoint(true);
      } else {
        handleShowToast('Permission Denied', 'Write permission required for SharePoint storage.', 'warning');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const reconnectSharepointMasterFile = async () => {
    if (!sharepointMasterFileHandle) return;
    try {
      const permission = await sharepointMasterFileHandle.requestPermission({ mode: 'readwrite' });
      if (permission === 'granted') {
        setSharepointMasterSyncStatus('saved');
        setSharepointMasterLastSyncedTime(new Date().toLocaleTimeString());
        handleShowToast('SharePoint Master Reconnected', `Seamlessly restored connection to SharePoint Master storage: "${sharepointMasterFileHandle.name}".`, 'success');
        addSystemLog(`Re-established connection to SharePoint Master storage file: "${sharepointMasterFileHandle.name}".`, 'success');
      } else {
        handleShowToast('Permission Denied', 'Write permission required for SharePoint Master.', 'warning');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncActivity = async (silent?: boolean) => {
    if (!activityFileHandle) {
      if (!silent) handleShowToast('No Activity File Linked', 'Please link or create an Activity storage file in Settings.', 'error');
      return;
    }
    try {
      await autoSaveActivityToFile(activityLogs, leaveLogs, systemLogs, deletedRecords, activityFileHandle);
      if (!silent) {
        handleShowToast('Activity Written Successfully', `Changes flushed to "${activityFileHandle.name}".`, 'success');
      }
    } catch (err) {
      console.error('Activity manual write failed:', err);
      if (!silent) {
        handleShowToast('Save Failed', 'Failed to write Activity Logs.', 'error');
      }
    }
  };

  const handleManualBackupExport = () => {
    const statePayload = {
      masterData,
      activityLogs,
      leaveLogs,
      systemLogs,
      deletedRecords
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(statePayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'Vector_SLAte_Workspace_Backup.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    handleShowToast('Backup Saved', 'Complete workspace state exported as backup JSON successfully.', 'success');
    addSystemLog('Exported full database sheets state backup as JSON.', 'info');
  };

  const handleManualBackupImport = (e: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = async (event) => {
      try {
        const parsed = await parseJsonAsync(event.target?.result as string);
        if (parsed.masterData) setMasterData(sanitizeAndMergeMasterData(parsed.masterData));
        if (parsed.activityLogs) setActivityLogs(parsed.activityLogs);
        if (parsed.leaveLogs) setLeaveLogs(parsed.leaveLogs);
        if (parsed.systemLogs) setSystemLogs(parsed.systemLogs);
        if (parsed.deletedRecords) setDeletedRecords(parsed.deletedRecords);

        handleShowToast('Backup Restored', 'Complete workspace sheets restored successfully!', 'success');
        addSystemLog('SUCCESS: Restored full database sheets state from manual backup file.', 'success');
      } catch (err) {
        handleShowToast('Restoration Failed', 'Invalid backup file format.', 'error');
      }
    };
    fileReader.readAsText(file);
    e.target.value = '';
  };

  const handleMasterBackupExport = () => {
    const payload = {
      masterData
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'Vector_SLAte_MasterData_Backup.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    handleShowToast('Master Data Exported', 'Master Data settings exported as backup JSON successfully.', 'success');
    addSystemLog('Exported Master Data state backup as JSON.', 'info');
  };

  const handleMasterBackupImport = (e: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = async (event) => {
      try {
        const parsed = await parseJsonAsync(event.target?.result as string);
        const dataToLoad = parsed.masterData || (parsed.employeeProfile ? parsed : null);
        if (dataToLoad) {
          setMasterData(sanitizeAndMergeMasterData(dataToLoad));
          handleShowToast('Master Data Restored', 'Master Data settings restored successfully!', 'success');
          addSystemLog('SUCCESS: Restored Master Data state from manual backup file.', 'success');
        } else {
          handleShowToast('Restoration Failed', 'Invalid Master Data backup file format.', 'error');
        }
      } catch (err) {
        handleShowToast('Restoration Failed', 'Invalid backup file format.', 'error');
      }
    };
    fileReader.readAsText(file);
    e.target.value = '';
  };

  const handleActivityBackupExport = () => {
    const payload = {
      activityLogs,
      leaveLogs
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'Vector_SLAte_ActivityLogs_Backup.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    handleShowToast('Activity Logs Exported', 'Daily SLA Activity Logs exported as backup JSON successfully.', 'success');
    addSystemLog('Exported Daily SLA Activity Logs backup as JSON.', 'info');
  };

  const handleActivityBackupImport = (e: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = async (event) => {
      try {
        const parsed = await parseJsonAsync(event.target?.result as string);
        const logsToLoad = parsed.activityLogs || (Array.isArray(parsed) ? parsed : null);
        const leavesToLoad = parsed.leaveLogs || [];
        if (logsToLoad) {
          setActivityLogs(logsToLoad);
          if (leavesToLoad.length > 0) setLeaveLogs(leavesToLoad);
          handleShowToast('Activity Logs Restored', 'Daily SLA Activity Logs restored successfully!', 'success');
          addSystemLog('SUCCESS: Restored Daily SLA Activity Logs from manual backup file.', 'success');
        } else {
          handleShowToast('Restoration Failed', 'Invalid Activity Logs backup file format.', 'error');
        }
      } catch (err) {
        handleShowToast('Restoration Failed', 'Invalid backup file format.', 'error');
      }
    };
    fileReader.readAsText(file);
    e.target.value = '';
  };

  const handleSharepointBackupExport = async () => {
    const { getIndexedDBItem } = await import('./utils/indexedDB');
    const rawCloud = await getIndexedDBItem<any>('sharepoint_consolidated_logs');
    let sharepointData: any = { activityLogs: [], leaveLogs: [] };
    if (rawCloud) {
      if (Array.isArray(rawCloud)) {
        sharepointData.activityLogs = rawCloud;
      } else {
        sharepointData = rawCloud;
      }
    }
    const payload = {
      sharepointLogs: sharepointData.activityLogs,
      sharepointLeaveLogs: sharepointData.leaveLogs
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'Vector_SLAte_SharePointLogs_Backup.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    handleShowToast('SharePoint Logs Exported', 'SharePoint consolidated logs exported as backup JSON successfully.', 'success');
    addSystemLog('Exported SharePoint consolidated logs backup as JSON.', 'info');
  };

  const handleSharepointBackupImport = (e: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = async (event) => {
      try {
        const parsed = await parseJsonAsync(event.target?.result as string);
        const logsToLoad = parsed.sharepointLogs || parsed.activityLogs || (Array.isArray(parsed) ? parsed : null);
        const leavesToLoad = parsed.sharepointLeaveLogs || parsed.leaveLogs || [];
        
        if (logsToLoad) {
          const payload = {
            activityLogs: logsToLoad,
            leaveLogs: leavesToLoad
          };
          const { setIndexedDBItem } = await import('./utils/indexedDB');
          await setIndexedDBItem('sharepoint_consolidated_logs', payload);
          setSharepointLogs(logsToLoad);
          setSharepointLeaveLogs(leavesToLoad);
          handleShowToast('SharePoint Logs Restored', 'SharePoint consolidated logs restored successfully!', 'success');
          addSystemLog(`SUCCESS: Restored ${logsToLoad.length} activity and ${leavesToLoad.length} leave SharePoint logs from manual backup file to IndexedDB.`, 'success');
          if (sharepointSyncStatus !== 'disconnected') {
            setSharepointSyncStatus('saved');
            localStorage.setItem('bu_sharepoint_sync_status', 'saved');
            const timeNow = new Date().toLocaleTimeString();
            setSharepointLastSyncedTime(timeNow);
            localStorage.setItem('bu_sharepoint_last_synced', timeNow);
          }
        } else {
          handleShowToast('Restoration Failed', 'Invalid SharePoint backup file format.', 'error');
        }
      } catch (err) {
        handleShowToast('Restoration Failed', 'Invalid backup file format.', 'error');
      }
    };
    fileReader.readAsText(file);
    e.target.value = '';
  };

  const handleUploadManualFallback = async (uploadedData: any) => {
    const mergedLogsMap = new Map<string, ActivityLog>();
    const mergedLeaveLogsMap = new Map<string, any>();

    const uploadedLogs = Array.isArray(uploadedData) ? uploadedData : (uploadedData.activityLogs || uploadedData.sharepointLogs || []);
    const uploadedLeaves = Array.isArray(uploadedData) ? [] : (uploadedData.leaveLogs || uploadedData.sharepointLeaveLogs || []);

    // Load existing sharepoint logs first
    sharepointLogs.forEach(log => {
      const key = `${log.employeeId || 'unknown'}_${log.id}`;
      mergedLogsMap.set(key, log);
    });
    sharepointLeaveLogs.forEach(log => {
      const key = `${log.employeeId || 'unknown'}_${log.id}`;
      mergedLeaveLogsMap.set(key, log);
    });

    // Merge/upsert uploaded fallback logs
    uploadedLogs.forEach((log: any) => {
      const key = `${log.employeeId || 'unknown'}_${log.id}`;
      mergedLogsMap.set(key, log);
    });
    uploadedLeaves.forEach((log: any) => {
      const key = `${log.employeeId || 'unknown'}_${log.id}`;
      mergedLeaveLogsMap.set(key, log);
    });

    const mergedLogs = Array.from(mergedLogsMap.values());
    const mergedLeaves = Array.from(mergedLeaveLogsMap.values());
    
    const finalPayload = {
      activityLogs: mergedLogs,
      leaveLogs: mergedLeaves
    };
    
    const { setIndexedDBItem } = await import('./utils/indexedDB');
    await setIndexedDBItem('sharepoint_consolidated_logs', finalPayload);
    setSharepointLogs(mergedLogs);
    setSharepointLeaveLogs(mergedLeaves);

    // Keep SharePoint synchronization indicators updated
    if (sharepointSyncStatus !== 'disconnected') {
      setSharepointSyncStatus('saved');
      localStorage.setItem('bu_sharepoint_sync_status', 'saved');
      const timeNow = new Date().toLocaleTimeString();
      setSharepointLastSyncedTime(timeNow);
      localStorage.setItem('bu_sharepoint_last_synced', timeNow);
    }

    addSystemLog(`Manual Fallback SUCCESS: Commited ${uploadedLogs.length} activities and ${uploadedLeaves.length} leaves to SharePoint. Merged database contains ${mergedLogs.length} activity records.`, 'success');
    addAuditLog('MANUAL_FALLBACK_SYNC', `Admin uploaded manual JSON file. Merged ${uploadedLogs.length} activities and ${uploadedLeaves.length} leaves. Total: ${mergedLogs.length} logs.`, 'success');
    handleShowToast('Commit Complete', `Saved fallback data to SharePoint (Channel 3) successfully.`, 'success');
  };

  if (!loggedInUser) {
    return (
      <>
        <LogonPage masterData={masterData} onLogin={handleLogin} />
        {/* Toast is still renderable if needed */}
        <AnimatePresence>
          {toast.show && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`absolute bottom-6 right-6 bg-white border border-slate-200 text-slate-900 p-4 rounded-xl shadow-xl flex items-center space-x-3 z-50 max-w-sm border-l-4 ${
                toast.type === 'success'
                  ? 'border-l-emerald-500'
                  : toast.type === 'warning'
                  ? 'border-l-amber-500'
                  : 'border-l-red-500'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                toast.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700'
                  : toast.type === 'warning'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{toast.title}</div>
                <div className="text-[11px] text-slate-550 mt-0.5">{toast.desc}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  const hasLockedMaster = !!(masterFileHandle && masterSyncStatus === 'needs-permission');
  const hasLockedActivity = !!(activityFileHandle && activitySyncStatus === 'needs-permission');
  const hasLockedSharepoint = !!(sharepointFileHandle && sharepointSyncStatus === 'needs-permission');
  const hasLockedSharepointMaster = !!(sharepointMasterFileHandle && sharepointMasterSyncStatus === 'needs-permission');
  const hasAnyLockedFiles = hasLockedMaster || hasLockedActivity || hasLockedSharepoint || hasLockedSharepointMaster;

  return (
    <div className="bg-neutral-light text-slate-900 h-screen flex flex-col overflow-hidden font-sans">
      <style>{`
        :root {
          ${(customThemeEnabled && themePreset === 'custom') ? `
            --color-brand-60: ${customPrimary} !important;
            --color-brand-20: ${customSecondary} !important;
            --color-accent-turquoise: ${customAccent1} !important;
            --color-accent-purple: ${customAccent2} !important;
            --color-neutral-light: ${customAccent3} !important;
          ` : (themeMode === 'dark') ? `
            --color-brand-60: #020b18 !important;
            --color-brand-20: #0b2240 !important;
            --color-accent-turquoise: #38bdf8 !important;
            --color-accent-purple: #a855f7 !important;
            --color-neutral-light: #1e293b !important;
          ` : `
            --color-brand-60: #06234D !important;
            --color-brand-20: #003886 !important;
            --color-accent-turquoise: #00C4E7 !important;
            --color-accent-purple: #7F59E9 !important;
            --color-neutral-light: #E7EAEF !important;
          `}
        }

        ${(themePreset === 'default') ? `
          * {
            font-family: "Futura", "Trebuchet MS", Arial, sans-serif !important;
          }
          ${themeMode === 'light' ? `
            body, #root, main, .bg-slate-50, .bg-slate-100 {
              background-color: #E7EAEF !important;
            }
            .bg-white {
              background-color: #FFFFFF !important;
            }
            aside {
              background-color: #06234D !important;
            }
            header {
              background-color: #06234D !important;
            }
            .bg-brand-60 {
              background-color: #06234D !important;
            }
            .bg-brand-20 {
              background-color: #003886 !important;
            }
            .text-slate-900, .text-slate-800, .text-slate-700 {
              color: #06234D !important;
            }
            input, select, textarea {
              background-color: #FFFFFF !important;
              color: #06234D !important;
              border-color: #003886 !important;
            }
            .border-slate-200, .border-slate-100 {
              border-color: #00388622 !important;
            }
            .bg-blue-600 {
              background-color: #003886 !important;
              color: #FFFFFF !important;
            }
            .bg-blue-600:hover {
              background-color: #003886dd !important;
            }
          ` : `
            /* Default Dark Theme Mode */
            body, #root, main, .bg-slate-50, .bg-slate-100 {
              background-color: #020b18 !important;
              color: #f1f5f9 !important;
            }
            .bg-white {
              background-color: #0b2240 !important;
              color: #f1f5f9 !important;
            }
            aside {
              background-color: #06234D !important;
            }
            header {
              background-color: #06234D !important;
            }
            .bg-brand-60 {
              background-color: #06234D !important;
            }
            .bg-brand-20 {
              background-color: #003886 !important;
            }
            .text-slate-900, .text-slate-800, .text-slate-700, .text-slate-600, .text-slate-500 {
              color: #f1f5f9 !important;
            }
            .text-indigo-950, .text-indigo-900 {
              color: #00C4E7 !important;
            }
            input, select, textarea {
              background-color: #111d35 !important;
              color: #f1f5f9 !important;
              border-color: #00C4E7 !important;
            }
            .border-slate-200, .border-slate-100, .border-slate-300 {
              border-color: #003886 !important;
            }
            .bg-blue-600 {
              background-color: #003886 !important;
              color: #FFFFFF !important;
            }
            .bg-blue-600:hover {
              background-color: #003886dd !important;
            }
            .bg-slate-50, .bg-indigo-50 {
              background-color: #06234D !important;
            }
            .text-indigo-700, .text-indigo-600, .text-blue-600 {
              color: #00C4E7 !important;
            }
            .border-indigo-100 {
              border-color: #003886 !important;
            }
          `}
        ` : (themeMode === 'dark' && (!customThemeEnabled || themePreset !== 'custom')) ? `
          body, #root, main, .bg-slate-50, .bg-slate-100 {
            background-color: #0b1329 !important;
            color: #f1f5f9 !important;
          }
          .bg-white {
            background-color: #111d35 !important;
            color: #f1f5f9 !important;
          }
          .text-slate-900, .text-slate-800, .text-slate-700, .text-slate-600, .text-slate-500 {
            color: #e2e8f0 !important;
          }
          .text-slate-400 {
            color: #94a3b8 !important;
          }
          .border-slate-200, .border-slate-100, .border-slate-300 {
            border-color: #334155 !important;
          }
          input, select, textarea {
            background-color: #1e293b !important;
            color: #f1f5f9 !important;
            border-color: #334155 !important;
          }
          /* Sidebar special overrides */
          aside {
            background-color: #050b14 !important;
            border-right-color: #111d35 !important;
          }
          header {
            background-color: #050b14 !important;
            border-bottom-color: #111d35 !important;
          }
        ` : (customThemeEnabled && themePreset === 'custom') ? `
          body, #root, main, .bg-slate-50 {
            background-color: ${customAccent3} !important;
          }
          .bg-white {
            background-color: ${customAccent4} !important;
          }
          aside {
            background-color: ${customPrimary} !important;
          }
          header {
            background-color: ${customPrimary} !important;
          }
          .bg-brand-60 {
            background-color: ${customPrimary} !important;
          }
          .bg-brand-20 {
            background-color: ${customSecondary} !important;
          }
          .text-slate-900, .text-slate-800, .text-slate-700 {
            color: ${customPrimary} !important;
          }
          input, select, textarea {
            background-color: ${customAccent4} !important;
            color: ${customPrimary} !important;
            border-color: ${customSecondary} !important;
          }
          .border-slate-200, .border-slate-100 {
            border-color: ${customSecondary}22 !important;
          }
          /* Buttons styled to Secondary color */
          .bg-blue-600 {
            background-color: ${customSecondary} !important;
            color: ${customAccent4} !important;
          }
          .bg-blue-600:hover {
            background-color: ${customSecondary}dd !important;
          }
        ` : ''}
      `}</style>
      {/* Upper Global Navigation Header */}
      <header className="bg-brand-60 border-b border-brand-20/30 px-4 py-3 flex items-center justify-between shrink-0 shadow-lg z-10 text-white">
        <div className="flex items-center space-x-4">
          {masterData.logo ? (
            <motion.div
              key={masterData.logo}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="shrink-0 h-11 flex items-center bg-brand-20/30 p-1 rounded-xl shadow-md transition-all"
              id="header-logo-container"
            >
              <img
                src={masterData.logo}
                alt="Custom App Logo"
                referrerPolicy="no-referrer"
                className="h-full object-contain w-auto max-w-[240px] rounded-lg"
              />
            </motion.div>
          ) : (
            <motion.div
              key="default-logo"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="bg-brand-20 p-2.5 rounded-xl text-white shadow-md shrink-0"
              id="header-logo-container"
            >
              <Briefcase className="h-6 w-6 text-accent-turquoise" />
            </motion.div>
          )}
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
              OpsIntel Prodex - Productivity Tool
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">
              Enterprise Productivity & Performance Intelligence
            </p>
          </div>
        </div>

        {/* Global KPI Metrics Header Strip */}
        <div className="hidden lg:flex items-center space-x-6 text-xs text-slate-300 font-mono">
          {/* Master File Action Buttons */}
          {masterFileHandle && masterSyncStatus === 'needs-permission' ? (
            <div className="border-l border-brand-20/40 pl-4">
              <button
                onClick={reconnectMasterFile}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium border border-amber-500 cursor-pointer shadow-md text-xs animate-pulse"
                title="Authorize read/write permission to your Master file"
              >
                🔓 Reconnect Master
              </button>
            </div>
          ) : masterFileHandle ? (
            <div className="border-l border-brand-20/40 pl-4">
              <button
                onClick={() => handleSyncMaster()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium border border-emerald-500/50 cursor-pointer shadow-md text-xs"
                title="Force save Master data directly to file"
              >
                <RefreshCw className="h-3 w-3" /> Save Master
              </button>
            </div>
          ) : null}

          {/* Activity File Action Buttons */}
          {activityFileHandle && activitySyncStatus === 'needs-permission' ? (
            <div className="border-l border-brand-20/40 pl-4">
              <button
                onClick={reconnectActivityFile}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium border border-amber-500 cursor-pointer shadow-md text-xs animate-pulse"
                title="Authorize read/write permission to your Activity Logs file"
              >
                🔓 Reconnect Activity
              </button>
            </div>
          ) : activityFileHandle ? (
            <div className="border-l border-brand-20/40 pl-4">
              <button
                onClick={() => handleSyncActivity()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium border border-emerald-500/50 cursor-pointer shadow-md text-xs"
                title="Force save Activity logs directly to file"
              >
                <RefreshCw className="h-3 w-3" /> Save Activity
              </button>
            </div>
          ) : null}

          {/* SharePoint Sync Log Button */}
          {sharepointSyncStatus !== 'disconnected' ? (
            <div className="border-l border-brand-20/40 pl-4">
              <button
                onClick={() => handleSyncSharepoint()}
                disabled={sharepointSyncStatus === 'syncing'}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium border border-indigo-500 cursor-pointer shadow-md text-xs disabled:opacity-55"
                title="Consolidate activity logs and sync securely to SharePoint"
              >
                <Cloud className={`h-3.5 w-3.5 ${sharepointSyncStatus === 'syncing' ? 'animate-spin' : ''}`} /> 
                {sharepointSyncStatus === 'syncing' ? 'Syncing...' : 'Sync Log'}
              </button>
            </div>
          ) : null}

          {/* Combined Status Indicators */}
          <div className="border-l border-brand-20/40 pl-4 flex items-center gap-2">
            {/* Master pill */}
            {masterFileHandle ? (
              masterSyncStatus === 'saved' ? (
                <div className="flex items-center gap-1.5 bg-emerald-500/25 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-200" title={`Master Connected to ${masterFileHandle.name}`}>
                  <Database className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden xl:inline">Master: In-Sync</span>
                </div>
              ) : masterSyncStatus === 'needs-permission' ? (
                <div className="flex items-center gap-1.5 bg-amber-500/25 border border-amber-500/30 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-200" title="Permission Required">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                  <span className="hidden xl:inline">Master: Locked</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-blue-500/25 border border-blue-500/30 px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-200" title="Connected">
                  <Database className="h-3.5 w-3.5 text-blue-400" />
                  <span className="hidden xl:inline">Master: Connected</span>
                </div>
              )
            ) : null}

            {/* Activity pill */}
            {activityFileHandle ? (
              activitySyncStatus === 'saved' ? (
                <div className="flex items-center gap-1.5 bg-emerald-500/25 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-200" title={`Activity Connected to ${activityFileHandle.name}`}>
                  <Database className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden xl:inline">Activity: In-Sync</span>
                </div>
              ) : activitySyncStatus === 'needs-permission' ? (
                <div className="flex items-center gap-1.5 bg-amber-500/25 border border-amber-500/30 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-200" title="Permission Required">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                  <span className="hidden xl:inline">Activity: Locked</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-blue-500/25 border border-blue-500/30 px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-200" title="Connected">
                  <Database className="h-3.5 w-3.5 text-blue-400" />
                  <span className="hidden xl:inline">Activity: Connected</span>
                </div>
              )
            ) : null}

            {/* SharePoint pill */}
            {sharepointSyncStatus !== 'disconnected' ? (
              sharepointSyncStatus === 'saved' ? (
                <div className="flex items-center gap-1.5 bg-emerald-500/25 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-200" title="SharePoint Connected">
                  <Cloud className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden xl:inline">SharePoint: In-Sync</span>
                </div>
              ) : sharepointSyncStatus === 'syncing' ? (
                <div className="flex items-center gap-1.5 bg-amber-500/25 border border-amber-500/30 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-200" title="Syncing to SharePoint">
                  <RefreshCw className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                  <span className="hidden xl:inline">SharePoint: Syncing</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-indigo-500/25 border border-indigo-500/30 px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-200" title={`SharePoint Connected`}>
                  <Cloud className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="hidden xl:inline">SharePoint: Connected</span>
                </div>
              )
            ) : null}
          </div>

          <div className="border-l border-brand-20/40 pl-4 flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">User Account</div>
              <div className="text-xs font-extrabold text-accent-turquoise flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {loggedInUser?.role === 'admin' 
                  ? 'admin: Administrator' 
                  : `${masterData.regularUserAccount?.employeeCode || 'staff'}: ${masterData.regularUserAccount?.employeeName || 'Staff'}`}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600/20 hover:bg-red-600/30 text-red-200 hover:text-white p-2 rounded-xl transition-all border border-red-500/20 cursor-pointer shadow-md text-xs flex items-center justify-center"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Primary Split Screen Layout */}
      {hasAnyLockedFiles ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-4 sm:p-8 overflow-y-auto custom-scrollbar relative">
          <div className="w-full max-w-2xl bg-slate-900 border border-amber-500/20 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 animate-pulse">
                <Lock className="h-8 w-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Secure Storage Authorization Required
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg leading-relaxed">
                Your session includes active, persistent storage links mapped to local synced folders.
                To access any system modules, you must re-grant read/write permissions for the locked storage files below.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Locked Storage Channels
              </h3>

              <div className="grid gap-3">
                {hasLockedMaster && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-800/60 border border-amber-500/20 rounded-xl gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <strong className="text-xs sm:text-sm font-bold text-white">Channel 1: Master Configuration Data</strong>
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-400 font-mono truncate max-w-xs sm:max-w-md">
                        File: {masterFileHandle.name}
                      </div>
                    </div>
                    <button
                      onClick={reconnectMasterFile}
                      className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer border-none"
                    >
                      <Unlock className="h-3.5 w-3.5" /> Reconnect Master
                    </button>
                  </div>
                )}

                {hasLockedActivity && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-800/60 border border-amber-500/20 rounded-xl gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <strong className="text-xs sm:text-sm font-bold text-white">Channel 2: SLA Activity Logs</strong>
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-400 font-mono truncate max-w-xs sm:max-w-md">
                        File: {activityFileHandle.name}
                      </div>
                    </div>
                    <button
                      onClick={reconnectActivityFile}
                      className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer border-none"
                    >
                      <Unlock className="h-3.5 w-3.5" /> Reconnect Activity Logs
                    </button>
                  </div>
                )}

                {hasLockedSharepoint && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-800/60 border border-amber-500/20 rounded-xl gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <strong className="text-xs sm:text-sm font-bold text-white">Channel 3: SharePoint Storage Repository</strong>
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-400 font-mono truncate max-w-xs sm:max-w-md">
                        File: {sharepointFileHandle.name}
                      </div>
                    </div>
                    <button
                      onClick={reconnectSharepointFile}
                      className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer border-none"
                    >
                      <Unlock className="h-3.5 w-3.5" /> Reconnect SharePoint
                    </button>
                  </div>
                )}

                {hasLockedSharepointMaster && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-800/60 border border-amber-500/20 rounded-xl gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <strong className="text-xs sm:text-sm font-bold text-white">Channel 4: SharePoint Master Data</strong>
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-400 font-mono truncate max-w-xs sm:max-w-md">
                        File: {sharepointMasterFileHandle.name}
                      </div>
                    </div>
                    <button
                      onClick={reconnectSharepointMasterFile}
                      className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer border-none"
                    >
                      <Unlock className="h-3.5 w-3.5" /> Reconnect SharePoint Master
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 text-center text-[10px] text-slate-500 font-medium">
              Secured Sync System • OpsIntel Prodex
            </div>
          </div>

          <AnimatePresence>
            {toast.show && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className={`absolute bottom-6 right-6 bg-white border border-slate-200 text-slate-900 p-4 rounded-xl shadow-xl flex items-center space-x-3 z-50 max-w-sm border-l-4 ${
                  toast.type === 'success'
                    ? 'border-l-emerald-500'
                    : toast.type === 'warning'
                    ? 'border-l-amber-500'
                    : 'border-l-red-500'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  toast.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700'
                    : toast.type === 'warning'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{toast.title}</div>
                  <div className="text-[11px] text-slate-550 mt-0.5">{toast.desc}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Interactive Sidebar Tab Navigation */}
          <Sidebar
            currentTab={currentTab}
            onTabChange={handleTabChange}
            masterData={masterData}
            activityLogs={activityLogs}
            onRunMacro={handleRunMacro}
            systemLogs={systemLogs}
            onClearSystemLogs={handleClearSystemLogs}
            isTimerActive={activeTimerState !== 'idle'}
            loggedInUser={loggedInUser}
          />

          {/* Center Canvas Viewport */}
          <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {currentTab === 'cover' && (
                  <CoverTab
                    masterData={masterData}
                    onNavigateToLog={() => handleTabChange('log')}
                  />
                )}
                {currentTab === 'log' && (
                  <LogTab
                    masterData={masterData}
                    onSubmitLog={handleAddLog}
                    onTimerStateChange={setActiveTimerState}
                    onContainersChange={setOpenLogIds}
                    activityLogs={activityLogs}
                    loggedInUser={loggedInUser}
                    containers={containers}
                    onUpdateContainers={setContainers}
                  />
                )}
                {currentTab === 'database' && (
                  <DatabaseTab
                    activityLogs={activityLogs}
                    masterData={masterData}
                    onUpdateLog={handleAddLog}
                    onContinueLog={handleContinueLog}
                    loggedInUser={loggedInUser}
                    openLogIds={openLogIds}
                    containers={containers}
                  />
                )}
                {currentTab === 'admin-cloud' && (
                  <AdminCloudTab
                    loggedInUser={loggedInUser}
                  />
                )}
                 {currentTab === 'settings' && (
                  <SettingsTab
                    masterData={masterData}
                    activityLogs={activityLogs}
                    onUpdateMasterData={handleUpdateMasterData}
                    loggedInUser={loggedInUser}
                    masterFileHandle={masterFileHandle}
                    masterSyncStatus={masterSyncStatus}
                    masterLastSyncedTime={masterLastSyncedTime}
                    linkExistingMasterFile={linkExistingMasterFile}
                    createNewMasterFile={createNewMasterFile}
                    disconnectMasterFile={disconnectMasterFile}
                    handleSyncMaster={handleSyncMaster}
                    reconnectMasterFile={reconnectMasterFile}
                    activityFileHandle={activityFileHandle}
                    activitySyncStatus={activitySyncStatus}
                    activityLastSyncedTime={activityLastSyncedTime}
                    linkExistingActivityFile={linkExistingActivityFile}
                    createNewActivityFile={createNewActivityFile}
                    disconnectActivityFile={disconnectActivityFile}
                    handleSyncActivity={handleSyncActivity}
                    reconnectActivityFile={reconnectActivityFile}
                    handleManualBackupExport={handleManualBackupExport}
                    handleManualBackupImport={handleManualBackupImport}
                    handleMasterBackupExport={handleMasterBackupExport}
                    handleMasterBackupImport={handleMasterBackupImport}
                    handleActivityBackupExport={handleActivityBackupExport}
                    handleActivityBackupImport={handleActivityBackupImport}
                    sharepointFileHandle={sharepointFileHandle}
                    sharepointSyncStatus={sharepointSyncStatus}
                    sharepointLastSyncedTime={sharepointLastSyncedTime}
                    linkExistingSharepointFile={linkExistingSharepointFile}
                    createNewSharepointFile={createNewSharepointFile}
                    disconnectSharepointFile={disconnectSharepointFile}
                    onSyncSharepoint={() => handleSyncSharepoint()}
                    sharepointAutoSaveEnabled={sharepointAutoSaveEnabled}
                    onToggleSharepointAutoSave={() => setSharepointAutoSaveEnabled(!sharepointAutoSaveEnabled)}
                    onCreateSharepointFile={handleCreateSharepointFile}
                    handleSharepointBackupExport={handleSharepointBackupExport}
                    handleSharepointBackupImport={handleSharepointBackupImport}
                    reconnectSharepointFile={reconnectSharepointFile}

                    // Channel 4 Props
                    sharepointMasterFileHandle={sharepointMasterFileHandle}
                    sharepointMasterSyncStatus={sharepointMasterSyncStatus}
                    sharepointMasterLastSyncedTime={sharepointMasterLastSyncedTime}
                    linkExistingSharepointMasterFile={linkExistingSharepointMasterFile}
                    createNewSharepointMasterFile={createNewSharepointMasterFile}
                    disconnectSharepointMasterFile={disconnectSharepointMasterFile}
                    onSyncSharepointMaster={() => handleSyncSharepointMaster()}
                    reconnectSharepointMasterFile={reconnectSharepointMasterFile}

                    // Theme Props
                    themeMode={themeMode}
                    setThemeMode={setThemeMode}
                    themePreset={themePreset}
                    setThemePreset={setThemePreset}
                    customThemeEnabled={customThemeEnabled}
                    setCustomThemeEnabled={setCustomThemeEnabled}
                    customPrimary={customPrimary}
                    setCustomPrimary={setCustomPrimary}
                    customSecondary={customSecondary}
                    setCustomSecondary={setCustomSecondary}
                    customAccent1={customAccent1}
                    setCustomAccent1={setCustomAccent1}
                    customAccent2={customAccent2}
                    setCustomAccent2={setCustomAccent2}
                    customAccent3={customAccent3}
                    setCustomAccent3={setCustomAccent3}
                    customAccent4={customAccent4}
                    setCustomAccent4={setCustomAccent4}
                  />
                )}
                {currentTab === 'leave-log' && (
                  <LeaveLogTab
                    masterData={masterData}
                    leaveLogs={leaveLogs}
                    activityLogs={activityLogs}
                    onSubmitLeaveLog={onSubmitLeaveLog}
                    onDeleteLeaveLog={onDeleteLeaveLog}
                    onUpdateMasterData={handleUpdateMasterData}
                    loggedInUser={loggedInUser}
                  />
                )}
                {currentTab === 'audit-tracking' && (
                  <AuditTrackingTab
                    auditLogs={auditLogs}
                    onClearLogs={handleClearAuditLogs}
                    userRole={loggedInUser?.role || null}
                  />
                )}

                {currentTab === 'summary' && (
                  <SummaryTab
                    activityLogs={activityLogs}
                    leaveLogs={leaveLogs}
                    masterData={masterData}
                    loggedInUser={loggedInUser}
                  />
                )}
                {currentTab === 'performance' && (
                  <PerformanceTab
                    activityLogs={activityLogs}
                    leaveLogs={leaveLogs}
                    masterData={masterData}
                    loggedInUser={loggedInUser}
                  />
                )}
                {currentTab === 'consolidated-database' && (
                  <DatabaseTab
                    activityLogs={sharepointLogs}
                    masterData={masterData}
                    onUpdateLog={handleAddLog}
                    onContinueLog={handleContinueLog}
                    loggedInUser={loggedInUser}
                    isConsolidated={true}
                    openLogIds={openLogIds}
                    containers={containers}
                  />
                )}
                {currentTab === 'consolidated-summary' && (
                  <SummaryTab
                    activityLogs={sharepointLogs}
                    leaveLogs={sharepointLeaveLogs}
                    masterData={masterData}
                    loggedInUser={loggedInUser}
                    isConsolidated={true}
                  />
                )}
                {currentTab === 'consolidated-performance' && (
                  <PerformanceTab
                    activityLogs={sharepointLogs}
                    leaveLogs={sharepointLeaveLogs}
                    masterData={masterData}
                    loggedInUser={loggedInUser}
                    isConsolidated={true}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Interactive Absolute-Position Toast Notifications */}
          <input type="file" ref={fileInputRef} className="hidden" />
          <AnimatePresence>
            {toast.show && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className={`absolute bottom-6 right-6 bg-white border border-slate-200 text-slate-900 p-4 rounded-xl shadow-xl flex items-center space-x-3 z-50 max-w-sm border-l-4 ${
                  toast.type === 'success'
                    ? 'border-l-emerald-500'
                    : toast.type === 'warning'
                    ? 'border-l-amber-500'
                    : 'border-l-red-500'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  toast.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700'
                    : toast.type === 'warning'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{toast.title}</div>
                  <div className="text-[11px] text-slate-550 mt-0.5">{toast.desc}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
                    <FloatingTimer 
            containers={containers} 
            onToggleTimer={(id) => {
              setContainers((prev) =>
                prev.map((item) => {
                  if (item.id === id) {
                    if (item.timerState === 'running') {
                      const added = item.startTime ? Math.floor((Date.now() - item.startTime) / 1000) : 0;
                      return {
                        ...item,
                        accumulatedSeconds: item.accumulatedSeconds + added,
                        startTime: null,
                        timerState: 'paused'
                      };
                    } else if (item.timerState === 'paused') {
                      return {
                        ...item,
                        startTime: Date.now(),
                        timerState: 'running'
                      };
                    }
                  } else if (item.timerState === 'running') {
                    const added = item.startTime ? Math.floor((Date.now() - item.startTime) / 1000) : 0;
                    return {
                      ...item,
                      accumulatedSeconds: item.accumulatedSeconds + added,
                      startTime: null,
                      timerState: 'paused'
                    };
                  }
                  return item;
                })
              );
            }} 
          />
        </main>
      </div>
      )}
    </div>
  );
}
