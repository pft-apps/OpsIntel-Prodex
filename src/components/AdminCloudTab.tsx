import React, { useState, useEffect } from 'react';
import { Database, Search, RefreshCw, Layers, ShieldAlert, Eye, FileText, Calendar, Terminal, Users, AlertCircle, Trash2 } from 'lucide-react';
import {
  loadUsersFromFirestore,
  loadMasterDataFromFirestore,
  loadActivityLogsFromFirestore,
  loadLeaveLogsFromFirestore,
  loadAuditLogsFromFirestore,
  loadSystemLogsFromFirestore,
  deleteSystemLogFromFirestore,
  clearAllSystemLogsInFirestore
} from '../utils/firebase';

interface AdminCloudTabProps {
  loggedInUser: { role: 'admin' | 'user'; username: string } | null;
}

type CollectionType = 'users' | 'master_data' | 'activity_logs' | 'leave_logs' | 'audit_logs' | 'system_logs';

export default function AdminCloudTab({ loggedInUser }: AdminCloudTabProps) {
  const [selectedCollection, setSelectedCollection] = useState<CollectionType>('activity_logs');
  const [data, setData] = useState<any[]>([]);
  const [cursors, setCursors] = useState<Record<string, any>>({});
  const [hasMore, setHasMore] = useState<Record<string, boolean>>({});
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [viewDoc, setViewDoc] = useState<any | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [stats, setStats] = useState<Record<CollectionType, number>>({
    users: 0,
    master_data: 0,
    activity_logs: 0,
    leave_logs: 0,
    audit_logs: 0,
    system_logs: 0
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const loadData = async (collection: CollectionType, loadMore: boolean = false) => {
    if (loadMore) setLoadingMore(true);
    else setLoading(true);
    
    if (!loadMore) setViewDoc(null);
    try {
      let results: any[] = [];
      let nextCursor = null;
      let more = false;
      
      const currentCursor = loadMore ? cursors[collection] : undefined;

      switch (collection) {
        case 'users': {
          const res = await loadUsersFromFirestore(currentCursor);
          results = res.data; nextCursor = res.lastDoc; more = res.hasMore;
          break;
        }
        case 'master_data': {
          const md = await loadMasterDataFromFirestore();
          results = md ? [md] : [];
          more = false;
          break;
        }
        case 'activity_logs': {
          const res = await loadActivityLogsFromFirestore(currentCursor);
          results = res.data; nextCursor = res.lastDoc; more = res.hasMore;
          break;
        }
        case 'leave_logs': {
          const res = await loadLeaveLogsFromFirestore(currentCursor);
          results = res.data; nextCursor = res.lastDoc; more = res.hasMore;
          break;
        }
        case 'audit_logs': {
          const res = await loadAuditLogsFromFirestore(currentCursor);
          results = res.data; nextCursor = res.lastDoc; more = res.hasMore;
          break;
        }
        case 'system_logs': {
          const res = await loadSystemLogsFromFirestore(currentCursor);
          results = res.data; nextCursor = res.lastDoc; more = res.hasMore;
          break;
        }
      }
      
      setData(prev => loadMore ? [...prev, ...results] : results);
      setCursors(prev => ({ ...prev, [collection]: nextCursor }));
      setHasMore(prev => ({ ...prev, [collection]: more }));
      
      setStats(prev => ({ 
        ...prev, 
        [collection]: loadMore ? prev[collection] + results.length : results.length 
      }));
    } catch (e) {
      console.error('Failed to load collection:', e);
    } finally {
      if (loadMore) setLoadingMore(false);
      else setLoading(false);
    }
  };

  const loadAllStats = async () => {
    try {
      const u = await loadUsersFromFirestore();
      const md = await loadMasterDataFromFirestore();
      const act = await loadActivityLogsFromFirestore();
      const lv = await loadLeaveLogsFromFirestore();
      const aud = await loadAuditLogsFromFirestore();
      const sys = await loadSystemLogsFromFirestore();
      setStats({
        users: u.data.length,
        master_data: md ? 1 : 0,
        activity_logs: act.data.length,
        leave_logs: lv.data.length,
        audit_logs: aud.data.length,
        system_logs: sys.data.length
      });
      setCursors({
        users: u.lastDoc,
        activity_logs: act.lastDoc,
        leave_logs: lv.lastDoc,
        audit_logs: aud.lastDoc,
        system_logs: sys.lastDoc
      });
      setHasMore({
        users: u.hasMore,
        activity_logs: act.hasMore,
        leave_logs: lv.hasMore,
        audit_logs: aud.hasMore,
        system_logs: sys.hasMore
      });
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  };

  const handleDeleteSystemLog = async (logId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showNotification(`Deleting system log: ${logId}...`, 'info');
    try {
      await deleteSystemLogFromFirestore(logId);
      await loadData('system_logs');
      await loadAllStats();
      showNotification(`Successfully deleted system log: ${logId}`, 'success');
    } catch (err) {
      console.error('Failed to delete system log:', err);
      showNotification(`Failed to delete system log: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const handleClearAllSystemLogs = async () => {
    showNotification('Clearing all system logs from Cloud Storage...', 'info');
    try {
      await clearAllSystemLogsInFirestore();
      await loadData('system_logs');
      await loadAllStats();
      showNotification('All system logs successfully cleared from Cloud Storage!', 'success');
    } catch (err) {
      console.error('Failed to clear system logs:', err);
      showNotification(`Failed to clear system logs: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  useEffect(() => {
    if (loggedInUser?.role === 'admin') {
      loadData(selectedCollection);
      loadAllStats();
    }
  }, [selectedCollection, loggedInUser]);

  if (loggedInUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-2xl border border-slate-200">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-extrabold text-slate-900">Access Denied</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          You must be signed in as an Administrator to access the administrative cloud storage dashboard.
        </p>
      </div>
    );
  }

  // Filter records based on search term
  const filteredData = data.filter(item => {
    if (!search) return true;
    const serialized = JSON.stringify(item).toLowerCase();
    return serialized.includes(search.toLowerCase());
  });

  const getCollectionIcon = (type: CollectionType) => {
    switch (type) {
      case 'users': return <Users className="h-5 w-5" />;
      case 'master_data': return <Database className="h-5 w-5" />;
      case 'activity_logs': return <FileText className="h-5 w-5" />;
      case 'leave_logs': return <Calendar className="h-5 w-5" />;
      case 'audit_logs': return <ShieldAlert className="h-5 w-5" />;
      case 'system_logs': return <Terminal className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in" id="admin-cloud-tab">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-150 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6 text-accent-turquoise" />
            Cloud Storage Console (Admin)
          </h2>
          <p className="text-xs text-slate-500">
            Real-time direct cloud connection to your Google Cloud Firestore database.
          </p>
        </div>
        <button
          onClick={() => { loadData(selectedCollection); loadAllStats(); }}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition font-bold text-xs border border-slate-250 disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Reload Database
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between shadow-xs animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 animate-pulse' 
            : notification.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)} 
            className="hover:opacity-75 font-mono text-[14px] cursor-pointer px-1 text-slate-400 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid selector / statistics cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {(['activity_logs', 'leave_logs', 'users', 'audit_logs', 'system_logs', 'master_data'] as CollectionType[]).map((col) => {
          const isActive = selectedCollection === col;
          return (
            <button
              key={col}
              onClick={() => setSelectedCollection(col)}
              className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between h-28 cursor-pointer relative overflow-hidden ${
                isActive
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={isActive ? 'text-white' : 'text-slate-400'}>
                  {getCollectionIcon(col)}
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              </div>
              <div>
                <div className={`text-[10px] font-bold tracking-wider uppercase ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                  {col.replace('_', ' ')}
                </div>
                <div className="text-xl font-extrabold mt-0.5">
                  {stats[col] || 0}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main console viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Document list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-150 overflow-hidden flex flex-col shadow-sm">
          {/* Header & Search */}
          <div className="p-4 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-accent-turquoise" />
                Collection: {selectedCollection.replace('_', ' ').toUpperCase()}
              </h3>
              {selectedCollection === 'system_logs' && data.length > 0 && (
                <button
                  onClick={handleClearAllSystemLogs}
                  className="px-2.5 py-1 text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear All
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-250 rounded-xl text-xs w-full sm:w-64 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* List area */}
          <div className="flex-1 overflow-y-auto max-h-[500px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin mb-3 text-blue-600" />
                <span className="text-xs font-bold">Querying Cloud Firestore...</span>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <AlertCircle className="h-8 w-8 mb-2" />
                <span className="text-xs">No documents found in this collection matching search.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 flex flex-col">
                {filteredData.map((doc, idx) => {
                  return (
                    <div
                      key={doc.id || idx}
                      onClick={() => setViewDoc(doc)}
                      className={`p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                        viewDoc === doc ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="text-xs font-extrabold text-slate-800 font-mono flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">Doc ID:</span>
                          <span className="text-blue-700">{doc.id || doc.username || `RECORD-${idx + 1}`}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-md">
                          {selectedCollection === 'users' && `Employee: ${doc.employeeName || doc.username} | Level: ${doc.userLevel}`}
                          {selectedCollection === 'activity_logs' && `Task: ${doc.name} | Bu: ${doc.bu} | Hours: ${doc.hours} hrs`}
                          {selectedCollection === 'leave_logs' && `Type: ${doc.category} | Employee: ${doc.employeeName} | Date: ${doc.date}`}
                          {selectedCollection === 'audit_logs' && `Action: ${doc.action} | User: ${doc.user} | Status: ${doc.status}`}
                          {selectedCollection === 'system_logs' && `Message: ${doc.message}`}
                          {selectedCollection === 'master_data' && `VBA Config Document`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setViewDoc(doc)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border border-slate-250 transition cursor-pointer flex items-center justify-center shadow-xs"
                          title="Inspect JSON"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {selectedCollection === 'system_logs' && doc.id && (
                          <button
                            onClick={(e) => handleDeleteSystemLog(doc.id, e)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg border border-red-200 transition cursor-pointer flex items-center justify-center shadow-xs"
                            title="Delete System Log"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              
                {hasMore[selectedCollection] && !search && (
                  <button 
                    onClick={() => loadData(selectedCollection, true)}
                    disabled={loadingMore}
                    className="p-3 text-xs font-bold text-blue-600 hover:bg-blue-50 transition w-full border-t border-slate-150 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loadingMore ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Load More (Next 20)'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column - Document JSON Viewer */}
        <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden flex flex-col h-full shadow-sm">
          <div className="p-4 border-b border-slate-150 bg-slate-50">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Document Inspector
            </h3>
          </div>
          <div className="flex-1 p-4 overflow-auto max-h-[500px] min-h-[300px] font-mono text-[11px] bg-slate-950 text-emerald-400">
            {viewDoc ? (
              <pre className="whitespace-pre-wrap">{JSON.stringify(viewDoc, null, 2)}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 font-sans p-6 text-center">
                <Eye className="h-8 w-8 mb-2" />
                <p className="text-xs">Select a document from the left to inspect its structural JSON schema and attributes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
