import type { Site, AppUser, Group, CustomRole } from '@/types';
import { saveSites, saveCustomRoles, saveUsers, saveCategories, markSeeded, saveCompany, saveGroups, addGroupMember, isSeeded } from './dataStore';

export function seedIfNeeded() {
  if (isSeeded()) return;

  const site: Site = {
    id: 'site-1',
    name: 'Main Office',
    address: '123 Business Park',
    city: 'Mumbai',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  saveSites([site]);

  saveCategories([]);

  const now = new Date().toISOString();

  const roles: CustomRole[] = [
    {
      id: 'role-admin',
      name: 'Admin',
      description: 'Full system access',
      isActive: true,
      isSystem: true,
      permissions: [
        'view_dashboard',
        'view_tickets', 'create_ticket', 'approve_ticket', 'allocate_ticket',
        'resolve_ticket', 'acknowledge_ticket', 'reopen_ticket', 'close_ticket',
        'view_users', 'manage_users',
        'view_masters', 'manage_masters',
        'view_groups', 'manage_groups',
        'view_roles', 'manage_roles',
        'view_audit',
        'view_reports',
      ],
      createdAt: now,
    },
    {
      id: 'role-manager',
      name: 'Manager',
      description: 'Manage tickets, approve and allocate',
      isActive: true,
      isSystem: true,
      permissions: [
        'view_dashboard',
        'view_tickets', 'create_ticket', 'approve_ticket', 'allocate_ticket',
        'acknowledge_ticket', 'reopen_ticket', 'close_ticket',
        'view_users',
        'view_masters',
        'view_groups',
        'view_reports',
      ],
      createdAt: now,
    },
    {
      id: 'role-engineer',
      name: 'Engineer',
      description: 'Work on and resolve tickets',
      isActive: true,
      isSystem: true,
      permissions: [
        'view_dashboard',
        'view_tickets', 'create_ticket', 'resolve_ticket',
        'view_masters',
        'view_groups',
      ],
      createdAt: now,
    },
    {
      id: 'role-user',
      name: 'User',
      description: 'Create and view own tickets',
      isActive: true,
      isSystem: true,
      permissions: [
        'view_dashboard',
        'view_tickets', 'create_ticket',
      ],
      createdAt: now,
    },
  ];

  saveCustomRoles(roles);

  const admin: AppUser = {
    id: 'user-1',
    username: 'admin',
    password: 'admin123',
    fullName: 'System Administrator',
    email: 'admin@company.com',
    role: 'role-admin',
    siteId: 'site-1',
    groupId: 'group-1',
    isActive: true,
    createdAt: now,
  };

  saveUsers([admin]);

  const group: Group = {
    id: 'group-1',
    name: 'Default Support Group',
    siteIds: ['site-1'],
    description: 'Default support group for Main Office',
    isActive: true,
    createdAt: now,
  };
  saveGroups([group]);
  addGroupMember({ groupId: 'group-1', userId: 'user-1' });

  saveCompany({ companyName: 'Ticket Management System', logoDataUrl: null });

  markSeeded();
}
