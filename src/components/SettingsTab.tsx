import { useState, ChangeEvent, useEffect, DragEvent } from 'react';
import { Shield, Settings, Users, FileText, Download, Briefcase, FileSpreadsheet, Sparkles, CheckCircle2, Edit2, Plus, Trash2, Save, X, Database, RefreshCw, FolderOpen, Upload, AlertTriangle, Lock, Key, Eye, EyeOff, Image, Clock, Calendar, Cloud, Edit, Trash, Check } from 'lucide-react';
import { MasterData, ActivityLog, UserAccount, EmployeeProfile } from '../types';
import {
  db,
  loadMasterDataFromFirestore,
  saveMasterDataToFirestore,
  loadUsersFromFirestore,
  saveUserToFirestore,
  loadActivityLogsFromFirestore,
  saveActivityLogsBatch,
  loadLeaveLogsFromFirestore,
  saveLeaveLogToFirestore,
  loadAuditLogsFromFirestore,
  saveAuditLogToFirestore,
} from '../utils/firebase';
import MasterBulkUpload from './MasterBulkUpload';

interface SettingsTabProps {
  masterData: MasterData;
  activityLogs: ActivityLog[];
  onUpdateMasterData?: (newData: MasterData) => void;
  loggedInUser?: { role: 'admin' | 'user'; username: string } | null;
  
  // Master File Storage Props
  masterFileHandle: any;
  masterSyncStatus: string;
  masterLastSyncedTime: string;
  linkExistingMasterFile: () => Promise<void>;
  createNewMasterFile: () => Promise<void>;
  disconnectMasterFile: () => Promise<void>;
  handleSyncMaster: () => Promise<void>;
  reconnectMasterFile?: () => Promise<void>;

  // Activity File Storage Props
  activityFileHandle: any;
  activitySyncStatus: string;
  activityLastSyncedTime: string;
  linkExistingActivityFile: () => Promise<void>;
  createNewActivityFile: () => Promise<void>;
  disconnectActivityFile: () => Promise<void>;
  handleSyncActivity: () => Promise<void>;
  reconnectActivityFile?: () => Promise<void>;

  handleManualBackupExport: () => void;
  handleManualBackupImport: (e: ChangeEvent<HTMLInputElement>) => void;
  handleMasterBackupExport: () => void;
  handleMasterBackupImport: (e: ChangeEvent<HTMLInputElement>) => void;
  handleActivityBackupExport: () => void;
  handleActivityBackupImport: (e: ChangeEvent<HTMLInputElement>) => void;

  // SharePoint Storage Props
  sharepointFileHandle: any;
  sharepointSyncStatus: string;
  sharepointLastSyncedTime: string;
  linkExistingSharepointFile: () => Promise<void>;
  createNewSharepointFile: () => Promise<void>;
  disconnectSharepointFile: () => Promise<void>;
  onSyncSharepoint: () => void;
  sharepointAutoSaveEnabled: boolean;
  onToggleSharepointAutoSave: () => void;
  onCreateSharepointFile: () => void;
  handleSharepointBackupExport: () => void;
  handleSharepointBackupImport: (e: ChangeEvent<HTMLInputElement>) => void;
  reconnectSharepointFile?: () => Promise<void>;

  // SharePoint Master Storage Props (Channel 4)
  sharepointMasterFileHandle: any;
  sharepointMasterSyncStatus: string;
  sharepointMasterLastSyncedTime: string;
  linkExistingSharepointMasterFile: () => Promise<void>;
  createNewSharepointMasterFile: () => Promise<void>;
  disconnectSharepointMasterFile: () => Promise<void>;
  onSyncSharepointMaster: () => void;
  reconnectSharepointMasterFile?: () => Promise<void>;

  // Theme & Customization Props
  themeMode?: 'light' | 'dark';
  setThemeMode?: (mode: 'light' | 'dark') => void;
  customThemeEnabled?: boolean;
  setCustomThemeEnabled?: (enabled: boolean) => void;
  themePreset?: 'default' | 'custom';
  setThemePreset?: (preset: 'default' | 'custom') => void;
  customPrimary?: string;
  setCustomPrimary?: (val: string) => void;
  customSecondary?: string;
  setCustomSecondary?: (val: string) => void;
  customAccent1?: string;
  setCustomAccent1?: (val: string) => void;
  customAccent2?: string;
  setCustomAccent2?: (val: string) => void;
  customAccent3?: string;
  setCustomAccent3?: (val: string) => void;
  customAccent4?: string;
  setCustomAccent4?: (val: string) => void;
}

