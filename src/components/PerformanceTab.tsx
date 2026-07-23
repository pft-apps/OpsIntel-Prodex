import { useState, useEffect } from 'react';
import { Gauge, AlertCircle, Clock, TrendingUp, Coffee, Zap, Calendar, Info, ShieldCheck, Hourglass, Target, Percent, Download } from 'lucide-react';
import { ActivityLog, MasterData, LeaveLog } from '../types';
import { jsPDF } from 'jspdf';

interface PerformanceTabProps {
  activityLogs: ActivityLog[];
  leaveLogs: LeaveLog[];
  masterData: MasterData;
  loggedInUser?: { role: 'admin' | 'user'; username: string } | null;
  isConsolidated?: boolean;
}

export default function PerformanceTab({ activityLogs, leaveLogs, masterData, loggedInUser, isConsolidated = false }: PerformanceTabProps) {
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
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // 3. Time Dimension State: 'daily' | 'week' | 'month' | 'range'
  const [timeDimension, setTimeDimension] = useState<'daily' | 'week' | 'month' | 'range'>('month');

  // 4. Daily and Range Date State
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (activityLogs.length > 0) {
      const sortedDates = activityLogs
        .map(log => log.dateLogged || log.date)
        .filter(d => d && d.length === 10)
        .sort((a, b) => b.localeCompare(a));
      if (sortedDates.length > 0) {
        return sortedDates[0];
      }
    }
    return todayStr;
  });
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: todayStr, end: todayStr });

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

  // 5. Dropdown Selector State for Custom Non-Core Activity KPI Card (using Categories)
  const [selectedNonCoreCategory, setSelectedNonCoreCategory] = useState<string>(() => {
    const list = masterData.nonCoreActivity || [];
    const uniqueCats = Array.from(new Set(list.map((item) => item.category))).filter(Boolean).sort();
    return uniqueCats.length > 0 ? uniqueCats[0] : '';
  });

  // Sync selected week index when month changes
  useEffect(() => {
    setSelectedWeekIndex(0);
  }, [selectedMonth]);

  const activeWeek = weeks[selectedWeekIndex] || weeks[0];
  const activeDates = activeWeek ? activeWeek.dates : [];

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

  const getDatesInRange = (start: string, end: string) => {
    const dates: string[] = [];
    const date = new Date(start);
    const endDate = new Date(end);
    while (date <= endDate) {
      dates.push(date.toISOString().split('T')[0]);
      date.setDate(date.getDate() + 1);
    }
    return dates;
  };

  // Standard Expected Metrics
  const standardDays = masterData.workingDays || ['mon', 'tue', 'wed', 'thu', 'fri'];
  const uniqueNonCoreCategories = Array.from(
    new Set((masterData.nonCoreActivity || []).map((item) => item.category))
  ).filter(Boolean).sort();
  const standardHoursPerDay = masterData.workingHours !== undefined ? masterData.workingHours : 8;

  // Consolidated filter states
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('All');
  const [excludeRework, setExcludeRework] = useState<boolean>(false);

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

  // Determine active dates based on selected time dimension
  const periodDates = 
    timeDimension === 'daily'
      ? [selectedDate]
      : timeDimension === 'week'
        ? activeDates
        : timeDimension === 'month'
          ? getDatesOfMonth(selectedMonth)
          : getDatesInRange(dateRange.start, dateRange.end);

  // Helper to check if a specific date falls within the selected period
  const isDateInPeriod = (dateStr: string | undefined): boolean => {
    if (!dateStr) return false;
    const dateOnly = dateStr.split('T')[0];
    if (timeDimension === 'daily') {
      return dateOnly === selectedDate;
    } else if (timeDimension === 'week') {
      return activeDates.includes(dateOnly);
    } else if (timeDimension === 'month') {
      return (dateOnly || "").substring(0, 7) === selectedMonth;
    } else if (timeDimension === 'range') {
      return dateOnly >= dateRange.start && dateOnly <= dateRange.end;
    }
    return false;
  };

  // Filter logs for the selected employee (unless consolidated)
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

  const parentIdsWithChildren = new Set(employeeLogs.filter(l => !!l.parentId).map(l => l.parentId as string));

  // Filter logs for the selected period (Daily, Week, or Month)
  const periodLogs = employeeLogs.filter((log) => {
    // Only include session-level items to avoid double-counting totals
    const isSessionItem = log.parentId || !parentIdsWithChildren.has(log.id);
    if (!isSessionItem) return false;
    
    return isDateInPeriod(log.dateLogged || log.date);
  });

  // Filter leave logs for the selected employee
  const relevantLeaveLogs = leaveLogs.filter((log) => {
    if (!isConsolidated) {
      return log.employeeId === currentUserInfo.id;
    }
    if (selectedEmployee !== 'All' && log.employeeId !== selectedEmployee) return false;
    return true;
  });

  // Auto-detect approved leave days (from activity logs)
  const checkIsLeaveDay = (date: string) => {
    // Check traditional activity logs first
    const logsOnDay = employeeLogs.filter(log => (log.dateLogged || log.date) === date);
    const leaveHours = logsOnDay
      .filter(log => log.name.toLowerCase().includes('leave') || log.name.toLowerCase().includes('pto') || log.desc.toLowerCase().includes('leave') || log.desc.toLowerCase().includes('pto'))
      .reduce((sum, log) => sum + log.hours, 0);
    
    if (leaveHours >= (standardHoursPerDay / 2)) return true;

    // Check new leave logs
    const dayLeaveLogs = relevantLeaveLogs.filter(l => l.date === date && l.category === 'Leave');
    if (dayLeaveLogs.some(l => l.period === 'Whole Day')) return true;
    
    return false;
  };

  // KPI INPUTS CALCULATIONS:
  // Date Filter references for these KPI Cards now are based on sub items on the "Activity Log History" if the main item has no sub item, it uses the main item instead.
  const periodMainLogs = employeeLogs.filter((log) => !log.parentId).filter((mainLog) => {
    const subItems = employeeLogs.filter((l) => l.parentId === mainLog.id);
    if (subItems.length > 0) {
      // It has sub items: check if any sub item falls within the period
      return subItems.some((sub) => isDateInPeriod(sub.dateLogged || sub.date));
    } else {
      // It has no sub items: check if the main item itself falls within the period
      return isDateInPeriod(mainLog.dateLogged || mainLog.date);
    }
  });

  // 1. Total Hours Logged (Core + Non-Core) - includes all sessions (main + sub)
  const totalHoursLogged = periodLogs.reduce((sum, log) => sum + log.hours, 0);

  // 2. Output (Total Volume) - computes only for main items
  const totalOutputVolume = periodMainLogs.reduce((sum, log) => sum + (Number(log.volume) || 0), 0);

  // Total of the Transaction Count: higher number between 1 or the Volume of each log - computes only for main items
  const totalTransactionCount = periodMainLogs.reduce((sum, log) => sum + Math.max(1, Number(log.volume) || 0), 0);

  // 3. Core Hours Logged Only - includes all sessions
  const coreHoursLogged = periodLogs.filter(log => log.type === 'Core').reduce((sum, log) => sum + log.hours, 0);

  // Rework Hours logged (includes all sessions)
  const reworkHoursLogged = periodLogs.filter(log => log.isRework === true).reduce((sum, log) => sum + log.hours, 0);

  // Effective Core Hours depending on the "Exclude Rework" switch
  const effectiveCoreHours = excludeRework ? Math.max(0, coreHoursLogged - reworkHoursLogged) : coreHoursLogged;

  // 4. Non-Core Hours Logged Only - includes all sessions
  const nonCoreHoursLogged = periodLogs.filter(log => log.type === 'Non-Core').reduce((sum, log) => sum + log.hours, 0);

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

  // 5. Count of Working Days (C) - Modified to be adjusted by partial deductions
  const workingDaysInPeriod = periodDates.filter((date) => {
    const d = new Date(date);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    const isWorkingDay = standardDays.includes(dayName);
    if (!isWorkingDay) return false;

    const isHoliday = (masterData.holidays || []).some(h => h.date === date);
    if (isHoliday) return false;

    const isLeave = checkIsLeaveDay(date);
    const deduction = getDeductionHours(date);
    
    // If it's a full leave day, it's NOT a working day for the count
    if (isLeave || deduction >= standardHoursPerDay) return false;
    
    return true;
  });
  const countOfWorkingDays = workingDaysInPeriod.length;

  // 6. Expected Hours (Adjusted for OB and Undertime deductions)
  const expectedHours = periodDates.reduce((sum, date) => {
    const d = new Date(date);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    if (!standardDays.includes(dayName)) return sum;

    const isHoliday = (masterData.holidays || []).some(h => h.date === date);
    if (isHoliday) return sum;

    const isLeave = checkIsLeaveDay(date);
    if (isLeave) return sum;

    const deduction = getDeductionHours(date);
    return sum + (standardHoursPerDay - deduction);
  }, 0);

  // 7. Total SLA Targets - computes only for main items
  const totalSlaTargets = periodMainLogs.reduce((sum, log) => {
    if (log.type !== 'Core') return sum;
    const matchedOutput = (masterData.serviceOutput || []).find(
      (o) => o.name === log.output || o.code === log.output
    );
    const target = matchedOutput && matchedOutput.slaTarget !== undefined ? matchedOutput.slaTarget : 0;
    const volume = log.volume !== undefined ? log.volume : 0;
    return sum + (target * volume);
  }, 0);

  // KPI CALCULATIONS FORMULAS:
  // KPI 1. Average Handling Time (mins) = computed as: A / B *60, Where A = Total Hours Logged, B = Output (Total Volume)
  const avgHandlingTime = totalOutputVolume > 0 ? (totalHoursLogged / totalOutputVolume) * 60 : 0;

  // KPI 2. Productivity = Computed as A / (B * C), Where A = Total Hours Logged (Core Activities Only), B = Working Hours, C = Count of Working Days
  const adjustedWorkingDays = standardHoursPerDay > 0 ? expectedHours / standardHoursPerDay : 0;
  const productivity = expectedHours > 0 ? (effectiveCoreHours / expectedHours) : 0;

  // KPI 3. Idle Time = computed as 1 - [A / (B * C)], Where A = Aggregate Total Hours (Core and Non-Core), B = Working Hours, C = Count of Working Days
  const idleTimeVal = expectedHours > 0 ? 1 - (totalHoursLogged / expectedHours) : 0;
  const idleTimeClamped = idleTimeVal < 0 ? 0 : idleTimeVal;

  // KPI 4. Efficiency = computed as A / B, Where A = Output (Total Volume), B = Total SLA Targets
  const efficiency = totalSlaTargets > 0 ? (totalOutputVolume / totalSlaTargets) : 0;

  // KPI 5. Completeness = computed as A / B, Where A = Total "Completed Count", B = Total "Transaction Count"
  // For Completeness and Accuracy Completed Output, date filter reference for both A and B should be the Reporting Date (which is periodLogs)
  const getRowCompletedCount = (log: ActivityLog) => {
    if (!log.dateCompleted) return 0;
    
    // Determine the reporting date for this row (supporting sub-item inheritance)
    const parentLog = log.parentId ? activityLogs.find(l => l.id === log.parentId) : undefined;
    const reportingDate = parentLog ? parentLog.date : log.date;

    // Use the maximum date in periodDates as the period end
    const periodEnd = periodDates.length > 0 ? periodDates[periodDates.length - 1] : reportingDate;

    if (log.dateCompleted > periodEnd) {
      return 0;
    }
    return log.volume !== undefined ? Number(log.volume) : 0;
  };

  const totalCompletedCount = periodMainLogs.reduce((sum, log) => sum + getRowCompletedCount(log), 0);
  const completeness = totalTransactionCount > 0 ? (totalCompletedCount / totalTransactionCount) : 0;

  // KPI 7. Accuracy = (A - B) / A, Where A = Total "Completed Count", B = total count of "Rework" that is tagged "Yes" AND "Considered Accurate" is not "Yes"
  const reworkCount = periodMainLogs.filter((log) => !!log.isRework && !log.consideredAccurate).length;
  const accuracy = totalCompletedCount > 0 ? (totalCompletedCount - reworkCount) / totalCompletedCount : 0;

  // KPI 6. Timeliness = A / B, Where A = Total Count of "On Time" that is tagged as "Yes", B = Total "Completed Count"
  const totalOnTimeYesCount = periodMainLogs.filter((log) => {
    const isCompleted = !!log.dateCompleted;
    if (!isCompleted) return false;

    if (log.type !== 'Core') return false;
    const matchedOutput = (masterData.serviceOutput || []).find(
      (o) => o.name === log.output || o.code === log.output
    );
    if (!matchedOutput) return false;
    const target = matchedOutput.slaTarget !== undefined ? matchedOutput.slaTarget : 0;
    const volume = log.volume !== undefined ? log.volume : 0;
    const computedSla = target * volume;
    return computedSla < log.hours;
  }).length;
  const timeliness = totalCompletedCount > 0 ? (totalOnTimeYesCount / totalCompletedCount) : 0;

  // KPI 9. Custom Non-Core Activity Metric: (A - B) / (C * D)
  const selectedCategoryHours = periodLogs
    .filter((log) => {
      if (log.type !== 'Non-Core') return false;
      const matched = (masterData.nonCoreActivity || []).find((item) => item.name === log.name);
      return matched ? matched.category === selectedNonCoreCategory : false;
    })
    .reduce((sum, log) => sum + log.hours, 0);

  const workingHoursDenominator = standardHoursPerDay * countOfWorkingDays;
  const nonCoreMetric = workingHoursDenominator > 0 ? (nonCoreHoursLogged - selectedCategoryHours) / workingHoursDenominator : 0;

  // Format dates for display
  const startDateStr = periodDates.length > 0 ? new Date(periodDates[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const endDateStr = periodDates.length > 0 ? new Date(periodDates[periodDates.length - 1]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  // Export dynamically calculated KPIs to PDF (including standard + Non-Core Categories separate KPIs)
  const handleExportToPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let currentY = 15;

    // Helper to draw custom vector icons matching the UI
    const drawPdfVectorIcon = (
      pdf: any,
      iconType: string,
      cx: number,
      cy: number,
      primaryColor: [number, number, number]
    ) => {
      pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.setLineWidth(0.4);

      if (iconType === 'clock') {
        pdf.circle(cx, cy, 2.5, 'S');
        pdf.line(cx, cy, cx, cy - 1.5);
        pdf.line(cx, cy, cx + 1.2, cy);
      } else if (iconType === 'trending-up') {
        pdf.line(cx - 2, cy + 1.5, cx - 0.5, cy);
        pdf.line(cx - 0.5, cy, cx + 0.5, cy + 0.5);
        pdf.line(cx + 0.5, cy + 0.5, cx + 2, cy - 1.5);
        pdf.line(cx + 2, cy - 1.5, cx + 0.8, cy - 1.5);
        pdf.line(cx + 2, cy - 1.5, cx + 2, cy - 0.3);
      } else if (iconType === 'coffee') {
        pdf.line(cx - 1.5, cy - 1, cx + 1.1, cy - 1);
        pdf.line(cx - 1.2, cy + 1.5, cx + 0.8, cy + 1.5);
        pdf.line(cx - 1.5, cy - 1, cx - 1.2, cy + 1.5);
        pdf.line(cx + 1.1, cy - 1, cx + 0.8, cy + 1.5);
        pdf.line(cx + 1.1, cy - 0.5, cx + 1.8, cy);
        pdf.line(cx + 1.8, cy, cx + 0.8, cy + 0.5);
        pdf.line(cx - 0.8, cy - 1.6, cx - 0.8, cy - 2.4);
        pdf.line(cx - 0.1, cy - 1.6, cx - 0.1, cy - 2.4);
        pdf.line(cx + 0.6, cy - 1.6, cx + 0.6, cy - 2.4);
      } else if (iconType === 'zap') {
        pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.triangle(cx + 0.5, cy - 2.4, cx - 1.2, cy + 0.2, cx - 0.2, cy + 0.2, 'F');
        pdf.triangle(cx - 0.5, cy + 2.4, cx + 1.2, cy - 0.2, cx + 0.2, cy - 0.2, 'F');
      } else if (iconType === 'shield-check') {
        pdf.line(cx - 1.8, cy - 1.8, cx + 1.8, cy - 1.8);
        pdf.line(cx - 1.8, cy - 1.8, cx - 1.8, cy + 0.4);
        pdf.line(cx + 1.8, cy - 1.8, cx + 1.8, cy + 0.4);
        pdf.line(cx - 1.8, cy + 0.4, cx, cy + 2.2);
        pdf.line(cx + 1.8, cy + 0.4, cx, cy + 2.2);
        pdf.line(cx - 0.8, cy - 0.1, cx - 0.2, cy + 0.5);
        pdf.line(cx - 0.2, cy + 0.5, cx + 0.9, cy - 0.6);
      } else if (iconType === 'hourglass') {
        pdf.line(cx - 1.8, cy - 1.8, cx + 1.8, cy - 1.8);
        pdf.line(cx - 1.8, cy + 1.8, cx + 1.8, cy + 1.8);
        pdf.line(cx - 1.8, cy - 1.8, cx, cy);
        pdf.line(cx + 1.8, cy - 1.8, cx, cy);
        pdf.line(cx - 1.8, cy + 1.8, cx, cy);
        pdf.line(cx + 1.8, cy + 1.8, cx, cy);
      } else if (iconType === 'target') {
        pdf.circle(cx, cy, 2.4, 'S');
        pdf.circle(cx, cy, 1.2, 'S');
        pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.circle(cx, cy, 0.4, 'FD');
      } else if (iconType === 'briefcase') {
        pdf.rect(cx - 2, cy - 1, 4, 2.8, 'S');
        pdf.rect(cx - 0.8, cy - 1.8, 1.6, 0.8, 'S');
        pdf.line(cx - 2, cy, cx + 2, cy);
      }
    };

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(isConsolidated ? 'Consolidated Group Performance Report' : 'Performance Report', 14, currentY);
    currentY += 6;

    // Subtitle & Print Timestamp
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Generated on: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`, 14, currentY);
    currentY += 8;

    // Divider
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.4);
    doc.line(14, currentY, 196, currentY);
    currentY += 8;

    // Metadata details block
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(14, currentY, 182, 34, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, currentY, 182, 34, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('REPORT CONTEXT & PROFILE DETAILS', 18, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // slate-600

    const employeeContext = isConsolidated
      ? `Group Scope: ${selectedGroup}   |   Employee Filter: ${selectedEmployee}`
      : `Employee ID: ${currentUserInfo.id}   |   Employee Name: ${currentUserInfo.name}`;

    doc.text(employeeContext, 18, currentY + 13);
    doc.text(`Reporting Period: ${startDateStr} to ${endDateStr} (${timeDimension.toUpperCase()} View)`, 18, currentY + 19);
    doc.text(`Working Days Count: ${countOfWorkingDays} Days   |   Expected Work Hours: ${expectedHours.toFixed(2)} Hrs   |   Total Logs: ${periodLogs.length}`, 18, currentY + 25);
    doc.text(`Total Logged Hours (Core + Non-Core): ${totalHoursLogged.toFixed(2)} Hrs`, 18, currentY + 31);

    currentY += 44;

    // Section Header: Standard KPIs
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('STANDARD KEY PERFORMANCE INDICATORS', 14, currentY);
    currentY += 6;

    // Standard KPIs array with assigned colorful UI palette values
    const standardKpis = [
      {
        title: 'Average Handling Time',
        code: 'AHT',
        value: totalOutputVolume > 0 ? `${avgHandlingTime.toFixed(2)} mins` : '—',
        formula: 'A / B * 60',
        inputs: [
          `A (Total Logged Hours): ${totalHoursLogged.toFixed(2)} hrs`,
          `B (Total Volume): ${totalOutputVolume} units`
        ],
        icon: 'clock',
        color: {
          primary: [37, 99, 235] as [number, number, number], // blue-600
          badgeBg: [239, 246, 255] as [number, number, number], // blue-50
          badgeText: [30, 64, 175] as [number, number, number], // blue-800
          border: [191, 219, 254] as [number, number, number], // blue-200
        }
      },
      {
        title: 'Operational Productivity',
        code: 'PRODUCTIVITY',
        value: `${(productivity * 100).toFixed(2)}%`,
        formula: 'A / (B * C)',
        inputs: [
          `A (Effective Core Hours): ${effectiveCoreHours.toFixed(2)} hrs`,
          `B (Working Hours/Day): ${standardHoursPerDay} hrs`,
          `C (Adjusted Working Days): ${adjustedWorkingDays.toFixed(2)} days`
        ],
        icon: 'trending-up',
        color: {
          primary: [16, 185, 129] as [number, number, number], // emerald-500
          badgeBg: [236, 253, 245] as [number, number, number], // emerald-50
          badgeText: [6, 95, 70] as [number, number, number], // emerald-800
          border: [167, 243, 208] as [number, number, number], // emerald-200
        }
      },
      {
        title: 'Unallocated Idle Ratio',
        code: 'IDLE TIME',
        value: `${(idleTimeClamped * 100).toFixed(2)}%`,
        formula: '1 - [A / (B * C)]',
        inputs: [
          `A (Aggregate Logged Hours): ${totalHoursLogged.toFixed(2)} hrs`,
          `B (Working Hours/Day): ${standardHoursPerDay} hrs`,
          `C (Adjusted Working Days): ${adjustedWorkingDays.toFixed(2)} days`
        ],
        icon: 'coffee',
        color: {
          primary: [245, 158, 11] as [number, number, number], // amber-500
          badgeBg: [254, 243, 199] as [number, number, number], // amber-50
          badgeText: [146, 64, 14] as [number, number, number], // amber-800
          border: [253, 230, 138] as [number, number, number], // amber-200
        }
      },
      {
        title: 'SLA Target Efficiency',
        code: 'EFFICIENCY',
        value: totalSlaTargets > 0 ? `${(efficiency * 100).toFixed(2)}%` : '—',
        formula: 'A / B',
        inputs: [
          `A (Output Volume): ${totalOutputVolume} units`,
          `B (Total SLA Targets): ${totalSlaTargets.toFixed(2)} hrs`
        ],
        icon: 'zap',
        color: {
          primary: [99, 102, 241] as [number, number, number], // indigo-500
          badgeBg: [238, 242, 255] as [number, number, number], // indigo-50
          badgeText: [55, 48, 163] as [number, number, number], // indigo-800
          border: [199, 210, 254] as [number, number, number], // indigo-200
        }
      },
      {
        title: 'Task Completeness Rate',
        code: 'COMPLETENESS',
        value: totalTransactionCount > 0 ? `${(completeness * 100).toFixed(2)}%` : '—',
        formula: 'A / B',
        inputs: [
          `A (Total Completed Count): ${totalCompletedCount} units`,
          `B (Total Transaction Count): ${totalTransactionCount} units`
        ],
        icon: 'shield-check',
        color: {
          primary: [139, 92, 246] as [number, number, number], // violet-500
          badgeBg: [245, 243, 255] as [number, number, number], // violet-50
          badgeText: [91, 33, 182] as [number, number, number], // violet-800
          border: [221, 214, 254] as [number, number, number], // violet-200
        }
      },
      {
        title: 'Standard Timeliness Ratio',
        code: 'TIMELINESS',
        value: totalCompletedCount > 0 ? `${(timeliness * 100).toFixed(2)}%` : '—',
        formula: 'A / B',
        inputs: [
          `A (On Time Yes Count): ${totalOnTimeYesCount} logs`,
          `B (Total Completed Count): ${totalCompletedCount} units`
        ],
        icon: 'hourglass',
        color: {
          primary: [244, 63, 94] as [number, number, number], // rose-500
          badgeBg: [255, 241, 242] as [number, number, number], // rose-50
          badgeText: [159, 18, 57] as [number, number, number], // rose-800
          border: [254, 205, 211] as [number, number, number], // rose-200
        }
      },
      {
        title: 'Process Output Accuracy',
        code: 'ACCURACY',
        value: totalCompletedCount > 0 ? `${(accuracy * 100).toFixed(2)}%` : '—',
        formula: '(A - B) / A',
        inputs: [
          `A (Total Completed Count): ${totalCompletedCount} units`,
          `B (Total Inaccurate Rework Count): ${reworkCount} logs`
        ],
        icon: 'target',
        color: {
          primary: [13, 148, 136] as [number, number, number], // teal-500
          badgeBg: [240, 253, 250] as [number, number, number], // teal-50
          badgeText: [17, 94, 89] as [number, number, number], // teal-800
          border: [153, 246, 228] as [number, number, number], // teal-200
        }
      },
      {
        title: 'Total Transaction Count',
        code: 'VOLUME',
        value: `${totalTransactionCount} units`,
        formula: 'Sum of Max(1, Volume)',
        inputs: [
          `A (Transaction Count): ${totalTransactionCount} units`,
          `B (Raw Volume Sum): ${totalOutputVolume} units`
        ],
        icon: 'target',
        color: {
          primary: [6, 182, 212] as [number, number, number], // cyan-500
          badgeBg: [236, 254, 255] as [number, number, number], // cyan-50
          badgeText: [21, 94, 117] as [number, number, number], // cyan-800
          border: [165, 243, 252] as [number, number, number], // cyan-200
        }
      }
    ];

    // Draw standard KPIs in a beautiful 2-column grid inheriting their actual colors & icons
    for (let i = 0; i < standardKpis.length; i++) {
      const kpi = standardKpis[i];
      const row = Math.floor(i / 2);
      const col = i % 2;

      const x = col === 0 ? 14 : 108;
      const cardY = currentY + row * 43;

      // Draw box with white background and thin color-matched border
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(kpi.color.border[0], kpi.color.border[1], kpi.color.border[2]);
      doc.setLineWidth(0.4);
      doc.rect(x, cardY, 88, 38, 'FD');

      // Left vertical accent line
      doc.setFillColor(kpi.color.primary[0], kpi.color.primary[1], kpi.color.primary[2]);
      doc.rect(x, cardY, 2.5, 38, 'F');

      // Top decorative header line background
      doc.setFillColor(kpi.color.badgeBg[0], kpi.color.badgeBg[1], kpi.color.badgeBg[2]);
      doc.rect(x + 2.5, cardY, 85.5, 5.5, 'F');
      doc.setDrawColor(kpi.color.border[0], kpi.color.border[1], kpi.color.border[2]);
      doc.setLineWidth(0.3);
      doc.line(x + 2.5, cardY + 5.5, x + 88, cardY + 5.5);

      // Draw Code/Badge title text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(kpi.color.badgeText[0], kpi.color.badgeText[1], kpi.color.badgeText[2]);
      doc.text(kpi.code, x + 5, cardY + 3.8);

      // Icon container on the right side of the card
      const iconBoxX = x + 74;
      const iconBoxY = cardY + 8;
      doc.setFillColor(kpi.color.badgeBg[0], kpi.color.badgeBg[1], kpi.color.badgeBg[2]);
      doc.setDrawColor(kpi.color.border[0], kpi.color.border[1], kpi.color.border[2]);
      doc.setLineWidth(0.2);
      doc.roundedRect(iconBoxX, iconBoxY, 10, 10, 1.5, 1.5, 'FD');

      // Draw the custom vector icon inside the container
      drawPdfVectorIcon(doc, kpi.icon, iconBoxX + 5, iconBoxY + 5, kpi.color.primary);

      // Draw Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(kpi.title, x + 5, cardY + 11.5);

      // Draw Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text(kpi.value, x + 5, cardY + 18.5);

      // Draw Formula Info header
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Formula: ${kpi.formula}`, x + 5, cardY + 23.5);

      // Draw Inputs (bullet list)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139); // slate-500
      let inputY = cardY + 28.5;
      kpi.inputs.forEach((inp) => {
        doc.text(`• ${inp}`, x + 5, inputY);
        inputY += 3.5;
      });
    }

    // Now let's calculate and add Page 2 for Non-Core Activity Categories KPIs
    doc.addPage();
    let page2Y = 15;

    // Title Page 2
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('NON-CORE ACTIVITY CATEGORIES BREAKDOWN', 14, page2Y);
    page2Y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Individually computed metrics for each Non-Core Activity Category applying the KPI formula.', 14, page2Y);
    page2Y += 8;

    doc.setDrawColor(226, 232, 240);
    doc.line(14, page2Y, 196, page2Y);
    page2Y += 8;

    // Compute Non-Core Activity Category KPIs
    const nonCoreKpis = uniqueNonCoreCategories.map((cat) => {
      const categoryHours = periodLogs
        .filter((log) => {
          if (log.type !== 'Non-Core') return false;
          const matched = (masterData.nonCoreActivity || []).find((item) => item.name === log.name);
          return matched ? matched.category === cat : false;
        })
        .reduce((sum, log) => sum + log.hours, 0);

      const denominator = standardHoursPerDay * countOfWorkingDays;
      const metricVal = denominator > 0 ? (nonCoreHoursLogged - categoryHours) / denominator : 0;

      return {
        category: cat,
        value: denominator > 0 ? `${(metricVal * 100).toFixed(2)}%` : '—',
        categoryHours,
        formula: '(A - B) / (C * D)',
        inputs: [
          `A (Total Non-Core Logged): ${nonCoreHoursLogged.toFixed(2)} hrs`,
          `B (Category "${cat}"): ${categoryHours.toFixed(2)} hrs`,
          `C (Working Hours/Day): ${standardHoursPerDay} hrs`,
          `D (Working Days Count): ${countOfWorkingDays} days`
        ]
      };
    });

    if (nonCoreKpis.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      doc.text('No Non-Core activity categories found in the system.', 14, page2Y + 6);
    } else {
      // Draw Non-Core KPIs in 2 columns
      for (let i = 0; i < nonCoreKpis.length; i++) {
        const kpi = nonCoreKpis[i];
        const row = Math.floor(i / 2);
        const col = i % 2;

        const x = col === 0 ? 14 : 108;
        const cardHeight = 38;
        const cardY = page2Y + row * 43;

        // If card exceeds page height, add another page
        if (cardY + cardHeight > 282) {
          doc.addPage();
          page2Y = 20 - row * 43; // Reset page2Y offset
        }

        const drawY = page2Y + row * 43;

        // Box border and white background with fuchsia color accents
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(245, 208, 254); // fuchsia-200
        doc.setLineWidth(0.4);
        doc.rect(x, drawY, 88, cardHeight, 'FD');

        // Left vertical fuchsia accent line
        doc.setFillColor(217, 70, 239); // fuchsia-500
        doc.rect(x, drawY, 2.5, cardHeight, 'F');

        // Top banner highlight (fuchsia color accent for non-core activity)
        doc.setFillColor(253, 244, 255); // fuchsia-50
        doc.rect(x + 2.5, drawY, 85.5, 5.5, 'F');
        doc.setDrawColor(245, 208, 254);
        doc.setLineWidth(0.3);
        doc.line(x + 2.5, drawY + 5.5, x + 88, drawY + 5.5);

        // Header label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(162, 28, 175); // fuchsia-700
        doc.text('NON-CORE ACTIVITY KPI', x + 5, drawY + 3.8);

        // Icon container on the right side of the card
        const iconBoxX = x + 74;
        const iconBoxY = drawY + 8;
        doc.setFillColor(253, 244, 255); // fuchsia-50
        doc.setDrawColor(245, 208, 254); // fuchsia-200
        doc.setLineWidth(0.2);
        doc.roundedRect(iconBoxX, iconBoxY, 10, 10, 1.5, 1.5, 'FD');

        // Draw the beautiful briefcase vector icon in fuchsia
        drawPdfVectorIcon(doc, 'briefcase', iconBoxX + 5, iconBoxY + 5, [217, 70, 239]);

        // Title (Category)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        const truncatedCat = kpi.category.length > 38 ? kpi.category.substring(0, 35) + '...' : kpi.category;
        doc.text(truncatedCat, x + 5, drawY + 11.5);

        // Value
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(30, 41, 59);
        doc.text(kpi.value, x + 5, drawY + 18.5);

        // Formula
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Formula: ${kpi.formula}`, x + 5, drawY + 23.5);

        // Inputs (bullet list)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        let inputY = drawY + 28.5;
        kpi.inputs.forEach((inp) => {
          doc.text(`• ${inp}`, x + 5, inputY);
          inputY += 3.5;
        });
      }
    }

    // Save and download PDF
    const safeEmpName = (isConsolidated ? `group_${selectedGroup}` : currentUserInfo.name)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');
    const filename = `performance_report_${safeEmpName}_${selectedMonth}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-fadeIn max-w-none w-full text-slate-900">
      {/* Top Controls Header */}
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Gauge className={`h-4 w-4 ${isConsolidated ? 'text-indigo-600' : 'text-blue-600'}`} /> {isConsolidated ? 'Consolidated Group Performance Report' : 'Performance Report'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isConsolidated ? 'Key Performance Indicator card analytics aggregated dynamically for all group employees.' : 'Key Performance Indicator card analytics filtered dynamically by period.'}
            </p>
          </div>
          <button
            onClick={handleExportToPdf}
            className={`flex items-center gap-1.5 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer border border-transparent ${
              isConsolidated 
                ? 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700' 
                : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
            }`}
            title="Export all KPIs to PDF Report"
          >
            <Download className="h-4 w-4" /> Export PDF
          </button>
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
            /* Employee Profile Display */
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
                onClick={() => setTimeDimension('daily')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  timeDimension === 'daily'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Daily
              </button>
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
              <button
                type="button"
                onClick={() => setTimeDimension('range')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  timeDimension === 'range'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Range
              </button>
            </div>
          </div>

          {/* Date Select (Daily Mode Only) */}
          {timeDimension === 'daily' && (
            <div className="flex flex-col animate-fadeIn">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Reporting Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-slate-700"
              />
            </div>
          )}

          {/* Range Select (Range Mode Only) */}
          {timeDimension === 'range' && (
            <div className="flex flex-col animate-fadeIn">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-slate-700 w-32"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-slate-700 w-32"
                />
              </div>
            </div>
          )}

          {/* Month Select */}
          <div className="flex flex-col">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Reporting Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              disabled={timeDimension === 'daily'}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
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
              disabled={weeks.length === 0 || timeDimension === 'month' || timeDimension === 'daily'}
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

      {/* Info Status Banner */}
      <div className="px-6 py-3.5 bg-blue-50/40 border-b border-slate-150 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-500" />
          <span className="font-semibold">
            Analyzed Period: <span className="text-slate-900">{startDateStr}</span> to <span className="text-slate-900">{endDateStr}</span>
          </span>
          <span className="text-slate-300">|</span>
          <span>
            Working Days Count: <span className="font-bold text-slate-800">{countOfWorkingDays} days</span>
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
          Total Logs Analyzed: <span className="font-bold text-blue-600">{periodLogs.length}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Average Handling Time */}
        <div className="bg-gradient-to-br from-blue-50/30 to-white border border-blue-100 rounded-2xl p-5 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md">
              AHT
            </span>
            <div className="p-1.5 bg-blue-100/50 rounded-xl text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Handling Time</h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 font-sans">
              {totalOutputVolume > 0 ? `${avgHandlingTime.toFixed(2)}` : '—'}
            </span>
            {totalOutputVolume > 0 && <span className="text-xs font-semibold text-slate-500">mins</span>}
          </div>
          
          <div className="mt-4 pt-3 border-t border-blue-50 text-[10px] text-slate-500 flex flex-col gap-1.5 font-mono">
            <div className="flex items-center gap-1 font-bold text-slate-600 uppercase text-[9px] tracking-wider mb-0.5">
              <Info className="h-3 w-3 text-blue-500" /> Formula: A / B * 60
            </div>
            <div className="flex justify-between">
              <span>A (Total Logged):</span>
              <span className="font-bold text-slate-800">{totalHoursLogged.toFixed(2)} hrs</span>
            </div>
            <div className="flex justify-between">
              <span>B (Total Volume):</span>
              <span className="font-bold text-slate-800">{totalOutputVolume} units</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Productivity */}
        <div className="bg-gradient-to-br from-emerald-50/20 to-white border border-emerald-100 rounded-2xl p-5 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
              Productivity
            </span>
            <div className="p-1.5 bg-emerald-100/50 rounded-xl text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operational Productivity</h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 font-sans">
              {(productivity * 100).toFixed(2)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, productivity * 100)}%` }}
            ></div>
          </div>

          {/* Exclude Rework Switch */}
          <div className="flex items-center justify-between mt-3 px-2 py-1.5 bg-emerald-50/40 rounded-lg border border-emerald-100/50" id="exclude-rework-switch-container">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Exclude Rework</span>
            <button
              id="exclude-rework-switch"
              type="button"
              role="switch"
              aria-checked={excludeRework}
              onClick={() => setExcludeRework(!excludeRework)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                excludeRework ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  excludeRework ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          
          <div className="mt-4 pt-3 border-t border-emerald-50 text-[10px] text-slate-500 flex flex-col gap-1.5 font-mono">
            <div className="flex items-center gap-1 font-bold text-slate-600 uppercase text-[9px] tracking-wider mb-0.5">
              <Info className="h-3 w-3 text-emerald-500" /> Formula: A / (B * C)
            </div>
            <div className="flex justify-between">
              <span>A (Core Hours):</span>
              <span className="font-bold text-slate-800">{effectiveCoreHours.toFixed(2)} hrs</span>
            </div>
            <div className="flex justify-between">
              <span>B (Working Hours):</span>
              <span className="font-bold text-slate-800">{standardHoursPerDay} hrs</span>
            </div>
            <div className="flex justify-between">
              <span>C (Working Days):</span>
              <span className="font-bold text-slate-800">{adjustedWorkingDays.toFixed(2)} days</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Idle Time */}
        <div className="bg-gradient-to-br from-amber-50/20 to-white border border-amber-100 rounded-2xl p-5 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
              Idle Time
            </span>
            <div className="p-1.5 bg-amber-100/50 rounded-xl text-amber-600">
              <Coffee className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unallocated Idle Ratio</h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 font-sans">
              {(idleTimeClamped * 100).toFixed(2)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, idleTimeClamped * 100)}%` }}
            ></div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-amber-50 text-[10px] text-slate-500 flex flex-col gap-1.5 font-mono">
            <div className="flex items-center gap-1 font-bold text-slate-600 uppercase text-[9px] tracking-wider mb-0.5">
              <Info className="h-3 w-3 text-amber-500" /> Formula: 1 - [A / (B * C)]
            </div>
            <div className="flex justify-between">
              <span>A (Aggregate Hours):</span>
              <span className="font-bold text-slate-800">{totalHoursLogged.toFixed(2)} hrs</span>
            </div>
            <div className="flex justify-between">
              <span>B (Working Hours):</span>
              <span className="font-bold text-slate-800">{standardHoursPerDay} hrs</span>
            </div>
            <div className="flex justify-between">
              <span>C (Working Days):</span>
              <span className="font-bold text-slate-800">{adjustedWorkingDays.toFixed(2)} days</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Efficiency */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-indigo-100 rounded-2xl p-5 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md">
              Efficiency
            </span>
            <div className="p-1.5 bg-indigo-100/50 rounded-xl text-indigo-600">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SLA Target Efficiency</h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 font-sans">
              {totalSlaTargets > 0 ? `${(efficiency * 100).toFixed(2)}%` : '—'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, efficiency * 100)}%` }}
            ></div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-indigo-50 text-[10px] text-slate-500 flex flex-col gap-1.5 font-mono">
            <div className="flex items-center gap-1 font-bold text-slate-600 uppercase text-[9px] tracking-wider mb-0.5">
              <Info className="h-3 w-3 text-indigo-500" /> Formula: A / B
            </div>
            <div className="flex justify-between">
              <span>A (Output Volume):</span>
              <span className="font-bold text-slate-800">{totalOutputVolume} units</span>
            </div>
            <div className="flex justify-between">
              <span>B (Total SLA Targets):</span>
              <span className="font-bold text-slate-800">{totalSlaTargets.toFixed(2)} hrs</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Completeness (Replacement for Quality) */}
        <div className="bg-gradient-to-br from-violet-50/20 to-white border border-violet-100 rounded-2xl p-5 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-800 bg-violet-50 px-2 py-0.5 rounded-md">
              Completeness
            </span>
            <div className="p-1.5 bg-violet-100/50 rounded-xl text-violet-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Task Completeness Rate</h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 font-sans">
              {totalTransactionCount > 0 ? `${(completeness * 100).toFixed(2)}%` : '—'}
            </span>
          </div>

          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-violet-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, completeness * 100)}%` }}
            ></div>
          </div>

          <div className="mt-4 pt-3 border-t border-violet-50 text-[10px] text-slate-500 flex flex-col gap-1.5 font-mono">
            <div className="flex items-center gap-1 font-bold text-slate-600 uppercase text-[9px] tracking-wider mb-0.5">
              <Info className="h-3 w-3 text-violet-500" /> Formula: A / B
            </div>
            <div className="flex justify-between">
              <span>A (Total "Completed Count"):</span>
              <span className="font-bold text-slate-800">{totalCompletedCount} units</span>
            </div>
            <div className="flex justify-between">
              <span>B (Total "Transaction Count"):</span>
              <span className="font-bold text-slate-800">{totalTransactionCount} units</span>
            </div>
          </div>
        </div>

        {/* KPI 6: Timeliness (Replacement for Utilization) */}
        <div id="timeliness-kpi-card" className="bg-gradient-to-br from-rose-50/20 to-white border border-rose-100 rounded-2xl p-5 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md">
              Timeliness
            </span>
            <div className="p-1.5 bg-rose-100/50 rounded-xl text-rose-600">
              <Hourglass className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Standard Timeliness Ratio</h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 font-sans">
              {totalCompletedCount > 0 ? `${(timeliness * 100).toFixed(2)}%` : '—'}
            </span>
          </div>

          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-rose-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${totalCompletedCount > 0 ? Math.min(100, timeliness * 100) : 0}%` }}
            ></div>
          </div>

          <div className="mt-4 pt-3 border-t border-rose-50 text-[10px] text-slate-500 flex flex-col gap-1.5 font-mono">
            <div className="flex items-center gap-1 font-bold text-slate-600 uppercase text-[9px] tracking-wider mb-0.5">
              <Info className="h-3 w-3 text-rose-500" /> Formula: A / B
            </div>
            <div className="flex justify-between">
              <span>A (Total Count of "On Time" = Yes):</span>
              <span className="font-bold text-slate-800">{totalOnTimeYesCount} logs</span>
            </div>
            <div className="flex justify-between">
              <span>B (Total "Completed Count"):</span>
              <span className="font-bold text-slate-800">{totalCompletedCount} units</span>
            </div>
          </div>
        </div>

        {/* KPI 7: Accuracy (Replacement for Overtime) */}
        <div className="bg-gradient-to-br from-teal-50/20 to-white border border-teal-100 rounded-2xl p-5 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
              Accuracy
            </span>
            <div className="p-1.5 bg-teal-100/50 rounded-xl text-teal-600">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Process Output Accuracy</h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 font-sans">
              {totalCompletedCount > 0 ? `${(accuracy * 100).toFixed(2)}%` : '—'}
            </span>
          </div>

          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-teal-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${totalCompletedCount > 0 ? Math.min(100, Math.max(0, accuracy * 100)) : 0}%` }}
            ></div>
          </div>

          <div className="mt-4 pt-3 border-t border-teal-50 text-[10px] text-slate-500 flex flex-col gap-1.5 font-mono">
            <div className="flex items-center gap-1 font-bold text-slate-600 uppercase text-[9px] tracking-wider mb-0.5">
              <Info className="h-3 w-3 text-teal-500" /> Formula: (A - B) / A
            </div>
            <div className="flex justify-between">
              <span>A (Total "Completed Count"):</span>
              <span className="font-bold text-slate-800">{totalCompletedCount} units</span>
            </div>
            <div className="flex justify-between">
              <span>B (Total Inaccurate Rework Count):</span>
              <span className="font-bold text-slate-800">{reworkCount} logs</span>
            </div>
          </div>
        </div>

        {/* KPI 8: Volume (Replacement for SLA Compliance) */}
        <div className="bg-gradient-to-br from-cyan-50/20 to-white border border-cyan-100 rounded-2xl p-5 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md">
              Volume
            </span>
            <div className="p-1.5 bg-cyan-100/50 rounded-xl text-cyan-600">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Transaction Count</h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 font-sans">
              {totalTransactionCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">units</span>
          </div>

          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-cyan-500 h-1.5 rounded-full transition-all duration-500" style={{ width: totalTransactionCount > 0 ? '100%' : '0%' }}></div>
          </div>

          <div className="mt-4 pt-3 border-t border-cyan-50 text-[10px] text-slate-500 flex flex-col gap-1.5 font-mono">
            <div className="flex items-center gap-1 font-bold text-slate-600 uppercase text-[9px] tracking-wider mb-0.5">
              <Info className="h-3 w-3 text-cyan-500" /> Formula: Sum of Max(1, Volume)
            </div>
            <div className="flex justify-between">
              <span>A (Total Transaction Count):</span>
              <span className="font-bold text-slate-800">{totalTransactionCount} units</span>
            </div>
            <div className="flex justify-between">
              <span>B (Raw Volume Sum):</span>
              <span className="font-bold text-slate-800">{totalOutputVolume} units</span>
            </div>
          </div>
        </div>

        {/* KPI 9: Custom Non-Core Activity Dropdown Card */}
        <div className="bg-gradient-to-br from-fuchsia-50/20 to-white border border-fuchsia-100 rounded-2xl p-5 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-800 bg-fuchsia-50 px-2 py-0.5 rounded-md">
              Non-Core Activity
            </span>
            <div className="p-1.5 bg-fuchsia-100/50 rounded-xl text-fuchsia-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          {/* Activity Dropdown Selector */}
          <div className="mb-2">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Select Activity Category
            </label>
            <select
              value={selectedNonCoreCategory}
              onChange={(e) => setSelectedNonCoreCategory(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-fuchsia-500 cursor-pointer text-slate-700"
            >
              {uniqueNonCoreCategories.length > 0 ? (
                uniqueNonCoreCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))
              ) : (
                <option value="">No Categories</option>
              )}
            </select>
          </div>

          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activity Distribution Metric</h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 font-sans">
              {workingHoursDenominator > 0 ? `${(nonCoreMetric * 100).toFixed(2)}%` : '—'}
            </span>
          </div>

          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-fuchsia-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${workingHoursDenominator > 0 ? Math.min(100, Math.max(0, nonCoreMetric * 100)) : 0}%` }}
            ></div>
          </div>

          <div className="mt-4 pt-3 border-t border-fuchsia-50 text-[10px] text-slate-500 flex flex-col gap-1.5 font-mono">
            <div className="flex items-center gap-1 font-bold text-slate-600 uppercase text-[9px] tracking-wider mb-0.5">
              <Info className="h-3 w-3 text-fuchsia-500" /> Formula: (A - B) / (C * D)
            </div>
            <div className="flex justify-between">
              <span>A (Total Non-Core):</span>
              <span className="font-bold text-slate-800">{nonCoreHoursLogged.toFixed(2)} hrs</span>
            </div>
            <div className="flex justify-between text-fuchsia-700">
              <span className="truncate max-w-[150px]">B (Selected Cat: {selectedNonCoreCategory || 'None'}):</span>
              <span className="font-bold">{selectedCategoryHours.toFixed(2)} hrs</span>
            </div>
            <div className="flex justify-between">
              <span>C (Working Hours):</span>
              <span className="font-bold text-slate-800">{standardHoursPerDay} hrs</span>
            </div>
            <div className="flex justify-between">
              <span>D (Working Days):</span>
              <span className="font-bold text-slate-800">{countOfWorkingDays} days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
