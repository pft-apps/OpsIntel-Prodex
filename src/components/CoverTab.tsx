import { BookOpen, CheckCircle2, ArrowRight, Settings, Users, Activity, FileText } from 'lucide-react';
import { EmployeeProfile, MasterData } from '../types';

interface CoverTabProps {
  masterData: MasterData;
  onNavigateToLog: () => void;
}

export default function CoverTab({ masterData, onNavigateToLog }: CoverTabProps) {
  return (
    <div className="space-y-6 max-w-none w-full animate-fadeIn">
      {/* Cover Header Grid */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 p-8 shadow-md">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl"></div>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          OpsIntel Prodex Productivity System
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          Designed to help the employees efficiently log their daily activities and measure performance across key metrics: productivity, utilization, timeliness, accuracy, and completeness every month.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
          <span className="flex items-center gap-1.5 bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-700">
            <Settings className="h-3.5 w-3.5 text-blue-400" /> Firebase Cloud Version 1.0
          </span>
          <span className="text-slate-700">|</span>
          <span className="flex items-center gap-1.5 bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-700">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" /> Strict Data Integrity
          </span>
        </div>
      </div>

      {/* Instruction Cards Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Guidelines & Workflows */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
              <BookOpen className="h-4.5 w-4.5 text-blue-600" /> System Instructions
            </h2>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
              {/* Category A */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-50 text-[10px] font-extrabold text-blue-600 border border-blue-100">A</span>
                  Activity Logging
                </h3>
                <ol className="space-y-1.5 pl-5 list-decimal leading-relaxed">
                  <li>Head to &quot;Employee Activity Logger&quot; to Log and time an activity.</li>
                  <li>Input the details for the required fields (required fields have a red asterisk mark on them).</li>
                  <li>You can &quot;Pause&quot;, &quot;Resume&quot; or &quot;Stop&quot; an activity timer by clicking the appropriate button.</li>
                  <li>You can stack multiple activities by clicking the button &quot;Create New Activity.&quot; However this automatically Pauses all the other active activity logs.</li>
                  <li>You can Stop an activity timer and choose to whether complete the activity or continue the activity on a later time/date, by clicking the &quot;Stop&quot; button and following the instructions that will pop up.</li>
                </ol>
              </div>

              {/* Category B */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-50 text-[10px] font-extrabold text-blue-600 border border-blue-100">B</span>
                  Leaves, Time Off & Calendar
                </h3>
                <ol className="space-y-1.5 pl-5 list-decimal leading-relaxed">
                  <li>You can input your leaves and times-offs (including Official Businesses and Undertime) so that the system can measure correct work hours and productivity.</li>
                  <li>You can also edit filed entries to the Leaves & Time Off.</li>
                  <li>You can tag specific days of the month as Holidays on the calendar or import a csv file for one time tagging of multiple days.</li>
                </ol>
              </div>

              {/* Category C */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-50 text-[10px] font-extrabold text-blue-600 border border-blue-100">C</span>
                  Activity Log History
                </h3>
                <ol className="space-y-1.5 pl-5 list-decimal leading-relaxed">
                  <li>You can view a list of your historical activity logs by going to the Navigation Menu &gt; Activity Log History.</li>
                  <li>You can filter the data to be seen on the activity history table by clicking the &quot;Filters&quot; button at the top left of the page (the one with a funnel icon beside it)</li>
                  <li>You can see data only for activity logs you have created.</li>
                </ol>
              </div>

              {/* Category D */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-50 text-[10px] font-extrabold text-blue-600 border border-blue-100">D</span>
                  Activity Planner
                </h3>
                <ol className="space-y-1.5 pl-5 list-decimal leading-relaxed">
                  <li>You can plan for activities that you want to do by creating activity plan items.</li>
                  <li>An activity plan item can be directly converted to employee activity logs by clicking the convert button on saved activities on the activity plan table.</li>
                  <li>A converted activity plan will be removed from the activity plan table once it is converted and will automatically run on the Employee Activity Logger.</li>
                </ol>
              </div>

              {/* Category E */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-50 text-[10px] font-extrabold text-blue-600 border border-blue-100">E</span>
                  Individual Analytics
                </h3>
                <ol className="space-y-1.5 pl-5 list-decimal leading-relaxed">
                  <li>This Menu shows reports and KPIs showing only data coming from the logs you have created.</li>
                </ol>
              </div>

              {/* Category F */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-50 text-[10px] font-extrabold text-blue-600 border border-blue-100">F</span>
                  Consolidated / Group Analytics
                </h3>
                <ol className="space-y-1.5 pl-5 list-decimal leading-relaxed">
                  <li>This Menu is not available to users with the User Level of &quot;General User&quot;</li>
                  <li>This is basically the same reports for the Individual Analytics but are consolidated for the whole entity, it can be filtered by Group, Service, Employee, etc.</li>
                </ol>
              </div>

              {/* Category G */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-50 text-[10px] font-extrabold text-blue-600 border border-blue-100">G</span>
                  Settings &amp; Preferences
                </h3>
                <ol className="space-y-1.5 pl-5 list-decimal leading-relaxed">
                  <li>You can change your details including login credentials.</li>
                </ol>
              </div>

              {/* Category H */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-50 text-[10px] font-extrabold text-blue-600 border border-blue-100">H</span>
                  Audit &amp; Tracking
                </h3>
                <ol className="space-y-1.5 pl-5 list-decimal leading-relaxed">
                  <li>This shows audit logs of what any user did on the system.</li>
                </ol>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end border-t border-slate-100 pt-6">
            <button
              onClick={onNavigateToLog}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 cursor-pointer border-none"
            >
              Open Employee Activity Logger <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Credit Section */}
      <div className="flex justify-center border-t border-slate-100 pt-8 pb-4">
        <div className="text-center space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Authorship</p>
          <p className="text-xs text-slate-600 font-medium">
            Developed by <span className="text-blue-600 font-bold">Patrick Jay F. Tanap</span>
          </p>
          <p className="text-[10px] text-slate-400 max-w-md mx-auto italic leading-relaxed">
            as an enhanced and improved version of the excel tool created by Romel Ropal & Perds Mesina
          </p>
        </div>
      </div>
    </div>
  );
}