export default function SettingsTab({ 
  masterData, 
  activityLogs, 
  onUpdateMasterData,
  loggedInUser,
  masterFileHandle,
  masterSyncStatus,
  masterLastSyncedTime,
  linkExistingMasterFile,
  createNewMasterFile,
  disconnectMasterFile,
  handleSyncMaster,
  reconnectMasterFile,
  activityFileHandle,
  activitySyncStatus,
  activityLastSyncedTime,
  linkExistingActivityFile,
  createNewActivityFile,
  disconnectActivityFile,
  handleSyncActivity,
  reconnectActivityFile,
  handleManualBackupExport,
  handleManualBackupImport,
  handleMasterBackupExport,
  handleMasterBackupImport,
  handleActivityBackupExport,
  handleActivityBackupImport,
  sharepointFileHandle,
  sharepointSyncStatus,
  sharepointLastSyncedTime,
  linkExistingSharepointFile,
  createNewSharepointFile,
  disconnectSharepointFile,
  onSyncSharepoint,
  sharepointAutoSaveEnabled,
  onToggleSharepointAutoSave,
  onCreateSharepointFile,
  handleSharepointBackupExport,
  handleSharepointBackupImport,
  reconnectSharepointFile,

  // Channel 4
  sharepointMasterFileHandle,
  sharepointMasterSyncStatus,
  sharepointMasterLastSyncedTime,
  linkExistingSharepointMasterFile,
  createNewSharepointMasterFile,
  disconnectSharepointMasterFile,
  onSyncSharepointMaster,
  reconnectSharepointMasterFile,

  // Theme states
  themeMode = 'light',
  setThemeMode = () => {},
  customThemeEnabled = false,
  setCustomThemeEnabled = () => {},
  themePreset = 'default',
  setThemePreset = () => {},
  customPrimary = '#06234D',
  setCustomPrimary = () => {},
  customSecondary = '#003886',
  setCustomSecondary = () => {},
  customAccent1 = '#00C4E7',
  setCustomAccent1 = () => {},
  customAccent2 = '#7F59E9',
  setCustomAccent2 = () => {},
  customAccent3 = '#E7EAEF',
  setCustomAccent3 = () => {},
  customAccent4 = '#FFFFFF',
  setCustomAccent4 = () => {}
}: SettingsTabProps) {

  const [activeTab, setActiveTab] = useState<'storage' | 'branding' | 'master' | 'access'>('storage');
  const [masterTab, setMasterTab] = useState<'bu' | 'leave' | 'activity' | 'groups' | 'services' | 'output'>('bu');

  // Drag & Drop / Upload for Custom Logo
  const [isDragging, setIsDragging] = useState(false);

  // Firebase Backup & Restore States
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState('');
  const [backupError, setBackupError] = useState('');

  const handleFirebaseBackupExport = async () => {
    setIsBackingUp(true);
    setBackupError('');
    setBackupSuccess('');
    try {
      const [master, usersData, activitiesData, leavesData, auditsData] = await Promise.all([
        loadMasterDataFromFirestore(),
        loadUsersFromFirestore(),
        loadActivityLogsFromFirestore(),
        loadLeaveLogsFromFirestore(),
        loadAuditLogsFromFirestore()
      ]);
      const users = usersData.data;
      const activities = activitiesData.data;
      const leaves = leavesData.data;
      const audits = auditsData.data;

      const backupData = {
        backupVersion: "1.0",
        backedUpAt: new Date().toISOString(),
        masterData: master || masterData,
        users: users || [],
        activityLogs: activities || [],
        leaveLogs: leaves || [],
        auditLogs: audits || []
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `firebase_database_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupSuccess('Firebase Cloud Firestore backup completed successfully! Local file saved.');
    } catch (error: any) {
      console.error('Firebase backup error:', error);
      setBackupError(`Backup failed: ${error.message || error}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFirebaseBackupImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setBackupError('');
    setBackupSuccess('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        if (!json.masterData || !Array.isArray(json.users) || !Array.isArray(json.activityLogs)) {
          throw new Error('Invalid backup file format. Missing essential collections.');
        }

        // 1. Restore Master Data
        await saveMasterDataToFirestore(json.masterData);

        // 2. Restore Users
        for (const u of json.users) {
          await saveUserToFirestore(u);
        }

        // 3. Restore Activity Logs in safe chunks
        if (json.activityLogs.length > 0) {
          const chunkSize = 450;
          for (let i = 0; i < json.activityLogs.length; i += chunkSize) {
            const chunk = json.activityLogs.slice(i, i + chunkSize);
            await saveActivityLogsBatch(chunk);
          }
        }

        // 4. Restore Leave Logs
        if (Array.isArray(json.leaveLogs)) {
          for (const leave of json.leaveLogs) {
            await saveLeaveLogToFirestore(leave);
          }
        }

        // 5. Restore Audit Logs
        if (Array.isArray(json.auditLogs)) {
          for (const audit of json.auditLogs) {
            await saveAuditLogToFirestore(audit);
          }
        }

        setBackupSuccess(`Firebase database restored successfully! Imported ${json.users.length} users, ${json.activityLogs.length} activity logs, and ${json.leaveLogs?.length || 0} leave logs.`);
        
        if (onUpdateMasterData) {
          onUpdateMasterData(json.masterData);
        }
      } catch (error: any) {
        console.error('Firebase restore error:', error);
        setBackupError(`Restore failed: ${error.message || error}`);
      } finally {
        setIsRestoring(false);
        e.target.value = '';
      }
    };

    reader.readAsText(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processLogoFile(file);
    }
  };

  const handleLogoFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processLogoFile(file);
    }
  };

  const processLogoFile = (file: File) => {
    setUserError('');
    setUserSuccess('');
    // Validate file size under 1MB
    if (file.size > 1024 * 1024) {
      setUserError('Logo image is too large. Please upload an image under 1MB.');
      setTimeout(() => setUserError(''), 5000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      if (base64String && onUpdateMasterData) {
        onUpdateMasterData({
          ...masterData,
          logo: base64String,
        });
        setUserSuccess('Custom logo uploaded and set successfully!');
        setTimeout(() => setUserSuccess(''), 5000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setUserError('');
    setUserSuccess('');
    if (onUpdateMasterData) {
      const updated = { ...masterData };
      delete updated.logo;
      onUpdateMasterData(updated);
      setUserSuccess('Custom logo removed successfully.');
      setTimeout(() => setUserSuccess(''), 5000);
    }
  };

  const [isEditingBUs, setIsEditingBUs] = useState(false);
  const [editingBUs, setEditingBUs] = useState<{ code: string; name: string }[]>([]);
  const [newBuCode, setNewBuCode] = useState('');
  const [newBuName, setNewBuName] = useState('');
  const [buError, setBuError] = useState('');

  // User Security Configuration States
  const [adminUsername, setAdminUsername] = useState(masterData.adminAccount?.username || 'admin');
  const [adminPassword, setAdminPassword] = useState(masterData.adminAccount?.password || 'admin123');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [userEmployeeName, setUserEmployeeName] = useState(masterData.regularUserAccount?.employeeName || '');
  const [userEmployeeCode, setUserEmployeeCode] = useState(masterData.regularUserAccount?.employeeCode || '');
  const [userGroup, setUserGroup] = useState(masterData.regularUserAccount?.group || '');
  const [userUsername, setUserUsername] = useState(masterData.regularUserAccount?.username || '');
  const [userPassword, setUserPassword] = useState(masterData.regularUserAccount?.password || '');
  const [showUserPassword, setShowUserPassword] = useState(loggedInUser?.role === 'admin');
  const [userLevel, setUserLevel] = useState<'General User' | 'Lead' | 'Department Head' | 'Executive' | 'Administrator'>(
    masterData.regularUserAccount?.userLevel || 'General User'
  );
  const [userAccessGroupAnalytics, setUserAccessGroupAnalytics] = useState<boolean>(false);
  const [userAccessPeriodClosing, setUserAccessPeriodClosing] = useState<boolean>(false);

  // Period Closing Management States
  const [selectedPeriodMonth, setSelectedPeriodMonth] = useState<string>(() => {
    const now = new Date();
    const yr = Math.max(2026, now.getFullYear());
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    return `${yr}-${mo}`;
  });
  const [periodTagAction, setPeriodTagAction] = useState<'closed' | 'open'>('closed');
  const [periodSuccess, setPeriodSuccess] = useState('');
  const [periodError, setPeriodError] = useState('');
  const [assignedGroups, setAssignedGroups] = useState<string[]>(
    masterData.regularUserAccount?.assignedGroups || []
  );
  const [assignedServices, setAssignedServices] = useState<string[]>(
    masterData.regularUserAccount?.assignedServices || []
  );

  const [isEditingUser, setIsEditingUser] = useState(false);

  const [ownNewPassword, setOwnNewPassword] = useState('');
  const [showOwnNewPassword, setShowOwnNewPassword] = useState(false);

  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserAccount | null>(null);
  const [isAddingNewUser, setIsAddingNewUser] = useState(false);

  useEffect(() => {
    if (loggedInUser?.role === 'admin') {
      fetchUsers();
    }
  }, [loggedInUser]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { loadUsersFromFirestore, saveMasterDataToFirestore } = await import('../utils/firebase');
      const { data: allUsers } = await loadUsersFromFirestore();
      setUsersList(allUsers);

      // Automatically sync any users who aren't in masterData.employeeProfile
      let needsSync = false;
      const currentProfiles = masterData.employeeProfile || [];
      const updatedProfiles = [...currentProfiles];

      allUsers.forEach((usr) => {
        if (usr.username !== 'admin' && usr.employeeCode) {
          const exists = updatedProfiles.some(ep => ep.id === usr.employeeCode);
          if (!exists) {
            updatedProfiles.push({
              id: usr.employeeCode,
              name: usr.employeeName || usr.username,
              group: usr.group || '01',
              targetHours: masterData.workingHours || 8
            });
            needsSync = true;
          }
        }
      });

      if (needsSync) {
        const updatedMaster = {
          ...masterData,
          employeeProfile: updatedProfiles
        };
        if (onUpdateMasterData) {
          onUpdateMasterData(updatedMaster);
        }
        await saveMasterDataToFirestore(updatedMaster);
      }
    } catch (e) {
      console.error('Error loading and syncing users:', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Operational Working Days & Hours States
  const [workingDays, setWorkingDays] = useState<string[]>(() => masterData.workingDays || ['mon', 'tue', 'wed', 'thu', 'fri']);
  const [workingHours, setWorkingHours] = useState<string>(() => (masterData.workingHours !== undefined ? Number(masterData.workingHours).toFixed(2) : "8.00"));
  const [operationalSuccess, setOperationalSuccess] = useState('');
  const [operationalError, setOperationalError] = useState('');

  const daysOfWeek = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
  ];

  const toggleWorkingDay = (dayKey: string) => {
    if (workingDays.includes(dayKey)) {
      setWorkingDays(workingDays.filter(d => d !== dayKey));
    } else {
      setWorkingDays([...workingDays, dayKey]);
    }
  };

  const handleSaveOperationalSettings = () => {
    setOperationalSuccess('');
    setOperationalError('');
    const hoursNum = parseFloat(parseFloat(workingHours).toFixed(2));
    if (isNaN(hoursNum) || hoursNum < 0 || hoursNum > 24) {
      setOperationalError('Working Hours must be a valid decimal number between 0 and 24.');
      return;
    }
    if (workingDays.length === 0) {
      setOperationalError('At least one working day must be selected.');
      return;
    }
    if (onUpdateMasterData) {
      onUpdateMasterData({
        ...masterData,
        workingDays,
        workingHours: hoursNum
      });
      setOperationalSuccess('Operational working days and hours updated successfully!');
      setTimeout(() => setOperationalSuccess(''), 5000);
    }
  };

  const handleSaveWorkingDays = () => {
    setOperationalSuccess('');
    setOperationalError('');
    if (workingDays.length === 0) {
      setOperationalError('At least one working day must be selected.');
      return;
    }
    if (onUpdateMasterData) {
      onUpdateMasterData({
        ...masterData,
        workingDays
      });
      setOperationalSuccess('Operational working days updated and saved to storage successfully!');
      setTimeout(() => setOperationalSuccess(''), 5000);
    }
  };

  const handleSaveWorkingHours = () => {
    setOperationalSuccess('');
    setOperationalError('');
    const hoursNum = parseFloat(parseFloat(workingHours).toFixed(2));
    if (isNaN(hoursNum) || hoursNum < 0 || hoursNum > 24) {
      setOperationalError('Working Hours must be a valid decimal number between 0 and 24.');
      return;
    }
    if (onUpdateMasterData) {
      onUpdateMasterData({
        ...masterData,
        workingHours: hoursNum
      });
      setOperationalSuccess('Standard daily working hours updated and saved to storage successfully!');
      setTimeout(() => setOperationalSuccess(''), 5000);
    }
  };

  const canAccessPeriodClosingCard = () => {
    if (loggedInUser?.role === 'admin') return true;
    const userAccount = masterData.regularUserAccount;
    if (!userAccount) return false;
    if (userAccount.userLevel === 'Administrator') return true;
    if (userAccount.userLevel === 'General User') return false;
    return userAccount.accessPeriodClosing || false;
  };

  const handleSavePeriodStatus = (monthStr?: string, statusTag?: 'closed' | 'open') => {
    const targetMonth = monthStr || selectedPeriodMonth;
    const targetStatus = statusTag || periodTagAction;

    if (!targetMonth || !/^\d{4}-\d{2}$/.test(targetMonth)) {
      setPeriodError('Please select a valid period (month).');
      return;
    }

    const yearNum = parseInt(targetMonth.split('-')[0], 10);
    if (yearNum < 2026) {
      setPeriodError('Periods before year 2026 cannot be selected.');
      return;
    }

    setPeriodError('');
    const currentClosed = masterData.closedPeriods || [];
    let updatedClosed: string[];

    if (targetStatus === 'closed') {
      if (!currentClosed.includes(targetMonth)) {
        updatedClosed = [...currentClosed, targetMonth].sort();
      } else {
        updatedClosed = currentClosed;
      }
    } else {
      updatedClosed = currentClosed.filter(p => p !== targetMonth);
    }

    const updatedMaster = {
      ...masterData,
      closedPeriods: updatedClosed
    };

    if (onUpdateMasterData) {
      onUpdateMasterData(updatedMaster);
    }

    setPeriodSuccess(`Period ${targetMonth} successfully tagged as ${targetStatus.toUpperCase()}.`);
    setTimeout(() => setPeriodSuccess(''), 4000);
  };

  useEffect(() => {
    if (masterData.adminAccount) {
      setAdminUsername(masterData.adminAccount.username);
      setAdminPassword(masterData.adminAccount.password);
    }
    if (masterData.workingDays) {
      setWorkingDays(masterData.workingDays);
    }
    if (masterData.workingHours !== undefined) {
      setWorkingHours(Number(masterData.workingHours).toFixed(2));
    }
    if (masterData.regularUserAccount) {
      setUserEmployeeName(masterData.regularUserAccount.employeeName || '');
      setUserEmployeeCode(masterData.regularUserAccount.employeeCode || '');
      setUserGroup(masterData.regularUserAccount.group || '');
      setUserUsername(masterData.regularUserAccount.username || '');
      setUserPassword(masterData.regularUserAccount.password || '');
      setUserLevel(masterData.regularUserAccount.userLevel || 'General User');
      setUserAccessGroupAnalytics(masterData.regularUserAccount.accessGroupAnalytics || false);
      setUserAccessPeriodClosing(masterData.regularUserAccount.accessPeriodClosing || false);
      setAssignedGroups(masterData.regularUserAccount.assignedGroups || []);
      setAssignedServices(masterData.regularUserAccount.assignedServices || []);
    } else {
      setUserEmployeeName('');
      setUserEmployeeCode('');
      setUserGroup('');
      setUserUsername('');
      setUserPassword('');
      setUserLevel('General User');
      setUserAccessGroupAnalytics(false);
      setUserAccessPeriodClosing(false);
      setAssignedGroups([]);
      setAssignedServices([]);
    }
  }, [masterData]);

  const [isEditingNonCore, setIsEditingNonCore] = useState(false);
  const [editingNonCore, setEditingNonCore] = useState<{ code: string; name: string; category: string }[]>([]);
  const [newNonCoreCode, setNewNonCoreCode] = useState('');
  const [newNonCoreName, setNewNonCoreName] = useState('');
  const [newNonCoreCategory, setNewNonCoreCategory] = useState('');
  const [nonCoreError, setNonCoreError] = useState('');

  const [isEditingLeaveTypes, setIsEditingLeaveTypes] = useState(false);
  const [editingLeaveTypes, setEditingLeaveTypes] = useState<{ code: string; name: string }[]>([]);
  const [newLeaveTypeCode, setNewLeaveTypeCode] = useState('');
  const [newLeaveTypeName, setNewLeaveTypeName] = useState('');
  const [leaveTypeError, setLeaveTypeError] = useState('');

  const handleStartEditingLeaveTypes = () => {
    setEditingLeaveTypes(
      (masterData.leaveTypes || []).map((item) => ({
        code: item.code || '',
        name: item.name || '',
      }))
    );
    setNewLeaveTypeCode('');
    setNewLeaveTypeName('');
    setLeaveTypeError('');
    setIsEditingLeaveTypes(true);
  };

  const handleAddLeaveType = () => {
    setLeaveTypeError('');
    const code = newLeaveTypeCode.trim();
    const name = newLeaveTypeName.trim();
    if (!code || !name) {
      setLeaveTypeError('Leave Type Code and Name are both required.');
      return;
    }
    if (editingLeaveTypes.some((n) => n.code.toLowerCase() === code.toLowerCase())) {
      setLeaveTypeError(`Leave Type with code "${code}" already exists.`);
      return;
    }
    setEditingLeaveTypes([...editingLeaveTypes, { code, name }]);
    setNewLeaveTypeCode('');
    setNewLeaveTypeName('');
  };

  const handleDeleteLeaveType = (index: number) => {
    setEditingLeaveTypes(editingLeaveTypes.filter((_, i) => i !== index));
  };

  const handleSaveLeaveTypes = () => {
    setLeaveTypeError('');
    if (editingLeaveTypes.length === 0) {
      setLeaveTypeError('You must have at least one Leave Type.');
      return;
    }
    const hasEmpty = editingLeaveTypes.some((n) => !n.code.trim() || !n.name.trim());
    if (hasEmpty) {
      setLeaveTypeError('All Leave Types must have a Code and Name.');
      return;
    }
    const codes = editingLeaveTypes.map((n) => n.code.trim().toLowerCase());
    const uniqueCodes = new Set(codes);
    if (uniqueCodes.size !== codes.length) {
      setLeaveTypeError('Leave Type Codes must be unique.');
      return;
    }

    if (onUpdateMasterData) {
      onUpdateMasterData({
        ...masterData,
        leaveTypes: editingLeaveTypes.map((n) => ({
          code: n.code.trim(),
          name: n.name.trim(),
        })),
      });
    }
    setIsEditingLeaveTypes(false);
  };

  const handleStartEditingNonCore = () => {
    setEditingNonCore(
      masterData.nonCoreActivity.map((item) => ({
        code: item.code || '',
        name: item.name || '',
        category: item.category || '',
      }))
    );
    setNewNonCoreCode('');
    setNewNonCoreName('');
    setNewNonCoreCategory('');
    setNonCoreError('');
    setIsEditingNonCore(true);
  };

  const handleAddNonCore = () => {
    setNonCoreError('');
    const code = newNonCoreCode.trim();
    const name = newNonCoreName.trim();
    const category = newNonCoreCategory.trim();
    if (!code || !name || !category) {
      setNonCoreError('Activity Code, Name, and Category are all required.');
      return;
    }
    if (editingNonCore.some((n) => n.code.toLowerCase() === code.toLowerCase())) {
      setNonCoreError(`Non-Core Activity with code "${code}" already exists.`);
      return;
    }
    setEditingNonCore([...editingNonCore, { code, name, category }]);
    setNewNonCoreCode('');
    setNewNonCoreName('');
    setNewNonCoreCategory('');
  };

  const handleDeleteNonCore = (index: number) => {
    setEditingNonCore(editingNonCore.filter((_, i) => i !== index));
  };

  const handleSaveNonCore = () => {
    setNonCoreError('');
    if (editingNonCore.length === 0) {
      setNonCoreError('You must have at least one Non-Core Activity.');
      return;
    }
    const hasEmpty = editingNonCore.some((n) => !n.code.trim() || !n.name.trim() || !n.category.trim());
    if (hasEmpty) {
      setNonCoreError('All activities must have a Code, Name, and Category.');
      return;
    }
    const codes = editingNonCore.map((n) => n.code.trim().toLowerCase());
    const uniqueCodes = new Set(codes);
    if (uniqueCodes.size !== codes.length) {
      setNonCoreError('Activity Codes must be unique.');
      return;
    }

    if (onUpdateMasterData) {
      onUpdateMasterData({
        ...masterData,
        nonCoreActivity: editingNonCore.map((n) => ({
          code: n.code.trim(),
          name: n.name.trim(),
          category: n.category.trim(),
        })),
      });
    }
    setIsEditingNonCore(false);
  };

  const parseBU = (buStr: string) => {
    if (buStr.includes(' - ')) {
      const parts = buStr.split(' - ');
      return { code: parts[0].trim(), name: parts.slice(1).join(' - ').trim() };
    }
    if (buStr.startsWith('BU-')) {
      return { code: buStr.trim(), name: buStr.replace('BU-', '').trim() };
    }
    return { code: buStr.trim(), name: buStr.trim() };
  };

  const handleStartEditingBUs = () => {
    setEditingBUs(masterData.bu.map(buStr => parseBU(buStr)));
    setNewBuCode('');
    setNewBuName('');
    setBuError('');
    setIsEditingBUs(true);
  };

  const handleAddBu = () => {
    setBuError('');
    const code = newBuCode.trim();
    const name = newBuName.trim();
    if (!code || !name) {
      setBuError('Both BU Code and BU Name are required.');
      return;
    }
    if (editingBUs.some(b => b.code.toLowerCase() === code.toLowerCase())) {
      setBuError(`Business Unit with code "${code}" already exists.`);
      return;
    }
    setEditingBUs([...editingBUs, { code, name }]);
    setNewBuCode('');
    setNewBuName('');
  };

  const handleDeleteBu = (index: number) => {
    setEditingBUs(editingBUs.filter((_, i) => i !== index));
  };

  const handleSaveBUs = () => {
    setBuError('');
    if (editingBUs.length === 0) {
      setBuError('You must have at least one Business Unit.');
      return;
    }
    const hasEmpty = editingBUs.some(b => !b.code.trim() || !b.name.trim());
    if (hasEmpty) {
      setBuError('All Business Units must have both Code and Name.');
      return;
    }
    const codes = editingBUs.map(b => b.code.trim().toLowerCase());
    const uniqueCodes = new Set(codes);
    if (uniqueCodes.size !== codes.length) {
      setBuError('Business Unit Codes must be unique.');
      return;
    }

    const updatedBuList = editingBUs.map(b => `${b.code.trim()} - ${b.name.trim()}`);
    if (onUpdateMasterData) {
      onUpdateMasterData({
        ...masterData,
        bu: updatedBuList
      });
    }
    setIsEditingBUs(false);
  };

  const [isEditingGroups, setIsEditingGroups] = useState(false);
  const [editingGroups, setEditingGroups] = useState<{ code: string; name: string }[]>([]);
  const [newGroupCode, setNewGroupCode] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [groupError, setGroupError] = useState('');

  const handleStartEditingGroups = () => {
    setEditingGroups(
      (masterData.group || []).map((g) => ({
        code: g.code || '',
        name: g.name || '',
      }))
    );
    setNewGroupCode('');
    setNewGroupName('');
    setGroupError('');
    setIsEditingGroups(true);
  };

  const handleAddGroup = () => {
    setGroupError('');
    const code = newGroupCode.trim();
    const name = newGroupName.trim();
    if (!code || !name) {
      setGroupError('Both Group Code and Group Name are required.');
      return;
    }
    if (editingGroups.some((g) => g.code.toLowerCase() === code.toLowerCase())) {
      setGroupError(`Group with code "${code}" already exists.`);
      return;
    }
    setEditingGroups([...editingGroups, { code, name }]);
    setNewGroupCode('');
    setNewGroupName('');
  };

  const handleDeleteGroup = (index: number) => {
    const groupToDelete = editingGroups[index];
    if (groupToDelete.code === '00') {
      setGroupError('The System group (00) cannot be deleted.');
      return;
    }
    setEditingGroups(editingGroups.filter((_, i) => i !== index));
  };

  const handleSaveGroups = () => {
    setGroupError('');
    if (editingGroups.length === 0) {
      setGroupError('You must have at least one Group.');
      return;
    }
    const hasEmpty = editingGroups.some((g) => !g.code.trim() || !g.name.trim());
    if (hasEmpty) {
      setGroupError('All groups must have both Code and Name.');
      return;
    }
    const codes = editingGroups.map((g) => g.code.trim().toLowerCase());
    const uniqueCodes = new Set(codes);
    if (uniqueCodes.size !== codes.length) {
      setGroupError('Group Codes must be unique.');
      return;
    }

    if (onUpdateMasterData) {
      onUpdateMasterData({
        ...masterData,
        group: editingGroups.map((g) => ({
          code: g.code.trim(),
          name: g.name.trim(),
        })),
      });
    }
    setIsEditingGroups(false);
  };

  const [isEditingServices, setIsEditingServices] = useState(false);
  const [editingServices, setEditingServices] = useState<{ code: string; name: string; groupCode: string }[]>([]);
  const [newServiceCode, setNewServiceCode] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceGroupCode, setNewServiceGroupCode] = useState('');
  const [serviceError, setServiceError] = useState('');

  const handleStartEditingServices = () => {
    setEditingServices(
      (masterData.services || []).map((s) => ({
        code: s.code || '',
        name: s.name || '',
        groupCode: s.groupCode || '',
      }))
    );
    setNewServiceCode('');
    setNewServiceName('');
    setNewServiceGroupCode('');
    setServiceError('');
    setIsEditingServices(true);
  };

  const handleAddService = () => {
    setServiceError('');
    const code = newServiceCode.trim();
    const name = newServiceName.trim();
    const groupCode = newServiceGroupCode.trim();
    if (!code || !name || !groupCode) {
      setServiceError('Service Code, Service Name, and a Parent Group are all required.');
      return;
    }
    if (editingServices.some((s) => s.code.toLowerCase() === code.toLowerCase())) {
      setServiceError(`Service with code "${code}" already exists.`);
      return;
    }
    setEditingServices([...editingServices, { code, name, groupCode }]);
    setNewServiceCode('');
    setNewServiceName('');
    setNewServiceGroupCode('');
  };

  const handleDeleteService = (index: number) => {
    setEditingServices(editingServices.filter((_, i) => i !== index));
  };

  const handleSaveServices = () => {
    setServiceError('');
    if (editingServices.length === 0) {
      setServiceError('You must have at least one Service.');
      return;
    }
    const hasEmpty = editingServices.some((s) => !s.code.trim() || !s.name.trim() || !s.groupCode.trim());
    if (hasEmpty) {
      setServiceError('All services must have a Code, Name, and Parent Group.');
      return;
    }
    const codes = editingServices.map((s) => s.code.trim().toLowerCase());
    const uniqueCodes = new Set(codes);
    if (uniqueCodes.size !== codes.length) {
      setServiceError('Service Codes must be unique.');
      return;
    }

    if (onUpdateMasterData) {
      onUpdateMasterData({
        ...masterData,
        services: editingServices.map((s) => ({
          code: s.code.trim(),
          name: s.name.trim(),
          groupCode: s.groupCode.trim(),
        })),
      });
    }
    setIsEditingServices(false);
  };

  const [isEditingOutputs, setIsEditingOutputs] = useState(false);
  const [editingOutputs, setEditingOutputs] = useState<{ code: string; name: string; serviceCode: string; slaTarget?: number }[]>([]);
  const [newOutputCode, setNewOutputCode] = useState('');
  const [newOutputName, setNewOutputName] = useState('');
  const [newOutputServiceCode, setNewOutputServiceCode] = useState('');
  const [newOutputSlaTarget, setNewOutputSlaTarget] = useState('');
  const [outputError, setOutputError] = useState('');

  const handleStartEditingOutputs = () => {
    setEditingOutputs(
      (masterData.serviceOutput || []).map((o) => ({
        code: o.code || '',
        name: o.name || '',
        serviceCode: o.serviceCode || '',
        slaTarget: o.slaTarget || 0,
      }))
    );
    setNewOutputCode('');
    setNewOutputName('');
    setNewOutputServiceCode('');
    setNewOutputSlaTarget('');
    setOutputError('');
    setIsEditingOutputs(true);
  };

  const handleAddOutput = () => {
    setOutputError('');
    const code = newOutputCode.trim();
    const name = newOutputName.trim();
    const serviceCode = newOutputServiceCode.trim();
    const slaTarget = parseFloat(newOutputSlaTarget) || 0;
    if (!code || !name || !serviceCode) {
      setOutputError('Output Code, Output Name, and a Parent Service are all required.');
      return;
    }
    if (editingOutputs.some((o) => o.code.toLowerCase() === code.toLowerCase())) {
      setOutputError(`Output with code "${code}" already exists.`);
      return;
    }
    setEditingOutputs([...editingOutputs, { code, name, serviceCode, slaTarget }]);
    setNewOutputCode('');
    setNewOutputName('');
    setNewOutputServiceCode('');
    setNewOutputSlaTarget('');
  };

  const handleDeleteOutput = (index: number) => {
    setEditingOutputs(editingOutputs.filter((_, i) => i !== index));
  };

  const handleSaveOutputs = () => {
    setOutputError('');
    if (editingOutputs.length === 0) {
      setOutputError('You must have at least one Output.');
      return;
    }
    const hasEmpty = editingOutputs.some((o) => !o.code.trim() || !o.name.trim() || !o.serviceCode.trim());
    if (hasEmpty) {
      setOutputError('All outputs must have a Code, Name, and Parent Service.');
      return;
    }
    const codes = editingOutputs.map((o) => o.code.trim().toLowerCase());
    const uniqueCodes = new Set(codes);
    if (uniqueCodes.size !== codes.length) {
      setOutputError('Output Codes must be unique.');
      return;
    }

    if (onUpdateMasterData) {
      onUpdateMasterData({
        ...masterData,
        serviceOutput: editingOutputs.map((o) => ({
          code: o.code.trim(),
          name: o.name.trim(),
          serviceCode: o.serviceCode.trim(),
          slaTarget: o.slaTarget !== undefined ? Number(o.slaTarget) : 0,
        })),
      });
    }
    setIsEditingOutputs(false);
  };

  const handleSaveAdminCredentials = () => {
    setUserError('');
    setUserSuccess('');
    const username = adminUsername.trim();
    const password = adminPassword.trim();
    if (!username || !password) {
      setUserError('Admin Username and Password cannot be empty.');
      return;
    }
    if (onUpdateMasterData) {
      onUpdateMasterData({
        ...masterData,
        adminAccount: { username, password }
      });
      setUserSuccess('Admin security credentials updated successfully!');
    }
  };

  const handleSaveUserCredentials = async () => {
    setUserError('');
    setUserSuccess('');
    const employeeName = userEmployeeName.trim();
    const employeeCode = userEmployeeCode.trim();
    const group = userGroup.trim();
    const username = userUsername.trim();
    const password = userPassword.trim();

    if (!employeeName || !employeeCode || !group || !username || !password) {
      setUserError('All user fields (Employee Name, Code, Group, Username, Password) are required.');
      return;
    }

    if (username.toLowerCase() === (masterData.adminAccount?.username || 'admin').toLowerCase()) {
      setUserError('Username cannot match the Administrator username.');
      return;
    }

    let level = userLevel;
    let groups = assignedGroups;
    let services = assignedServices;
    let finalGroup = group;
    let accessAnalytics = userAccessGroupAnalytics;
    let accessClosing = userAccessPeriodClosing;

    if (level === 'Administrator') {
      groups = masterData.group?.map(g => g.code) || [];
      services = masterData.services?.map(s => s.code) || [];
      accessAnalytics = true;
      accessClosing = true;
      finalGroup = '00';
    } else if (level === 'General User') {
      accessAnalytics = false;
      accessClosing = false;
    }

    const newUserObj: UserAccount = {
      employeeName,
      employeeCode,
      group: finalGroup,
      username,
      password,
      userLevel: level,
      assignedGroups: groups,
      assignedServices: services,
      accessGroupAnalytics: accessAnalytics,
      accessPeriodClosing: accessClosing
    };

    try {
      const { saveUserToFirestore } = await import('../utils/firebase');
      await saveUserToFirestore(newUserObj);

      // Now sync this user into masterData.employeeProfile so it's also the Employee Profile!
      const existingProfiles = masterData.employeeProfile || [];
      const updatedProfiles = [...existingProfiles];
      const existingIndex = updatedProfiles.findIndex(ep => ep.id === employeeCode);

      // Map group code to its details or default
      const mappedProfile: EmployeeProfile = {
        id: employeeCode,
        name: employeeName,
        group: finalGroup,
        targetHours: masterData.workingHours || 8
      };

      if (existingIndex > -1) {
        updatedProfiles[existingIndex] = mappedProfile;
      } else {
        updatedProfiles.push(mappedProfile);
      }

      // If logged in as user, update regularUserAccount in masterData as well
      const updatedMaster = {
        ...masterData,
        employeeProfile: updatedProfiles
      };

      if (loggedInUser?.role === 'user') {
        updatedMaster.regularUserAccount = newUserObj;
        sessionStorage.setItem('logged_in_user_account', JSON.stringify(newUserObj));
      }

      if (onUpdateMasterData) {
        onUpdateMasterData(updatedMaster);
      }

      setUserSuccess(selectedUserForEdit ? 'User account and profile updated successfully!' : 'User account and profile created successfully!');
      
      // Reset form states
      setSelectedUserForEdit(null);
      setIsAddingNewUser(false);
      setIsEditingUser(false);
      
      // Clear fields
      setUserEmployeeName('');
      setUserEmployeeCode('');
      setUserGroup('');
      setUserUsername('');
      setUserPassword('');
      setUserLevel('General User');
      setUserAccessGroupAnalytics(false);
      setAssignedGroups([]);
      setAssignedServices([]);

      // Refresh list
      fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
      setUserError('Failed to save user account to database.');
    }
  };

  const handleDeleteRegularUser = async (userToDelete: UserAccount) => {
    setUserError('');
    setUserSuccess('');
    if (window.confirm(`Are you sure you want to delete user ${userToDelete.username} (Employee: ${userToDelete.employeeName})?`)) {
      try {
        const { deleteUserFromFirestore } = await import('../utils/firebase');
        await deleteUserFromFirestore(userToDelete.username);

        // Also remove from masterData.employeeProfile
        const updatedProfiles = (masterData.employeeProfile || []).filter(ep => ep.id !== userToDelete.employeeCode);

        if (onUpdateMasterData) {
          onUpdateMasterData({
            ...masterData,
            employeeProfile: updatedProfiles
          });
        }

        setUserSuccess(`User ${userToDelete.username} and employee profile removed successfully.`);
        fetchUsers();
      } catch (err) {
        console.error('Error deleting user:', err);
        setUserError('Failed to delete user account from database.');
      }
    }
  };

  return (
    <div className="max-w-none w-full animate-fadeIn text-slate-900">
      <div className="flex border-b border-slate-200 overflow-x-auto mb-6 bg-white sticky top-0 z-10 px-4 pt-2 shadow-sm">
        <button
          onClick={() => setActiveTab('storage')}
          className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${activeTab === 'storage' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Storage & Processing Engine
        </button>
        {loggedInUser?.role === 'admin' && (
        <button
          onClick={() => setActiveTab('branding')}
          className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${activeTab === 'branding' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Branding & Customization
        </button>
        )}
        {loggedInUser?.role === 'admin' && (
        <button
          onClick={() => setActiveTab('master')}
          className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${activeTab === 'master' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Master Data
        </button>
        )}
        <button
          onClick={() => setActiveTab('access')}
          className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${activeTab === 'access' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          User Access & Others
        </button>
      </div>

      <div className="space-y-6 px-4">
        {activeTab === 'storage' && (
          <div className="space-y-6">
            {/* Phase 1 & Phase 2: Advanced Storage & Thread Processing Monitor */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6 text-white shadow-xl shadow-black/30">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-400 animate-pulse" />
              Advanced Storage & Thread Processing Engine
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Active status monitoring of multi-threaded Web Workers, unlimited IndexedDB cached persistence, and dynamic monthly partitioning.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-400/20 rounded-full text-[10px] text-emerald-400 font-bold uppercase tracking-wider animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              All Engines Online
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Engine 1: Multi-Threading */}
          <div className="bg-slate-950/60 p-5 rounded-xl border border-blue-500/10 hover:border-blue-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-extrabold text-blue-300 tracking-wider">Engine 1: Multi-Threading</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/10 text-[9px] uppercase font-bold">Active</span>
            </div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              Web Worker Offloader
            </h4>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Delegates complex data parsing, CSV imports, and JSON serialization to a separate background CPU thread, preventing UI stuttering and locks.
            </p>
            <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-[10px] text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>Thread State:</span>
                <span className="text-emerald-400 font-bold">Listening / Idle</span>
              </div>
              <div className="flex justify-between">
                <span>Offload Latency:</span>
                <span className="text-white">&lt; 0.05ms</span>
              </div>
            </div>
          </div>

          {/* Engine 2: IndexedDB Cache */}
          <div className="bg-slate-950/60 p-5 rounded-xl border border-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-extrabold text-indigo-300 tracking-wider">Engine 2: Local Cache</span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/10 text-[9px] uppercase font-bold">Active</span>
            </div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              IndexedDB Storage Hub
            </h4>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Bypasses standard 5MB browser limits to provide persistent local storage scaling up to 50%+ of your physical disk capacity.
            </p>
            <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-[10px] text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>Database Engine:</span>
                <span className="text-white font-bold">IndexedDB v1</span>
              </div>
              <div className="flex justify-between">
                <span>Active Cached Items:</span>
                <span className="text-emerald-400 font-bold">{activityLogs.length} Records</span>
              </div>
            </div>
          </div>

          {/* Engine 3: Partitioning */}
          <div className="bg-slate-950/60 p-5 rounded-xl border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-extrabold text-purple-300 tracking-wider">Engine 3: Partitioning</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/10 text-[9px] uppercase font-bold">Dynamic</span>
            </div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              Monthly Split Schemes
            </h4>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Dynamically segments all transactional records on a monthly basis when autosaving files, ensuring fast structural read-write splits.
            </p>
            <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-[10px] text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>Target Scheme:</span>
                <span className="text-white">YYYY-MM Split Map</span>
              </div>
              <div className="flex justify-between">
                <span>Current Partitions:</span>
                <span className="text-purple-400 font-bold">
                  {Object.keys(
                    activityLogs.reduce((acc, log) => {
                      const m = log.date ? log.date.substring(0, 7) : 'Unknown';
                      acc[m] = true;
                      return acc;
                    }, {} as Record<string, boolean>)
                  ).length} Active Months
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Month Partition Breakdown */}
        <div className="bg-slate-950/40 p-4.5 rounded-xl border border-slate-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-purple-400" />
              <h5 className="text-xs font-bold text-white">Dynamic Monthly Partition Directory Map</h5>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Real-Time Computed Partition Directory Indexes</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {Object.entries(
              activityLogs.reduce((acc, log) => {
                const monthKey = log.date ? log.date.substring(0, 7) : 'Unknown';
                acc[monthKey] = (acc[monthKey] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).sort().map(([month, count]) => (
              <div key={month} className="bg-slate-900/80 p-2.5 rounded-lg border border-white/5 flex flex-col justify-between space-y-1 hover:border-purple-500/20 transition-all duration-300">
                <span className="text-[9px] font-bold text-purple-400 tracking-widest font-mono uppercase">{month}</span>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-white font-bold">{count}</span>
                  <span className="text-[9px] text-slate-400">records</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Firebase Database Manual Backup & Restore Center */}
      <div id="backup-restore-container" className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600 animate-pulse" />
            Firebase Database Backup & Restore Center
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Back up your entire Firebase database (including settings, user accounts, and transactional logs) to a local JSON file or restore it from an existing snapshot.
          </p>
        </div>

        {backupSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2 font-semibold animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{backupSuccess}</span>
          </div>
        )}

        {backupError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl flex items-center gap-2 font-semibold animate-shake">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            <span>{backupError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export card */}
          <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4 hover:shadow-sm transition-all duration-300">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-600">
                <Download className="h-4.5 w-4.5" />
                <span className="text-xs font-extrabold uppercase tracking-wider font-sans">Export Local Backup File</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                Save a secure snapshot of all configurations, user credentials, employee profiles, activity histories, and leave requests as a single downloadable JSON file.
              </p>
            </div>
            
            <div className="pt-2">
              <button 
                id="btn-firebase-export"
                onClick={handleFirebaseBackupExport}
                disabled={isBackingUp || isRestoring}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer border-none"
              >
                {isBackingUp ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Generating Backup...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Export Firebase Database
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Import card */}
          <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4 hover:shadow-sm transition-all duration-300">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-600">
                <Upload className="h-4.5 w-4.5" />
                <span className="text-xs font-extrabold uppercase tracking-wider font-sans">Restore Database from File</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                Restore configurations and logs directly into Firebase Cloud Firestore. <strong className="text-amber-600">Warning:</strong> This will overwrite existing keys with the imported database snapshot.
              </p>
            </div>
            
            <div className="pt-2">
              <label className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition disabled:opacity-50">
                {isRestoring ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Restoring Collections...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Upload & Restore Database
                  </>
                )}
                <input 
                  id="input-firebase-import"
                  type="file" 
                  accept=".json"
                  onChange={handleFirebaseBackupImport}
                  disabled={isBackingUp || isRestoring}
                  className="hidden" 
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* App Branding & Customization Card */}
  {activeTab === 'branding' && loggedInUser?.role === 'admin' && (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5 text-indigo-600" />
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Application Branding & Customization
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-sans">
                  Replace the default application logo in the top-left of the header. Support drag-and-drop or file upload.
                </p>
              </div>
            </div>
            {masterData.logo && (
              <button
                id="btn-remove-logo"
                onClick={handleRemoveLogo}
                className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 border border-rose-200 cursor-pointer transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove Custom Logo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Drag & Drop Upload Container */}
            <div
              id="logo-drag-drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
              onClick={() => document.getElementById('logo-file-input')?.click()}
            >
              <Upload className="h-8 w-8 text-indigo-500 mb-2.5 animate-bounce" />
              <p className="text-xs font-semibold text-slate-700 font-sans">
                Drag & drop your logo here, or <span className="text-indigo-600">browse</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                Supports PNG, JPG, JPEG, GIF, SVG (Max 1MB)
              </p>
              <input
                id="logo-file-input"
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="hidden"
              />
            </div>

            {/* Current Active Preview & Information */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-center items-center h-full min-h-[140px] relative overflow-hidden">
              <span className="absolute top-2.5 left-2.5 text-[8px] font-extrabold uppercase font-mono tracking-wider text-slate-400">
                Active Header Preview
              </span>

              {masterData.logo ? (
                <div className="flex flex-col items-center space-y-3 w-full">
                  <div className="bg-brand-60 border border-brand-20/40 p-4 rounded-2xl flex items-center justify-center w-full shadow-inner max-w-xs">
                    <div className="shrink-0 h-11 flex items-center bg-brand-20/30 p-1 rounded-xl shadow-md transition-all">
                      <img
                        src={masterData.logo}
                        alt="Logo preview"
                        className="h-full object-contain w-auto max-w-[180px] rounded-lg"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 font-sans">
                    <CheckCircle2 className="h-3 w-3" /> Custom Logo Active
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2 text-slate-400">
                  <div className="bg-brand-60 p-3 rounded-2xl flex items-center justify-center shadow-md">
                    <Briefcase className="h-6 w-6 text-accent-turquoise" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium font-sans">
                    Default system icon active
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Theme Mode and Custom Theme Section */}
          <div className="border-t border-slate-100 pt-5 mt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Theme Mode Toggle */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-sans">
                  Appearance Mode
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setThemeMode('light')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border-none ${
                      themeMode === 'light'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    ☀️ Light Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeMode('dark')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border-none ${
                      themeMode === 'dark'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    🌙 Dark Mode
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Switch the overall layout between high-contrast light or dark mode.
                </p>
              </div>

              {/* Theme Selector Profile Option */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-sans">
                  Theme Configuration Profile
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => {
                      setThemePreset('default');
                      setCustomThemeEnabled(false);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border-none ${
                      themePreset === 'default'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    🛡️ Default Theme
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setThemePreset('custom');
                      setCustomThemeEnabled(true);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border-none ${
                      themePreset === 'custom'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    🎨 Custom Theme
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Choose default brand guideline distribution rules or customize each layer.
                </p>
              </div>
            </div>

            {/* Implementation Guide for Default Theme */}
            {themePreset === 'default' && (
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🛡️</span>
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-950 font-sans">
                        Application UI / Slide Deck Implementation Guide
                      </h4>
                      <p className="text-[10px] text-slate-500 font-sans">
                        To maintain the sophisticated balance defined by the brand hierarchy, follow these structural distribution rules during front-end development:
                      </p>
                    </div>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-100">
                    Active & Enforced
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primary 60% */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="h-4 w-4 rounded-full" style={{ backgroundColor: '#06234D' }}></span>
                        <h5 className="text-xs font-bold text-slate-800 font-sans">Primary Surfaces & Structure (The 60%)</h5>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-sans mb-1">
                        Use Code: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px] font-bold">#06234D</code>
                      </p>
                      <p className="text-[10px] text-slate-400 font-sans">
                        Apply this to deep container backgrounds, splash screens, main sidebar navigation (in desktop layouts), or top app bars where a strong brand presence is required.
                      </p>
                    </div>
                  </div>

                  {/* Secondary 20% */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="h-4 w-4 rounded-full" style={{ backgroundColor: '#003886' }}></span>
                        <h5 className="text-xs font-bold text-slate-800 font-sans">Secondary Components (The 20%)</h5>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-sans mb-1">
                        Use Code: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px] font-bold">#003886</code>
                      </p>
                      <p className="text-[10px] text-slate-400 font-sans">
                        Use this for primary interaction elements. This includes your main Call-to-Action (CTA) buttons, standard form headers, and selected tab states. It provides excellent contrast against both white and light gray backgrounds.
                      </p>
                    </div>
                  </div>

                  {/* Accents Remaining 20% */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm md:col-span-2 space-y-3">
                    <h5 className="text-xs font-bold text-slate-800 font-sans">Accents & Interactivity (The Remaining 20%)</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/40">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#00C4E7' }}></span>
                          <span className="text-[11px] font-bold text-slate-700">Turquoise (#00C4E7)</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Use sparingly for interactive highlights, inline links, or indicating a positive/active status. Its high brightness makes it perfect for grabbing attention without overwhelming the view.
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/40">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#7F59E9' }}></span>
                          <span className="text-[11px] font-bold text-slate-700">Purple (#7F59E9)</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Reserve this for secondary feature highlights, specific category tags, or alternate interactive states (like hover effects or onboarding wizard flows).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Neutrals & Reading */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm md:col-span-2 space-y-3">
                    <h5 className="text-xs font-bold text-slate-800 font-sans">Neutrals & Reading Layouts</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/40">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="h-3 w-3 rounded-full border border-slate-300" style={{ backgroundColor: '#E7EAEF' }}></span>
                          <span className="text-[11px] font-bold text-slate-700">Light Gray (#E7EAEF)</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Use as the canvas backdrop for content-heavy pages. It reduces eye strain compared to stark white and helps white content cards pop.
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/40">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="h-3 w-3 rounded-full border border-slate-300" style={{ backgroundColor: '#FFFFFF' }}></span>
                          <span className="text-[11px] font-bold text-slate-700">White (#FFFFFF)</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Use for the body background of cards, input fields, and as the text color when layered over the Dark Blue or Navy Blue elements to ensure high accessibility contrast.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Font Style */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm md:col-span-2 flex items-center justify-between">
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-slate-800 font-sans">Font Style Selection</h5>
                      <p className="text-[10px] text-slate-400">
                        Primary aesthetic typographic selection applied systematically.
                      </p>
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 font-mono text-xs font-bold px-3 py-1 rounded-lg border border-indigo-100">
                      “Futura”
                    </span>
                  </div>
                </div>
              </div>
            )}

            {themePreset === 'custom' && (
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-5 animate-fadeIn">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-indigo-700 flex items-center gap-1.5 font-sans">
                  🎨 Theme Color Configuration Palette
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Primary Color (60%) */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                    <div>
                      <span className="inline-block bg-slate-100 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1 font-mono">
                        60% of Layout
                      </span>
                      <h5 className="text-xs font-extrabold text-slate-900 font-sans">Primary Surfaces & Structure</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                        Applied to deep containers, main sidebar navigation, and headers.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customPrimary}
                        onChange={(e) => setCustomPrimary(e.target.value)}
                        className="h-9 w-9 p-0 border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={customPrimary}
                        onChange={(e) => setCustomPrimary(e.target.value)}
                        placeholder="#06234D"
                        maxLength={7}
                        className="font-mono text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 w-full uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500 animate-none"
                      />
                    </div>
                  </div>

                  {/* Secondary Color (20%) */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                    <div>
                      <span className="inline-block bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1 font-mono">
                        20% of Layout
                      </span>
                      <h5 className="text-xs font-extrabold text-slate-900 font-sans">Secondary Components</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                        Applied to primary interactive elements, CTA buttons, active tabs, and form headers.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customSecondary}
                        onChange={(e) => setCustomSecondary(e.target.value)}
                        className="h-9 w-9 p-0 border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={customSecondary}
                        onChange={(e) => setCustomSecondary(e.target.value)}
                        placeholder="#003886"
                        maxLength={7}
                        className="font-mono text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 w-full uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500 animate-none"
                      />
                    </div>
                  </div>

                  {/* Accents Section */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5 md:col-span-2 lg:col-span-1">
                    <div>
                      <span className="inline-block bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1 font-mono">
                        Accent 1 (Interactivity)
                      </span>
                      <h5 className="text-xs font-extrabold text-slate-900 font-sans">Highlights & Active Indicators</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                        For links, highlights, and positive status indicators.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customAccent1}
                        onChange={(e) => setCustomAccent1(e.target.value)}
                        className="h-9 w-9 p-0 border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={customAccent1}
                        onChange={(e) => setCustomAccent1(e.target.value)}
                        placeholder="#00C4E7"
                        maxLength={7}
                        className="font-mono text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 w-full uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500 animate-none"
                      />
                    </div>
                  </div>

                  {/* Accent 2 */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                    <div>
                      <span className="inline-block bg-purple-50 text-purple-700 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1 font-mono">
                        Accent 2 (Secondary Features)
                      </span>
                      <h5 className="text-xs font-extrabold text-slate-900 font-sans">Category Tags & Hover States</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                        For specific tag elements, alternate hover behaviors, and highlights.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customAccent2}
                        onChange={(e) => setCustomAccent2(e.target.value)}
                        className="h-9 w-9 p-0 border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={customAccent2}
                        onChange={(e) => setCustomAccent2(e.target.value)}
                        placeholder="#7F59E9"
                        maxLength={7}
                        className="font-mono text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 w-full uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500 animate-none"
                      />
                    </div>
                  </div>

                  {/* Accent 3 */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                    <div>
                      <span className="inline-block bg-slate-50 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1 font-mono">
                        Accent 3 (Neutrals)
                      </span>
                      <h5 className="text-xs font-extrabold text-slate-900 font-sans">Canvas & Reading Layout Backdrop</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                        Used as the underlying body backdrop for content-heavy pages.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customAccent3}
                        onChange={(e) => setCustomAccent3(e.target.value)}
                        className="h-9 w-9 p-0 border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={customAccent3}
                        onChange={(e) => setCustomAccent3(e.target.value)}
                        placeholder="#E7EAEF"
                        maxLength={7}
                        className="font-mono text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 w-full uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500 animate-none"
                      />
                    </div>
                  </div>

                  {/* Accent 4 */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                    <div>
                      <span className="inline-block bg-slate-100 text-slate-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1 font-mono">
                        Accent 4 (Body Surface)
                      </span>
                      <h5 className="text-xs font-extrabold text-slate-900 font-sans">Cards, Input Fields & Text Color</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                        Body background of container cards, inputs, and text layered color.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customAccent4}
                        onChange={(e) => setCustomAccent4(e.target.value)}
                        className="h-9 w-9 p-0 border-0 rounded cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={customAccent4}
                        onChange={(e) => setCustomAccent4(e.target.value)}
                        placeholder="#FFFFFF"
                        maxLength={7}
                        className="font-mono text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 w-full uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500 animate-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {activeTab === 'master' && loggedInUser?.role === 'admin' && (
        <div className="space-y-6">
          <div className="flex border-b border-slate-200 overflow-x-auto pb-2 gap-2">
            <button
              onClick={() => setMasterTab('bu')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors rounded-lg ${masterTab === 'bu' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
            >
              Business Units
            </button>
            <button
              onClick={() => setMasterTab('leave')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors rounded-lg ${masterTab === 'leave' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
            >
              Leave Types
            </button>
            <button
              onClick={() => setMasterTab('activity')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors rounded-lg ${masterTab === 'activity' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
            >
              Non-Core Activities
            </button>
            <button
              onClick={() => setMasterTab('groups')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors rounded-lg ${masterTab === 'groups' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
            >
              Groups
            </button>
            <button
              onClick={() => setMasterTab('services')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors rounded-lg ${masterTab === 'services' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
            >
              Services
            </button>
            <button
              onClick={() => setMasterTab('output')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors rounded-lg ${masterTab === 'output' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
            >
              Service Output
            </button>
          </div>

        {masterTab === 'bu' && (
          <div className="space-y-6">
            {!isEditingBUs ? (
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-blue-600" /> Business Units Master Data
                </h3>
                <button
                  id="edit-bu-registries-btn"
                  onClick={handleStartEditingBUs}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all border border-slate-200 shadow-sm cursor-pointer"
                >
                  <Edit2 className="h-3 w-3 text-blue-600" /> Edit BUs
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] uppercase font-mono font-bold text-slate-450 border-b border-slate-150 tracking-wider">
                      <th className="pb-2">BU Code</th>
                      <th className="pb-2 pl-3">BU Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {masterData.bu.map((buStr, index) => {
                      const parsed = parseBU(buStr);
                      return (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="py-2.5 text-xs font-mono font-bold text-blue-600 whitespace-nowrap">
                            {parsed.code}
                          </td>
                          <td className="py-2.5 pl-3 text-xs font-semibold text-slate-700">
                            {parsed.name}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-blue-300 p-5 rounded-2xl shadow-md ring-4 ring-blue-50/50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-blue-600 animate-spin" /> Editing Business Units Master Data
                </h3>
                <span className="text-[9px] font-extrabold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                  EDIT MODE
                </span>
              </div>

              {/* Error Message */}
              {buError && (
                <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                  {buError}
                </div>
              )}

              {/* List of current BUs being edited */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mb-4 custom-scrollbar">
                {editingBUs.map((bu, index) => (
                  <div key={index} className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <div>
                        <label className="block text-[8px] uppercase font-extrabold text-slate-450 font-mono tracking-wider mb-0.5">BU Code</label>
                        <input
                          type="text"
                          value={bu.code}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingBUs(editingBUs.map((b, i) => i === index ? { ...b, code: val } : b));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g. BU-GT"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] uppercase font-extrabold text-slate-450 font-mono tracking-wider mb-0.5">BU Name</label>
                        <input
                          type="text"
                          value={bu.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingBUs(editingBUs.map((b, i) => i === index ? { ...b, name: val } : b));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g. GlobalTech"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteBu(index)}
                      className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer self-end mb-0.5"
                      title="Delete row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Bulk Upload Facility */}
              <div className="mb-4">
                <MasterBulkUpload
                  typeLabel="Business Units"
                  expectedHeaders={['code', 'name']}
                  sampleRows={[
                    ['BU-MKT', 'Marketing'],
                    ['BU-OPS', 'Operations']
                  ]}
                  onDataUploaded={(parsed, mode) => {
                    const mapped = parsed.map(item => ({
                      code: String(item.code || '').trim().toUpperCase(),
                      name: String(item.name || '').trim()
                    })).filter(b => b.code && b.name);

                    if (mode === 'replace') {
                      setEditingBUs(mapped);
                    } else {
                      setEditingBUs(prev => {
                        const existingCodes = new Set(prev.map(p => p.code.toLowerCase()));
                        const filtered = mapped.filter(m => !existingCodes.has(m.code.toLowerCase()));
                        return [...prev, ...filtered];
                      });
                    }
                  }}
                />
              </div>

              {/* Inline Add BU Form */}
              <div className="bg-slate-50 border border-dashed border-slate-300 p-3 rounded-xl mb-4">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                  Manually Add Business Unit
                </span>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <input
                      type="text"
                      value={newBuCode}
                      onChange={(e) => setNewBuCode(e.target.value)}
                      placeholder="BU Code (e.g. BU-MKT)"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newBuName}
                      onChange={(e) => setNewBuName(e.target.value)}
                      placeholder="BU Name (e.g. Marketing)"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddBu}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-1.5 rounded-lg transition border border-blue-200/55 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add BU Row
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => setIsEditingBUs(false)}
                  className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold text-xs py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
                <button
                  onClick={handleSaveBUs}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition shadow-sm hover:shadow cursor-pointer flex items-center justify-center gap-1"
                >
                  <Save className="h-3.5 w-3.5" /> Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {masterTab === 'leave' && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          {!isEditingLeaveTypes ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" /> Leave Types Master Data
                </h3>
                <button
                  id="edit-leave-types-btn"
                  onClick={handleStartEditingLeaveTypes}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all border border-slate-200 shadow-sm cursor-pointer"
                >
                  <Edit2 className="h-3 w-3 text-blue-600" /> Edit Leave Types
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Define the master list of leave types available for employee logging.
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] uppercase font-mono font-bold text-slate-450 border-b border-slate-150 tracking-wider">
                      <th className="pb-2">Code</th>
                      <th className="pb-2 pl-3">Leave Type Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(masterData.leaveTypes || []).map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="py-2.5 text-xs font-mono font-bold text-blue-600 whitespace-nowrap">
                          {item.code}
                        </td>
                        <td className="py-2.5 pl-3 text-xs font-semibold text-slate-700">
                          {item.name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(masterData.leaveTypes || []).length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400 italic">
                    No leave types defined. Click "Edit Leave Types" to add.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-slate-50/30 border border-blue-300 p-1.5 rounded-xl">
              <div className="flex justify-between items-center mb-4 p-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600 animate-spin" /> Editing Leave Types Master Data
                </h3>
                <span className="text-[9px] font-extrabold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                  EDIT MODE
                </span>
              </div>

              {leaveTypeError && (
                <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold mx-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                  {leaveTypeError}
                </div>
              )}

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mb-4 custom-scrollbar p-2">
                {editingLeaveTypes.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
                    <div className="grid grid-cols-1 gap-2 flex-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] uppercase font-extrabold text-slate-450 font-mono tracking-wider mb-0.5">Code</label>
                          <input
                            type="text"
                            value={item.code}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingLeaveTypes(editingLeaveTypes.map((n, i) => i === index ? { ...n, code: val } : n));
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g. SL"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase font-extrabold text-slate-450 font-mono tracking-wider mb-0.5">Name</label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingLeaveTypes(editingLeaveTypes.map((n, i) => i === index ? { ...n, name: val } : n));
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g. Sick Leave"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteLeaveType(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition hover:bg-rose-50 rounded-lg cursor-pointer self-center"
                      title="Delete leave type"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Bulk Upload Facility */}
              <div className="mb-4 mx-2">
                <MasterBulkUpload
                  typeLabel="Leave Types"
                  expectedHeaders={['code', 'name']}
                  sampleRows={[
                    ['VL', 'Vacation Leave'],
                    ['SL', 'Sick Leave'],
                    ['EL', 'Emergency Leave']
                  ]}
                  onDataUploaded={(parsed, mode) => {
                    const mapped = parsed.map(item => ({
                      code: String(item.code || '').trim().toUpperCase(),
                      name: String(item.name || '').trim()
                    })).filter(b => b.code && b.name);

                    if (mode === 'replace') {
                      setEditingLeaveTypes(mapped);
                    } else {
                      setEditingLeaveTypes(prev => {
                        const existingCodes = new Set(prev.map(p => p.code.toLowerCase()));
                        const filtered = mapped.filter(m => !existingCodes.has(m.code.toLowerCase()));
                        return [...prev, ...filtered];
                      });
                    }
                  }}
                />
              </div>

              <div className="bg-slate-100 border border-dashed border-slate-300 p-3 rounded-xl mb-4 mx-2">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-650 mb-2 font-mono">
                  Manually Add Leave Type
                </span>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    value={newLeaveTypeCode}
                    onChange={(e) => setNewLeaveTypeCode(e.target.value)}
                    placeholder="Code (e.g. SL)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={newLeaveTypeName}
                    onChange={(e) => setNewLeaveTypeName(e.target.value)}
                    placeholder="Name (e.g. Sick Leave)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleAddLeaveType}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-1.5 rounded-lg transition border border-blue-200/55 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Leave Type Row
                </button>
              </div>

              <div className="flex items-center gap-2 border-t border-slate-200 pt-3 px-2">
                <button
                  onClick={() => setIsEditingLeaveTypes(false)}
                  className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold text-xs py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
                <button
                  onClick={handleSaveLeaveTypes}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition shadow-sm hover:shadow cursor-pointer flex items-center justify-center gap-1"
                >
                  <Save className="h-3.5 w-3.5" /> Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Middle Panel: Non-Core Tasks */}
        {masterTab === 'activity' && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          {!isEditingNonCore ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" /> Non-Core Activities Master Data
                </h3>
                <button
                  id="edit-noncore-activities-btn"
                  onClick={handleStartEditingNonCore}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all border border-slate-200 shadow-sm cursor-pointer"
                >
                  <Edit2 className="h-3 w-3 text-blue-600" /> Edit Activities
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Underlying mapped categories logged on non-operational core activities to maintain standard workbook limits.
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] uppercase font-mono font-bold text-slate-450 border-b border-slate-150 tracking-wider">
                      <th className="pb-2">Code</th>
                      <th className="pb-2 pl-3">Name</th>
                      <th className="pb-2 pl-3">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {masterData.nonCoreActivity.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="py-2.5 text-xs font-mono font-bold text-blue-600 whitespace-nowrap">
                          {item.code}
                        </td>
                        <td className="py-2.5 pl-3 text-xs font-semibold text-slate-700">
                          {item.name}
                        </td>
                        <td className="py-2.5 pl-3 text-xs text-slate-500 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded-md font-medium text-[10px] border border-slate-200/50">
                            {item.category}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="bg-slate-50/30 border border-blue-300 p-1.5 rounded-xl">
              <div className="flex justify-between items-center mb-4 p-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600 animate-spin" /> Editing Non-Core Activities Master Data
                </h3>
                <span className="text-[9px] font-extrabold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                  EDIT MODE
                </span>
              </div>

              {/* Error Message */}
              {nonCoreError && (
                <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold mx-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                  {nonCoreError}
                </div>
              )}

              {/* List of current activities being edited */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mb-4 custom-scrollbar p-2">
                {editingNonCore.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
                    <div className="grid grid-cols-1 gap-2 flex-1">
                      <div>
                        <label className="block text-[8px] uppercase font-extrabold text-slate-450 font-mono tracking-wider mb-0.5">Code</label>
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingNonCore(editingNonCore.map((n, i) => i === index ? { ...n, code: val } : n));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g. NC-SYNC"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] uppercase font-extrabold text-slate-450 font-mono tracking-wider mb-0.5">Name</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingNonCore(editingNonCore.map((n, i) => i === index ? { ...n, name: val } : n));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g. Strategy Sync"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] uppercase font-extrabold text-slate-450 font-mono tracking-wider mb-0.5">Category</label>
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingNonCore(editingNonCore.map((n, i) => i === index ? { ...n, category: val } : n));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g. Admin"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteNonCore(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition hover:bg-rose-50 rounded-lg cursor-pointer self-start mt-4"
                      title="Delete activity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Bulk Upload Facility */}
              <div className="mb-4 mx-2">
                <MasterBulkUpload
                  typeLabel="Non-Core Activities"
                  expectedHeaders={['code', 'name', 'category']}
                  sampleRows={[
                    ['NC-MEET', 'Internal Meeting', 'Meeting'],
                    ['NC-TRAIN', 'System Training', 'Learning'],
                    ['NC-ADMIN', 'General Admin Support', 'Operational']
                  ]}
                  onDataUploaded={(parsed, mode) => {
                    const mapped = parsed.map(item => ({
                      code: String(item.code || '').trim().toUpperCase(),
                      name: String(item.name || '').trim(),
                      category: String(item.category || '').trim()
                    })).filter(b => b.code && b.name && b.category);

                    if (mode === 'replace') {
                      setEditingNonCore(mapped);
                    } else {
                      setEditingNonCore(prev => {
                        const existingCodes = new Set(prev.map(p => p.code.toLowerCase()));
                        const filtered = mapped.filter(m => !existingCodes.has(m.code.toLowerCase()));
                        return [...prev, ...filtered];
                      });
                    }
                  }}
                />
              </div>

              {/* Inline Add Activity Form */}
              <div className="bg-slate-100 border border-dashed border-slate-300 p-3 rounded-xl mb-4 mx-2">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-650 mb-2 font-mono">
                  Manually Add Non-Core Activity
                </span>
                <div className="space-y-2 mb-2">
                  <input
                    type="text"
                    value={newNonCoreCode}
                    onChange={(e) => setNewNonCoreCode(e.target.value)}
                    placeholder="Activity Code (e.g. NC-SYNC)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={newNonCoreName}
                    onChange={(e) => setNewNonCoreName(e.target.value)}
                    placeholder="Activity Name (e.g. Weekly Sync)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={newNonCoreCategory}
                    onChange={(e) => setNewNonCoreCategory(e.target.value)}
                    placeholder="Activity Category (e.g. Operational)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleAddNonCore}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-1.5 rounded-lg transition border border-blue-200/55 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Activity Row
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 border-t border-slate-200 pt-3 px-2">
                <button
                  onClick={() => setIsEditingNonCore(false)}
                  className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold text-xs py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
                <button
                  onClick={handleSaveNonCore}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition shadow-sm hover:shadow cursor-pointer flex items-center justify-center gap-1"
                >
                  <Save className="h-3.5 w-3.5" /> Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* New Section: Groups & Services Master Data Maintenance */}
        {masterTab === 'groups' && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          {!isEditingGroups ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" /> Groups Master Data
                </h3>
                <button
                  id="edit-groups-registries-btn"
                  onClick={handleStartEditingGroups}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all border border-slate-200 shadow-sm cursor-pointer"
                >
                  <Edit2 className="h-3 w-3 text-blue-600" /> Edit Groups
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Configure operational group categories for tracking service queues and workforce allocation.
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] uppercase font-mono font-bold text-slate-450 border-b border-slate-150 tracking-wider">
                      <th className="pb-2">Group Code</th>
                      <th className="pb-2 pl-3">Group Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(masterData.group || []).map((g, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="py-2.5 text-xs font-mono font-bold text-blue-600 whitespace-nowrap">
                          {g.code}
                        </td>
                        <td className="py-2.5 pl-3 text-xs font-semibold text-slate-700">
                          {g.name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-blue-300 p-1.5 rounded-xl ring-4 ring-blue-50/50">
              <div className="flex justify-between items-center mb-4 p-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600 animate-spin" /> Editing Groups Master Data
                </h3>
                <span className="text-[9px] font-extrabold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                  EDIT MODE
                </span>
              </div>

              {/* Error Message */}
              {groupError && (
                <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold mx-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                  {groupError}
                </div>
              )}

              {/* List of groups being edited */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mb-4 custom-scrollbar p-2">
                {editingGroups.map((g, index) => (
                  <div key={index} className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <div>
                        <label className="block text-[8px] uppercase font-extrabold text-slate-450 font-mono tracking-wider mb-0.5">Group Code</label>
                        <input
                          type="text"
                          value={g.code}
                          disabled={g.code === '00'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingGroups(editingGroups.map((group, i) => i === index ? { ...group, code: val } : group));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] uppercase font-extrabold text-slate-450 font-mono tracking-wider mb-0.5">Group Name</label>
                        <input
                          type="text"
                          value={g.name}
                          disabled={g.code === '00'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingGroups(editingGroups.map((group, i) => i === index ? { ...group, name: val } : group));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteGroup(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition hover:bg-rose-50 rounded-lg cursor-pointer self-end mb-0.5"
                      title="Delete group"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Bulk Upload Facility */}
              <div className="mb-4 mx-2">
                <MasterBulkUpload
                  typeLabel="Groups"
                  expectedHeaders={['code', 'name']}
                  sampleRows={[
                    ['01', 'Core Operations Group'],
                    ['02', 'Support & Admin Group'],
                    ['03', 'Strategic Advisory Group']
                  ]}
                  onDataUploaded={(parsed, mode) => {
                    const mapped = parsed.map(item => ({
                      code: String(item.code || '').trim().toUpperCase(),
                      name: String(item.name || '').trim()
                    })).filter(b => b.code && b.name);

                    if (mode === 'replace') {
                      // Ensure the mandatory system group 00 is kept if it's missing
                      const has00 = mapped.some(m => m.code === '00');
                      if (!has00) {
                        const existing00 = editingGroups.find(eg => eg.code === '00') || { code: '00', name: 'System / Non-Core' };
                        setEditingGroups([existing00, ...mapped]);
                      } else {
                        setEditingGroups(mapped);
                      }
                    } else {
                      setEditingGroups(prev => {
                        const existingCodes = new Set(prev.map(p => p.code.toLowerCase()));
                        const filtered = mapped.filter(m => !existingCodes.has(m.code.toLowerCase()));
                        return [...prev, ...filtered];
                      });
                    }
                  }}
                />
              </div>

              {/* Add Group Form */}
              <div className="bg-slate-100 border border-dashed border-slate-300 p-3 rounded-xl mb-4 mx-2">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-650 mb-2 font-mono">
                  Manually Add Group
                </span>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    value={newGroupCode}
                    onChange={(e) => setNewGroupCode(e.target.value)}
                    placeholder="Group Code (e.g. GP-ADMIN)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Group Name (e.g. Administration)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleAddGroup}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-1.5 rounded-lg transition border border-blue-200/55 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Group Row
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 border-t border-slate-200 pt-3 px-2">
                <button
                  onClick={() => setIsEditingGroups(false)}
                  className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold text-xs py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
                <button
                  onClick={handleSaveGroups}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition shadow-sm hover:shadow cursor-pointer flex items-center justify-center gap-1"
                >
                  <Save className="h-3.5 w-3.5" /> Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Services Maintenance Card */}
        {masterTab === 'services' && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          {!isEditingServices ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-600" /> Services Master Data
                </h3>
                <button
                  id="edit-services-registries-btn"
                  onClick={handleStartEditingServices}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all border border-slate-200 shadow-sm cursor-pointer"
                >
                  <Edit2 className="h-3 w-3 text-blue-600" /> Edit Services
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Configure hierarchical services linked explicitly to groups. Tag services under their respective operational parents.
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] uppercase font-mono font-bold text-slate-450 border-b border-slate-150 tracking-wider">
                      <th className="pb-2">Service Code</th>
                      <th className="pb-2 pl-3">Service Name</th>
                      <th className="pb-2 pl-3">Parent Group</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(masterData.services || []).map((s, index) => {
                      const parentGroup = (masterData.group || []).find((g) => g.code === s.groupCode);
                      return (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="py-2.5 text-xs font-mono font-bold text-blue-600 whitespace-nowrap">
                            {s.code}
                          </td>
                          <td className="py-2.5 pl-3 text-xs font-semibold text-slate-700">
                            {s.name}
                          </td>
                          <td className="py-2.5 pl-3 text-xs font-semibold text-slate-500">
                            <span className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded-md font-medium text-[10px] border border-slate-200/50">
                              {parentGroup ? parentGroup.name : s.groupCode}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-blue-300 p-1.5 rounded-xl ring-4 ring-blue-50/50">
              <div className="flex justify-between items-center mb-4 p-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-600 animate-spin" /> Editing Services Master Data
                </h3>
                <span className="text-[9px] font-extrabold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                  EDIT MODE
                </span>
              </div>

              {/* Error Message */}
              {serviceError && (
                <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold mx-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                  {serviceError}
                </div>
              )}

              {/* List of services being edited */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mb-4 custom-scrollbar p-2">
                {editingServices.map((s, index) => (
                  <div key={index} className="flex items-start gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <div className="grid grid-cols-1 gap-2 flex-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] uppercase font-extrabold text-slate-450 font-mono tracking-wider mb-0.5">Service Code</label>
                          <input
                            type="text"
                            value={s.code}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingServices(editingServices.map((service, i) => i === index ? { ...service, code: val } : service));
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase font-extrabold text-slate-450 font-mono tracking-wider mb-0.5">Parent Group</label>
                          <select
                            value={s.groupCode}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingServices(editingServices.map((service, i) => i === index ? { ...service, groupCode: val } : service));
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">-- Select Parent Group --</option>
                            {(editingGroups.length > 0 ? editingGroups : masterData.group || []).map((g) => (
                              <option key={g.code} value={g.code}>
                                {g.name} ({g.code})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[8px] uppercase font-extrabold text-slate-450 font-mono tracking-wider mb-0.5">Service Name</label>
                        <input
                          type="text"
                          value={s.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingServices(editingServices.map((service, i) => i === index ? { ...service, name: val } : service));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteService(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition hover:bg-rose-50 rounded-lg cursor-pointer self-start mt-4"
                      title="Delete service"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Bulk Upload Facility */}
              <div className="mb-4 mx-2">
                <MasterBulkUpload
                  typeLabel="Services"
                  expectedHeaders={['code', 'name', 'groupcode']}
                  sampleRows={[
                    ['SVC-BILL', 'Billing & Invoicing', '01'],
                    ['SVC-PAY', 'Payroll Processing', '01'],
                    ['SVC-RECR', 'Talent Recruitment', '02']
                  ]}
                  onDataUploaded={(parsed, mode) => {
                    const mapped = parsed.map(item => {
                      const groupCodeRaw = String(item.groupcode || item.groupCode || '').trim();
                      return {
                        code: String(item.code || '').trim().toUpperCase(),
                        name: String(item.name || '').trim(),
                        groupCode: groupCodeRaw
                      };
                    }).filter(b => b.code && b.name && b.groupCode);

                    if (mode === 'replace') {
                      setEditingServices(mapped);
                    } else {
                      setEditingServices(prev => {
                        const existingCodes = new Set(prev.map(p => p.code.toLowerCase()));
                        const filtered = mapped.filter(m => !existingCodes.has(m.code.toLowerCase()));
                        return [...prev, ...filtered];
                      });
                    }
                  }}
                />
              </div>

              {/* Add Service Form */}
              <div className="bg-slate-100 border border-dashed border-slate-300 p-3 rounded-xl mb-4 mx-2">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-650 mb-2 font-mono">
                  Manually Add Service
                </span>
                <div className="space-y-2 mb-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newServiceCode}
                      onChange={(e) => setNewServiceCode(e.target.value)}
                      placeholder="Service Code (e.g. SV-QA)"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <select
                      value={newServiceGroupCode}
                      onChange={(e) => setNewServiceGroupCode(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Select Parent Group --</option>
                      {(editingGroups.length > 0 ? editingGroups : masterData.group || []).map((g) => (
                        <option key={g.code} value={g.code}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="Service Name (e.g. Quality Assurance Testing)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleAddService}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-1.5 rounded-lg transition border border-blue-200/55 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Service Row
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 border-t border-slate-200 pt-3 px-2">
                <button
                  onClick={() => setIsEditingServices(false)}
                  className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold text-xs py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
                <button
                  onClick={handleSaveServices}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition shadow-sm hover:shadow cursor-pointer flex items-center justify-center gap-1"
                >
                  <Save className="h-3.5 w-3.5" /> Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Service Output Master Data Portion */}
        {masterTab === 'output' && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm mt-6">
          {!isEditingOutputs ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-600" /> Service Output Master Data
              </h3>
              <button
                id="edit-service-outputs-registries-btn"
                onClick={handleStartEditingOutputs}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all border border-slate-200 shadow-sm cursor-pointer"
              >
                <Edit2 className="h-3 w-3 text-blue-600" /> Edit Outputs
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Configure hierarchical service outputs linked explicitly to services. Tag outputs under their respective operational parent services.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] uppercase font-mono font-bold text-slate-450 border-b border-slate-150 tracking-wider">
                    <th className="pb-2">Output Code</th>
                    <th className="pb-2 pl-3">Output Name</th>
                    <th className="pb-2 pl-3">Services Master Data Parent</th>
                    <th className="pb-2 pl-3 text-right">SLA Target (hrs/unit)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(masterData.serviceOutput || []).map((o, index) => {
                    const parentService = (masterData.services || []).find((s) => s.code === o.serviceCode);
                    return (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="py-2.5 text-xs font-mono font-bold text-blue-600 whitespace-nowrap">
                          {o.code}
                        </td>
                        <td className="py-2.5 pl-3 text-xs font-semibold text-slate-700">
                          {o.name}
                        </td>
                        <td className="py-2.5 pl-3 text-xs font-semibold text-slate-500">
                          <span className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded-md font-medium text-[10px] border border-slate-200/50">
                            {parentService ? `${parentService.name} (${parentService.code})` : o.serviceCode}
                          </span>
                        </td>
                        <td className="py-2.5 pl-3 text-xs font-mono text-right font-semibold text-slate-700 whitespace-nowrap">
                          {o.slaTarget !== undefined ? o.slaTarget : 0} hrs
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-blue-300 p-4 rounded-xl ring-4 ring-blue-50/50">
            <div className="flex justify-between items-center mb-4 p-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-600 animate-spin" /> Editing Service Output Master Data
              </h3>
              <span className="text-[9px] font-extrabold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                EDIT MODE
              </span>
            </div>

            {/* Error Message */}
            {outputError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold mx-2">
                <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                {outputError}
              </div>
            )}

            {/* List of outputs being edited */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 mb-4 custom-scrollbar p-2">
              {editingOutputs.map((o, index) => (
                <div key={index} className="flex items-start gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
                    <div>
                      <label className="block text-[8px] uppercase font-extrabold text-slate-450 font-mono tracking-wider mb-0.5">Output Code</label>
                      <input
                        type="text"
                        value={o.code}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingOutputs(editingOutputs.map((out, i) => i === index ? { ...out, code: val } : out));
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase font-extrabold text-slate-450 font-mono tracking-wider mb-0.5">Output Name</label>
                      <input
                        type="text"
                        value={o.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingOutputs(editingOutputs.map((out, i) => i === index ? { ...out, name: val } : out));
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase font-extrabold text-slate-450 font-mono tracking-wider mb-0.5">Parent Service</label>
                      <select
                        value={o.serviceCode}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingOutputs(editingOutputs.map((out, i) => i === index ? { ...out, serviceCode: val } : out));
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">-- Select Parent Service --</option>
                        {(editingServices.length > 0 ? editingServices : masterData.services || []).map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.name} ({s.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase font-extrabold text-slate-450 font-mono tracking-wider mb-0.5">SLA Target (hrs/unit)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={o.slaTarget !== undefined ? Number(o.slaTarget).toFixed(2) : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? undefined : parseFloat(parseFloat(e.target.value).toFixed(2));
                          setEditingOutputs(editingOutputs.map((out, i) => i === index ? { ...out, slaTarget: val } : out));
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteOutput(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition hover:bg-rose-50 rounded-lg cursor-pointer self-start mt-4"
                    title="Delete output"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Bulk Upload Facility */}
            <div className="mb-4 mx-2">
              <MasterBulkUpload
                typeLabel="Service Outputs"
                expectedHeaders={['code', 'name', 'servicecode', 'slatarget']}
                sampleRows={[
                  ['OUT-BILL-01', 'Monthly Invoice Summary PDF', 'SVC-BILL', '0.50'],
                  ['OUT-PAY-02', 'Direct Deposit Bank File', 'SVC-PAY', '1.00'],
                  ['OUT-RECR-03', 'Shortlisted Candidate Report', 'SVC-RECR', '12.00']
                ]}
                onDataUploaded={(parsed, mode) => {
                  const mapped = parsed.map(item => {
                    const svcCode = String(item.servicecode || item.serviceCode || '').trim();
                    const rawSla = item.slatarget !== undefined ? item.slatarget : item.slaTarget;
                    const parsedSla = rawSla !== undefined ? parseFloat(String(rawSla)) : undefined;
                    return {
                      code: String(item.code || '').trim().toUpperCase(),
                      name: String(item.name || '').trim(),
                      serviceCode: svcCode,
                      slaTarget: isNaN(parsedSla as number) ? undefined : parsedSla
                    };
                  }).filter(b => b.code && b.name && b.serviceCode);

                  if (mode === 'replace') {
                    setEditingOutputs(mapped);
                  } else {
                    setEditingOutputs(prev => {
                      const existingCodes = new Set(prev.map(p => p.code.toLowerCase()));
                      const filtered = mapped.filter(m => !existingCodes.has(m.code.toLowerCase()));
                      return [...prev, ...filtered];
                    });
                  }
                }}
              />
            </div>

            {/* Add Output Form */}
            <div className="bg-slate-100 border border-dashed border-slate-300 p-3 rounded-xl mb-4 mx-2">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-650 mb-2 font-mono">
                Manually Add Service Output
              </span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2">
                <input
                  type="text"
                  value={newOutputCode}
                  onChange={(e) => setNewOutputCode(e.target.value)}
                  placeholder="Output Code (e.g. OP-QA-01)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  value={newOutputName}
                  onChange={(e) => setNewOutputName(e.target.value)}
                  placeholder="Output Name (e.g. Test Run Execution Report)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  value={newOutputServiceCode}
                  onChange={(e) => setNewOutputServiceCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Select Parent Service --</option>
                  {(editingServices.length > 0 ? editingServices : masterData.services || []).map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={newOutputSlaTarget}
                  onChange={(e) => {
                    const rawVal = e.target.value;
                    if (rawVal === '') {
                      setNewOutputSlaTarget('');
                    } else {
                      const parsed = parseFloat(rawVal);
                      if (!isNaN(parsed)) {
                        setNewOutputSlaTarget(parseFloat(parsed.toFixed(2)).toString());
                      } else {
                        setNewOutputSlaTarget(rawVal);
                      }
                    }
                  }}
                  placeholder="SLA Target (e.g. 0.50)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleAddOutput}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-1.5 rounded-lg transition border border-blue-200/55 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Output Row
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 border-t border-slate-200 pt-3 px-2">
              <button
                onClick={() => setIsEditingOutputs(false)}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold text-xs py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
              <button
                onClick={handleSaveOutputs}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition shadow-sm hover:shadow cursor-pointer flex items-center justify-center gap-1"
              >
                <Save className="h-3.5 w-3.5" /> Save Changes
              </button>
            </div>
          </div>
        )}
        </div>
        )}
        </div>
      )}

      {/* Operational Working Days & Hours Configuration Card - Only visible to admin */}
      {activeTab === 'access' && (
        <div className="space-y-6">
        {loggedInUser?.role === 'admin' && (
        <div id="operational-settings-card" className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6 col-span-full text-slate-900 animate-fadeIn">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" /> Operational Days & Hours Configuration
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure standard work hours per day and designate the operational days of the week. These values are used to compute employee idle times and workload capacities.
            </p>
          </div>

          {operationalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              <span>{operationalError}</span>
            </div>
          )}
          {operationalSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{operationalSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Working Days Select */}
            <div className="bg-indigo-50/20 border border-indigo-100/60 p-5 rounded-xl flex flex-col justify-between hover:border-indigo-200 hover:shadow-sm hover:bg-indigo-50/30 transition-all duration-300 min-h-[220px]">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600" /> Operational Days of the Week
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Toggle days to designate them as standard corporate working days. Non-selected days are automatically treated as rest days (0 working hours).
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {daysOfWeek.map((day) => {
                    const isActive = workingDays.includes(day.key);
                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => toggleWorkingDay(day.key)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveWorkingDays}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm hover:shadow-md border-none cursor-pointer"
                >
                  <Save className="h-4 w-4" /> Save
                </button>
              </div>
            </div>

            {/* Working Hours Input */}
            <div className="bg-indigo-50/20 border border-indigo-100/60 p-5 rounded-xl flex flex-col justify-between hover:border-indigo-200 hover:shadow-sm hover:bg-indigo-50/30 transition-all duration-300 min-h-[220px]">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-indigo-600" /> Standard Daily Working Hours
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Specify the standard scheduled labor hours expected per employee each working day. Support decimal formats (e.g. 7.5 or 8.0).
                </p>
                <div className="pt-2 relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="24"
                    value={workingHours !== '' && !isNaN(parseFloat(workingHours)) ? parseFloat(parseFloat(workingHours).toFixed(2)) : workingHours}
                    onChange={(e) => {
                      const rawVal = e.target.value;
                      if (rawVal === '') {
                        setWorkingHours('');
                      } else {
                        const parsed = parseFloat(rawVal);
                        if (!isNaN(parsed)) {
                          setWorkingHours(parseFloat(parsed.toFixed(2)).toString());
                        } else {
                          setWorkingHours(rawVal);
                        }
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                    placeholder="8.0"
                  />
                  <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400 font-mono">HRS / DAY</span>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveWorkingHours}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm hover:shadow-md border-none cursor-pointer"
                >
                  <Save className="h-4 w-4" /> Save
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Closing of Period (Month) Configuration Card */}
        {canAccessPeriodClosingCard() && (
          <div id="period-closing-settings-card" className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6 col-span-full text-slate-900 animate-fadeIn mt-6">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Lock className="h-5 w-5 text-indigo-600" /> Closing of Period (Month)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Select an accounting or reporting Period (Month) and tag it as Open or Closed. Tagging a period as Closed prevents users from selecting past reporting dates from that period in the Employee Activity Logger.
              </p>
            </div>

            {periodError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <span>{periodError}</span>
              </div>
            )}
            {periodSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold animate-fadeIn">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{periodSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Period Selector and Tag Controls */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600" /> Tag Period Status
                </h4>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Select Period (Month)
                  </label>
                  <input
                    type="month"
                    min="2026-01"
                    value={selectedPeriodMonth}
                    onChange={(e) => setSelectedPeriodMonth(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Set Status Tag
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSavePeriodStatus(selectedPeriodMonth, 'closed')}
                      className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 border-none cursor-pointer"
                    >
                      <Lock className="h-3.5 w-3.5" /> Tag as Closed
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSavePeriodStatus(selectedPeriodMonth, 'open')}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 border-none cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" /> Tag as Open
                    </button>
                  </div>
                </div>
              </div>

              {/* List of Closed Periods */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-rose-600" /> Currently Closed Periods
                  </span>
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full font-extrabold">
                    {(masterData.closedPeriods || []).length} Closed
                  </span>
                </h4>

                <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1">
                  {(masterData.closedPeriods || []).length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 font-medium bg-white rounded-lg border border-dashed border-slate-200">
                      No periods are currently tagged as closed. All months are open for logging.
                    </div>
                  ) : (
                    (masterData.closedPeriods || []).map((periodStr) => {
                      const [yr, mo] = periodStr.split('-');
                      const dateObj = new Date(parseInt(yr, 10), parseInt(mo, 10) - 1, 1);
                      const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

                      return (
                        <div key={periodStr} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                          <div>
                            <span className="text-xs font-bold text-slate-800">{monthName}</span>
                            <span className="text-[10px] text-slate-400 font-mono ml-2">({periodStr})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-red-100 text-red-700 rounded-full border border-red-200 uppercase">
                              Closed
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSavePeriodStatus(periodStr, 'open')}
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline bg-transparent border-none cursor-pointer"
                            >
                              Tag as Open
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Embedded Section: Maintenance of User Data */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6 mt-6 col-span-full">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" /> Maintenance of User Data
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure system-wide logins, security credentials, and access levels. User security details are fully stored and embedded securely inside the local database file.
            </p>
          </div>

          {/* Global Action Messages */}
          {userError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl flex items-center gap-2 font-semibold animate-shake">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              <span>{userError}</span>
            </div>
          )}
          {userSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{userSuccess}</span>
            </div>
          )}

          {/* Regular User Password Edit */}
          {loggedInUser?.role !== 'admin' && (
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Key className="h-4 w-4 text-indigo-600" />
                Change Your Password
              </h4>
              <div className="relative">
                <input
                  type={showOwnNewPassword ? 'text' : 'password'}
                  value={ownNewPassword}
                  onChange={(e) => setOwnNewPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="New Password"
                />
                <button
                  type="button"
                  onClick={() => setShowOwnNewPassword(!showOwnNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none"
                >
                  {showOwnNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                onClick={async () => {
                  if (!ownNewPassword) {
                    setUserError('New password cannot be empty.');
                    return;
                  }
                  if (onUpdateMasterData && masterData.regularUserAccount) {
                    try {
                      const updatedUser = {
                        ...masterData.regularUserAccount,
                        password: ownNewPassword
                      };
                      onUpdateMasterData({
                        ...masterData,
                        regularUserAccount: updatedUser
                      });
                      const { saveUserToFirestore } = await import('../utils/firebase');
                      await saveUserToFirestore(updatedUser);
                      setUserSuccess('Password updated successfully!');
                      setOwnNewPassword('');
                    } catch (err) {
                      setUserError('Failed to update password in database.');
                    }
                  }
                }}
                className="text-[10px] px-3 py-1.5 rounded font-bold transition flex items-center gap-1 border cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-sm"
              >
                <Save className="h-3 w-3" /> Save Password
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {/* User Account / Profile Management Card */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
              {loggedInUser?.role === 'admin' ? (
                // ==========================================
                // ADMIN ROLE: MULTI-USER & PROFILE MANAGEMENT
                // ==========================================
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        User Accounts & Employee Profiles
                      </h4>
                    </div>
                    {(!isAddingNewUser && !selectedUserForEdit) && (
                      <button
                        onClick={() => {
                          setIsAddingNewUser(true);
                          setSelectedUserForEdit(null);
                          // Clear fields
                          setUserEmployeeName('');
                          setUserEmployeeCode('');
                          setUserGroup('');
                          setUserUsername('');
                          setUserPassword('');
                          setUserLevel('General User');
                          setUserAccessGroupAnalytics(false);
                          setAssignedGroups([]);
                          setAssignedServices([]);
                          setUserError('');
                          setUserSuccess('');
                        }}
                        className="text-[10px] px-2.5 py-1 rounded font-bold transition flex items-center gap-1 border cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-sm"
                        title="Add New User Account & Employee Profile"
                      >
                        <Plus className="h-3 w-3" /> Add User / Profile
                      </button>
                    )}
                  </div>

                  {userSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 font-semibold">
                      {userSuccess}
                    </div>
                  )}
                  {userError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-800 font-semibold">
                      {userError}
                    </div>
                  )}

                  {(isAddingNewUser || selectedUserForEdit) ? (
                    // FORM MODE: ADD OR EDIT USER
                    <div className="space-y-4 bg-white p-4 border border-slate-200 rounded-xl shadow-inner">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          {selectedUserForEdit ? `Edit User: ${selectedUserForEdit.username}` : 'Create New User Account & Profile'}
                        </span>
                        <button
                          onClick={() => {
                            setIsAddingNewUser(false);
                            setSelectedUserForEdit(null);
                            setUserError('');
                            setUserSuccess('');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded bg-slate-100 border-none cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                              Employee Name
                            </label>
                            <input
                              type="text"
                              value={userEmployeeName}
                              onChange={(e) => setUserEmployeeName(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Full Name"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                              Employee Code
                            </label>
                            <input
                              type="text"
                              value={userEmployeeCode}
                              onChange={(e) => setUserEmployeeCode(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="e.g. EMP-101"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Group / Division
                          </label>
                          <select
                            value={userGroup}
                            onChange={(e) => setUserGroup(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-- Select Group --</option>
                            {(masterData.group || []).map((g) => (
                              <option key={g.code} value={g.code}>
                                {g.name} ({g.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                              User Name
                            </label>
                            <input
                              type="text"
                              value={userUsername}
                              onChange={(e) => setUserUsername(e.target.value)}
                              disabled={!!selectedUserForEdit}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                              placeholder="Username"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                              Password
                            </label>
                            <div className="relative">
                              <input
                                type={showUserPassword ? 'text' : 'password'}
                                value={userPassword}
                                onChange={(e) => setUserPassword(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowUserPassword(!showUserPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none"
                              >
                                {showUserPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {(!selectedUserForEdit || selectedUserForEdit.username.toLowerCase() !== (loggedInUser?.username || '').toLowerCase()) && (
                        <div className="border-t border-slate-200/85 pt-4 space-y-4">
                          <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                            <span className="w-1.5 h-3 bg-blue-600 rounded"></span>
                            User Access Restrictions & Level
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-605 uppercase tracking-wider mb-1">
                              User Level
                            </label>
                            <select
                              value={userLevel}
                              onChange={(e) => {
                                const newLvl = e.target.value as any;
                                setUserLevel(newLvl);
                                if (newLvl === 'General User') {
                                  setUserAccessGroupAnalytics(false);
                                  setUserAccessPeriodClosing(false);
                                } else if (newLvl === 'Administrator') {
                                  setUserAccessGroupAnalytics(true);
                                  setUserAccessPeriodClosing(true);
                                }
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="General User">General User (No Consolidated Analytics Access)</option>
                              <option value="Lead">Lead</option>
                              <option value="Department Head">Department Head</option>
                              <option value="Executive">Executive</option>
                              <option value="Administrator">Administrator</option>
                            </select>
                          </div>
                          
                          {/* Access to Period Closing Toggle */}
                          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <div>
                              <div className="text-xs font-bold text-slate-800">Access to Period Closing</div>
                              <div className="text-[10px] text-slate-500">Enable setting for closing of period (month)</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={userLevel === 'Administrator' ? true : (userLevel === 'General User' ? false : userAccessPeriodClosing)}
                                disabled={userLevel === 'Administrator' || userLevel === 'General User'}
                                onChange={(e) => setUserAccessPeriodClosing(e.target.checked)}
                              />
                              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>

                          {/* Access to Group Analytics Toggle */}
                          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <div>
                              <div className="text-xs font-bold text-slate-800">Access to Group Analytics</div>
                              <div className="text-[10px] text-slate-500">Enable Consolidated / Group Analytics menu</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={userLevel === 'Administrator' ? true : (userLevel === 'General User' ? false : userAccessGroupAnalytics)}
                                disabled={userLevel === 'Administrator' || userLevel === 'General User'}
                                onChange={(e) => setUserAccessGroupAnalytics(e.target.checked)}
                              />
                              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-605 uppercase tracking-wider mb-1.5">
                              Assigned Groups Visible (Multi-select)
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2.5 border border-slate-200 rounded-lg bg-slate-50/50">
                              {(masterData.group || []).map((g) => (
                                <label key={g.code} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900">
                                  <input
                                    type="checkbox"
                                    checked={assignedGroups.includes(g.code)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setAssignedGroups([...assignedGroups, g.code]);
                                      } else {
                                        setAssignedGroups(assignedGroups.filter((code) => code !== g.code));
                                      }
                                    }}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="truncate">{g.name} ({g.code})</span>
                                </label>
                              ))}
                              {(masterData.group || []).length === 0 && (
                                <div className="text-slate-400 text-xs col-span-2 text-center py-2">No groups configured.</div>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-605 uppercase tracking-wider mb-1.5">
                              Assigned Services Visible (Multi-select)
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2.5 border border-slate-200 rounded-lg bg-slate-50/50">
                              {(masterData.services || []).map((s) => (
                                <label key={s.code} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer hover:text-slate-900">
                                  <input
                                    type="checkbox"
                                    checked={assignedServices.includes(s.code)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setAssignedServices([...assignedServices, s.code]);
                                      } else {
                                        setAssignedServices(assignedServices.filter((code) => code !== s.code));
                                      }
                                    }}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="truncate">{s.name} ({s.code})</span>
                                </label>
                              ))}
                              {(masterData.services || []).length === 0 && (
                                <div className="text-slate-400 text-xs col-span-2 text-center py-2">No services configured.</div>
                              )}
                            </div>
                          </div>
                        </div>

                        )}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={handleSaveUserCredentials}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-750 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm shadow-blue-500/10"
                          >
                            <Save className="h-3.5 w-3.5" /> {selectedUserForEdit ? 'Save Changes' : 'Create User & Profile'}
                          </button>
                          <button
                            onClick={() => {
                              setIsAddingNewUser(false);
                              setSelectedUserForEdit(null);
                              setUserError('');
                              setUserSuccess('');
                            }}
                            className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-lg transition-all border border-slate-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // LIST MODE: VIEW ALL ACTIVE USERS / EMPLOYEE PROFILES
                    <div className="space-y-2">
                      {isLoadingUsers ? (
                        <div className="text-center py-6 text-xs text-slate-500 flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                          Loading active user accounts...
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                  <th className="px-3.5 py-2">Employee Details</th>
                                  <th className="px-3.5 py-2">Username</th>
                                  <th className="px-3.5 py-2">Group</th>
                                  <th className="px-3.5 py-2">Level</th>
                                  <th className="px-3.5 py-2 text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                {usersList.map((usr) => (
                                  <tr key={usr.username} className="hover:bg-slate-50/55 transition">
                                    <td className="px-3.5 py-2.5">
                                      <div className="font-bold text-slate-800">{usr.employeeName || 'No Name'}</div>
                                      <div className="text-[10px] text-slate-500 font-mono font-semibold">{usr.employeeCode || 'No Code'}</div>
                                    </td>
                                    <td className="px-3.5 py-2.5 font-semibold text-indigo-700 font-mono">{usr.username}</td>
                                    <td className="px-3.5 py-2.5">
                                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold font-mono">
                                        {usr.group || 'N/A'}
                                      </span>
                                    </td>
                                    <td className="px-3.5 py-2.5">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        usr.userLevel === 'Executive' ? 'bg-red-50 text-red-700 border border-red-100' :
                                        usr.userLevel === 'Department Head' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                        usr.userLevel === 'Lead' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                        'bg-slate-100 text-slate-600'
                                      }`}>
                                        {usr.userLevel || 'General User'}
                                      </span>
                                    </td>
                                    <td className="px-3.5 py-2.5 text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => {
                                            setSelectedUserForEdit(usr);
                                            setIsAddingNewUser(false);
                                            // Populate form states
                                            setUserEmployeeName(usr.employeeName || '');
                                            setUserEmployeeCode(usr.employeeCode || '');
                                            setUserGroup(usr.group || '');
                                            setUserUsername(usr.username || '');
                                            setUserPassword(usr.password || '');
                                            setUserLevel(usr.userLevel || 'General User');
                                            setUserAccessGroupAnalytics(usr.accessGroupAnalytics || false);
                                            setUserAccessPeriodClosing(usr.accessPeriodClosing || false);
                                            setAssignedGroups(usr.assignedGroups || []);
                                            setAssignedServices(usr.assignedServices || []);
                                            setUserError('');
                                            setUserSuccess('');
                                          }}
                                          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer border-none bg-transparent"
                                          title="Edit Account"
                                        >
                                          <Edit className="h-3.5 w-3.5" />
                                        </button>
                                        {usr.username.toLowerCase() !== 'admin' && (
                                          <button
                                            onClick={() => handleDeleteRegularUser(usr)}
                                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer border-none bg-transparent"
                                            title="Delete Account"
                                          >
                                            <Trash className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                                {usersList.length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="text-center py-6 text-slate-400 font-medium">
                                      No users added yet. Click Add User above to create one.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // ==========================================
                // GENERAL USER ROLE: MY PROFILE & CREDENTIALS
                // ==========================================
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        My Profile & Credentials
                      </h4>
                    </div>
                    {masterData.regularUserAccount && (
                      <button
                        onClick={() => setIsEditingUser(!isEditingUser)}
                        className={`text-[10px] px-2.5 py-1 rounded font-bold transition flex items-center gap-1 border cursor-pointer ${
                          isEditingUser
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200'
                        }`}
                        title={isEditingUser ? "Cancel Edit" : "Edit Profile"}
                      >
                        <Edit2 className="h-3 w-3" /> {isEditingUser ? 'Cancel Edit' : 'Edit Profile'}
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Manage your profile fields and login password. Any changes will immediately synchronize and auto-save.
                  </p>

                  {userSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 font-semibold">
                      {userSuccess}
                    </div>
                  )}
                  {userError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-800 font-semibold">
                      {userError}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Employee Name
                        </label>
                        <input
                          type="text"
                          value={userEmployeeName}
                          onChange={(e) => setUserEmployeeName(e.target.value)}
                          disabled={!!masterData.regularUserAccount && !isEditingUser}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100/70 disabled:text-slate-400 disabled:cursor-not-allowed"
                          placeholder="Full Name"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Employee Code
                        </label>
                        <input
                          type="text"
                          value={userEmployeeCode}
                          onChange={(e) => setUserEmployeeCode(e.target.value)}
                          disabled={!!masterData.regularUserAccount && !isEditingUser}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100/70 disabled:text-slate-400 disabled:cursor-not-allowed"
                          placeholder="e.g. EMP-101"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Group / Division
                      </label>
                      <select
                        value={userGroup}
                        onChange={(e) => setUserGroup(e.target.value)}
                        disabled={!!masterData.regularUserAccount && !isEditingUser}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100/70 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Select Group --</option>
                        {(masterData.group || []).map((g) => (
                          <option key={g.code} value={g.code}>
                            {g.name} ({g.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          User Name
                        </label>
                        <input
                          type="text"
                          value={userUsername}
                          onChange={(e) => setUserUsername(e.target.value)}
                          disabled={true}
                          className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed"
                          placeholder="Username"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showUserPassword ? 'text' : 'password'}
                            value={userPassword}
                            onChange={(e) => setUserPassword(e.target.value)}
                            disabled={!!masterData.regularUserAccount && !isEditingUser}
                            className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100/70 disabled:text-slate-400 disabled:cursor-not-allowed"
                            placeholder="Password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowUserPassword(!showUserPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none"
                          >
                            {showUserPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {(!masterData.regularUserAccount || isEditingUser) && (
                      <button
                        onClick={handleSaveUserCredentials}
                        className="w-full bg-blue-600 hover:bg-blue-500 active:bg-indigo-700 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/10 border-none mt-2"
                      >
                        <Save className="h-3.5 w-3.5" /> Save Changes
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      )}
      </div>
    </div>
  );
}
