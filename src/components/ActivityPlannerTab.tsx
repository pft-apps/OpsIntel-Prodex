import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Plus, 
  Save, 
  ArrowRightCircle, 
  Trash2, 
  User, 
  Users, 
  CheckCircle2, 
  Clock, 
  X,
  ClipboardList,
  Filter,
  Layers
} from 'lucide-react';
import { MasterData, ActivityLog, PlannedActivity } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ActivityPlannerTabProps {
  masterData: MasterData;
  activityLogs: ActivityLog[];
  onSubmitLog: (log: ActivityLog | Omit<ActivityLog, 'id'>) => void;
  onUpdateMasterData: (newData: MasterData) => void;
  loggedInUser?: { role: 'admin' | 'user'; username: string } | null;
  onConvertAndStartTimer?: (log: ActivityLog) => void;
  title?: string;
  isTeamView?: boolean;
}

export const ActivityPlannerTab: React.FC<ActivityPlannerTabProps> = ({
  masterData,
  activityLogs,
  onSubmitLog,
  onUpdateMasterData,
  loggedInUser,
  onConvertAndStartTimer,
  title,
  isTeamView = false,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Employee profile info
  const empProfile = useMemo(() => {
    const isDbAdmin = loggedInUser?.role === 'admin';
    const userAcc = masterData.regularUserAccount;
    const userGroupVal = userAcc?.group || '';
    const matchedGroup = (masterData.group || []).find(
      (g) => g.code === userGroupVal || g.name === userGroupVal
    );
    const resolvedGroupName = isDbAdmin
      ? 'All Groups (Admin)'
      : matchedGroup
      ? matchedGroup.name
      : userGroupVal || masterData.group?.[0]?.name || 'Group 1';

    return {
      username: isDbAdmin ? 'admin' : (userAcc?.username || 'user'),
      employeeName: isDbAdmin ? 'Administrator' : (userAcc?.employeeName || 'Staff Member'),
      employeeCode: isDbAdmin ? 'ADM-001' : (userAcc?.employeeCode || 'EMP-001'),
      group: resolvedGroupName
    };
  }, [loggedInUser, masterData.regularUserAccount, masterData.group]);

  // User assigned group & service restrictions
  const userAssignedGroups = useMemo(() => {
    if (loggedInUser?.role === 'user' && masterData.regularUserAccount?.assignedGroups) {
      return masterData.regularUserAccount.assignedGroups;
    }
    return [];
  }, [loggedInUser, masterData.regularUserAccount]);

  const userAssignedServices = useMemo(() => {
    if (loggedInUser?.role === 'user' && masterData.regularUserAccount?.assignedServices) {
      return masterData.regularUserAccount.assignedServices;
    }
    return [];
  }, [loggedInUser, masterData.regularUserAccount]);

  // Available Group Options for dropdown filters
  const availableGroupOptions = useMemo(() => {
    let groups = masterData.group || [];
    if (userAssignedGroups.length > 0) {
      groups = groups.filter((g) => userAssignedGroups.includes(g.code) || userAssignedGroups.includes(g.name));
    }
    return groups;
  }, [masterData.group, userAssignedGroups]);

  // Local state for planned activities
  const [plannedActivities, setPlannedActivities] = useState<PlannedActivity[]>(() => {
    return masterData.plannedActivities || [];
  });

  // Keep local state in sync with masterData.plannedActivities if updated externally
  useEffect(() => {
    if (masterData.plannedActivities) {
      setPlannedActivities(masterData.plannedActivities);
    }
  }, [masterData.plannedActivities]);

  // Toast Notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Group & Employee Filter States
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [teamEmployeeFilter, setTeamEmployeeFilter] = useState<string>('all');

  // Helper to test if an activity belongs to user's assigned groups
  const isActivityInAssignedGroups = (actGroup?: string) => {
    if (userAssignedGroups.length === 0) return true;
    if (!actGroup) return false;
    if (userAssignedGroups.includes(actGroup)) return true;
    const found = (masterData.group || []).find(g => g.code === actGroup || g.name === actGroup);
    if (found && (userAssignedGroups.includes(found.code) || userAssignedGroups.includes(found.name))) {
      return true;
    }
    return false;
  };

  // Helper to test if an activity matches selected group filter
  const isActivityInSelectedGroup = (actGroup?: string) => {
    if (selectedGroupFilter === 'all') return true;
    if (!actGroup) return false;
    if (actGroup === selectedGroupFilter) return true;
    const found = (masterData.group || []).find(g => g.code === selectedGroupFilter || g.name === selectedGroupFilter);
    if (found && (actGroup === found.code || actGroup === found.name)) {
      return true;
    }
    return false;
  };

  // Unique list of employees in planned activities for team filter
  const teamEmployees = useMemo(() => {
    const map = new Map<string, string>();
    plannedActivities.forEach((p) => {
      if (!isActivityInAssignedGroups(p.group)) return;
      if (!isActivityInSelectedGroup(p.group)) return;
      const name = p.employeeName || p.username || 'Staff Member';
      map.set(name, name);
    });
    return Array.from(map.values()).sort();
  }, [plannedActivities, selectedGroupFilter, userAssignedGroups, masterData.group]);

  // ----------------------------------------------------
  // Period Filter Selectors (Monthly, Weekly, Daily, Range)
  // ----------------------------------------------------
  const [timeDimension, setTimeDimension] = useState<'month' | 'week' | 'daily' | 'range'>('month');
  
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const yr = Math.max(2026, now.getFullYear());
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    return `${yr}-${mo}`;
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    const yr = Math.max(2026, now.getFullYear());
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const da = String(now.getDate()).padStart(2, '0');
    const dStr = `${yr}-${mo}-${da}`;
    return dStr > todayStr ? todayStr : dStr;
  });

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    return {
      start: '2026-01-01',
      end: todayStr
    };
  });

  // Helper to generate weeks of a selected month
  const getWeeksOfMonth = (yearMonth: string) => {
    if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) return [];
    const [year, month] = yearMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const weeks: { start: string; end: string; label: string; dates: string[] }[] = [];
    let current = new Date(firstDay);

    let weekNum = 1;
    while (current <= lastDay) {
      const wStart = new Date(current);
      const wEnd = new Date(current);
      wEnd.setDate(wEnd.getDate() + 6);
      if (wEnd > lastDay) {
        wEnd.setTime(lastDay.getTime());
      }

      const dates: string[] = [];
      const d = new Date(wStart);
      while (d <= wEnd) {
        dates.push(d.toISOString().split('T')[0]);
        d.setDate(d.getDate() + 1);
      }

      const startFmt = `${wStart.getMonth() + 1}/${wStart.getDate()}`;
      const endFmt = `${wEnd.getMonth() + 1}/${wEnd.getDate()}`;

      weeks.push({
        start: wStart.toISOString().split('T')[0],
        end: wEnd.toISOString().split('T')[0],
        label: `Week ${weekNum} (${startFmt} - ${endFmt})`,
        dates
      });

      current.setDate(current.getDate() + 7);
      weekNum++;
    }
    return weeks;
  };

  const weeks = useMemo(() => getWeeksOfMonth(selectedMonth), [selectedMonth]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0);

  useEffect(() => {
    setSelectedWeekIndex(0);
  }, [selectedMonth]);

  const activeWeek = weeks[selectedWeekIndex] || weeks[0];

  // Check if a planned activity date falls within active period
  const isDateInPeriod = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const dateOnly = dateStr.split('T')[0];

    if (timeDimension === 'daily') {
      return dateOnly === selectedDate;
    }
    if (timeDimension === 'week') {
      if (!activeWeek) return true;
      return activeWeek.dates.includes(dateOnly);
    }
    if (timeDimension === 'month') {
      return dateOnly.startsWith(selectedMonth);
    }
    if (timeDimension === 'range') {
      return dateOnly >= dateRange.start && dateOnly <= dateRange.end;
    }
    return true;
  };

  // Filtered Planned Activities
  const filteredActivities = useMemo(() => {
    return plannedActivities.filter((act) => {
      // 1. User Assigned Groups Restriction
      if (!isActivityInAssignedGroups(act.group)) return false;

      // 2. Period Filter (Basis: Planned Activity Date if set, otherwise Reporting Date)
      const targetDate = act.plannedDate || act.date;
      const periodMatch = isDateInPeriod(targetDate);
      if (!periodMatch) return false;

      // 3. Selected Group Filter (ONLY on Team View)
      if (isTeamView && !isActivityInSelectedGroup(act.group)) return false;

      // 4. Team View Employee Filter
      if (isTeamView && teamEmployeeFilter !== 'all') {
        const name = act.employeeName || act.username || 'Staff Member';
        if (name !== teamEmployeeFilter) return false;
      }

      return true;
    });
  }, [plannedActivities, timeDimension, selectedMonth, selectedDate, selectedWeekIndex, dateRange, isTeamView, teamEmployeeFilter, selectedGroupFilter, userAssignedGroups, masterData.group]);

  // ----------------------------------------------------
  // Date Rules Validation Helper
  // ----------------------------------------------------
  const validateReportingDate = (dateStr: string): { valid: boolean; error?: string } => {
    if (!dateStr) return { valid: false, error: 'Please enter a valid Reporting Date.' };
    if (dateStr < '2026-01-01') return { valid: false, error: 'Reporting date must be on or after year 2026.' };

    if (masterData.closedPeriods && masterData.closedPeriods.length > 0) {
      const periodKey = dateStr.substring(0, 7); // YYYY-MM
      if (masterData.closedPeriods.includes(periodKey)) {
        return { valid: false, error: `Period ${periodKey} is CLOSED for activity logging.` };
      }
    }

    return { valid: true };
  };

  const validatePlannedDate = (plannedDateStr: string, reportingDateStr: string): { valid: boolean; error?: string } => {
    if (!plannedDateStr) return { valid: false, error: 'Please enter a valid Planned Activity Date.' };
    if (plannedDateStr < '2026-01-01') return { valid: false, error: 'Planned Activity Date must be on or after year 2026.' };
    if (reportingDateStr && plannedDateStr < reportingDateStr) {
      return { valid: false, error: 'Planned Activity Date cannot be prior to the Reporting Date.' };
    }

    if (masterData.closedPeriods && masterData.closedPeriods.length > 0) {
      const periodKey = plannedDateStr.substring(0, 7); // YYYY-MM
      if (masterData.closedPeriods.includes(periodKey)) {
        return { valid: false, error: `Period ${periodKey} is CLOSED for activity logging.` };
      }
    }

    return { valid: true };
  };

  // ----------------------------------------------------
  // Add Planned Activity Row (Draft state)
  // ----------------------------------------------------
  const handleAddRow = () => {
    let defaultDate = todayStr;
    if (defaultDate < '2026-01-01') defaultDate = '2026-01-01';
    
    if (timeDimension === 'daily' && selectedDate) {
      defaultDate = selectedDate;
    } else if (timeDimension === 'month' && selectedMonth) {
      defaultDate = `${selectedMonth}-01`;
    } else if (timeDimension === 'week' && activeWeek?.start) {
      defaultDate = activeWeek.start;
    }

    const defaultType = 'Core';
    
    // Default service restricted by assigned services if present
    const availableServices = (masterData.services || []).filter((s) => {
      if (userAssignedServices.length > 0) {
        return userAssignedServices.includes(s.code) || userAssignedServices.includes(s.name);
      }
      return true;
    });
    const firstService = availableServices[0]?.name || masterData.services?.[0]?.name || '';

    // Default group restricted by assigned groups
    const defaultGroup = availableGroupOptions[0]?.name || empProfile.group || masterData.group?.[0]?.name || 'Group 1';

    const newActivity: PlannedActivity = {
      id: `PLAN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: defaultDate,
      plannedDate: defaultDate,
      employeeId: empProfile.employeeCode,
      employeeName: empProfile.employeeName,
      username: empProfile.username,
      group: defaultGroup,
      bu: masterData.bu?.[0] || 'BU1',
      type: defaultType,
      name: firstService,
      desc: '',
      output: 'N/A',
      volume: 1,
      hours: 1,
      isRework: false,
      consideredAccurate: true,
      referenceCode: '',
      remarks: '',
      status: 'Draft',
      createdAt: new Date().toISOString()
    };

    // Unsaved activities remain in local memory until explicitly saved
    setPlannedActivities((prev) => [newActivity, ...prev]);
    showToast('New draft activity added. Fill in details and click Save.', 'warning');
  };

  // ----------------------------------------------------
  // Cancel Unsaved Draft Activity
  // ----------------------------------------------------
  const handleCancelDraft = (id: string) => {
    setPlannedActivities((prev) => prev.filter((item) => item.id !== id));
    showToast('Unsaved planned activity cancelled.', 'warning');
  };

  // ----------------------------------------------------
  // Update Planned Activity Field
  // ----------------------------------------------------
  const handleUpdateField = (id: string, field: keyof PlannedActivity, value: any) => {
    setPlannedActivities((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updatedItem = { ...item, [field]: value };

        // Handle cascading changes (e.g. Type or Service Name change)
        if (field === 'type') {
          if (value === 'Non-Core') {
            const firstNonCore = masterData.nonCoreActivity?.[0]?.name || '';
            updatedItem.name = firstNonCore;
            updatedItem.referenceCode = 'N/A';
          } else {
            const availableServices = (masterData.services || []).filter((s) => {
              if (userAssignedServices.length > 0) {
                return userAssignedServices.includes(s.code) || userAssignedServices.includes(s.name);
              }
              return true;
            });
            const firstService = availableServices[0]?.name || masterData.services?.[0]?.name || '';
            updatedItem.name = firstService;
            if (updatedItem.referenceCode === 'N/A') {
              updatedItem.referenceCode = '';
            }
          }
        }

        return updatedItem;
      })
    );
  };

  // ----------------------------------------------------
  // Save Activity (Commits item to storage)
  // ----------------------------------------------------
  const handleSaveActivity = (id: string) => {
    const activity = plannedActivities.find((a) => a.id === id);
    if (!activity) return;

    // Validate reporting date rules
    const dateCheck = validateReportingDate(activity.date);
    if (!dateCheck.valid) {
      showToast(dateCheck.error || 'Invalid Reporting Date.', 'error');
      return;
    }

    // Validate planned date rules
    const plannedDateToTest = activity.plannedDate || activity.date;
    const plannedCheck = validatePlannedDate(plannedDateToTest, activity.date);
    if (!plannedCheck.valid) {
      showToast(plannedCheck.error || 'Invalid Planned Activity Date.', 'error');
      return;
    }

    if (!activity.name) {
      showToast('Please select a valid Activity Name.', 'error');
      return;
    }

    const updatedList = plannedActivities.map((item) => {
      if (item.id === id) {
        return { 
          ...item, 
          plannedDate: plannedDateToTest,
          status: 'Saved' as const,
          referenceCode: item.type === 'Non-Core' ? 'N/A' : item.referenceCode
        };
      }
      return item;
    });

    setPlannedActivities(updatedList);
    
    // Commit ONLY saved activities to masterData storage
    const savedActivitiesOnly = updatedList.filter(a => a.status === 'Saved');
    onUpdateMasterData({
      ...masterData,
      plannedActivities: savedActivitiesOnly
    });

    showToast('Planned Activity saved to plan successfully.', 'success');
  };

  // ----------------------------------------------------
  // Convert Saved Activity to Activity Log and Start Timer
  // ----------------------------------------------------
  const handleConvertToLog = (id: string) => {
    const activity = plannedActivities.find((a) => a.id === id);
    if (!activity) return;

    if (activity.status !== 'Saved') {
      showToast('Only saved activities can be converted.', 'error');
      return;
    }

    // Check if reporting date is beyond current date
    if (activity.date > todayStr) {
      showToast('Conversion not allowed: Reporting Date is in the future. Please change the Reporting Date to today or an earlier date before converting.', 'error');
      return;
    }

    // Validate date rules
    const dateCheck = validateReportingDate(activity.date);
    if (!dateCheck.valid) {
      showToast(dateCheck.error || 'Invalid Reporting Date.', 'error');
      return;
    }

    // Generate unique Activity Log Code
    const generatedCode = `ACT-${Math.floor(100000 + Math.random() * 900000)}`;

    const empId = activity.employeeId || empProfile.employeeCode;
    const empName = activity.employeeName || empProfile.employeeName;
    const refCode = (activity.type === 'Non-Core' ? 'N/A' : (activity.referenceCode || '')).trim().toLowerCase();
    const buVal = activity.bu || masterData.bu?.[0] || 'BU1';

    let isAutoRework = false;
    if (activity.type === 'Core' && refCode && refCode !== 'n/a') {
      isAutoRework = activityLogs.some((log) =>
        log.type === 'Core' &&
        log.referenceCode &&
        log.referenceCode.trim().toLowerCase() === refCode &&
        (log.employeeId === empId || (empName && log.employeeName === empName)) &&
        log.name === activity.name &&
        log.bu === buVal
      );
    }

    const finalIsRework = activity.isRework || isAutoRework;

    // Do NOT carry planned volume/hours or plannedDate over (date uses Reporting Date)
    const newLog: ActivityLog = {
      id: generatedCode,
      date: activity.date,
      employeeId: empId,
      employeeName: empName,
      bu: buVal,
      group: activity.group || empProfile.group,
      type: activity.type,
      name: activity.name,
      hours: 0, // Do NOT carry planned hours over
      desc: activity.desc || 'N/A',
      output: 'N/A',
      volume: 1, // Reset to default actual volume 1
      isRework: finalIsRework,
      consideredAccurate: true,
      remarks: activity.remarks || '',
      referenceCode: activity.type === 'Non-Core' ? 'N/A' : (activity.referenceCode || '')
    };

    // Remove converted item from Planned Activities
    const remainingList = plannedActivities.filter((item) => item.id !== id);
    setPlannedActivities(remainingList);

    const remainingSavedOnly = remainingList.filter(a => a.status === 'Saved');
    onUpdateMasterData({
      ...masterData,
      plannedActivities: remainingSavedOnly
    });

    // Automatically convert to log, switch tab to Employee Activity Log, and start timer
    if (onConvertAndStartTimer) {
      onConvertAndStartTimer(newLog);
    } else {
      onSubmitLog(newLog);
      showToast(`Converted planned activity to Activity Log (${generatedCode})!`, 'success');
    }
  };

  // Delete Planned Activity Row
  const handleDeleteRow = (id: string) => {
    const remaining = plannedActivities.filter((item) => item.id !== id);
    setPlannedActivities(remaining);

    const remainingSavedOnly = remaining.filter(a => a.status === 'Saved');
    onUpdateMasterData({
      ...masterData,
      plannedActivities: remainingSavedOnly
    });
    showToast('Planned Activity removed.', 'warning');
  };

  const headerTitle = title || (isTeamView ? 'Team Activity Plans' : 'Activity Planner');
  const headerBadge = isTeamView ? 'Consolidated Group Analytics' : 'Productivity Module';
  const headerDesc = isTeamView
    ? 'Consolidated view for group activity plans. Review and monitor planned work activities across team members.'
    : 'Plan and schedule work activities. Click Save to commit activities to your plan, and click Convert to start the activity log timer immediately.';

  return (
    <div className="space-y-4 w-full px-2 sm:px-4 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100'
                : toastMessage.type === 'error'
                ? 'bg-rose-900/90 border-rose-500/50 text-rose-100'
                : 'bg-amber-900/90 border-amber-500/50 text-amber-100'
            }`}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-indigo-500/20 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-extrabold uppercase tracking-widest mb-1.5">
              <ClipboardList className="h-3.5 w-3.5 text-indigo-400" /> {headerBadge}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {headerTitle}
            </h1>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
              {headerDesc}
            </p>
          </div>

          {/* Employee Profile Header Section */}
          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-xl p-3.5 flex items-center gap-4 shadow">
            <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/40 rounded-lg text-indigo-300 shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
                {isTeamView ? 'Group / Organization' : 'Employee Profile'}
              </div>
              <div className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <span>{empProfile.employeeName}</span>
                <span className="text-[11px] font-semibold text-slate-400">({empProfile.username})</span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium flex items-center gap-1.5">
                <Users className="h-3 w-3 text-slate-400" />
                <span>Group: <strong className="text-white">{empProfile.group}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Header Period Filters & Group Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Filter Period Selectors (Monthly, Weekly, Daily, Range) & Group/Employee Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setTimeDimension('month')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  timeDimension === 'month'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setTimeDimension('week')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  timeDimension === 'week'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setTimeDimension('daily')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  timeDimension === 'daily'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setTimeDimension('range')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  timeDimension === 'range'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Range
              </button>
            </div>

            {/* Selector inputs depending on dimension */}
            {timeDimension === 'month' && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Month:</label>
                <input
                  type="month"
                  min="2026-01"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}

            {timeDimension === 'week' && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Month:</label>
                  <input
                    type="month"
                    min="2026-01"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                {weeks.length > 0 && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Week:</label>
                    <select
                      value={selectedWeekIndex}
                      onChange={(e) => setSelectedWeekIndex(Number(e.target.value))}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {weeks.map((w, idx) => (
                        <option key={idx} value={idx}>
                          {w.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {timeDimension === 'daily' && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date:</label>
                <input
                  type="date"
                  min="2026-01-01"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}

            {timeDimension === 'range' && (
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start:</label>
                <input
                  type="date"
                  min="2026-01-01"
                  value={dateRange.start}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End:</label>
                <input
                  type="date"
                  min="2026-01-01"
                  value={dateRange.end}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}

            {/* Group Filter - ONLY available on Team Activity Plans (isTeamView === true) */}
            {isTeamView && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Group:</label>
                <select
                  value={selectedGroupFilter}
                  onChange={(e) => {
                    setSelectedGroupFilter(e.target.value);
                    setTeamEmployeeFilter('all');
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="all">All Groups</option>
                  {availableGroupOptions.map((g) => (
                    <option key={g.code} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Team View Employee Filter */}
            {isTeamView && teamEmployees.length > 0 && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employee:</label>
                <select
                  value={teamEmployeeFilter}
                  onChange={(e) => setTeamEmployeeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="all">All Staff Members</option>
                  {teamEmployees.map((emp) => (
                    <option key={emp} value={emp}>
                      {emp}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Add Planned Activity Button - HIDDEN in Team View (Report Mode) */}
          {!isTeamView && (
            <button
              type="button"
              onClick={handleAddRow}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-md shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" /> Add Planned Activity
            </button>
          )}
        </div>
      </div>

      {/* Planned Activities Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {isTeamView ? 'Team Planned Work Activities' : 'Planned Work Activities'}
            </h3>
            <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-bold ml-1.5">
              {filteredActivities.length} Items
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium italic">
            {isTeamView ? (
              '* Reporting mode: Read-only summary of planned activities for team members.'
            ) : (
              '* Complete fields, click <strong className="text-blue-600">Save</strong> to commit to plan, then <strong className="text-emerald-600">Convert</strong> to launch activity log timer.'
            )}
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[1080px]">
            <thead>
              <tr className="bg-slate-100/80 text-[10px] uppercase font-black text-slate-600 border-b border-slate-200 tracking-wider">
                <th className="p-2.5 w-32">Reporting Date</th>
                <th className="p-2.5 w-36">Planned Activity Date</th>
                {isTeamView && <th className="p-2.5 w-36">Staff Member</th>}
                <th className="p-2.5 w-32">Group</th>
                <th className="p-2.5 w-28">Category</th>
                <th className="p-2.5 w-48">Activity Name</th>
                <th className="p-2.5 min-w-[200px]">Task Description</th>
                <th className="p-2.5 w-20">Volume</th>
                <th className="p-2.5 w-20">Hours</th>
                <th className="p-2.5 w-20">Rework?</th>
                <th className="p-2.5 w-28">Ref Code</th>
                <th className="p-2.5 w-36">Remarks</th>
                {!isTeamView && <th className="p-2.5 w-44 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-10 text-center text-slate-400 italic">
                    {isTeamView ? (
                      'No team planned activities for this period.'
                    ) : (
                      <>
                        No planned activities for this period. Click <strong className="text-indigo-600 font-bold">"+ Add Planned Activity"</strong> above to create one.
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => {
                  const isDraft = act.status === 'Draft';
                  const isSaved = act.status === 'Saved';

                  return (
                    <tr 
                      key={act.id} 
                      className={`hover:bg-slate-50 transition-colors ${
                        isDraft ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Reporting Date */}
                      <td className="p-2">
                        <input
                          type="date"
                          min="2026-01-01"
                          value={act.date}
                          disabled={isTeamView}
                          onChange={(e) => handleUpdateField(act.id, 'date', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </td>

                      {/* Planned Activity Date */}
                      <td className="p-2">
                        <input
                          type="date"
                          min={act.date || '2026-01-01'}
                          value={act.plannedDate || act.date || todayStr}
                          disabled={isTeamView}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val && act.date && val < act.date) {
                              showToast('Planned Activity Date cannot be prior to the Reporting Date.', 'error');
                              return;
                            }
                            handleUpdateField(act.id, 'plannedDate', val);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </td>

                      {/* Staff Member (In Team View) */}
                      {isTeamView && (
                        <td className="p-2">
                          <div className="font-bold text-slate-800 truncate">
                            {act.employeeName || act.username || 'Staff Member'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {act.employeeId || empProfile.employeeCode}
                          </div>
                        </td>
                      )}

                      {/* Group */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={act.group || empProfile.group}
                          disabled={true}
                          readOnly
                          className="w-full bg-slate-100 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-600 cursor-not-allowed"
                        />
                      </td>

                      {/* Category / Type */}
                      <td className="p-2">
                        <select
                          value={act.type}
                          disabled={isTeamView}
                          onChange={(e) => handleUpdateField(act.id, 'type', e.target.value as 'Core' | 'Non-Core')}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="Core">Core</option>
                          <option value="Non-Core">Non-Core</option>
                        </select>
                      </td>

                      {/* Activity Name */}
                      <td className="p-2">
                        <select
                          value={act.name}
                          disabled={isTeamView}
                          onChange={(e) => handleUpdateField(act.id, 'name', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {act.type === 'Core' ? (
                            (masterData.services || [])
                              .filter((s) => {
                                if (userAssignedServices.length > 0) {
                                  return userAssignedServices.includes(s.code) || userAssignedServices.includes(s.name);
                                }
                                return true;
                              })
                              .map((s) => (
                                <option key={s.code} value={s.name}>
                                  {s.name}
                                </option>
                              ))
                          ) : (
                            (masterData.nonCoreActivity || []).map((nc) => (
                              <option key={nc.code} value={nc.name}>
                                {nc.name}
                              </option>
                            ))
                          )}
                        </select>
                      </td>

                      {/* Task Description */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={act.desc}
                          placeholder="Task details..."
                          disabled={isTeamView}
                          onChange={(e) => handleUpdateField(act.id, 'desc', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </td>

                      {/* Volume */}
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={act.volume ?? 1}
                          disabled={isTeamView}
                          onChange={(e) => handleUpdateField(act.id, 'volume', Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </td>

                      {/* Hours */}
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={act.hours ?? 1}
                          disabled={isTeamView}
                          onChange={(e) => handleUpdateField(act.id, 'hours', Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </td>

                      {/* Rework? */}
                      <td className="p-2">
                        <select
                          value={act.isRework ? 'Yes' : 'No'}
                          disabled={isTeamView}
                          onChange={(e) => handleUpdateField(act.id, 'isRework', e.target.value === 'Yes')}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </td>

                      {/* Ref Code - Disabled and shows N/A if Non-Core or in Team View */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={act.type === 'Non-Core' ? 'N/A' : (act.referenceCode || '')}
                          disabled={act.type === 'Non-Core' || isTeamView}
                          placeholder="REF-..."
                          onChange={(e) => handleUpdateField(act.id, 'referenceCode', e.target.value)}
                          className={`w-full rounded-lg p-1.5 text-xs font-mono border ${
                            act.type === 'Non-Core' || isTeamView
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : 'bg-slate-50 text-slate-800 border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
                          }`}
                        />
                      </td>

                      {/* Remarks */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={act.remarks || ''}
                          placeholder="Notes..."
                          disabled={isTeamView}
                          onChange={(e) => handleUpdateField(act.id, 'remarks', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </td>

                      {/* Action Buttons - HIDDEN in Team View */}
                      {!isTeamView && (
                        <td className="p-2">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Save Activity Button */}
                            <button
                              type="button"
                              onClick={() => handleSaveActivity(act.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-2.5 rounded-lg text-[11px] transition shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
                              title="Save Activity to Plan"
                            >
                              <Save className="h-3.5 w-3.5" /> Save
                            </button>

                            {/* Unsaved Draft Cancel Button */}
                            {isDraft && (
                              <button
                                type="button"
                                onClick={() => handleCancelDraft(act.id)}
                                className="bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold py-1.5 px-2 rounded-lg text-[11px] transition flex items-center gap-1 cursor-pointer shrink-0 border border-slate-300 hover:border-rose-300"
                                title="Cancel unsaved draft activity"
                              >
                                <X className="h-3.5 w-3.5" /> Cancel
                              </button>
                            )}

                            {/* Convert to Activity Log Button (Enabled ONLY for saved activities) */}
                            {isSaved && (
                              <button
                                type="button"
                                onClick={() => handleConvertToLog(act.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-2.5 rounded-lg text-[11px] transition shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
                                title="Convert to Employee Activity Log & Start Timer"
                              >
                                <ArrowRightCircle className="h-3.5 w-3.5" /> Convert
                              </button>
                            )}

                            {/* Trash Delete Button */}
                            {isSaved && (
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(act.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Remove Planned Activity"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
