export interface Site {
  id: string;
  name: string;
  address: string;
  city: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface CompanyProfile {
  companyName: string;
  logoDataUrl: string | null;
}

export interface Group {
  id: string;
  name: string;
  siteIds: string[];
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface GroupMember {
  groupId: string;
  userId: string;
}

export type AppRole = 'admin' | 'manager' | 'engineer' | 'user';

export type Permission =
  | 'create_ticket'
  | 'approve_ticket'
  | 'allocate_ticket'
  | 'resolve_ticket'
  | 'acknowledge_ticket'
  | 'reopen_ticket'
  | 'view_dashboard'
  | 'manage_users'
  | 'manage_masters'
  | 'manage_roles'
  | 'view_audit'
  | 'view_reports';

export const ALL_PERMISSIONS: { key: Permission; label: string; group: string }[] = [
  { key: 'create_ticket', label: 'Create Ticket', group: 'Tickets' },
  { key: 'approve_ticket', label: 'Approve Ticket', group: 'Tickets' },
  { key: 'allocate_ticket', label: 'Allocate Ticket', group: 'Tickets' },
  { key: 'resolve_ticket', label: 'Resolve Ticket', group: 'Tickets' },
  { key: 'acknowledge_ticket', label: 'Acknowledge Ticket', group: 'Tickets' },
  { key: 'reopen_ticket', label: 'Reopen Ticket', group: 'Tickets' },
  { key: 'view_dashboard', label: 'View Dashboard', group: 'Pages' },
  { key: 'manage_users', label: 'Manage Users', group: 'Admin' },
  { key: 'manage_masters', label: 'Manage Masters', group: 'Admin' },
  { key: 'manage_roles', label: 'Manage Roles', group: 'Admin' },
  { key: 'view_audit', label: 'View Audit Trail', group: 'Admin' },
  { key: 'view_reports', label: 'View Reports', group: 'Reports' },
];

export interface RoleConfig {
  role: AppRole;
  permissions: Permission[];
}

export interface AppUser {
  id: string;
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: AppRole;
  siteId: string;
  isActive: boolean;
  createdAt: string;
}

export type TicketStatus = 'Open' | 'Approved' | 'Allocated' | 'In Progress' | 'Resolved' | 'Acknowledged' | 'Reopened' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  categoryId: string;
  siteId: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: string;
  assignedGroupId: string | null;
  assignedTo: string | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  userName: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
}
