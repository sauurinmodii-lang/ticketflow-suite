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

// AppRole is now dynamic — system roles use well-known IDs, custom roles use UUIDs
export type AppRole = string;

export type Permission =
  | 'view_tickets'
  | 'create_ticket'
  | 'approve_ticket'
  | 'allocate_ticket'
  | 'resolve_ticket'
  | 'acknowledge_ticket'
  | 'reopen_ticket'
  | 'close_ticket'
  | 'view_dashboard'
  | 'view_users'
  | 'manage_users'
  | 'view_masters'
  | 'manage_masters'
  | 'view_groups'
  | 'manage_groups'
  | 'view_roles'
  | 'manage_roles'
  | 'view_audit'
  | 'view_reports';

// Maps a write permission to its implied read permission
export const PERMISSION_READ_DEPS: Partial<Record<Permission, Permission>> = {
  create_ticket: 'view_tickets',
  approve_ticket: 'view_tickets',
  allocate_ticket: 'view_tickets',
  resolve_ticket: 'view_tickets',
  acknowledge_ticket: 'view_tickets',
  reopen_ticket: 'view_tickets',
  close_ticket: 'view_tickets',
  manage_users: 'view_users',
  manage_masters: 'view_masters',
  manage_groups: 'view_groups',
  manage_roles: 'view_roles',
};

export const ALL_PERMISSIONS: { key: Permission; label: string; group: string }[] = [
  { key: 'view_dashboard', label: 'View Dashboard', group: 'Dashboard' },
  { key: 'view_tickets', label: 'View Tickets', group: 'Tickets' },
  { key: 'create_ticket', label: 'Create Ticket', group: 'Tickets' },
  { key: 'approve_ticket', label: 'Approve Ticket', group: 'Tickets' },
  { key: 'allocate_ticket', label: 'Allocate / Assign Ticket', group: 'Tickets' },
  { key: 'resolve_ticket', label: 'Resolve Ticket', group: 'Tickets' },
  { key: 'acknowledge_ticket', label: 'Acknowledge Ticket', group: 'Tickets' },
  { key: 'reopen_ticket', label: 'Reopen Ticket', group: 'Tickets' },
  { key: 'close_ticket', label: 'Close Ticket', group: 'Tickets' },
  { key: 'view_users', label: 'View Users', group: 'Users' },
  { key: 'manage_users', label: 'Manage Users (CRUD)', group: 'Users' },
  { key: 'view_masters', label: 'View Masters (Sites / Categories)', group: 'Masters' },
  { key: 'manage_masters', label: 'Manage Masters (CRUD)', group: 'Masters' },
  { key: 'view_groups', label: 'View Groups', group: 'Groups' },
  { key: 'manage_groups', label: 'Manage Groups (CRUD)', group: 'Groups' },
  { key: 'view_roles', label: 'View Roles', group: 'Roles' },
  { key: 'manage_roles', label: 'Manage Roles & Permissions', group: 'Roles' },
  { key: 'view_audit', label: 'View Audit Trail', group: 'Audit & Reports' },
  { key: 'view_reports', label: 'View Reports', group: 'Audit & Reports' },
];

// Expands a permission set to include all implied read-access permissions
export function expandPermissions(perms: Permission[]): Permission[] {
  const set = new Set<Permission>(perms);
  for (const perm of perms) {
    const dep = PERMISSION_READ_DEPS[perm];
    if (dep) set.add(dep);
  }
  return Array.from(set);
}

export interface CustomRole {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isSystem: boolean;
  permissions: Permission[];
  createdAt: string;
}

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
  groupId?: string | null;
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
  remarks: string | null;
  timestamp: string;
}
