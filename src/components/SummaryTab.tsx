import { useState, useEffect } from 'react';
import { PieChart, AlertCircle } from 'lucide-react';
import { ActivityLog, MasterData, LeaveLog } from '../types';
import { formatNumber } from '../utils/format';

interface SummaryTabProps {
  activityLogs: ActivityLog[];
  leaveLogs: LeaveLog[];
  masterData: MasterData;
  loggedInUser?: { role: 'admin' | 'user'; username: string } | null;
  isConsolidated?: boolean;
}

export default function SummaryTab({ activityLogs, leaveLogs, masterData, loggedInUser, isConsolidated = false }: SummaryTabProps) {
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

  // Find all unique months present in activityLogs
  const uniqueMonths = Array.from(
    new Set(
      activityLogs
        .map((log) => (log.dateLogged || log.date || "").substring(0, 7))
        .filter((d) => d && d.length === 7)
    )
  ).sort().reverse();

  // 2. Month Filter State
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return uniqueMonths.length > 0 ? uniqueMonths[0] : currentMonthStr;
  });

  // 3. Filter Level: 'week' | 'month'
  const [timeDimension, setTimeDimension] = useState<'week' | 'month'>('week');

  // Calculate Weeks of Selected Month (Monday to Sunday)
  const getWeeksOfMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const weeks: { start: string; end: string; label: string; dates: string[] }[] = [];
    
    let current = new Date(firstDay);
    // Adjust to Monday
    let dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday...
    let diff = current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    let monday = new Date(current.setDate(diff));

    while (monday <= lastDay) {
      const datesOfThisWeek: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const formatted = d.toISOString().split('T')[0];
        datesOfThisWeek.push(formatted);
      }
      
      const wStart = datesOfThisWeek[0];
      const wEnd = datesOfThisWeek[6];
      const startFormatted = new Date(wStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endFormatted = new Date(wEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      weeks.push({
        start: wStart,
        end: wEnd,
        label: `${startFormatted} – ${endFormatted}`,
        dates: datesOfThisWeek
      });

      monday.setDate(monday.getDate() + 7);
    }

    return weeks;
  };

  const weeks = getWeeksOfMonth(selectedMonth);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0);

  // Consolidated filter states
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('All');

  // Sync selected week index when month changes
  useEffect(() => {
    setSelectedWeekIndex(0);
  }, [selectedMonth]);

  const activeWeek = weeks[selectedWeekIndex] || weeks[0];
  const activeDates = activeWeek ? activeWeek.dates : [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Helper to generate all dates of a selected month
  const getDatesOfMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const dates: string[] = [];
    while (date.getMonth() === month - 1) {
      dates.push(date.toISOString().split('T')[0]);
      date.setDate(date.getDate() + 1);
    }
    return dates;
  };

  // Standard Expected Metrics
  const standardDays = masterData.workingDays || ['mon', 'tue', 'wed', 'thu', 'fri'];
  const standardHoursPerDay = masterData.workingHours !== undefined ? masterData.workingHours : 8;

  // Determine active period dates (either weeks dates or month dates)
  const periodDates = timeDimension === 'week' ? activeDates : getDatesOfMonth(selectedMonth);

  // Group and employee select lists computed from all available activityLogs
  let groupsList = Array.from(new Set(activityLogs.map((log) => log.group).filter(Boolean))).sort();
  if (loggedInUser?.role === 'user' && masterData.regularUserAccount?.assignedGroups && masterData.regularUserAccount.assignedGroups.length > 0) {
    groupsList = groupsList.filter(g => masterData.regularUserAccount?.assignedGroups?.includes(g));
  }

  const uniqueEmployeesMap = new Map<string, string>();
  activityLogs.forEach((log) => {
    if (log.employeeId) {
      if (loggedInUser?.role === 'user' && masterData.regularUserAccount?.assignedGroups && masterData.regularUserAccount.assignedGroups.length > 0) {
        if (!masterData.regularUserAccount.assignedGroups.includes(log.group)) {
          return;
        }
      }
      if (selectedGroup === 'All' || log.group === selectedGroup) {
        uniqueEmployeesMap.set(log.employeeId, log.employeeName || 'Unknown Employee');
      }
    }
  });
  const employeeIds = Array.from(uniqueEmployeesMap.keys()).sort();

  // Filter logs for the selected employee and active dates (unless consolidated)
  const employeeLogs = activityLogs.filter((log) => {
    if (!isConsolidated) {
      return log.employeeId === currentUserInfo.id;
    }
    if (loggedInUser?.role === 'user' && masterData.regularUserAccount?.assignedGroups && masterData.regularUserAccount.assignedGroups.length > 0) {
      if (!masterData.regularUserAccount.assignedGroups.includes(log.group)) return false;
    }
    if (selectedGroup !== 'All' && log.group !== selectedGroup) return false;
    if (selectedEmployee !== 'All' && log.employeeId !== selectedEmployee) return false;
    return true;
  });

  const parentIdsWithChildren = new Set(activityLogs.filter(l => !!l.parentId).map(l => l.parentId as string));

  const periodLogs = employeeLogs.filter((log) => {
    // Only include session-level items (sub-logs OR main logs that were never continued on other days)
    // to ensure daily attribution is correct and avoids double-counting the main log total.
    const isSessionItem = log.parentId || !parentIdsWithChildren.has(log.id);
    if (!isSessionItem) return false;

    const d = log.dateLogged || log.date;
    return periodDates.includes(d);
  });

  // Filter leave logs for the selected employee
  const relevantLeaveLogs = leaveLogs.filter((log) => {
    if (!isConsolidated) {
      return log.employeeId === currentUserInfo.id;
    }
    // For consolidated, we might need to filter by group if LeaveLog had group info
    // But currently LeaveLog doesn't have group. If isConsolidated and employee is All,
    // we might want all leave logs, otherwise filter by selected employee.
    if (selectedEmployee !== 'All' && log.employeeId !== selectedEmployee) return false;
    return true;
  });

  // Auto-detect approved leave days (from activity logs)
  const checkIsHoliday = (date: string) => {
    return (masterData.holidays || []).some(h => h.date === date);
  };

  const checkIsLeaveDay = (date: string) => {
    // Check traditional activity logs first
    const logsOnDay = employeeLogs.filter(log => log.date === date);
    const leaveHours = logsOnDay
      .filter(log => log.name.toLowerCase().includes('leave') || log.name.toLowerCase().includes('pto') || log.desc.toLowerCase().includes('leave') || log.desc.toLowerCase().includes('pto'))
      .reduce((sum, log) => sum + log.hours, 0);
    
    if (leaveHours >= (standardHoursPerDay / 2)) return true;

    // Check new leave logs
    const dayLeaveLogs = relevantLeaveLogs.filter(l => l.date === date && l.category === 'Leave');
    if (dayLeaveLogs.some(l => l.period === 'Whole Day')) return true;
    
    return false;
  };

  // Calculate deduction hours from LeaveLog entries
  const getDeductionHours = (date: string) => {
    const dayLogs = relevantLeaveLogs.filter(l => l.date === date);
    let totalDeduction = 0;

    dayLogs.forEach(log => {
      if (log.category === 'Leave') {
        if (log.period === 'Whole Day') {
          totalDeduction = standardHoursPerDay;
        } else if (log.period === 'AM' || log.period === 'PM') {
          totalDeduction += (standardHoursPerDay / 2);
        }
      } else if (log.category === 'Official Business' || log.category === 'Undertime') {
        totalDeduction += (log.hours || 0);
      }
    });

    return Math.min(totalDeduction, standardHoursPerDay);
  };

  // Group Core activities for rows
  const coreLogs = periodLogs.filter((log) => log.type === 'Core');
  const uniqueCoreActivities = Array.from(new Set(coreLogs.map((log) => log.name))).sort();

  const coreRows = uniqueCoreActivities.map((actName) => {
    const dailyHours = periodDates.map((date) => {
      const logsForDay = coreLogs.filter((log) => log.name === actName && log.date === date);
      return logsForDay.reduce((sum, log) => sum + log.hours, 0);
    });
    const total = dailyHours.reduce((sum, hrs) => sum + hrs, 0);
    return { name: actName, dailyHours, total };
  });

  // Row Calculations
  const coreDailyTotals = periodDates.map((_, dayIndex) => {
    return coreRows.reduce((sum, row) => sum + row.dailyHours[dayIndex], 0);
  });
  const coreTotalAll = coreDailyTotals.reduce((sum, h) => sum + h, 0);

  const nonCoreLogs = periodLogs.filter((log) => log.type === 'Non-Core');
  const nonCoreDailyHours = periodDates.map((date) => {
    const logsForDay = nonCoreLogs.filter((log) => log.date === date);
    return logsForDay.reduce((sum, log) => sum + log.hours, 0);
  });
  const nonCoreTotalAll = nonCoreDailyHours.reduce((sum, h) => sum + h, 0);

  const aggregateDailyHours = periodDates.map((_, dayIndex) => {
    return coreDailyTotals[dayIndex] + nonCoreDailyHours[dayIndex];
  });
  const aggregateTotalAll = aggregateDailyHours.reduce((sum, h) => sum + h, 0);

  // Idle Time Row (standardExpectedHours - actualLoggedHours)
  const idleDailyHours = periodDates.map((date, dayIndex) => {
    const d = new Date(date);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    
    // Non-operational days are exempt
    const isWorkingDay = standardDays.includes(dayName);
    const isHoliday = checkIsHoliday(date);
    if (!isWorkingDay || isHoliday) return 0;

    const isLeave = checkIsLeaveDay(date);
    const deduction = getDeductionHours(date);

    if (isLeave || deduction >= standardHoursPerDay) {
      return 0;
    }
    
    const adjustedExpected = standardHoursPerDay - deduction;
    const logged = aggregateDailyHours[dayIndex];
    const idle = adjustedExpected - logged;
    return idle > 0 ? idle : 0;
  });
  const idleTotalAll = idleDailyHours.reduce((sum, h) => sum + h, 0);

  // Output Volume Row
  const outputDailyVolume = periodDates.map((date) => {
    const logsForDay = coreLogs.filter((log) => log.date === date);
    return logsForDay.reduce((sum, log) => sum + (Number(log.volume) || 0), 0);
  });
  const outputTotalAll = outputDailyVolume.reduce((sum, v) => sum + v, 0);

  // REWORK HOURS calculation
  const reworkDailyHours = periodDates.map((date) => {
    const logsForDay = periodLogs.filter((log) => log.date === date && log.isRework === true);
    return logsForDay.reduce((sum, log) => sum + log.hours, 0);
  });
  const reworkTotalHoursAll = reworkDailyHours.reduce((sum, h) => sum + h, 0);

  // Rework Volume calculation (total count of activity items tagged as "Yes" on "REWORK")
  const reworkDailyVolume = periodDates.map((date) => {
    const logsForDay = periodLogs.filter((log) => log.date === date && log.isRework === true);
    return logsForDay.length;
  });
  const reworkTotalVolumeAll = reworkDailyVolume.reduce((sum, v) => sum + v, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-fadeIn max-w-none w-full text-slate-900">
      {/* Top Controls Header */}
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <PieChart className={`h-4 w-4 ${isConsolidated ? 'text-indigo-600' : 'text-blue-600'}`} /> {isConsolidated ? 'Consolidated Group Analytics Summary Report' : 'Individual Analytics Summary Report'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isConsolidated ? 'Weekly/Monthly group-level aggregated core & non-core time logs, idle time, and output volume breakdowns.' : 'Weekly/Monthly Core & Non-Core time logs, idle time, and output volume breakdowns.'}
          </p>
        </div>

        {/* Filters Grid */}
        <div className="flex flex-wrap items-center gap-4">
          {isConsolidated ? (
            <>
              {/* Group Scope Dropdown */}
              <div className="flex flex-col">
                <label className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 mb-1 flex items-center gap-1">
                  Group Scope
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => {
                    setSelectedGroup(e.target.value);
                    setSelectedEmployee('All'); // Reset employee selection when group changes
                  }}
                  className="bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs font-bold text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm cursor-pointer"
                >
                  <option value="All">All Groups</option>
                  {groupsList.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Employee Filter */}
              <div className="flex flex-col">
                <label className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 mb-1 flex items-center gap-1">
                  Employee Filter
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs font-bold text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm cursor-pointer"
                >
                  <option value="All">All Employees</option>
                  {employeeIds.map((id) => (
                    <option key={id} value={id}>
                      {id} - {uniqueEmployeesMap.get(id)}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            /* Employee Select */
            <div className="flex flex-col">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                Employee Profile
              </label>
              <div className="border border-indigo-100 bg-indigo-50 text-indigo-700 rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                {currentUserInfo.id}: {currentUserInfo.name}
              </div>
            </div>
          )}

          {/* Time Dimension Selector */}
          <div className="flex flex-col">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Filter Level
            </label>
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/60">
              <button
                type="button"
                onClick={() => setTimeDimension('week')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  timeDimension === 'week'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setTimeDimension('month')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  timeDimension === 'month'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Month Select */}
          <div className="flex flex-col">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Reporting Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {uniqueMonths.length > 0 ? (
                uniqueMonths.map((m) => {
                  const [yr, mn] = m.split('-');
                  const monthName = new Date(Number(yr), Number(mn) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  return (
                    <option key={m} value={m}>
                      {monthName}
                    </option>
                  );
                })
              ) : (
                <option value={currentMonthStr}>Current Month</option>
              )}
            </select>
          </div>

          {/* Week Select */}
          <div className="flex flex-col">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Reporting Week</label>
            <select
              value={selectedWeekIndex}
              onChange={(e) => setSelectedWeekIndex(Number(e.target.value))}
              disabled={weeks.length === 0 || timeDimension === 'month'}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {weeks.map((wk, idx) => (
                <option key={idx} value={idx}>
                  Week {idx + 1} ({wk.label})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      {periodDates.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-100/65 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider font-mono whitespace-nowrap">
                <th className="px-6 py-4">Activity (Core Only)</th>
                {periodDates.map((date) => {
                  const d = new Date(date);
                  const dateNum = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const isLeave = checkIsLeaveDay(date);
                  const isHoliday = checkIsHoliday(date);
                  const holiday = masterData.holidays?.find(h => h.date === date);
                  const deduction = getDeductionHours(date);
                  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                  return (
                    <th key={date} className="px-4 py-4 text-center">
                      <div className="font-bold">{dayName}</div>
                      <div className="text-[9px] text-slate-400 font-normal mt-0.5">{dateNum}</div>
                      {isHoliday && (
                        <span className="block mt-1 text-[8px] bg-indigo-100 text-indigo-800 rounded px-1 py-0.2 mx-auto font-bold w-max" title={holiday?.name}>
                          HOLIDAY
                        </span>
                      )}
                      {(isLeave || deduction > 0) && (
                        <span className="block mt-1 text-[8px] bg-amber-150 text-amber-800 rounded px-1 py-0.2 mx-auto font-bold w-max">
                          {deduction > 0 ? `-${deduction}h ADJ` : 'LEAVE DEDUCTION'}
                        </span>
                      )}
                    </th>
                  );
                })}
                <th className="px-6 py-4 text-right">Tallied Totals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Core rows */}
              {coreRows.length > 0 ? (
                coreRows.map((row) => (
                  <tr key={row.name} className="hover:bg-slate-50/70 border-b border-slate-150 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-800 flex flex-col">
                      <span>{row.name}</span>
                      <span className="text-[9px] font-bold text-blue-600 font-mono uppercase tracking-wider mt-0.5 bg-blue-50 border border-blue-100 rounded-md px-1.5 py-0.2 w-max">Core</span>
                    </td>
                    {row.dailyHours.map((hours, dayIdx) => (
                      <td key={dayIdx} className="px-4 py-4 text-xs text-center font-mono text-slate-600">
                        {hours > 0 ? `${formatNumber(hours)} hrs` : '—'}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-xs text-right font-mono font-bold text-slate-900">
                      {row.total > 0 ? `${formatNumber(row.total)} hrs` : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={periodDates.length + 2} className="px-6 py-8 text-center text-xs text-slate-450 italic">
                    No Core operational activities logged for this period.
                  </td>
                </tr>
              )}

              {/* TALLIED CORE TOTALS ROW */}
              <tr className="bg-blue-50/20 border-b-2 border-blue-100 font-semibold text-slate-800">
                <td className="px-6 py-4 text-xs font-bold text-blue-900 uppercase">
                  Tallied Core Totals
                </td>
                {coreDailyTotals.map((total, idx) => (
                  <td key={idx} className="px-4 py-4 text-xs text-center font-mono font-bold text-blue-700">
                    {total > 0 ? `${formatNumber(total)} hrs` : '—'}
                  </td>
                ))}
                <td className="px-6 py-4 text-xs text-right font-mono font-bold text-blue-800 bg-blue-50/50">
                  {coreTotalAll > 0 ? `${formatNumber(coreTotalAll)} hrs` : '—'}
                </td>
              </tr>

              {/* NON-CORE TOTAL HOURS ROW */}
              <tr className="bg-purple-50/15 border-b border-purple-100 font-medium text-slate-700">
                <td className="px-6 py-4 text-xs font-bold text-purple-900 uppercase">
                  Non-Core Total Hours
                </td>
                {nonCoreDailyHours.map((hours, idx) => (
                  <td key={idx} className="px-4 py-4 text-xs text-center font-mono font-bold text-purple-600">
                    {hours > 0 ? `${formatNumber(hours)} hrs` : '—'}
                  </td>
                ))}
                <td className="px-6 py-4 text-xs text-right font-mono font-bold text-purple-800 bg-purple-50/30">
                  {nonCoreTotalAll > 0 ? `${formatNumber(nonCoreTotalAll)} hrs` : '—'}
                </td>
              </tr>

              {/* AGGREGATE TOTAL ROW */}
              <tr className="bg-slate-100/40 border-b-2 border-slate-200 font-bold text-slate-900">
                <td className="px-6 py-4 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Aggregate Total
                </td>
                {aggregateDailyHours.map((hours, idx) => (
                  <td key={idx} className="px-4 py-4 text-xs text-center font-mono font-extrabold text-slate-950">
                    {hours > 0 ? `${formatNumber(hours)} hrs` : '—'}
                  </td>
                ))}
                <td className="px-6 py-4 text-xs text-right font-mono font-extrabold text-slate-950 bg-slate-100">
                  {aggregateTotalAll > 0 ? `${formatNumber(aggregateTotalAll)} hrs` : '—'}
                </td>
              </tr>

              {/* IDLE TIME ROW */}
              <tr className="bg-amber-50/15 border-b border-amber-100 text-slate-700" id="summary-idle-time-row">
                <td className="px-6 py-4 text-xs font-bold text-amber-800 uppercase flex flex-col">
                  <span>Idle Time</span>
                  <span className="text-[9px] font-normal text-slate-400 font-mono mt-0.5 normal-case">
                    Expected: {standardHoursPerDay}h/day on working days
                  </span>
                </td>
                {idleDailyHours.map((hours, idx) => (
                  <td key={idx} className="px-4 py-4 text-xs text-center font-mono font-bold text-amber-600">
                    {hours > 0 ? `${formatNumber(hours)} hrs` : '0.00 hrs'}
                  </td>
                ))}
                <td className="px-6 py-4 text-xs text-right font-mono font-bold text-amber-700 bg-amber-50/30">
                  {idleTotalAll > 0 ? `${formatNumber(idleTotalAll)} hrs` : '0.00 hrs'}
                </td>
              </tr>

              {/* REWORK HOURS ROW */}
              <tr className="bg-rose-50/15 border-b border-rose-100 text-slate-700" id="summary-rework-hours-row">
                <td className="px-6 py-4 text-xs font-bold text-rose-800 uppercase">
                  REWORK HOURS
                </td>
                {reworkDailyHours.map((hours, idx) => (
                  <td key={idx} className="px-4 py-4 text-xs text-center font-mono font-bold text-rose-600">
                    {hours > 0 ? `${formatNumber(hours)} hrs` : '—'}
                  </td>
                ))}
                <td className="px-6 py-4 text-xs text-right font-mono font-bold text-rose-700 bg-rose-50/30">
                  {reworkTotalHoursAll > 0 ? `${formatNumber(reworkTotalHoursAll)} hrs` : '—'}
                </td>
              </tr>

              {/* OUTPUT VOLUME ROW */}
              <tr className="bg-emerald-50/10 border-b border-emerald-50 text-slate-700" id="summary-output-volume-row">
                <td className="px-6 py-4 text-xs font-bold text-emerald-800 uppercase">
                  Output Volume
                </td>
                {outputDailyVolume.map((volume, idx) => (
                  <td key={idx} className="px-4 py-4 text-xs text-center font-mono font-bold text-emerald-600">
                    {volume > 0 ? `${formatNumber(volume)} units` : '—'}
                  </td>
                ))}
                <td className="px-6 py-4 text-xs text-right font-mono font-bold text-emerald-700 bg-emerald-50/20">
                  {outputTotalAll > 0 ? `${formatNumber(outputTotalAll)} units` : '—'}
                </td>
              </tr>

              {/* REWORK VOLUME ROW */}
              <tr className="bg-rose-50/5 text-slate-700" id="summary-rework-volume-row">
                <td className="px-6 py-4 text-xs font-bold text-rose-800 uppercase">
                  Rework Volume
                </td>
                {reworkDailyVolume.map((volume, idx) => (
                  <td key={idx} className="px-4 py-4 text-xs text-center font-mono font-bold text-rose-600">
                    {volume > 0 ? `${volume} items` : '—'}
                  </td>
                ))}
                <td className="px-6 py-4 text-xs text-right font-mono font-bold text-rose-700 bg-rose-50/10">
                  {reworkTotalVolumeAll > 0 ? `${reworkTotalVolumeAll} items` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <AlertCircle className="h-8 w-8 text-slate-300" />
          <p className="text-xs">No active calendar dates found for the selected period.</p>
        </div>
      )}
    </div>
  );
}
