import React, { useState, useEffect } from 'react';
import { Search, Database, AlertCircle, Edit2, Play, X, Check, Filter, RotateCcw, ChevronRight, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { ActivityLog, MasterData, ContainerState } from '../types';

interface DatabaseTabProps {
  activityLogs: ActivityLog[];
  masterData: MasterData;
  onUpdateLog: (log: ActivityLog) => void;
  onContinueLog: (log: ActivityLog) => void;
  loggedInUser?: { role: 'admin' | 'user'; username: string } | null;
  isConsolidated?: boolean;
  openLogIds?: string[];
  containers?: ContainerState[];
}

export default function DatabaseTab({ 
  activityLogs, 
  masterData, 
  onUpdateLog, 
  onContinueLog, 
  loggedInUser, 
  isConsolidated = false,
  openLogIds = [],
  containers = []
}: DatabaseTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);
  const isOriginalPaused = editingLog ? !editingLog.dateCompleted : false;
  const isOriginalCompleted = editingLog ? !!editingLog.dateCompleted : false;
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const renderRow = (row: ActivityLog, isSubItem: boolean, hasChildren: boolean, isExpanded: boolean) => {
    const parentLog = isSubItem && row.parentId ? activityLogs.find(l => l.id === row.parentId) : undefined;
    const reportingDate = parentLog ? parentLog.date : row.date;
    const typeBadge = row.type === 'Core'
      ? 'bg-blue-50 text-blue-700 border-blue-200/60'
      : 'bg-purple-50 text-purple-700 border-purple-200/60';

    const statusBadge = row.dateCompleted
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
      : 'bg-amber-50 text-amber-700 border-amber-200/60';

    const isCompleted = !!row.dateCompleted;
    const isOpen = openLogIds.includes(row.id);
    const activeContainer = containers.find(c => c.activityLogCode === row.id && c.timerState === 'running');
    const isRunning = !!activeContainer;

    const calculateCurrentHours = () => {
      if (!isRunning || !activeContainer) return row.hours;
      const elapsedSec = activeContainer.accumulatedSeconds + Math.floor((now - (activeContainer.startTime || now)) / 1000);
      return elapsedSec / 3600;
    };

    const currentHours = calculateCurrentHours();

    const isAnyRowEditing = !!editingLog;

    return (
      <tr key={row.id} className={`hover:bg-slate-50/70 border-b border-slate-150 transition-colors divide-x divide-slate-100 ${isSubItem ? 'bg-slate-50/30' : ''}`}>
        {/* Action / Actions Column (Leftmost) */}
        {isConsolidated ? (
          <td className={`px-4 py-3 text-xs whitespace-nowrap transition-opacity duration-250 ${isAnyRowEditing ? 'opacity-50' : ''}`}>
            {!isSubItem && loggedInUser?.role === 'admin' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartEdit(row)}
                  disabled={isOpen || isAnyRowEditing}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-colors font-medium text-xs border border-transparent ${
                    isOpen || isAnyRowEditing
                      ? 'text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed' 
                      : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 hover:border-blue-200/50 cursor-pointer font-bold'
                  }`}
                  title={isOpen ? "Activity is currently open in Logger" : (isAnyRowEditing ? "Save or cancel current edit first" : "Edit Log")}
                >
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
              </div>
            ) : (
              <span className="text-slate-300 ml-4">—</span>
            )}
          </td>
        ) : (
          <td className={`px-4 py-3 text-xs whitespace-nowrap transition-opacity duration-250 ${isAnyRowEditing ? 'opacity-50' : ''}`}>
            {!isSubItem && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartEdit(row)}
                  disabled={isOpen || isAnyRowEditing}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-colors font-medium text-xs border border-transparent ${
                    isOpen || isAnyRowEditing
                      ? 'text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed' 
                      : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 hover:border-blue-200/50 cursor-pointer'
                  }`}
                  title={isOpen ? "Activity is currently open in Logger" : (isAnyRowEditing ? "Save or cancel current edit first" : "Edit Log")}
                >
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
                {!isCompleted && (!isConsolidated || row.employeeId === currentUserInfo.id) && (
                  <button
                    onClick={() => onContinueLog(row)}
                    disabled={isOpen || isAnyRowEditing}
                    className={`flex items-center gap-1 px-2 py-1 rounded transition-colors font-medium text-xs border border-transparent ${
                      isOpen || isAnyRowEditing
                        ? 'text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed'
                        : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 hover:border-emerald-200/50 cursor-pointer'
                    }`}
                    title={isOpen ? "Activity is already running" : (isAnyRowEditing ? "Save or cancel current edit first" : "Continue Log Timer")}
                  >
                    <Play className={`h-3 w-3 ${isOpen || isAnyRowEditing ? 'fill-slate-400' : 'fill-emerald-600 hover:fill-emerald-800'}`} /> Continue
                  </button>
                )}
              </div>
            )}
            {isSubItem && <span className="text-slate-300 ml-4">—</span>}
          </td>
        )}

        {/* Log ID */}
        <td className="px-4 py-3 text-xs font-mono font-bold text-slate-400 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(row.id)}
                className="p-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded transition-all cursor-pointer flex items-center justify-center shadow-xs"
                title={isExpanded ? "Collapse sessions" : "Expand sessions"}
              >
                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <span className="w-6" />
            )}
            <span className={isSubItem ? 'ml-4' : ''}>{row.id}</span>
            {!isSubItem && (() => {
              const subCount = activityLogs.filter(l => l.parentId === row.id).length;
              if (subCount === 0) return null;
              return (
                <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-extrabold bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100/50">
                  {subCount} {subCount === 1 ? 'session' : 'sessions'}
                </span>
              );
            })()}
          </div>
        </td>

        {/* Employee column if consolidated */}
        {isConsolidated && (
          <td className="px-4 py-3 text-xs font-semibold text-slate-700 whitespace-nowrap">
            <div className="flex flex-col">
              <span className="font-bold text-slate-800">{row.employeeName || 'Unknown Employee'}</span>
              <span className="text-[10px] font-mono text-slate-400">{row.employeeId || 'No ID'}</span>
            </div>
          </td>
        )}

        {/* Activity Label / Category */}
        <td className={`px-4 py-3 text-xs font-bold text-slate-800 whitespace-nowrap ${isSubItem ? 'pl-8 text-slate-500 font-medium' : ''}`}>
          <div className="flex items-center gap-2">
            {row.name}
            {isRunning && (
              <span className="flex items-center gap-1 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                <Clock className="h-2.5 w-2.5" /> Running
              </span>
            )}
          </div>
        </td>

        {/* Non-Core Category */}
        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
          {row.type === 'Non-Core' ? (
            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-medium text-[10px] border border-purple-200/40">
              {getNonCoreCategory(row)}
            </span>
          ) : '—'}
        </td>

        {/* Description */}
        <td className="px-4 py-3 text-xs text-slate-650 min-w-[200px] max-w-[300px] truncate" title={row.desc}>
          {row.desc}
        </td>

        {/* Status badge */}
        <td className="px-4 py-3 text-xs whitespace-nowrap">
          {isRunning ? (
            <span className="text-[9px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              Live Tracking
            </span>
          ) : (
            <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-full uppercase ${statusBadge}`}>
              {row.dateCompleted ? 'Completed' : 'Paused'}
            </span>
          )}
        </td>

        {/* Reporting Date */}
        <td className="px-4 py-3 text-xs text-slate-650 font-mono whitespace-nowrap">
          {reportingDate}
        </td>

        {/* Date Logged */}
        <td className="px-4 py-3 text-xs text-slate-650 font-mono whitespace-nowrap">
          {row.dateLogged || row.date}
        </td>

        {/* Date Completed */}
        <td className="px-4 py-3 text-xs text-slate-650 font-mono whitespace-nowrap">{row.dateCompleted || '—'}</td>

        {/* Business Unit */}
        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{row.bu}</td>

        {/* Group */}
        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{row.group}</td>

        {/* SLA Targets */}
        <td className="px-4 py-3 text-xs font-mono text-slate-600 text-right whitespace-nowrap">
          {(() => {
            const computed = getRowSlaTargets(row);
            return computed !== null ? `${computed.toFixed(2)} hrs` : '—';
          })()}
        </td>

        {/* Hours Logged */}
        <td className={`px-4 py-3 text-xs font-mono font-bold text-right whitespace-nowrap ${isRunning ? 'text-emerald-600' : 'text-blue-600'}`}>
          {(() => {
            if (row.parentId) {
              return `${currentHours.toFixed(2)} hrs`;
            }
            // For parent rows, row.hours now represents the total logged hours across all sub-items
            return `${currentHours.toFixed(2)} hrs`;
          })()}
        </td>
        {/* On Time */}
        <td className="px-4 py-3 text-xs text-center whitespace-nowrap">
          {(() => {
            const isComp = !!row.dateCompleted;
            if (!isComp) {
              return (
                <span className="bg-slate-100 text-slate-500 border border-slate-200/60 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  N/A
                </span>
              );
            }
            const computedSla = getRowSlaTargets(row);
            if (computedSla === null) return '—';
            const isOnTime = computedSla < row.hours;
            return isOnTime ? (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-1.5 py-0.5 rounded text-[10px] font-bold">
                Yes
              </span>
            ) : (
              <span className="bg-rose-50 text-rose-600 border border-rose-200/60 px-1.5 py-0.5 rounded text-[10px] font-bold">
                No
              </span>
            );
          })()}
        </td>

        {/* Type */}
        <td className="px-4 py-3 text-xs whitespace-nowrap">
          <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-full uppercase ${typeBadge}`}>
            {row.type}
          </span>
        </td>

        {/* Ref Number */}
        <td className="px-4 py-3 text-xs font-mono font-bold text-slate-700 whitespace-nowrap">{row.referenceCode || '—'}</td>

        {/* Output Name */}
        <td className="px-4 py-3 text-xs text-slate-600 min-w-[120px]">
          {(!row.dateCompleted || row.output === 'Continue later' || row.output === 'Continue Later') ? '' : (row.output || '—')}
        </td>

        {/* Volume */}
        <td className="px-4 py-3 text-xs font-mono text-right text-slate-700 whitespace-nowrap">{row.volume !== undefined ? Number(row.volume).toFixed(2) : '—'}</td>

        {/* Rework? */}
        <td className="px-4 py-3 text-xs text-center whitespace-nowrap">
          {row.isRework ? (
            <span className="bg-rose-50 text-rose-600 border border-rose-200/60 px-1.5 py-0.5 rounded text-[9px] font-bold">
              Yes
            </span>
          ) : row.isRework === false ? (
            <span className="bg-slate-50 text-slate-500 border border-slate-200/60 px-1.5 py-0.5 rounded text-[9px] font-medium">
              No
            </span>
          ) : (
            <span className="text-slate-350">—</span>
          )}
        </td>

        {/* Considered Accurate */}
        <td className="px-4 py-3 text-xs text-center whitespace-nowrap">
          {row.isRework ? (
            row.consideredAccurate ? (
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200/60 px-1.5 py-0.5 rounded text-[9px] font-bold">Yes</span>
            ) : (
              <span className="bg-rose-50 text-rose-600 border border-rose-200/60 px-1.5 py-0.5 rounded text-[9px] font-bold">No</span>
            )
          ) : (
            <span className="text-slate-350">—</span>
          )}
        </td>

        {/* Remarks */}
        <td className="px-4 py-3 text-xs text-center text-slate-700 max-w-[150px] truncate">
          {row.isRework && row.remarks ? row.remarks : <span className="text-slate-350">—</span>}
        </td>

        {/* Transaction Count */}
        <td className="px-4 py-3 text-xs font-mono font-bold text-right text-indigo-600 whitespace-nowrap">
          {row.parentId ? '—' : Math.max(1, Number(row.volume) || 0).toFixed(2)}
        </td>
        {/* Completed Count */}
        <td className="px-4 py-3 text-xs font-mono font-bold text-right text-emerald-600 whitespace-nowrap">
          {row.parentId ? '—' : getCompletedCount(row).toFixed(2)}
        </td>
      </tr>
    );
  };

  const getRowSlaTargets = (row: ActivityLog) => {
    if (row.type !== 'Core') return null;
    const matchedOutput = (masterData.serviceOutput || []).find(
      (o) => o.name === row.output || o.code === row.output
    );
    if (!matchedOutput) return 0;
    const target = matchedOutput.slaTarget !== undefined ? matchedOutput.slaTarget : 0;
    const volume = row.volume !== undefined ? row.volume : 0;
    return target * volume;
  };

  const getCompletedCount = (row: ActivityLog) => {
    if (!row.dateCompleted) return 0;
    
    // Determine the reporting date for this row (supporting sub-item inheritance)
    const parentLog = row.parentId ? activityLogs.find(l => l.id === row.parentId) : undefined;
    const reportingDate = parentLog ? parentLog.date : row.date;

    // By default, the period end is the row's reporting date
    let periodEnd = reportingDate;

    // If reporting date range filters are active, use them to define the period
    if (filterReportingStart && filterReportingEnd) {
      periodEnd = filterReportingEnd;
    } else if (filterReportingEnd) {
      periodEnd = filterReportingEnd;
    } else if (filterReportingStart) {
      periodEnd = reportingDate > filterReportingStart ? reportingDate : filterReportingStart;
    }

    if (row.dateCompleted > periodEnd) {
      return 0;
    }
    return row.volume !== undefined ? Number(row.volume) : 0;
  };

  // Compute the current logged in user ID and Name
  const currentUserInfo = (() => {
    if (loggedInUser?.role === 'admin') {
      return {
        id: 'admin',
        name: 'Administrator',
      };
    } else if (loggedInUser?.role === 'user') {
      const userCode = masterData.regularUserAccount?.employeeCode || 'staff';
      const userName = masterData.regularUserAccount?.employeeName || 'Staff';
      return {
        id: userCode,
        name: userName,
      };
    } else {
      const firstEmp = masterData.employeeProfile?.[0];
      return {
        id: firstEmp?.id || 'admin',
        name: firstEmp?.name || 'Administrator',
      };
    }
  })();

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterBU, setFilterBU] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterOutput, setFilterOutput] = useState<string>('All');
  const [filterRework, setFilterRework] = useState<string>('All');
  const [filterReportingStart, setFilterReportingStart] = useState<string>('');
  const [filterReportingEnd, setFilterReportingEnd] = useState<string>('');
  const [filterCompletedStart, setFilterCompletedStart] = useState<string>('');
  const [filterCompletedEnd, setFilterCompletedEnd] = useState<string>('');
  const [filterActivityLabel, setFilterActivityLabel] = useState<string>('All');
  const [filterNonCoreCategory, setFilterNonCoreCategory] = useState<string>('All');
  const [filterEmployee, setFilterEmployee] = useState<string>('All');
  const [filterGroup, setFilterGroup] = useState<string>('All');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Form states for the modal
  const [editForm, setEditForm] = useState<{
    date: string;
    dateCompleted: string;
    bu: string;
    group: string;
    type: 'Core' | 'Non-Core';
    desc: string;
    referenceCode: string;
    output: string;
    volume: number;
    isRework: boolean;
    consideredAccurate?: boolean;
    remarks?: string;
    status: 'Completed' | 'Paused';
    hours: number;
  }>({
    date: '',
    dateCompleted: '',
    bu: '',
    group: '',
    type: 'Core',
    desc: '',
    referenceCode: '',
    output: '',
    volume: 1,
    isRework: false,
    consideredAccurate: false,
    remarks: '',
    status: 'Paused',
    hours: 0,
  });

  const getNonCoreCategory = (row: ActivityLog) => {
    if (row.type !== 'Non-Core') return '—';
    const matched = (masterData.nonCoreActivity || []).find((item) => item.name === row.name);
    return matched ? matched.category : '—';
  };

  const handleResetFilters = () => {
    setFilterStatus('All');
    setFilterBU('All');
    setFilterType('All');
    setFilterOutput('All');
    setFilterRework('All');
    setFilterReportingStart('');
    setFilterReportingEnd('');
    setFilterCompletedStart('');
    setFilterCompletedEnd('');
    setFilterActivityLabel('All');
    setFilterNonCoreCategory('All');
    setFilterEmployee('All');
    setFilterGroup('All');
  };

  // Unique options for filters based on actual activityLogs
  const buOptions = Array.from(new Set(activityLogs.map((log) => log.bu))).filter(Boolean).sort();
  const outputOptions = Array.from(new Set(activityLogs.map((log) => log.output).filter(Boolean))).sort();
  const labelOptions = Array.from(new Set(activityLogs.map((log) => log.name))).filter(Boolean).sort();
  const nonCoreCategories = Array.from(new Set((masterData.nonCoreActivity || []).map((item) => item.category))).filter(Boolean).sort();

  const uniqueEmployeesMap = new Map<string, string>();
  activityLogs.forEach((log) => {
    if (log.employeeId) {
      if (loggedInUser?.role === 'user' && masterData.regularUserAccount?.assignedGroups && masterData.regularUserAccount.assignedGroups.length > 0) {
        if (!masterData.regularUserAccount.assignedGroups.includes(log.group)) {
          return;
        }
      }
      uniqueEmployeesMap.set(log.employeeId, log.employeeName || 'Unknown Employee');
    }
  });
  const employeeIds = Array.from(uniqueEmployeesMap.keys()).sort();
  
  let groupOptions = Array.from(new Set(activityLogs.map((log) => log.group).filter(Boolean))).sort();
  if (loggedInUser?.role === 'user' && masterData.regularUserAccount?.assignedGroups && masterData.regularUserAccount.assignedGroups.length > 0) {
    groupOptions = groupOptions.filter(g => masterData.regularUserAccount?.assignedGroups?.includes(g));
  }

  const filteredLogs = activityLogs.filter((log) => {
    // 0. Only show filtered data for the logged-in user (unless in consolidated mode)
    if (!isConsolidated && log.employeeId !== currentUserInfo.id) return false;

    // Consolidated Filters
    if (isConsolidated) {
      if (loggedInUser?.role === 'user' && masterData.regularUserAccount?.assignedGroups && masterData.regularUserAccount.assignedGroups.length > 0) {
        if (!masterData.regularUserAccount.assignedGroups.includes(log.group)) return false;
      }
      if (filterEmployee !== 'All' && log.employeeId !== filterEmployee) return false;
      if (filterGroup !== 'All' && log.group !== filterGroup) return false;
    }

    // 1. Search Term Filter
    const term = searchTerm.toLowerCase();
    const statusStr = log.dateCompleted ? 'completed' : 'paused';
    const matchesSearch = searchTerm === '' || (
      log.id.toLowerCase().includes(term) ||
      log.date.toLowerCase().includes(term) ||
      statusStr.includes(term) ||
      log.bu.toLowerCase().includes(term) ||
      log.group.toLowerCase().includes(term) ||
      log.type.toLowerCase().includes(term) ||
      log.name.toLowerCase().includes(term) ||
      (log.referenceCode || '').toLowerCase().includes(term) ||
      (log.output || '').toLowerCase().includes(term) ||
      log.desc.toLowerCase().includes(term)
    );
    if (!matchesSearch) return false;

    // 2. Status Filter
    if (filterStatus !== 'All') {
      const isCompleted = !!log.dateCompleted;
      if (filterStatus === 'Completed' && !isCompleted) return false;
      if (filterStatus === 'Paused' && isCompleted) return false;
    }

    // 3. BU Filter
    if (filterBU !== 'All' && log.bu !== filterBU) return false;

    // 4. Type Filter
    if (filterType !== 'All' && log.type !== filterType) return false;

    // 5. Output Name Filter
    if (filterOutput !== 'All' && (log.output || '—') !== filterOutput) return false;

    // 6. Rework Filter
    if (filterRework !== 'All') {
      const isReworkStr = log.isRework ? 'Yes' : 'No';
      if (filterRework !== isReworkStr) return false;
    }

    // 7. Reporting Date Range
    if (filterReportingStart && log.date < filterReportingStart) return false;
    if (filterReportingEnd && log.date > filterReportingEnd) return false;

    // 8. Date Completed Range
    if (filterCompletedStart) {
      if (!log.dateCompleted || log.dateCompleted < filterCompletedStart) return false;
    }
    if (filterCompletedEnd) {
      if (!log.dateCompleted || log.dateCompleted > filterCompletedEnd) return false;
    }

    // 9. Activity Label / Category Filter
    if (filterActivityLabel !== 'All' && log.name !== filterActivityLabel) return false;

    // 10. Non-Core Category Filter
    if (filterNonCoreCategory !== 'All') {
      const rowNonCoreCat = getNonCoreCategory(log);
      if (rowNonCoreCat !== filterNonCoreCategory) return false;
    }

    return true;
  });

  const handleStartEdit = (row: ActivityLog) => {
    // If it's a sub-item, find the main item
    const targetLog = row.parentId
      ? (activityLogs.find((l) => l.id === row.parentId) || row)
      : row;

    setEditingLog(targetLog);
    setEditForm({
      date: targetLog.date || '',
      dateCompleted: targetLog.dateCompleted || '',
      bu: targetLog.bu || '',
      group: targetLog.group || '',
      type: targetLog.type || 'Core',
      desc: targetLog.desc || '',
      referenceCode: targetLog.referenceCode || '',
      output: (!targetLog.dateCompleted || targetLog.output === 'Continue later' || targetLog.output === 'Continue Later') ? '' : (targetLog.output || ''),
      volume: targetLog.volume !== undefined ? targetLog.volume : 1,
      isRework: targetLog.isRework || false,
      consideredAccurate: targetLog.consideredAccurate || false,
      remarks: targetLog.remarks || '',
      status: targetLog.dateCompleted ? 'Completed' : 'Paused',
      hours: targetLog.hours || 0,
    });

    // Smoothly scroll down to the editing container at the bottom
    setTimeout(() => {
      document.getElementById('edit-log-container')?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 150);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;

    const finalDateCompleted = editForm.status === 'Completed'
      ? (editForm.dateCompleted || new Date().toISOString().split('T')[0])
      : '';

    const updatedLog: ActivityLog = {
      ...editingLog,
      date: editForm.date,
      bu: editForm.bu,
      group: editForm.group,
      type: editForm.type,
      desc: editForm.desc,
      referenceCode: editForm.referenceCode,
      output: editForm.status === 'Paused' ? '' : editForm.output,
      volume: Number(editForm.volume),
      isRework: editForm.isRework,
      consideredAccurate: editForm.consideredAccurate,
      remarks: editForm.remarks,
      dateCompleted: finalDateCompleted,
      hours: Number(editForm.hours),
    };

    onUpdateLog(updatedLog);
    setEditingLog(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-fadeIn text-slate-900">
      {/* Header and Controls */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Database className={`h-4 w-4 ${isConsolidated ? 'text-indigo-600' : 'text-blue-600'}`} /> {isConsolidated ? 'Consolidated Group Activity Log History' : 'Activity Log History'}
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-x-2.5 gap-y-1 mt-0.5">
            <p className="text-xs text-slate-500">{isConsolidated ? 'Consolidated Multi-Employee Repository' : 'Historical Listing of Employee Activity Logs'}</p>
            <span className="hidden sm:inline text-slate-300 text-xs">|</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded border inline-flex items-center font-sans ${isConsolidated ? 'text-indigo-700 bg-indigo-50 border-indigo-250/50' : 'text-slate-700 bg-slate-100 border-slate-200'}`}>
              {isConsolidated ? 'Consolidated Channel: SharePoint Repository' : `${currentUserInfo.id}: ${currentUserInfo.name}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search activities..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-455 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-sm ${
              showFilters
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filters</span>
            {(() => {
              let count = 0;
              if (filterStatus !== 'All') count++;
              if (filterBU !== 'All') count++;
              if (filterType !== 'All') count++;
              if (filterOutput !== 'All') count++;
              if (filterRework !== 'All') count++;
              if (filterReportingStart || filterReportingEnd) count++;
              if (filterCompletedStart || filterCompletedEnd) count++;
              if (filterActivityLabel !== 'All') count++;
              if (filterNonCoreCategory !== 'All') count++;
              if (isConsolidated && filterEmployee !== 'All') count++;
              if (isConsolidated && filterGroup !== 'All') count++;
              return count > 0 ? (
                <span className={`ml-1 px-1.5 py-0.2 text-[9px] font-extrabold rounded-full ${showFilters ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                  {count}
                </span>
              ) : null;
            })()}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/60 animate-fadeIn grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-slate-900 border-t border-slate-100">
          {/* Employee Filter (Consolidated Mode Only) */}
          {isConsolidated && (
            <div className="border border-indigo-100 bg-indigo-50/30 p-2.5 rounded-xl">
              <label className="block text-[10px] font-bold text-indigo-650 uppercase tracking-wider mb-1.5">Employee Filter</label>
              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="w-full bg-white border border-indigo-200/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Employees</option>
                {employeeIds.map((id) => (
                  <option key={id} value={id}>
                    {id} - {uniqueEmployeesMap.get(id)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Group Filter (Consolidated Mode Only) */}
          {isConsolidated && (
            <div className="border border-indigo-100 bg-indigo-50/30 p-2.5 rounded-xl">
              <label className="block text-[10px] font-bold text-indigo-650 uppercase tracking-wider mb-1.5">Group Filter</label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="w-full bg-white border border-indigo-200/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Groups</option>
                {groupOptions.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filter 1: Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Paused">Paused</option>
            </select>
          </div>

          {/* Filter 2: Business Unit */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Business Unit</label>
            <select
              value={filterBU}
              onChange={(e) => setFilterBU(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All BUs</option>
              {buOptions.map((bu) => (
                <option key={bu} value={bu}>{bu}</option>
              ))}
            </select>
          </div>

          {/* Filter 3: Type */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Types</option>
              <option value="Core">Core</option>
              <option value="Non-Core">Non-Core</option>
            </select>
          </div>

          {/* Filter 4: Output Name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Output Name</label>
            <select
              value={filterOutput}
              onChange={(e) => setFilterOutput(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Outputs</option>
              {outputOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Filter 5: Rework? */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Rework?</label>
            <select
              value={filterRework}
              onChange={(e) => setFilterRework(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Options</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          {/* Filter 6: Activity Label / Category */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Activity Label / Category</label>
            <select
              value={filterActivityLabel}
              onChange={(e) => setFilterActivityLabel(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Labels</option>
              {labelOptions.map((label) => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
          </div>

          {/* Filter 7: Non-Core Category */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Non-Core Category</label>
            <select
              value={filterNonCoreCategory}
              onChange={(e) => setFilterNonCoreCategory(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Non-Core Categories</option>
              {nonCoreCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Spacer */}
          <div className="hidden lg:block"></div>

          {/* Filter 8: Reporting Date Range */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Reporting Date Range</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filterReportingStart}
                onChange={(e) => setFilterReportingStart(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-855 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-slate-400 text-xs font-semibold">to</span>
              <input
                type="date"
                value={filterReportingEnd}
                onChange={(e) => setFilterReportingEnd(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-855 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter 9: Date Completed Range */}
          <div className="sm:col-span-2 flex flex-col justify-between">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date Completed Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filterCompletedStart}
                  onChange={(e) => setFilterCompletedStart(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-855 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-slate-400 text-xs font-semibold">to</span>
                <input
                  type="date"
                  value={filterCompletedEnd}
                  onChange={(e) => setFilterCompletedEnd(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-855 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Reset Filters Trigger */}
          <div className="sm:col-span-full flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition border-none bg-transparent cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {/* Table Area */}
      <div className="overflow-x-auto">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <AlertCircle className="h-8 w-8 text-slate-300" />
            <p className="text-xs">No matching activity records found.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[1550px]">
            <thead>
              <tr className="bg-slate-100/65 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider font-mono whitespace-nowrap divide-x divide-slate-200">
                {isConsolidated ? (
                  <th className="px-4 py-3 text-center">Action</th>
                ) : (
                  <th className="px-4 py-3 text-center">Actions</th>
                )}
                <th className="px-4 py-3 text-center">Log ID</th>
                {isConsolidated && <th className="px-4 py-3 text-center">Employee</th>}
                <th className="px-4 py-3 text-center">Activity Label / Category</th>
                <th className="px-4 py-3 text-center">Non-Core Category</th>
                <th className="px-4 py-3 text-center">Description</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Reporting Date</th>
                <th className="px-4 py-3 text-center">Date Logged</th>
                <th className="px-4 py-3 text-center">Date Completed</th>
                <th className="px-4 py-3 text-center">Business Unit</th>
                <th className="px-4 py-3 text-center">Group</th>
                <th className="px-4 py-3 text-center">SLA Targets</th>
                <th className="px-4 py-3 text-center">Hours Logged</th>
                <th className="px-4 py-3 text-center">On Time</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-center">Ref Number</th>
                <th className="px-4 py-3 text-center">Output Name</th>
                <th className="px-4 py-3 text-center">Volume</th>
                <th className="px-4 py-3 text-center">Rework?</th>
                <th className="px-4 py-3 text-center">Considered Accurate</th>
                <th className="px-4 py-3 text-center">Remarks</th>
                <th className="px-4 py-3 text-center">Transaction Count</th>
                <th className="px-4 py-3 text-center">Completed Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                const matchingIds = new Set(filteredLogs.map(l => l.id));
                const parentsToShow = activityLogs.filter(l => !l.parentId && (matchingIds.has(l.id) || activityLogs.some(child => child.parentId === l.id && matchingIds.has(child.id))));
                
                return parentsToShow.flatMap(parent => {
                  const parentMatches = matchingIds.has(parent.id);
                  const children = activityLogs.filter(l => l.parentId === parent.id && (matchingIds.has(l.id) || parentMatches));
                  const isExpanded = expandedIds.includes(parent.id);
                  const hasChildren = activityLogs.some(l => l.parentId === parent.id);

                  const rows = [];
                  if (parentMatches || hasChildren) {
                    rows.push(renderRow(parent, false, hasChildren, isExpanded));
                  }
                  if (isExpanded) {
                    children.forEach(child => {
                      rows.push(renderRow(child, true, false, false));
                    });
                  }
                  return rows;
                });
              })()}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Form Container at the Bottom of the Table */}
      {editingLog && (
        <div id="edit-log-container" className="mt-8 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden text-slate-900 animate-fadeIn scroll-mt-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-blue-600" /> Edit Log Details
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Modify persistent row records for database row #{editingLog.id}</p>
            </div>
            <button
              type="button"
              onClick={() => setEditingLog(null)}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
            {/* Hours logged display/input */}
            {loggedInUser?.role === 'admin' ? (
              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 flex justify-between items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Hours Logged (Editable by Admin):</span>
                  <span className="text-[10px] text-slate-500">You can override the recorded time spent on this activity log.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.hours}
                    onChange={(e) => setEditForm({ ...editForm, hours: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-24 bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="text-xs font-semibold text-slate-600">hrs</span>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex justify-between items-center">
                <span className="text-xs font-medium text-blue-800">Hours Logged (Non-Editable):</span>
                <span className="text-sm font-mono font-bold text-blue-600">{editingLog.hours.toFixed(2)} hrs</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Reporting Date */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Reporting Date</label>
                <input
                  type="date"
                  value={editForm.date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  required
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Status</label>
                <select
                  value={editForm.status}
                  disabled={isOriginalPaused || isOriginalCompleted}
                  onChange={(e) => {
                    const statusVal = e.target.value as 'Completed' | 'Paused';
                    const defaultDate = statusVal === 'Completed' ? (editForm.dateCompleted || new Date().toISOString().split('T')[0]) : '';
                    setEditForm({
                      ...editForm,
                      status: statusVal,
                      dateCompleted: defaultDate
                    });
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-150"
                >
                  <option value="Completed">Completed</option>
                  <option value="Paused">Paused (Continue later)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date Completed */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Date Completed</label>
                <input
                  type="date"
                  value={editForm.dateCompleted}
                  disabled={isOriginalPaused || editForm.status === 'Paused'}
                  onChange={(e) => setEditForm({ ...editForm, dateCompleted: e.target.value })}
                  required={editForm.status === 'Completed'}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-150"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Type</label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value as 'Core' | 'Non-Core' })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Core">Core Operational</option>
                  <option value="Non-Core">Non-Core Admin</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Business Unit */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Business Unit</label>
                <select
                  value={editForm.bu}
                  onChange={(e) => setEditForm({ ...editForm, bu: e.target.value })}
                  required
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Select BU...</option>
                  {(masterData?.bu || []).map((bu) => (
                    <option key={bu} value={bu}>{bu}</option>
                  ))}
                </select>
              </div>

              {/* Group */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Group</label>
                <select
                  value={editForm.group}
                  disabled={isOriginalPaused || isOriginalCompleted}
                  onChange={(e) => setEditForm({ ...editForm, group: e.target.value })}
                  required
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-150"
                >
                  <option value="">Select Group...</option>
                  {(masterData?.group || []).map((grp) => (
                    <option key={grp.code} value={grp.code || grp.name}>{grp.name || grp.code}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Description</label>
              <textarea
                rows={2}
                value={editForm.desc}
                onChange={(e) => setEditForm({ ...editForm, desc: e.target.value })}
                required
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Enter activity description detail..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Ref Number */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ref Number</label>
                <input
                  type="text"
                  value={editForm.referenceCode}
                  onChange={(e) => setEditForm({ ...editForm, referenceCode: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Rework */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Rework?</label>
                <select
                  value={editForm.isRework ? 'Yes' : 'No'}
                  disabled={isOriginalPaused}
                  onChange={(e) => setEditForm({ ...editForm, isRework: e.target.value === 'Yes' })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-150"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {editForm.isRework && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 mt-6 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.consideredAccurate || false}
                      onChange={(e) => setEditForm({ ...editForm, consideredAccurate: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Considered Accurate</span>
                  </label>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Remarks</label>
                  <textarea
                    value={editForm.remarks || ''}
                    onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    rows={2}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Output Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Output Name</label>
                <input
                  type="text"
                  value={editForm.output}
                  disabled={isOriginalPaused}
                  onChange={(e) => setEditForm({ ...editForm, output: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-150"
                />
              </div>

              {/* Volume */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Volume</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.volume}
                  disabled={isOriginalPaused}
                  onChange={(e) => setEditForm({ ...editForm, volume: Math.max(0, parseFloat(e.target.value) || 0) })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-150"
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Check className="h-3.5 w-3.5" /> Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
