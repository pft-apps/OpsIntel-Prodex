import { useState } from 'react';
import { Search, Shield, RefreshCw, Trash2, Download, AlertTriangle, CheckCircle, Info, Calendar, Filter } from 'lucide-react';
import { SystemAuditLog } from '../types';

interface AuditTrackingTabProps {
  auditLogs: SystemAuditLog[];
  onClearLogs: () => void;
  userRole: 'admin' | 'user' | null;
}

export default function AuditTrackingTab({ auditLogs, onClearLogs, userRole }: AuditTrackingTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'success' | 'warning' | 'error' | 'info'>('All');

  // Filter logs based on search term and status filter
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.ipAddress || '').includes(searchTerm);

    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalLogs = filteredLogs.length;
  const successCount = filteredLogs.filter((l) => l.status === 'success').length;
  const warningCount = filteredLogs.filter((l) => l.status === 'warning').length;
  const errorCount = filteredLogs.filter((l) => l.status === 'error').length;

  const handleExport = () => {
    const headers = ['ID', 'Timestamp', 'User', 'Action', 'Details', 'IP Address', 'Status'];
    const rows = filteredLogs.map((log) => [
      log.id,
      log.timestamp,
      log.user,
      log.action,
      log.details,
      log.ipAddress || 'N/A',
      log.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `system_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: SystemAuditLog['status']) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="h-3 w-3" /> SUCCESS
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" /> WARNING
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertTriangle className="h-3 w-3" /> CRITICAL
          </span>
        );
      case 'info':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Info className="h-3 w-3" /> SYSTEM
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn" id="audit-logs-tab">
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600" /> Audit & Tracking Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            System level traceability logs recording administrative controls, sync events, modifications, and user authentications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={totalLogs === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Download className="h-3.5 w-3.5" /> Export logs (CSV)
          </button>
          {userRole === 'admin' && (
            <button
              onClick={onClearLogs}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition cursor-pointer border border-red-100 shadow-sm"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear Audit Log
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Traces</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalLogs}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Calendar className="h-5 w-5 text-slate-400" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Successful Actions</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{successCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Warnings</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{warningCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Critical Errors</div>
            <div className="text-2xl font-black text-red-600 mt-1">{errorCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-red-50 border border-red-100">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search logs by action, user or details..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Severity:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="All">All Severities</option>
            <option value="success">Success</option>
            <option value="info">System Info</option>
            <option value="warning">Warning</option>
            <option value="error">Critical Error</option>
          </select>
        </div>
      </div>

      {/* Main Logs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-mono w-24">Trace ID</th>
                <th className="py-3.5 px-4 w-44">Timestamp</th>
                <th className="py-3.5 px-4 w-32">User</th>
                <th className="py-3.5 px-4 w-44">Action Logged</th>
                <th className="py-3.5 px-4">Audit Trace Details</th>
                <th className="py-3.5 px-4 w-28">IP Address</th>
                <th className="py-3.5 px-4 w-32 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[10px] font-bold">{log.id}</td>
                    <td className="py-3.5 px-4 text-slate-500">{log.timestamp}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{log.user}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-indigo-100/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 truncate max-w-xs md:max-w-md lg:max-w-xl" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="py-3.5 px-4 text-center">{getStatusBadge(log.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Shield className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    No audit logs match the current search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
