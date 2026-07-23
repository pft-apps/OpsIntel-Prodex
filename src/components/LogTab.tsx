import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
  Play, 
  Pause, 
  Square, 
  Check, 
  AlertTriangle, 
  Calendar, 
  Clock,
  Hash,
  Tag,
  Trash
} from 'lucide-react';
import { MasterData, ActivityLog, ContainerState, TimerState } from '../types';

interface LogTabProps {
  masterData: MasterData;
  onSubmitLog: (log: ActivityLog) => void;
  onTimerStateChange?: (state: string) => void;
  onContainersChange?: (ids: string[]) => void;
  activityLogs?: ActivityLog[];
  loggedInUser?: { role: 'admin' | 'user'; username: string } | null;
  containers: ContainerState[];
  onUpdateContainers: (containers: ContainerState[] | ((prev: ContainerState[]) => ContainerState[])) => void;
}

export default function LogTab({ 
  masterData, 
  onSubmitLog, 
  onTimerStateChange, 
  onContainersChange, 
  activityLogs = [], 
  loggedInUser,
  containers,
  onUpdateContainers: setContainers
}: LogTabProps) {
  // We keep simulationMode internally for robust elapsed time calculation, but remove its UI bar.
  const [simulationMode] = useState<boolean>(false);

  // Tick driver to update clock displays in real time
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to calculate current elapsed seconds based on startTime & accumulated
  const calculateTotalSeconds = (currState: TimerState, currAccum: number, currStart: number | null, now: number) => {
    if (currState === 'running' && currStart) {
      return currAccum + Math.floor((now - currStart) / 1000);
    }
    return currAccum;
  };

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const validateReportingDate = (dateVal: string): string => {
    if (!dateVal) return 'Please choose a valid Reporting Date.';
    const todayStr = getTodayDateString();
    if (dateVal > todayStr) {
      return 'Future reporting dates are not allowed under Reporting Date.';
    }
    const period = dateVal.substring(0, 7); // YYYY-MM
    const closedPeriods = masterData.closedPeriods || [];
    if (closedPeriods.includes(period)) {
      return `Reporting Date belongs to a closed period (${period}). Selection not allowed.`;
    }
    return '';
  };

  const getLogEmployeeInfo = (c: ContainerState) => {
    if (loggedInUser?.role === 'admin') {
      return {
        employeeId: 'admin',
        employeeName: 'Administrator',
        group: 'App Admin',
        targetHours: 8,
      };
    } else if (loggedInUser?.role === 'user') {
      const userCode = masterData.regularUserAccount?.employeeCode || 'staff';
      const userName = masterData.regularUserAccount?.employeeName || 'Staff';
      const matchedProfile = masterData.employeeProfile.find(e => e.id === userCode || e.name === userName);
      return {
        employeeId: userCode,
        employeeName: userName,
        group: masterData.regularUserAccount?.group || 'N/A',
        targetHours: matchedProfile?.targetHours || 8,
      };
    } else {
      const emp = masterData.employeeProfile.find(e => e.id === c.employeeId);
      return {
        employeeId: c.employeeId,
        employeeName: emp?.name || '',
        group: c.selectedGroup || '',
        targetHours: emp?.targetHours || 8,
      };
    }
  };

  // Check if a reference code is a duplicate in database or in other un-committed logs (duplicate check disabled)
  const isDuplicateRef = (ref: string, currentCode: string) => {
    return false;
  };

  // Check if an activity should be automatically tagged as Rework due to matching existing reference code, employee, service, and BU
  const checkIsAutoRework = (c: ContainerState) => {
    if (c.type !== 'Core' || !c.refNumber || !c.refNumber.trim() || !c.activityName || !c.selectedBu) {
      return false;
    }
    const empInfo = getLogEmployeeInfo(c);
    if (!empInfo.employeeId) return false;

    const refTrimmed = c.refNumber.trim().toLowerCase();
    return activityLogs.some((log) => 
      log.id !== c.activityLogCode &&
      log.type === 'Core' &&
      log.referenceCode &&
      log.referenceCode.trim().toLowerCase() === refTrimmed &&
      (log.employeeId === empInfo.employeeId || (empInfo.employeeName && log.employeeName === empInfo.employeeName)) &&
      log.name === c.activityName &&
      log.bu === c.selectedBu
    );
  };

  // Update specific container properties helper
  const updateContainer = (id: string, updates: Partial<ContainerState>) => {
    setContainers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  // Handle employee profile selection -> Auto populate Group and set default BU
  const handleEmployeeChange = (id: string, empId: string) => {
    const emp = masterData.employeeProfile.find(e => e.id === empId);
    if (emp) {
      updateContainer(id, {
        employeeId: empId,
        selectedBu: '',
        selectedGroup: emp.group,
        validationError: ''
      });
    } else {
      updateContainer(id, {
        employeeId: '',
        selectedBu: '',
        selectedGroup: '',
        validationError: ''
      });
    }
  };

  // Start activity timer action
  const handleStartTimer = (id: string) => {
    const c = containers.find(item => item.id === id);
    if (!c) return;

    const empInfo = getLogEmployeeInfo(c);

    if (!empInfo.employeeId) {
      updateContainer(id, { validationError: 'Please select an active Employee Profile.' });
      return;
    }
    const dateErr = validateReportingDate(c.date);
    if (dateErr) {
      updateContainer(id, { validationError: dateErr });
      return;
    }
    if (!c.activityName) {
      updateContainer(id, { validationError: 'Please specify or select an Activity Label/Category.' });
      return;
    }
    if (!c.refNumber || !c.refNumber.trim()) {
      updateContainer(id, { validationError: 'Please enter an Activity Reference Number/Code.' });
      return;
    }
    if (!c.desc || !c.desc.trim()) {
      updateContainer(id, { validationError: 'Please enter a Log Description Detail.' });
      return;
    }

    // Set output defaults
    let firstOutput = '';
    if (c.type === 'Non-Core') {
      firstOutput = 'N/A';
    } else {
      const selectedService = (masterData.services || []).find(s => s.name === c.activityName);
      const filtered = (masterData.serviceOutput || []).filter(o => o.serviceCode === selectedService?.code);
      firstOutput = filtered[0]?.name || '';
    }

    // Generate unique code
    const generatedCode = `ACT-${Math.floor(100000 + Math.random() * 900000)}`;

    // Initial Data Storage Commitment
    onSubmitLog({
      id: generatedCode,
      date: c.date,
      employeeId: empInfo.employeeId,
      employeeName: empInfo.employeeName,
      bu: c.selectedBu,
      group: empInfo.group,
      type: c.type,
      name: c.activityName,
      hours: 0,
      desc: c.desc || 'N/A',
      referenceCode: c.refNumber,
      targetHours: empInfo.targetHours,
      employeeTargetHours: empInfo.targetHours
    });

    const now = Date.now();
    setContainers((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            activityLogCode: generatedCode,
            selectedOutput: firstOutput,
            isRework: null,
            consideredAccurate: null,
            remarks: '',
            startTime: now,
            accumulatedSeconds: 0,
            timerState: 'running',
            validationError: ''
          };
        } else if (item.timerState === 'running') {
          let added = 0;
          if (item.startTime) {
            added = Math.floor((now - item.startTime) / 1000);
          }
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
  };

  // Pause activity timer
  const handlePause = (id: string) => {
    const c = containers.find(item => item.id === id);
    if (!c) return;

    let added = 0;
    if (c.startTime) {
      added = Math.floor((Date.now() - c.startTime) / 1000);
    }
    updateContainer(id, {
      accumulatedSeconds: c.accumulatedSeconds + added,
      startTime: null,
      timerState: 'paused'
    });
  };

  // Resume activity timer
  const handleResume = (id: string) => {
    const now = Date.now();
    setContainers((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            startTime: now,
            timerState: 'running'
          };
        } else if (item.timerState === 'running') {
          let added = 0;
          if (item.startTime) {
            added = Math.floor((now - item.startTime) / 1000);
          }
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
  };

  // Stop activity timer prompt
  const handlePromptStop = (id: string) => {
    const c = containers.find(item => item.id === id);
    if (!c) return;

    let added = 0;
    if (c.timerState === 'running' && c.startTime) {
      added = Math.floor((Date.now() - c.startTime) / 1000);
    }
    updateContainer(id, {
      accumulatedSeconds: c.accumulatedSeconds + added,
      startTime: null,
      timerState: 'prompting'
    });
  };

  const handleConfirmStop = (id: string) => {
    updateContainer(id, {
      timerState: 'stopped_options'
    });
  };

  const handleCancelStop = (id: string) => {
    updateContainer(id, {
      timerState: 'paused'
    });
  };

  // Continue later (Saves time to current item and hides the container)
  const handleContinueLater = (id: string) => {
    const c = containers.find(item => item.id === id);
    if (!c) return;

    const empInfo = getLogEmployeeInfo(c);
    const secs = calculateTotalSeconds(c.timerState, c.accumulatedSeconds, c.startTime, Date.now());
    const hoursVal = simulationMode ? (secs / 60) : (secs / 3600);

    const isAutoRework = checkIsAutoRework(c);

    // Save hours directly to the same log item referenced by c.activityLogCode
    onSubmitLog({
      id: c.activityLogCode,
      date: c.date,
      employeeId: empInfo.employeeId,
      employeeName: empInfo.employeeName,
      bu: c.selectedBu,
      group: empInfo.group,
      type: c.type,
      name: c.activityName,
      hours: parseFloat(hoursVal.toFixed(2)),
      desc: c.desc || 'N/A',
      referenceCode: c.refNumber,
      targetHours: empInfo.targetHours,
      employeeTargetHours: empInfo.targetHours,
      output: 'Continue later',
      volume: 0,
      isRework: isAutoRework ? true : false,
      isTimerCommit: true
    });

    // Remove container from the stacked logs list (hides it)
    if (containers.length > 1) {
      setContainers(prev => prev.filter(item => item.id !== id));
    } else {
      // If it's the only one, reset to idle
      updateContainer(id, {
        employeeId: '',
        selectedBu: '',
        selectedGroup: '',
        type: 'Core',
        activityName: '',
        desc: '',
        refNumber: '',
        activityLogCode: '',
        selectedOutput: '',
        volume: '1',
        isRework: null,
        consideredAccurate: null,
        remarks: "",
        timerState: 'idle',
        startTime: null,
        accumulatedSeconds: 0,
        validationError: ''
      });
    }
  };

  // Proceed from choices to the Output Worksheet
  const handleProceedToOutput = (id: string) => {
    const c = containers.find(item => item.id === id);
    if (c && checkIsAutoRework(c)) {
      updateContainer(id, {
        timerState: 'collecting_output',
        isRework: true
      });
    } else {
      updateContainer(id, {
        timerState: 'collecting_output'
      });
    }
  };

  // Commit output and hours (Completing the activity)
  const handleCommitLog = (id: string) => {
    const c = containers.find(item => item.id === id);
    if (!c) return;

    if (c.type === 'Core' && !c.selectedOutput) {
      alert('Please select an activity output.');
      return;
    }

    const numericVolume = parseInt(c.volume, 10);
    if (isNaN(numericVolume) || numericVolume <= 0) {
      alert('Please enter a valid volume.');
      return;
    }

    const isAutoRework = checkIsAutoRework(c);
    const finalIsRework = isAutoRework ? true : c.isRework;

    if (finalIsRework === null) {
      alert('Please specify if this is for a Rework.');
      return;
    }

    const empInfo = getLogEmployeeInfo(c);
    const secs = calculateTotalSeconds(c.timerState, c.accumulatedSeconds, c.startTime, Date.now());
    const hoursVal = simulationMode ? (secs / 60) : (secs / 3600);

    onSubmitLog({
      id: c.activityLogCode,
      date: c.date,
      employeeId: empInfo.employeeId,
      employeeName: empInfo.employeeName,
      bu: c.selectedBu,
      group: empInfo.group,
      type: c.type,
      name: c.activityName,
      hours: parseFloat(hoursVal.toFixed(2)),
      desc: c.desc || 'N/A',
      output: c.type === 'Non-Core' ? 'N/A' : c.selectedOutput,
      volume: numericVolume,
      isRework: finalIsRework,
      consideredAccurate: finalIsRework ? (c.consideredAccurate || false) : undefined,
      remarks: finalIsRework ? c.remarks : undefined,
      referenceCode: c.refNumber,
      targetHours: empInfo.targetHours,
      employeeTargetHours: empInfo.targetHours,
      dateCompleted: getTodayDateString(),
      isTimerCommit: true
    });

    // Remove container if multiple, otherwise reset
    if (containers.length > 1) {
      setContainers(prev => prev.filter(item => item.id !== id));
    } else {
      updateContainer(id, {
        employeeId: '',
        selectedBu: '',
        selectedGroup: '',
        type: 'Core',
        activityName: '',
        desc: '',
        refNumber: '',
        activityLogCode: '',
        selectedOutput: '',
        volume: '1',
        isRework: null,
        consideredAccurate: null,
        remarks: "",
        timerState: 'idle',
        startTime: null,
        accumulatedSeconds: 0,
        validationError: ''
      });
    }
  };

  // Stack/Create a new container
  const handleCreateNewContainer = () => {
    const now = Date.now();
    setContainers((prev) => {
      // Pause any active/running timers in existing containers
      const paused = prev.map((c) => {
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
          } as ContainerState;
        }
        return c;
      });

      const last = paused[paused.length - 1];
      const defaultEmpId = last ? last.employeeId : '';
      const defaultBu = last ? last.selectedBu : '';
      const defaultGroup = last ? last.selectedGroup : '';

      const newContainer: ContainerState = {
        id: `container-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        employeeId: defaultEmpId,
        selectedBu: defaultBu,
        selectedGroup: defaultGroup,
        date: getTodayDateString(),
        type: 'Core',
        activityName: '',
        desc: '',
        refNumber: '',
        activityLogCode: '',
        selectedOutput: '',
        volume: '1',
        isRework: null,
        consideredAccurate: null,
        remarks: "",
        timerState: 'idle',
        startTime: null,
        accumulatedSeconds: 0,
        validationError: ''
      };

      return [...paused, newContainer];
    });
  };

  // Remove custom stacked container
  const handleRemoveContainer = (id: string) => {
    if (containers.length > 1) {
      setContainers(prev => prev.filter(item => item.id !== id));
    }
  };

  const hasAnyRunningTimer = containers.some(c => c.timerState === 'running');
  const hasAnyStartedLog = containers.some(c => c.activityLogCode !== '');

  // Condition to display the "Create New Activity Log" button:
  // Only show it once at least one activity has been officially started
  const showCreateNewBtn = hasAnyStartedLog;

  // It will only be enabled when all current activities are paused and at least one has started
  const isCreateNewBtnEnabled = !hasAnyRunningTimer && hasAnyStartedLog;

  return (
    <div className="space-y-6">
      {/* Create New Activity Log button at the very top just below the header */}
      {showCreateNewBtn && (
        <div className="flex justify-end bg-slate-50 border border-slate-200/60 p-3 rounded-2xl shadow-xs">
          <button
            id="create-new-activity-log-btn"
            onClick={handleCreateNewContainer}
            disabled={!isCreateNewBtnEnabled}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs px-5 py-3 rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            Create New Activity Log
          </button>
        </div>
      )}

      {containers.map((c, index) => {
        const isFormLocked = c.timerState !== 'idle';
        const isFieldEditable = c.timerState === 'idle' || c.timerState === 'paused' || c.timerState === 'collecting_output';
        const isRefDup = isDuplicateRef(c.refNumber, c.activityLogCode);
        const hasEffectiveEmployee = loggedInUser || c.employeeId;
        const isStartDisabled = !c.date || !c.activityName || !c.desc.trim() || (c.type === 'Core' && !c.refNumber.trim()) || !hasEffectiveEmployee || !c.selectedBu || (c.type === 'Core' && isRefDup);
        const isTimerActive = c.timerState === 'running' || c.timerState === 'paused' || c.timerState === 'prompting' || c.timerState === 'stopped_options';
        const hasRightSidebar = isTimerActive || c.timerState === 'collecting_output';

        const secondsElapsed = calculateTotalSeconds(c.timerState, c.accumulatedSeconds, c.startTime, currentTime);
        const decimalHours = simulationMode ? (secondsElapsed / 60) : (secondsElapsed / 3600);

        const formatTimeDisplay = () => {
          if (simulationMode) {
            const h = Math.floor(secondsElapsed / 60);
            const m = secondsElapsed % 60;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
          } else {
            const h = Math.floor(secondsElapsed / 3600);
            const m = Math.floor((secondsElapsed % 3600) / 60);
            const s = secondsElapsed % 60;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
          }
        };

        const getOutputsListForC = () => {
          if (c.type === 'Non-Core') {
            return [{ code: 'N/A', name: 'N/A' }];
          }
          const selectedService = (masterData.services || []).find((s) => s.name === c.activityName);
          if (!selectedService) return [];
          return (masterData.serviceOutput || []).filter((o) => o.serviceCode === selectedService.code);
        };

        const isAutoRework = checkIsAutoRework(c);
        const effectiveIsRework = isAutoRework ? true : c.isRework;

        const isCommitDisabled = 
          (c.type === 'Core' && !c.selectedOutput) || 
          !c.volume || 
          isNaN(parseInt(c.volume, 10)) || 
          parseInt(c.volume, 10) <= 0 || 
          effectiveIsRework === null;

        const currentSelectedEmp = masterData.employeeProfile.find(e => e.id === c.employeeId);

        return (
          <div 
            key={c.id} 
            id="log-activity-tab-card" 
            className="max-w-none w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-fadeIn text-slate-900"
          >
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-blue-600" /> 
                  {index === 0 ? 'Log Activity Here' : `Stacked Activity Log #${index + 1}`}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Logs input directly with real-time tracking metrics (Supports background persistence)
                </p>
              </div>
              <div className="flex items-center gap-2">
                {containers.length > 1 && !isFormLocked && (
                  <button
                    onClick={() => handleRemoveContainer(c.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Remove Stacked Activity Log"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                )}
                <span className="text-[10px] bg-blue-50 text-blue-700 px-3 py-1 rounded font-mono border border-blue-200 font-bold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  PERSISTENT
                </span>
              </div>
            </div>

            <div className={`p-6 ${hasRightSidebar ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 space-y-0' : 'space-y-6'}`}>
              <div className={`space-y-6 ${hasRightSidebar ? 'lg:col-span-8' : ''}`}>
                {c.validationError && (
                  <div id="validation-error-banner" className="bg-rose-50 border border-rose-150 p-4 rounded-xl flex items-center gap-3 text-xs text-rose-700 animate-fadeIn">
                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                    <span className="font-semibold">{c.validationError}</span>
                  </div>
                )}

                {/* PROFILE & DATE FIELDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5 text-blue-600" /> ACTIVITY LOG CODE
                    </label>
                    <input
                      id="activity-log-code-select"
                      type="text"
                      readOnly
                      value={c.activityLogCode || ''}
                      placeholder="[Auto-assigned on Start]"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-500 focus:outline-none cursor-not-allowed shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                      <span className="text-rose-500 font-bold mr-1">*</span>Employee Target Profile
                    </label>
                    {loggedInUser ? (
                      <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 flex items-center gap-2 shadow-sm font-sans">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                        {loggedInUser.role === 'admin'
                          ? 'Administrator'
                          : `${masterData.regularUserAccount?.employeeName || 'Staff'} (${masterData.regularUserAccount?.employeeCode || 'staff'})`
                        }
                      </div>
                    ) : (
                      <select
                        id="employee-profile-select"
                        value={c.employeeId}
                        onChange={(e) => handleEmployeeChange(c.id, e.target.value)}
                        disabled={isFormLocked}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm cursor-pointer"
                      >
                        <option value="">Select Employee profile...</option>
                        {masterData.employeeProfile.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* REPORTING DATE & REF CODE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <div className="grid grid-cols-2 gap-3 items-end">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                          <span className="text-rose-500 font-bold mr-1">*</span>Reporting Date
                        </label>
                        <div className="relative">
                          <input
                            id="reporting-date-input"
                            type="date"
                            value={c.date}
                            max={getTodayDateString()}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              const err = validateReportingDate(newDate);
                              updateContainer(c.id, { date: newDate, validationError: err });
                            }}
                            disabled={isFormLocked}
                            required
                            className={`w-full bg-white border ${
                              validateReportingDate(c.date)
                                ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                                : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                            } disabled:bg-slate-50 disabled:text-slate-500 rounded-xl pl-4 pr-10 py-3 text-xs text-slate-950 focus:outline-none transition shadow-sm`}
                          />
                          <Calendar className="absolute right-4 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                          Date Today
                        </label>
                        <input
                          id="todays-date-display"
                          type="text"
                          readOnly
                          value={getTodayDateString()}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-500 cursor-not-allowed shadow-sm text-left"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      ACTIVITY TYPE
                    </label>
                    <div className="flex gap-2 bg-slate-100 p-1 border border-slate-200 rounded-xl h-[42px] mt-[10px]">
                      <button
                        id="activity-type-core-btn"
                        type="button"
                        disabled={!isFieldEditable}
                        onClick={() => { updateContainer(c.id, { type: 'Core', activityName: '', selectedBu: '', refNumber: c.refNumber === 'N/A' ? '' : c.refNumber }); }}
                        className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                          c.type === 'Core'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        Core Activity
                      </button>
                      <button
                        id="activity-type-noncore-btn"
                        type="button"
                        disabled={!isFieldEditable}
                        onClick={() => { updateContainer(c.id, { type: 'Non-Core', activityName: '', selectedBu: 'N/A', refNumber: 'N/A' }); }}
                        className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                          c.type === 'Non-Core'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        Non-Core
                      </button>
                    </div>
                  </div>
                </div>

                {/* TYPE & LABEL FIELDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      {c.type === 'Core' && <span className="text-rose-500 font-bold mr-1">*</span>}
                      <Hash className="h-3.5 w-3.5 text-blue-600" /> ACTIVITY REFERENCE NUMBER/CODE
                    </label>
                    <input
                      id="activity-reference-input"
                      type="text"
                      value={c.refNumber}
                      onChange={(e) => updateContainer(c.id, { refNumber: e.target.value, validationError: '' })}
                      disabled={!isFieldEditable || c.type === 'Non-Core'}
                      required={c.type === 'Core'}
                      placeholder={c.type === 'Non-Core' ? 'N/A' : 'Enter reference number or code...'}
                      className={`w-full bg-white border disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed rounded-xl px-4 py-3 text-xs text-slate-950 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition shadow-sm ${
                        (isRefDup && c.type === 'Core')
                          ? 'border-rose-500 ring-2 ring-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse'
                          : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                    />
                    {(isRefDup && c.type === 'Core') && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-2 flex items-center gap-1.5 bg-rose-50 border border-rose-200/50 p-2 rounded-lg animate-fadeIn">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span>Duplicate Reference Number detected in database.</span>
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                      <span className="text-rose-500 font-bold mr-1">*</span>ACTIVITY LABEL / CATEGORY
                    </label>
                    {c.type === 'Core' ? (
                      <select
                        id="core-activity-name-input"
                        value={c.activityName}
                        onChange={(e) => updateContainer(c.id, { activityName: e.target.value })}
                        disabled={!isFieldEditable}
                        required
                        className="w-full bg-white border border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 rounded-xl px-4 py-3 text-xs text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                      >
                        <option value="">Select Core Service label...</option>
                        {(masterData.services || [])
                          .filter((item) => {
                            if (loggedInUser?.role === 'user' && masterData.regularUserAccount?.assignedServices && masterData.regularUserAccount.assignedServices.length > 0) {
                              const code = typeof item === 'string' ? '' : item.code;
                              return masterData.regularUserAccount.assignedServices.includes(code);
                            }
                            return true;
                          })
                          .map((item, index) => {
                            const name = typeof item === 'string' ? item : item.name;
                            const code = typeof item === 'string' ? `SV-${index}` : item.code;
                            return (
                              <option key={index} value={name}>
                                [{code}] {name}
                              </option>
                            );
                          })}
                      </select>
                    ) : (
                      <select
                        id="noncore-activity-select"
                        value={c.activityName}
                        onChange={(e) => updateContainer(c.id, { activityName: e.target.value })}
                        disabled={!isFieldEditable}
                        required
                        className="w-full bg-white border border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 rounded-xl px-4 py-3 text-xs text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                      >
                        <option value="">Select Non-Core activity category...</option>
                        {(masterData.nonCoreActivity || []).map((item) => (
                          <option key={item.code} value={item.name}>
                            [{item.code}] {item.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* BUSINESS UNIT & GROUP FIELDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                      <span className="text-rose-500 font-bold mr-1">*</span>Business Unit
                    </label>
                    <select
                      id="business-unit-select"
                      value={c.selectedBu}
                      onChange={(e) => updateContainer(c.id, { selectedBu: e.target.value })}
                      disabled={!isFieldEditable || c.type !== 'Core'}
                      required
                      className="w-full bg-white border border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 rounded-xl px-4 py-3 text-xs text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                    >
                      {c.type === 'Non-Core' ? (
                        <option value="N/A">N/A</option>
                      ) : (
                        <>
                          <option value="">Select Business Unit...</option>
                          {(masterData.bu || []).map((buName) => (
                            <option key={buName} value={buName}>
                              {buName}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                      Group
                    </label>
                    <input
                      id="group-readonly-input"
                      type="text"
                      readOnly
                      value={
                        loggedInUser?.role === 'admin'
                          ? 'App Admin'
                          : loggedInUser?.role === 'user'
                          ? (() => {
                              const gCode = masterData.regularUserAccount?.group || '';
                              const matchedG = (masterData.group || []).find(g => g.code === gCode);
                              return matchedG ? `${matchedG.name} (${matchedG.code})` : (gCode || 'N/A');
                            })()
                          : (c.selectedGroup || '')
                      }
                      placeholder="[Auto-populated from Profile]"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-500 focus:outline-none cursor-not-allowed shadow-sm"
                    />
                  </div>
                </div>

                {/* LOG DESCRIPTION DETAIL */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                    <span className="text-rose-500 font-bold mr-1">*</span>LOG DESCRIPTION DETAIL
                  </label>
                  <input
                    id="log-description-input"
                    type="text"
                    value={c.desc}
                    onChange={(e) => updateContainer(c.id, { desc: e.target.value, validationError: '' })}
                    disabled={!isFieldEditable}
                    placeholder="Brief detail of execution..."
                    className="w-full bg-white border border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 rounded-xl px-4 py-3 text-xs text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                  />
                </div>
              </div>

              {/* DYNAMIC TIMER AND INTERACTION PANELS / STOP PROMPT */}
              {hasRightSidebar ? (
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {(c.timerState === 'running' || c.timerState === 'paused') && (
                    <>
                      {/* LIVE TRACKED HOURS DISPLAY ON TOP OF THE TIMER */}
                      <div id="live-tracked-hours-input-display-top" className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm animate-slideDown">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Decimal Hours Logged (Ticking Live)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={`${decimalHours.toFixed(2)} hrs`}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 font-mono font-bold focus:outline-none"
                          />
                          <Clock className="absolute right-4 top-3.5 h-4 w-4 text-blue-500 animate-pulse" />
                        </div>
                      </div>

                      <div id="timer-active-interface-panel" className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center gap-6 animate-scaleUp h-full min-h-[320px]">
                        <div className="space-y-2 flex flex-col items-center">
                          <span className="inline-flex items-center gap-1.5 text-[10px] bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                            <span className={`h-2 w-2 rounded-full ${c.timerState === 'running' ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
                            Time Tracking Matrix
                          </span>
                          <div id="timer-formatted-display-text" className="text-5xl lg:text-6xl font-black font-mono text-slate-900 tracking-widest tabular-nums py-2 my-1">
                            {formatTimeDisplay()}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            Calculated Metric: <span className="text-blue-600 font-bold">{decimalHours.toFixed(2)} hrs</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-4 w-full">
                          <div className="flex flex-col gap-2.5 w-full">
                            {c.timerState === 'running' ? (
                              <button
                                id="pause-timer-btn"
                                onClick={() => handlePause(c.id)}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-3 rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer w-full"
                              >
                                <Pause className="h-3.5 w-3.5 fill-white text-white" /> Pause
                              </button>
                            ) : (
                              <button
                                id="resume-timer-btn"
                                onClick={() => handleResume(c.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-3 rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer w-full"
                              >
                                <Play className="h-3.5 w-3.5 fill-white text-white" /> Resume
                              </button>
                            )}
                            <button
                              id="stop-timer-btn"
                              onClick={() => handlePromptStop(c.id)}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-3 rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer w-full"
                            >
                              <Square className="h-3.5 w-3.5 fill-white text-white" /> Stop Timer
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {c.timerState === 'prompting' && (
                    <div id="stop-timer-prompt-card" className="bg-slate-50 border-2 border-amber-300 p-5 rounded-xl shadow-md space-y-4 animate-slideDown w-full">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Confirm Stop Timer</h4>
                          <p className="text-xs text-slate-600 mt-1">
                            Are you sure you want to stop tracking this activity? This will lock the logged duration at <strong className="text-blue-600">{decimalHours.toFixed(2)} hrs</strong>.
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          id="cancel-stop-timer-btn"
                          onClick={() => handleCancelStop(c.id)}
                          className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          id="confirm-stop-timer-btn"
                          onClick={() => handleConfirmStop(c.id)}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
                        >
                          Yes
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STOPPED OPTIONS (SAVE OR COMPLETE) */}
                  {c.timerState === 'stopped_options' && (
                    <div id="stop-options-prompt-card" className="bg-slate-50 border-2 border-blue-300 p-5 rounded-xl shadow-md space-y-4 animate-slideDown w-full">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Finish Tracking Session</h4>
                          <p className="text-xs text-slate-600 mt-1">
                            You have recorded <strong className="text-blue-600">{decimalHours.toFixed(2)} hrs</strong>. Choose how you would like to proceed:
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <button
                          id="continue-later-btn"
                          onClick={() => handleContinueLater(c.id)}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer w-full shadow-xs"
                        >
                          Continue later
                        </button>
                        <button
                          id="proceed-to-output-btn"
                          onClick={() => handleProceedToOutput(c.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer w-full shadow-xs"
                        >
                          Yes, Complete Activity (Specify Output)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* OUTPUT DETAILS FORM SECTION */}
                  {c.timerState === 'collecting_output' && (
                    <div id="collecting-output-details-section" className="bg-blue-50/40 border border-blue-200 rounded-xl p-6 shadow-sm space-y-6 animate-scaleUp">
                      <div className="border-b border-blue-100 pb-4">
                        <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                          <Check className="h-4 w-4 text-blue-600" /> Output Specification Worksheet
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Step 2: Declare standard output metrics produced in the logged session (<strong className="text-slate-800 font-semibold">{decimalHours.toFixed(2)} hrs</strong> of <strong className="text-slate-800 font-semibold">{c.activityName}</strong>).
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-5">
                        {/* A. OUTPUT */}
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                            OUTPUT
                          </label>
                          <select
                            id="standard-output-dropdown"
                            value={c.type === 'Non-Core' ? 'N/A' : c.selectedOutput}
                            onChange={(e) => updateContainer(c.id, { selectedOutput: e.target.value })}
                            disabled={c.type === 'Non-Core'}
                            required
                            className="w-full bg-white border border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 rounded-xl px-4 py-3 text-xs text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                          >
                            {c.type === 'Non-Core' ? (
                              <option value="N/A">N/A</option>
                            ) : (
                              <>
                                <option value="">-- Select Output --</option>
                                {getOutputsListForC().map((out, idx) => (
                                  <option key={idx} value={out.name}>
                                    [{out.code}] {out.name}
                                  </option>
                                ))}
                              </>
                            )}
                          </select>
                        </div>

                        {/* B. Volume Completed */}
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                            B. Volume Completed (Qty)
                          </label>
                          <input
                            id="output-volume-completed-input"
                            type="number"
                            min="0.01"
                            step="0.01"
                            required
                            value={c.volume}
                            onChange={(e) => updateContainer(c.id, { volume: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-950 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                          />
                        </div>
                      </div>

                      {/* C. Rework Yes/No Option Buttons */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                          C. Is this for a Rework?
                        </label>
                        {isAutoRework && (
                          <div className="mb-3 bg-amber-50 border border-amber-200/80 p-2.5 rounded-lg text-xs font-semibold text-amber-800 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                            <span>Automatically tagged as Rework: Existing reference code detected for this employee, activity, and business unit.</span>
                          </div>
                        )}
                        <div className="flex gap-3 mb-4">
                          <button
                            id="is-rework-no-btn"
                            type="button"
                            disabled={isAutoRework}
                            onClick={() => updateContainer(c.id, { isRework: false })}
                            className={`flex-1 text-center py-2.5 rounded-lg text-xs font-bold transition-all border ${
                              effectiveIsRework === false
                                ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs font-extrabold'
                                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-350 disabled:opacity-40 disabled:cursor-not-allowed'
                            }`}
                          >
                            No, New Work
                          </button>
                          <button
                            id="is-rework-yes-btn"
                            type="button"
                            disabled={isAutoRework}
                            onClick={() => updateContainer(c.id, { isRework: true })}
                            className={`flex-1 text-center py-2.5 rounded-lg text-xs font-bold transition-all border ${
                              effectiveIsRework === true
                                ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs font-extrabold'
                                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-350'
                            }`}
                          >
                            Yes, Rework
                          </button>
                        </div>
                        {effectiveIsRework === true && (
                          <div className="space-y-4 pt-4 border-t border-slate-100">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={c.consideredAccurate || false}
                                onChange={(e) => updateContainer(c.id, { consideredAccurate: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-sm font-bold text-slate-700">Considered Accurate</span>
                            </label>
                            <div>
                              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                Remarks
                              </label>
                              <textarea
                                value={c.remarks || ''}
                                onChange={(e) => updateContainer(c.id, { remarks: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm resize-none"
                                rows={2}
                                placeholder="Add any remarks..."
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* D. Confirmation Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-slate-200">
                        <button
                          id="cancel-output-worksheet-btn"
                          onClick={() => updateContainer(c.id, { timerState: 'paused' })}
                          className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm px-6 py-3 rounded-xl transition cursor-pointer flex-1"
                        >
                          Cancel
                        </button>
                        <button
                          id="confirm-and-commit-activity-btn"
                          onClick={() => handleCommitLog(c.id)}
                          disabled={isCommitDisabled}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:border-slate-250 disabled:cursor-not-allowed disabled:hover:bg-slate-300 text-white font-bold text-sm px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer flex-1"
                        >
                          <Check className="h-4 w-4" /> Confirm & Commit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full pt-4 border-t border-slate-200">
                  {c.timerState === 'idle' && (
                    <div className="flex justify-end gap-3">
                      {index > 0 && (
                        <button
                          onClick={() => handleRemoveContainer(c.id)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm px-8 py-3.5 rounded-xl transition flex items-center gap-2 shadow-md cursor-pointer hover:shadow-lg"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        id="start-activity-timer-btn"
                        onClick={() => handleStartTimer(c.id)}
                        disabled={isStartDisabled}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-8 py-3.5 rounded-xl transition flex items-center gap-2 shadow-md cursor-pointer hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:hover:bg-slate-400 disabled:shadow-none"
                      >
                        <Play className="h-4 w-4 fill-white text-white" /> Start
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
