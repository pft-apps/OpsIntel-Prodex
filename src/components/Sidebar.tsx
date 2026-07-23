/**
 * OpsIntel Prodex
 * Developed by: Patrick Jay F. Tanap
 */

import { useState } from 'react';
import { Info, PenTool, Database, Settings, PieChart, Gauge, ChevronLeft, ChevronRight, History, FileJson, Calendar, ClipboardList } from 'lucide-react';
import { MasterData, ActivityLog, SystemLog } from '../types';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tabId: string) => void;
  masterData: MasterData;
  activityLogs: ActivityLog[];
  onRunMacro: (macro: 'compile' | 'audit') => void;
  systemLogs: SystemLog[];
  onClearSystemLogs: () => void;
  isTimerActive?: boolean;
  loggedInUser?: { role: 'admin' | 'user'; username: string } | null;
}

export default function Sidebar({
  currentTab,
  onTabChange,
  masterData,
  activityLogs,
  onRunMacro,
  systemLogs,
  onClearSystemLogs,
  isTimerActive = false,
  loggedInUser,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const cached = localStorage.getItem('productivity_sidebar_collapsed');
    return cached ? JSON.parse(cached) : false;
  });

  const checkConsolidatedAccess = () => {
    if (loggedInUser?.role === 'admin') return true;
    const userAccount = masterData.regularUserAccount;
    if (!userAccount) return false;
    if (userAccount.userLevel === 'Administrator') return true;
    if (userAccount.userLevel === 'General User') return false;
    return userAccount.accessGroupAnalytics || false;
  };
  const showConsolidated = checkConsolidatedAccess();

  const toggleCollapse = () => {
    setIsCollapsed((prev: boolean) => {
      const next = !prev;
      localStorage.setItem('productivity_sidebar_collapsed', JSON.stringify(next));
      return next;
    });
  };

  return (
    <aside className={`${isCollapsed ? 'w-18' : 'w-80'} bg-brand-60 border-r border-brand-20/30 flex flex-col justify-between shrink-0 overflow-y-auto custom-scrollbar transition-all duration-300`}>
      {/* Upper content section */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} space-y-6 flex-1`}>
        {/* Sidebar Toggle Area */}
        <div className={`flex items-center pb-2 border-b border-brand-20/30 ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4`}>
          {!isCollapsed && (
            <span className="text-[10px] uppercase text-slate-400 tracking-wider font-extrabold px-1">
              Navigation Menu
            </span>
          )}
          <button
            type="button"
            onClick={toggleCollapse}
            className="p-1.5 rounded hover:bg-brand-20/40 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isCollapsed ? "Expand Navigation Menu" : "Collapse Navigation Menu"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div>
          {!isCollapsed && (
            <div className="text-[10px] uppercase text-slate-400 tracking-wider font-extrabold px-3 mb-2.5">
              Productivity Menus
            </div>
          )}
          <nav className="space-y-1">
            {/* Cover & Instructions */}
            <button
              onClick={() => onTabChange('cover')}
              title="Cover & Instructions"
              className={`w-full text-left rounded-lg text-xs font-semibold flex items-center group transition-all duration-200 ${
                isCollapsed ? 'justify-center py-3 px-2' : 'justify-between px-3 py-2.5'
              } ${
                currentTab === 'cover'
                  ? 'bg-brand-20 text-white shadow-sm cursor-default'
                  : isTimerActive
                  ? 'text-slate-600 cursor-not-allowed opacity-50'
                  : 'text-slate-300 hover:text-white hover:bg-accent-purple/20 cursor-pointer'
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? 'space-x-0' : 'space-x-3'}`}>
                <Info className={`h-4 w-4 shrink-0 transition-colors ${currentTab === 'cover' ? 'text-white' : isTimerActive ? 'text-slate-700' : 'text-slate-400 group-hover:text-accent-turquoise'}`} />
                {!isCollapsed && <span>Cover & Instructions</span>}
              </div>
            </button>

            {/* Leaves, Time Off & Calendar */}
            <button
              onClick={() => onTabChange('leave-log')}
              title="Leaves, Time Off & Calendar"
              className={`w-full text-left rounded-lg text-xs font-semibold flex items-center group transition-all duration-200 cursor-pointer ${
                isCollapsed ? 'justify-center py-3 px-2' : 'justify-between px-3 py-2.5'
              } ${
                currentTab === 'leave-log'
                  ? 'bg-brand-20 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-accent-purple/20'
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? 'space-x-0' : 'space-x-3'}`}>
                <Calendar className={`h-4 w-4 shrink-0 transition-colors ${currentTab === 'leave-log' ? 'text-white' : 'text-slate-400 group-hover:text-accent-turquoise'}`} />
                {!isCollapsed && <span>Leaves, Time Off & Calendar</span>}
              </div>
            </button>

            {/* Log Activity Here */}
            <button
              onClick={() => onTabChange('log')}
              title="Employee Activity Logger"
              className={`w-full text-left rounded-lg text-xs font-semibold flex items-center group transition-all duration-200 cursor-pointer ${
                isCollapsed ? 'justify-center py-3 px-2' : 'justify-between px-3 py-2.5'
              } ${
                currentTab === 'log'
                  ? 'bg-brand-20 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-accent-purple/20'
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? 'space-x-0' : 'space-x-3'}`}>
                <PenTool className={`h-4 w-4 shrink-0 transition-colors ${currentTab === 'log' ? 'text-white' : 'text-slate-400 group-hover:text-accent-turquoise'}`} />
                {!isCollapsed && <span>Employee Activity Logger</span>}
              </div>
            </button>

            {/* Activity Database */}
            <button
              onClick={() => onTabChange('database')}
              title="Activity Log History"
              className={`w-full text-left rounded-lg text-xs font-semibold flex items-center group transition-all duration-200 ${
                isCollapsed ? 'justify-center py-3 px-2' : 'justify-between px-3 py-2.5'
              } ${
                currentTab === 'database'
                  ? 'bg-brand-20 text-white shadow-sm cursor-default'
                  : 'text-slate-300 hover:text-white hover:bg-accent-purple/20 cursor-pointer'
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? 'space-x-0' : 'space-x-3'}`}>
                <Database className={`h-4 w-4 shrink-0 transition-colors ${currentTab === 'database' ? 'text-white' : 'text-slate-400 group-hover:text-accent-turquoise'}`} />
                {!isCollapsed && <span>Activity Log History</span>}
              </div>
            </button>

            {/* Activity Planner */}
            <button
              onClick={() => onTabChange('planner')}
              title="Activity Planner"
              className={`w-full text-left rounded-lg text-xs font-semibold flex items-center group transition-all duration-200 cursor-pointer ${
                isCollapsed ? 'justify-center py-3 px-2' : 'justify-between px-3 py-2.5'
              } ${
                currentTab === 'planner'
                  ? 'bg-brand-20 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-accent-purple/20'
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? 'space-x-0' : 'space-x-3'}`}>
                <ClipboardList className={`h-4 w-4 shrink-0 transition-colors ${currentTab === 'planner' ? 'text-white' : 'text-slate-400 group-hover:text-accent-turquoise'}`} />
                {!isCollapsed && <span>Activity Planner</span>}
              </div>
            </button>
          </nav>
        </div>

        <div>
          {!isCollapsed && (
            <div className="text-[10px] uppercase text-slate-400 tracking-wider font-extrabold px-3 mb-2.5">
              Individual Analytics
            </div>
          )}
          <nav className="space-y-1">
            {/* Summary Report */}
            <button
              onClick={() => onTabChange('summary')}
              title="Summary Report"
              className={`w-full text-left rounded-lg text-xs font-semibold flex items-center group transition-all duration-200 ${
                isCollapsed ? 'justify-center py-3 px-2' : 'justify-between px-3 py-2.5'
              } ${
                currentTab === 'summary'
                  ? 'bg-brand-20 text-white shadow-sm cursor-default'
                  : isTimerActive
                  ? 'text-slate-600 cursor-not-allowed opacity-50'
                  : 'text-slate-300 hover:text-white hover:bg-accent-purple/20 cursor-pointer'
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? 'space-x-0' : 'space-x-3'}`}>
                <PieChart className={`h-4 w-4 shrink-0 transition-colors ${currentTab === 'summary' ? 'text-white' : isTimerActive ? 'text-slate-700' : 'text-slate-400 group-hover:text-accent-turquoise'}`} />
                {!isCollapsed && <span>Summary Report</span>}
              </div>
            </button>

            {/* Performance Report */}
            <button
              onClick={() => onTabChange('performance')}
              title="Performance Report"
              className={`w-full text-left rounded-lg text-xs font-semibold flex items-center group transition-all duration-200 ${
                isCollapsed ? 'justify-center py-3 px-2' : 'justify-between px-3 py-2.5'
              } ${
                currentTab === 'performance'
                  ? 'bg-brand-20 text-white shadow-sm cursor-default'
                  : isTimerActive
                  ? 'text-slate-600 cursor-not-allowed opacity-50'
                  : 'text-slate-300 hover:text-white hover:bg-accent-purple/20 cursor-pointer'
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? 'space-x-0' : 'space-x-3'}`}>
                <Gauge className={`h-4 w-4 shrink-0 transition-colors ${currentTab === 'performance' ? 'text-white' : isTimerActive ? 'text-slate-700' : 'text-slate-400 group-hover:text-accent-turquoise'}`} />
                {!isCollapsed && <span>Performance Report</span>}
              </div>
            </button>
          </nav>
        </div>

        {showConsolidated && (
          <div>
            {!isCollapsed && (
              <div className="text-[10px] uppercase text-slate-400 tracking-wider font-extrabold px-3 mb-2.5">
                CONSOLIDATED / GROUP ANALYTICS
              </div>
            )}
            <nav className="space-y-1">
              {/* Team Activity Plans */}
              <button
                onClick={() => onTabChange('team-planner')}
                title="Team Activity Plans"
                className={`w-full text-left rounded-lg text-xs font-semibold flex items-center group transition-all duration-200 cursor-pointer ${
                  isCollapsed ? 'justify-center py-3 px-2' : 'justify-between px-3 py-2.5'
                } ${
                  currentTab === 'team-planner'
                    ? 'bg-brand-20 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-accent-purple/20'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'space-x-0' : 'space-x-3'}`}>
                  <ClipboardList className={`h-4 w-4 shrink-0 transition-colors ${currentTab === 'team-planner' ? 'text-white' : 'text-slate-400 group-hover:text-accent-turquoise'}`} />
                  {!isCollapsed && <span>Team Activity Plans</span>}
                </div>
              </button>

              {/* Activity Log History */}
              <button
                onClick={() => onTabChange('consolidated-database')}
                title="Activity Log History"
                className={`w-full text-left rounded-lg text-xs font-semibold flex items-center group transition-all duration-200 ${
                  isCollapsed ? 'justify-center py-3 px-2' : 'justify-between px-3 py-2.5'
                } ${
                  currentTab === 'consolidated-database'
                    ? 'bg-brand-20 text-white shadow-sm cursor-default'
                    : 'text-slate-300 hover:text-white hover:bg-accent-purple/20 cursor-pointer'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'space-x-0' : 'space-x-3'}`}>
                  <Database className={`h-4 w-4 shrink-0 transition-colors ${currentTab === 'consolidated-database' ? 'text-white' : 'text-slate-400 group-hover:text-accent-turquoise'}`} />
                  {!isCollapsed && <span>Activity Log History</span>}
                </div>
              </button>

              {/* Summary Report */}
              <button
                onClick={() => onTabChange('consolidated-summary')}
                title="Summary Report"
                className={`w-full text-left rounded-lg text-xs font-semibold flex items-center group transition-all duration-200 ${
                  isCollapsed ? 'justify-center py-3 px-2' : 'justify-between px-3 py-2.5'
                } ${
                  currentTab === 'consolidated-summary'
                    ? 'bg-brand-20 text-white shadow-sm cursor-default'
                    : isTimerActive
                    ? 'text-slate-600 cursor-not-allowed opacity-50'
                    : 'text-slate-300 hover:text-white hover:bg-accent-purple/20 cursor-pointer'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'space-x-0' : 'space-x-3'}`}>
                  <PieChart className={`h-4 w-4 shrink-0 transition-colors ${currentTab === 'consolidated-summary' ? 'text-white' : isTimerActive ? 'text-slate-700' : 'text-slate-400 group-hover:text-accent-turquoise'}`} />
                  {!isCollapsed && <span>Summary Report</span>}
                </div>
              </button>

              {/* Performance Report */}
              <button
                onClick={() => onTabChange('consolidated-performance')}
                title="Performance Report"
                className={`w-full text-left rounded-lg text-xs font-semibold flex items-center group transition-all duration-200 ${
                  isCollapsed ? 'justify-center py-3 px-2' : 'justify-between px-3 py-2.5'
                } ${
                  currentTab === 'consolidated-performance'
                    ? 'bg-brand-20 text-white shadow-sm cursor-default'
                    : isTimerActive
                    ? 'text-slate-600 cursor-not-allowed opacity-50'
                    : 'text-slate-300 hover:text-white hover:bg-accent-purple/20 cursor-pointer'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'space-x-0' : 'space-x-3'}`}>
                  <Gauge className={`h-4 w-4 shrink-0 transition-colors ${currentTab === 'consolidated-performance' ? 'text-white' : isTimerActive ? 'text-slate-700' : 'text-slate-400 group-hover:text-accent-turquoise'}`} />
                  {!isCollapsed && <span>Performance Report</span>}
                </div>
              </button>
            </nav>
          </div>
        )}


      </div>

      {/* Bottom config section */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-brand-20/20`}>
        {!isCollapsed && (
          <div className="text-[10px] uppercase text-slate-400 tracking-wider font-extrabold px-3 mb-2.5">
            SYSTEM & CONFIGURATIONS
          </div>
        )}
        <nav className="space-y-1">
          {/* Admin Cloud Storage Console */}
          {loggedInUser?.role === 'admin' && (
            <button
              onClick={() => onTabChange('admin-cloud')}
              title="Cloud Storage Console"
              className={`w-full text-left rounded-lg text-xs font-semibold flex items-center group transition-all duration-200 ${
                isCollapsed ? 'justify-center py-3 px-2' : 'justify-between px-3 py-2.5'
              } ${
                currentTab === 'admin-cloud'
                  ? 'bg-brand-20 text-white shadow-sm cursor-default'
                  : 'text-slate-300 hover:text-white hover:bg-accent-purple/20 cursor-pointer'
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? 'space-x-0' : 'space-x-3'}`}>
                <Database className={`h-4 w-4 shrink-0 transition-colors ${currentTab === 'admin-cloud' ? 'text-white' : 'text-slate-400 group-hover:text-accent-turquoise'}`} />
                {!isCollapsed && <span>Cloud Storage Console</span>}
              </div>
            </button>
          )}

          {/* Settings Registry */}
          <button
            id="settings-nav-btn"
            onClick={() => onTabChange('settings')}
            title="Settings & Preferences"
            className={`w-full text-left rounded-lg text-xs font-semibold flex items-center group transition-all duration-200 ${
              isCollapsed ? 'justify-center py-3 px-2' : 'justify-between px-3 py-2.5'
            } ${
              currentTab === 'settings'
                ? 'bg-brand-20 text-white shadow-sm cursor-default'
                : isTimerActive
                ? 'text-slate-600 cursor-not-allowed opacity-50'
                : 'text-slate-300 hover:text-white hover:bg-accent-purple/20 cursor-pointer'
            }`}
          >
            <div className={`flex items-center ${isCollapsed ? 'space-x-0' : 'space-x-3'}`}>
              <Settings className={`h-4 w-4 shrink-0 transition-colors ${currentTab === 'settings' ? 'text-white' : isTimerActive ? 'text-slate-700' : 'text-slate-400 group-hover:text-accent-turquoise'}`} />
              {!isCollapsed && <span>Settings & Preferences</span>}
            </div>
          </button>

          {/* Audit & Tracking */}
          <button
            id="audit-nav-btn"
            onClick={() => onTabChange('audit-tracking')}
            title="Audit & Tracking"
            className={`w-full text-left rounded-lg text-xs font-semibold flex items-center group transition-all duration-200 ${
              isCollapsed ? 'justify-center py-3 px-2' : 'justify-between px-3 py-2.5'
            } ${
              currentTab === 'audit-tracking'
                ? 'bg-brand-20 text-white shadow-sm cursor-default'
                : isTimerActive
                ? 'text-slate-600 cursor-not-allowed opacity-50'
                : 'text-slate-300 hover:text-white hover:bg-accent-purple/20 cursor-pointer'
            }`}
          >
            <div className={`flex items-center ${isCollapsed ? 'space-x-0' : 'space-x-3'}`}>
              <History className={`h-4 w-4 shrink-0 transition-colors ${currentTab === 'audit-tracking' ? 'text-white' : isTimerActive ? 'text-slate-700' : 'text-slate-400 group-hover:text-accent-turquoise'}`} />
              {!isCollapsed && <span>Audit & Tracking</span>}
            </div>
          </button>
        </nav>
      </div>
    </aside>
  );
}
