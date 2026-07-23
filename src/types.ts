export interface EmployeeProfile {
  id: string;
  name: string;
  group: string;
  targetHours: number;
}

export interface ActivityLog {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  bu: string;
  group: string;
  type: 'Core' | 'Non-Core';
  name: string;
  hours: number;
  desc: string;
  output?: string;
  volume?: number;
  isRework?: boolean;
  consideredAccurate?: boolean;
  remarks?: string;
  referenceCode?: string;
  targetHours?: number;
  employeeTargetHours?: number;
  dateCompleted?: string;
  dateLogged?: string;
  parentId?: string;
  isTimerCommit?: boolean;
}

export interface SystemLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface NonCoreActivityItem {
  code: string;
  name: string;
  category: string;
}

export interface GroupItem {
  code: string;
  name: string;
}

export interface ServiceItem {
  code: string;
  name: string;
  groupCode: string;
}

export interface ServiceOutputItem {
  code: string;
  name: string;
  serviceCode: string;
  slaTarget?: number;
}

export interface UserAccount {
  username: string;
  password?: string;
  employeeName?: string;
  employeeCode?: string;
  group?: string;
  userLevel?: 'General User' | 'Lead' | 'Department Head' | 'Executive' | 'Administrator';
  assignedGroups?: string[];
  assignedServices?: string[];
  accessGroupAnalytics?: boolean;
  accessPeriodClosing?: boolean;
}

export interface LeaveType {
  code: string;
  name: string;
}

export interface LeaveLog {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  category: 'Leave' | 'Official Business' | 'Undertime';
  leaveType?: string; // Only for Leave
  period?: 'AM' | 'PM' | 'Whole Day'; // Only for Leave
  hours?: number; // For OB and Undertime
  remarks: string;
  timestamp: string;
}

export interface Holiday {
  date: string;
  name: string;
}

export interface PlannedActivity {
  id: string;
  date: string;
  plannedDate?: string;
  employeeId: string;
  employeeName: string;
  username: string;
  group: string;
  bu?: string;
  type: 'Core' | 'Non-Core';
  name: string;
  desc: string;
  output?: string;
  volume?: number;
  hours: number;
  isRework?: boolean;
  consideredAccurate?: boolean;
  referenceCode?: string;
  remarks?: string;
  status: 'Draft' | 'Saved' | 'Converted';
  convertedLogId?: string;
  createdAt: string;
}

export interface MasterData {
  bu: string[];
  group: GroupItem[];
  services: ServiceItem[];
  nonCoreActivity: NonCoreActivityItem[];
  employeeProfile: EmployeeProfile[];
  leaveTypes?: LeaveType[];
  holidays?: Holiday[];
  plannedActivities?: PlannedActivity[];
  serviceOutput?: ServiceOutputItem[];
  adminAccount?: UserAccount;
  regularUserAccount?: UserAccount;
  logo?: string;
  workingDays?: string[];
  workingHours?: number;
  closedPeriods?: string[];
  autoSaveChannels12Enabled?: boolean;
  autoSaveChannels12Interval?: number;
  autoSyncChannels34Enabled?: boolean;
  autoSyncChannels34Interval?: number;
  sharepointFileLinkedName?: string;
  sharepointMasterFileLinkedName?: string;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  ipAddress?: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export type TimerState = 'idle' | 'running' | 'paused' | 'prompting' | 'stopped_options' | 'collecting_output';

export interface ContainerState {
  id: string;
  employeeId: string;
  selectedBu: string;
  selectedGroup: string;
  date: string;
  type: 'Core' | 'Non-Core';
  activityName: string;
  desc: string;
  refNumber: string;
  activityLogCode: string;
  selectedOutput: string;
  volume: string;
  isRework: boolean | null;
  consideredAccurate: boolean | null;
  remarks: string;
  timerState: TimerState;
  startTime: number | null;
  accumulatedSeconds: number;
  validationError: string;
}
