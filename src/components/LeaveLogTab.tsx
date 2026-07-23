/**
 * OpsIntel Prodex - Leaves & Time Off Module
 * Developed by: Patrick Jay F. Tanap
 */

import React, { useState, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  X,
  Briefcase,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  CalendarDays,
  Edit2,
  Check
} from 'lucide-react';
import { MasterData, LeaveLog, LeaveType, Holiday, ActivityLog } from '../types';
import { formatNumber } from '../utils/format';
import MasterBulkUpload from './MasterBulkUpload';


interface LeaveLogTabProps {
  masterData: MasterData;
  leaveLogs: LeaveLog[];
  activityLogs: ActivityLog[];
  onSubmitLeaveLog: (log: LeaveLog) => void;
  onDeleteLeaveLog: (id: string) => void;
  onUpdateMasterData: (newData: MasterData) => void;
  loggedInUser?: { role: 'admin' | 'user'; username: string } | null;
}

export default function LeaveLogTab({ 
  masterData, 
  leaveLogs,
  activityLogs,
  onSubmitLeaveLog, 
  onDeleteLeaveLog,
  onUpdateMasterData,
  loggedInUser 
}: LeaveLogTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [category, setCategory] = useState<'Leave' | 'Official Business' | 'Undertime'>('Leave');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveTypeCode, setLeaveTypeCode] = useState('');
  const [period, setPeriod] = useState<'AM' | 'PM' | 'Whole Day'>('Whole Day');
  const [hours, setHours] = useState<number>(0);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  // Filter State
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterLeaveType, setFilterLeaveType] = useState<string>('All');

  // Calendar State
  const [viewDate, setViewDate] = useState(new Date());
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [selectedHolidayDate, setSelectedHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');

  const [editingLeaveLog, setEditingLeaveLog] = useState<LeaveLog | null>(null);
  const [editForm, setEditForm] = useState({
    date: '',
    category: 'Leave' as 'Leave' | 'Official Business' | 'Undertime',
    leaveType: '',
    period: 'Whole Day' as 'AM' | 'PM' | 'Whole Day',
    hours: 0,
    remarks: '',
  });

  const handleStartEdit = (log: LeaveLog) => {
    setEditingLeaveLog(log);
    const logLeaveTypeCode = typeof log.leaveType === 'object' && log.leaveType ? (log.leaveType as any).code : log.leaveType;
    setEditForm({
      date: log.date || '',
      category: log.category || 'Leave',
      leaveType: logLeaveTypeCode || '',
      period: log.period || 'Whole Day',
      hours: log.hours || 0,
      remarks: log.remarks || '',
    });
    setTimeout(() => {
      document.getElementById('edit-leave-container')?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 150);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLeaveLog) return;
    onSubmitLeaveLog({
      ...editingLeaveLog,
      date: editForm.date,
      category: editForm.category,
      leaveType: editForm.category === 'Leave' ? editForm.leaveType : undefined,
      period: editForm.category === 'Leave' ? editForm.period : undefined,
      hours: editForm.category !== 'Leave' ? editForm.hours : undefined,
      remarks: editForm.remarks,
    });
    setEditingLeaveLog(null);
  };

  const leaveTypes = masterData.leaveTypes || [];
  const holidays = masterData.holidays || [];

  const getLogEmployeeInfo = () => {
    if (loggedInUser?.role === 'admin') {
      return {
        employeeId: 'admin',
        employeeName: 'Administrator',
      };
    } else if (loggedInUser?.role === 'user') {
      const userCode = masterData.regularUserAccount?.employeeCode || 'staff';
      const userName = masterData.regularUserAccount?.employeeName || 'Staff';
      return {
        employeeId: userCode,
        employeeName: userName,
      };
    }
    return { employeeId: 'unknown', employeeName: 'Unknown' };
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setCategory('Leave');
    setDate(new Date().toISOString().split('T')[0]);
    setLeaveTypeCode(leaveTypes[0]?.code || '');
    setPeriod('Whole Day');
    setHours(0);
    setRemarks('');
    setError('');
  };

  const handleSubmit = () => {
    setError('');
    
    if (category === 'Leave' && !leaveTypeCode) {
      setError('Please select a leave type.');
      return;
    }

    if ((category === 'Official Business' || category === 'Undertime') && (hours <= 0 || hours > 24)) {
      setError('Please enter valid hours (1-24).');
      return;
    }

    const { employeeId, employeeName } = getLogEmployeeInfo();

    const newLog: LeaveLog = {
      id: `leave-${Date.now()}`,
      date,
      employeeId,
      employeeName,
      category,
      leaveType: category === 'Leave' ? leaveTypeCode : undefined,
      period: category === 'Leave' ? period : undefined,
      hours: category !== 'Leave' ? hours : undefined,
      remarks,
      timestamp: new Date().toISOString(),
    };

    onSubmitLeaveLog(newLog);
    setIsAdding(false);
  };

  // Holiday Handlers
  const handleToggleHoliday = (dateStr: string) => {
    const existing = holidays.find(h => h.date === dateStr);
    if (existing) {
      const updatedHolidays = holidays.filter(h => h.date !== dateStr);
      onUpdateMasterData({ ...masterData, holidays: updatedHolidays });
    } else {
      setSelectedHolidayDate(dateStr);
      setHolidayName('');
      setIsHolidayModalOpen(true);
    }
  };

  const handleSaveHoliday = () => {
    if (!holidayName.trim()) return;
    const newHoliday: Holiday = { date: selectedHolidayDate, name: holidayName };
    const updatedHolidays = [...holidays, newHoliday];
    onUpdateMasterData({ ...masterData, holidays: updatedHolidays });
    setIsHolidayModalOpen(false);
  };



  // Calendar Helpers
  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  // Find all unique months present in activityLogs (matching Summary Report logic)
  const uniqueMonths = Array.from(
    new Set(
      activityLogs
        .map((log) => (log.dateLogged || log.date || "").substring(0, 7))
        .filter((d) => d && d.length === 7)
    )
  ).sort().reverse();

  const filteredLogs = leaveLogs.filter(log => {
    // Extract month from "YYYY-MM-DD"
    const logMonth = (log.date || "").substring(0, 7);
    
    const monthMatch = filterMonth === 'All' || logMonth === filterMonth;
    const categoryMatch = filterCategory === 'All' || log.category === filterCategory;
    const logLeaveTypeCode = typeof log.leaveType === 'object' && log.leaveType ? (log.leaveType as any).code : log.leaveType;
    const leaveTypeMatch = filterCategory !== 'Leave' || filterLeaveType === 'All' || logLeaveTypeCode === filterLeaveType;

    return monthMatch && categoryMatch && leaveTypeMatch;
  });

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const monthYear = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthDays = daysInMonth(viewDate.getMonth(), viewDate.getFullYear());
  const startDay = firstDayOfMonth(viewDate.getMonth(), viewDate.getFullYear());

  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= monthDays; i++) days.push(i);

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-blue-600" /> Leaves, Time Off & Calendar
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage and track employee leaves, official business trips, and holidays.
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={handleAddClick}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition shadow-lg shadow-blue-200 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-5 w-5" /> Log New Entry
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white border-2 border-blue-100 rounded-2xl p-6 shadow-xl animate-slideIn">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" /> New Log Entry
            </h3>
            <button 
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="Leave">Leave</option>
                <option value="Official Business">Official Business</option>
                <option value="Undertime">Undertime</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {category === 'Leave' ? (
              <>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Leave Type</label>
                  <select
                    value={leaveTypeCode}
                    onChange={(e) => setLeaveTypeCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="">-- Select Type --</option>
                    {leaveTypes.map((t) => (
                      <option key={t.code} value={t.code}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Period</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="Whole Day">Whole Day</option>
                    <option value="AM">AM Only</option>
                    <option value="PM">PM Only</option>
                  </select>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Number of Hours</label>
                <input
                  type="number"
                  step="0.01"
                  value={hours}
                  onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="e.g. 4.50"
                />
              </div>
            )}
          </div>

          <div className="space-y-2 mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition h-24 resize-none"
              placeholder="Add any additional details or context here..."
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setIsAdding(false)}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center gap-2 cursor-pointer"
            >
              <Save className="h-5 w-5" /> Submit Log
            </button>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" /> Recent Entries
          </h3>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Reporting Month</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
              >
                <option value="All">All Months</option>
                {uniqueMonths.map((m) => {
                  const [yr, mn] = m.split('-');
                  const monthName = new Date(Number(yr), Number(mn) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  return (
                    <option key={m} value={m}>
                      {monthName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Entry Type</label>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setFilterLeaveType('All'); // Reset leave type when category changes
                }}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
              >
                <option value="All">All Types</option>
                <option value="Leave">Leave</option>
                <option value="Official Business">Official Business</option>
                <option value="Undertime">Undertime</option>
              </select>
            </div>

            {filterCategory === 'Leave' && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <label className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">What type of leave</label>
                <select
                  value={filterLeaveType}
                  onChange={(e) => setFilterLeaveType(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
                >
                  <option value="All">All Leave Types</option>
                  {leaveTypes.map((t) => (
                    <option key={t.code} value={t.code}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] uppercase font-bold text-slate-500 border-b border-slate-150 bg-slate-50/50">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Details</th>
                <th className="px-6 py-3">Remarks</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                    {leaveLogs.length === 0 ? "No entries logged yet." : "No entries match your filters."}
                  </td>
                </tr>
              ) : (
                [...filteredLogs].reverse().map((log) => {
                  const logLeaveTypeCode = typeof log.leaveType === 'object' && log.leaveType ? (log.leaveType as any).code : log.leaveType;
                  const leaveType = leaveTypes.find(t => t.code === logLeaveTypeCode);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-sm">{log.date}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          log.category === 'Leave' 
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : log.category === 'Official Business'
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }`}>
                          {log.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-700">
                          {log.category === 'Leave' ? (
                            <>
                              <span className="text-blue-600">
                                {leaveType?.name || (typeof log.leaveType === 'object' && log.leaveType ? (log.leaveType as any).name : log.leaveType)}
                              </span>
                              <span className="mx-2 text-slate-300">|</span>
                              <span className="text-slate-500">{log.period}</span>
                            </>
                          ) : (
                            <span className="text-slate-700 flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-slate-400" /> {formatNumber(log.hours)} Hours
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-sm text-slate-600 truncate" title={log.remarks}>
                          {log.remarks || <span className="text-slate-300 italic">No remarks</span>}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEdit(log)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Edit Entry"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDeleteLeaveLog(log.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Delete Entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Leave/Time Off Form Container */}
      {editingLeaveLog && (
        <div id="edit-leave-container" className="my-8 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden text-slate-900 animate-fadeIn scroll-mt-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-blue-600" /> Edit Leave & Time Off Details
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Modify persistent record for leave log #{editingLeaveLog.id}</p>
            </div>
            <button
              type="button"
              onClick={() => setEditingLeaveLog(null)}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Date</label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  required
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => {
                    const catVal = e.target.value as 'Leave' | 'Official Business' | 'Undertime';
                    setEditForm({
                      ...editForm,
                      category: catVal,
                      leaveType: catVal === 'Leave' ? (leaveTypes[0]?.code || '') : '',
                      hours: catVal !== 'Leave' ? 8 : 0,
                    });
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Leave">Leave</option>
                  <option value="Official Business">Official Business</option>
                  <option value="Undertime">Undertime</option>
                </select>
              </div>
            </div>

            {editForm.category === 'Leave' ? (
              <div className="grid grid-cols-2 gap-4">
                {/* Leave Type */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Leave Type</label>
                  <select
                    value={editForm.leaveType}
                    onChange={(e) => setEditForm({ ...editForm, leaveType: e.target.value })}
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {leaveTypes.map((t) => (
                      <option key={t.code} value={t.code}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Period */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Period</label>
                  <select
                    value={editForm.period}
                    onChange={(e) => setEditForm({ ...editForm, period: e.target.value as 'AM' | 'PM' | 'Whole Day' })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="AM">AM (Half Day)</option>
                    <option value="PM">PM (Half Day)</option>
                    <option value="Whole Day">Whole Day</option>
                  </select>
                </div>
              </div>
            ) : (
              <div>
                {/* Hours */}
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Hours</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.hours}
                  onChange={(e) => setEditForm({ ...editForm, hours: Math.min(24, Math.max(0.01, parseFloat(e.target.value) || 0)) })}
                  required
                  min={0.01}
                  max={24}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            )}

            {/* Remarks */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Remarks</label>
              <textarea
                rows={2}
                value={editForm.remarks}
                onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                required
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Enter remarks details..."
              />
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingLeaveLog(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" /> Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Calendar Section for Holidays */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-600" /> Holiday Calendar & Tagging
          </h3>
        </div>
        
        {loggedInUser?.role === 'admin' && (
          <div className="px-6 pt-6 pb-0">
            <MasterBulkUpload
              typeLabel="Holidays"
            expectedHeaders={['date', 'name']}
            sampleRows={[
              ['2025-01-01', 'New Year\'s Day'],
              ['2025-12-25', 'Christmas Day']
            ]}
            onDataUploaded={(parsed, mode) => {
              const mapped = parsed.map(item => ({
                date: String(item.date || '').trim(),
                name: String(item.name || '').trim()
              })).filter(h => h.date && h.name);

              let newHolidays = [...holidays];
              if (mode === 'replace') {
                newHolidays = [...mapped];
              } else {
                mapped.forEach(m => {
                  const existingIdx = newHolidays.findIndex(h => h.date === m.date);
                  if (existingIdx >= 0) {
                    newHolidays[existingIdx] = m;
                  } else {
                    newHolidays.push(m);
                  }
                });
              }
              onUpdateMasterData({ ...masterData, holidays: newHolidays });
            }}
          />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full transition cursor-pointer">
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
            <h4 className="font-bold text-slate-900 text-lg">{monthYear}</h4>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full transition cursor-pointer">
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden shadow-inner">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-slate-50 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {day}
              </div>
            ))}
            {days.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} className="bg-white/50 h-24 md:h-32"></div>;
              
              const dateObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
              const dateStr = dateObj.toISOString().split('T')[0];
              const holiday = holidays.find(h => h.date === dateStr);
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

              return (
                <div 
                  key={day} 
                  onClick={() => handleToggleHoliday(dateStr)}
                  className={`bg-white h-24 md:h-32 p-2 transition-all duration-200 cursor-pointer relative group hover:z-10 ${
                    holiday ? 'bg-amber-50/70 hover:bg-amber-100/80' : 'hover:bg-blue-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : holiday ? 'text-amber-700' : isWeekend ? 'text-slate-400' : 'text-slate-700'
                    }`}>
                      {day}
                    </span>
                    {holiday && <Trash2 className="h-3 w-3 text-amber-400 opacity-0 group-hover:opacity-100 hover:text-rose-600 transition" />}
                  </div>
                  {holiday && (
                    <div className="mt-2 text-[10px] font-bold text-amber-800 bg-amber-100/80 p-1.5 rounded border border-amber-200 leading-tight line-clamp-2">
                      {holiday.name}
                    </div>
                  )}
                  {!holiday && (
                    <div className="mt-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[9px] font-bold text-blue-500">
                      <Plus className="h-2.5 w-2.5" /> Tag Holiday
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-600 rounded-full shadow-sm"></div> Today
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded shadow-sm"></div> Holiday
            </div>
            <div className="flex items-center gap-1.5 italic text-slate-400">
              * Click any day to tag/untag as holiday
            </div>
          </div>
        </div>
      </div>

      {/* Holiday Entry Modal */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-scaleUp overflow-hidden">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center justify-between">
              <h3 className="font-bold text-amber-900 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-amber-600" /> Tag as Holiday
              </h3>
              <button onClick={() => setIsHolidayModalOpen(false)} className="text-amber-400 hover:text-amber-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Date Selected</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700">
                  {new Date(selectedHolidayDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Holiday Description</label>
                <input
                  autoFocus
                  type="text"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveHoliday()}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  placeholder="e.g. Independence Day, New Year..."
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => setIsHolidayModalOpen(false)}
                className="px-6 py-2 rounded-xl text-slate-600 font-bold hover:bg-white transition cursor-pointer text-sm"
              >
                Cancel
              </button>
              <button
                disabled={!holidayName.trim()}
                onClick={handleSaveHoliday}
                className="px-8 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition shadow-lg shadow-amber-100 disabled:opacity-50 cursor-pointer text-sm"
              >
                Save Holiday
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

