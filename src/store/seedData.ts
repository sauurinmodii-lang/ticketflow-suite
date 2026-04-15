import type { Site, RoleConfig, AppUser, Group } from '@/types';
import { saveSites, saveRoleConfigs, saveUsers, saveCategories, markSeeded, saveCompany, saveGroups, addGroupMember } from './dataStore';

export function seedIfNeeded() {
  const seeded = localStorage.getItem('tms_seeded');
  if (seeded) return;

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

  const adminRole: RoleConfig = {
    role: 'admin',
    permissions: [
      'create_ticket', 'approve_ticket', 'allocate_ticket', 'resolve_ticket',
      'acknowledge_ticket', 'reopen_ticket', 'view_dashboard', 'manage_users',
      'manage_masters', 'manage_roles', 'view_audit', 'view_reports',
    ],
  };

  saveRoleConfigs([adminRole]);

  const admin: AppUser = {
    id: 'user-1',
    username: 'admin',
    password: 'admin123',
    fullName: 'System Administrator',
    email: 'admin@company.com',
    role: 'admin',
    siteId: 'site-1',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  saveUsers([admin]);

  const group: Group = {
    id: 'group-1',
    name: 'Default Support Group',
    siteIds: ['site-1'],
    description: 'Default support group for Main Office',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  saveGroups([group]);
  addGroupMember({ groupId: 'group-1', userId: 'user-1' });

  saveCompany({ companyName: 'Ticket Management System', logoDataUrl: null });

  markSeeded();
}
