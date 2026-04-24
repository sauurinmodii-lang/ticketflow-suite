import type { Site, Category, CompanyProfile, RoleConfig, AppUser, Ticket, AuditEntry, AppRole, Permission, Group, GroupMember, CustomRole, SlaPriority } from '@/types';
import { expandPermissions } from '@/types';

const KEYS = {
  sites: 'tms_sites',
  categories: 'tms_categories',
  company: 'tms_company',
  customRoles: 'tms_custom_roles',
  users: 'tms_users',
  tickets: 'tms_tickets',
  audit: 'tms_audit',
  groups: 'tms_groups',
  groupMembers: 'tms_group_members',
  slaPriorities: 'tms_sla_priorities',
  seeded: 'tms_seeded_v3',
};

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Sites ---
export const getSites = (): Site[] => get(KEYS.sites, []);
export const saveSites = (s: Site[]) => set(KEYS.sites, s);
export const addSite = (s: Site) => { const all = getSites(); all.push(s); saveSites(all); };
export const updateSite = (s: Site) => { saveSites(getSites().map(x => x.id === s.id ? s : x)); };
export const deleteSite = (id: string) => { saveSites(getSites().filter(x => x.id !== id)); };

// --- Categories ---
export const getCategories = (): Category[] => get(KEYS.categories, []);
export const saveCategories = (c: Category[]) => set(KEYS.categories, c);
export const addCategory = (c: Category) => { const all = getCategories(); all.push(c); saveCategories(all); };
export const updateCategory = (c: Category) => { saveCategories(getCategories().map(x => x.id === c.id ? c : x)); };
export const deleteCategory = (id: string) => { saveCategories(getCategories().filter(x => x.id !== id)); };

// --- Company ---
export const getCompany = (): CompanyProfile => get(KEYS.company, { companyName: 'Ticket Management System', logoDataUrl: null });
export const saveCompany = (c: CompanyProfile) => set(KEYS.company, c);

// --- Custom Roles ---
export const getCustomRoles = (): CustomRole[] => get(KEYS.customRoles, []);
export const saveCustomRoles = (r: CustomRole[]) => set(KEYS.customRoles, r);
export const addCustomRole = (r: CustomRole) => { const all = getCustomRoles(); all.push(r); saveCustomRoles(all); };
export const updateCustomRole = (r: CustomRole) => { saveCustomRoles(getCustomRoles().map(x => x.id === r.id ? r : x)); };
export const deleteCustomRole = (id: string) => { saveCustomRoles(getCustomRoles().filter(x => x.id !== id)); };

export const getRolePermissions = (roleId: AppRole): Permission[] => {
  const role = getCustomRoles().find(r => r.id === roleId);
  if (!role) return [];
  return expandPermissions(role.permissions);
};

export const getActiveRoles = (): CustomRole[] => getCustomRoles().filter(r => r.isActive);

export const countUsersWithRole = (roleId: AppRole): number =>
  getUsers().filter(u => u.role === roleId).length;

// Legacy shim for RoleAccessPage
export const getRoleConfigs = (): RoleConfig[] =>
  getCustomRoles().map(r => ({ role: r.id, permissions: expandPermissions(r.permissions) }));
export const saveRoleConfigs = (_r: RoleConfig[]) => {};

// --- Users ---
export const getUsers = (): AppUser[] => get(KEYS.users, []);
export const saveUsers = (u: AppUser[]) => set(KEYS.users, u);
export const addUser = (u: AppUser) => { const all = getUsers(); all.push(u); saveUsers(all); };
export const updateUser = (u: AppUser) => { saveUsers(getUsers().map(x => x.id === u.id ? u : x)); };
export const deleteUser = (id: string) => { saveUsers(getUsers().filter(x => x.id !== id)); };

// --- Groups ---
export const getGroups = (): Group[] => get(KEYS.groups, []);
export const saveGroups = (g: Group[]) => set(KEYS.groups, g);
export const addGroup = (g: Group) => { const all = getGroups(); all.push(g); saveGroups(all); };
export const updateGroup = (g: Group) => { saveGroups(getGroups().map(x => x.id === g.id ? g : x)); };

// --- Group Members ---
export const getGroupMembers = (): GroupMember[] => get(KEYS.groupMembers, []);
export const saveGroupMembers = (m: GroupMember[]) => set(KEYS.groupMembers, m);
export const addGroupMember = (m: GroupMember) => {
  const all = getGroupMembers();
  if (!all.find(x => x.groupId === m.groupId && x.userId === m.userId)) {
    all.push(m);
    saveGroupMembers(all);
  }
};
export const removeGroupMember = (groupId: string, userId: string) => {
  saveGroupMembers(getGroupMembers().filter(x => !(x.groupId === groupId && x.userId === userId)));
};
export const getGroupUsers = (groupId: string): string[] =>
  getGroupMembers().filter(m => m.groupId === groupId).map(m => m.userId);
export const getUserGroups = (userId: string): string[] =>
  getGroupMembers().filter(m => m.userId === userId).map(m => m.groupId);

// --- Tickets ---
export const getTickets = (): Ticket[] => get(KEYS.tickets, []);
export const saveTickets = (t: Ticket[]) => set(KEYS.tickets, t);
export const addTicket = (t: Ticket) => { const all = getTickets(); all.push(t); saveTickets(all); };
export const updateTicket = (t: Ticket) => { saveTickets(getTickets().map(x => x.id === t.id ? t : x)); };

// --- Audit ---
export const getAuditEntries = (): AuditEntry[] => get(KEYS.audit, []);
export const addAuditEntry = (e: AuditEntry) => {
  const all = getAuditEntries();
  all.unshift(e);
  set(KEYS.audit, all);
};

// --- SLA Priorities ---
export const getSlaPriorities = (): SlaPriority[] => get(KEYS.slaPriorities, []);
export const saveSlaPriorities = (p: SlaPriority[]) => set(KEYS.slaPriorities, p);
export const addSlaPriority = (p: SlaPriority) => { const all = getSlaPriorities(); all.push(p); saveSlaPriorities(all); };
export const updateSlaPriority = (p: SlaPriority) => { saveSlaPriorities(getSlaPriorities().map(x => x.id === p.id ? p : x)); };
export const deleteSlaPriority = (id: string) => { saveSlaPriorities(getSlaPriorities().filter(x => x.id !== id)); };

// --- Seed ---
export const isSeeded = (): boolean => get(KEYS.seeded, false);
export const markSeeded = () => set(KEYS.seeded, true);

export const clearAllData = () => {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
};
