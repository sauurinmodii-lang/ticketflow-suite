import type { Site, RoleConfig, AppUser } from '@/types';
import { saveSites, saveRoleConfigs, saveUsers, saveCategories, markSeeded, saveCompany } from './dataStore';

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

  saveCategories([
    { id: 'cat-1', name: 'Hardware', description: 'Hardware related issues', isActive: true, createdAt: new Date().toISOString() },
    { id: 'cat-2', name: 'Software', description: 'Software related issues', isActive: true, createdAt: new Date().toISOString() },
    { id: 'cat-3', name: 'Network', description: 'Network connectivity issues', isActive: true, createdAt: new Date().toISOString() },
  ]);

  const adminRole: RoleConfig = {
    role: 'admin',
    permissions: [
      'create_ticket', 'approve_ticket', 'allocate_ticket', 'resolve_ticket',
      'acknowledge_ticket', 'reopen_ticket', 'view_dashboard', 'manage_users',
      'manage_masters', 'manage_roles', 'view_audit', 'view_reports',
    ],
  };

  const managerRole: RoleConfig = {
    role: 'manager',
    permissions: [
      'create_ticket', 'approve_ticket', 'allocate_ticket',
      'acknowledge_ticket', 'reopen_ticket', 'view_dashboard', 'view_reports',
    ],
  };

  const engineerRole: RoleConfig = {
    role: 'engineer',
    permissions: ['create_ticket', 'resolve_ticket', 'view_dashboard'],
  };

  const userRole: RoleConfig = {
    role: 'user',
    permissions: ['create_ticket', 'acknowledge_ticket', 'reopen_ticket'],
  };

  saveRoleConfigs([adminRole, managerRole, engineerRole, userRole]);

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

  saveCompany({ companyName: 'Ticket Management System', logoDataUrl: null });

  markSeeded();
}
