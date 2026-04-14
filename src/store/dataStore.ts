import type { Site, Category, CompanyProfile, RoleConfig, AppUser, Ticket, AuditEntry, AppRole, Permission } from '@/types';

const KEYS = {
  sites: 'tms_sites',
  categories: 'tms_categories',
  company: 'tms_company',
  roles: 'tms_roles',
  users: 'tms_users',
  tickets: 'tms_tickets',
  audit: 'tms_audit',
  seeded: 'tms_seeded',
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

// --- Roles ---
export const getRoleConfigs = (): RoleConfig[] => get(KEYS.roles, []);
export const saveRoleConfigs = (r: RoleConfig[]) => set(KEYS.roles, r);
export const getRolePermissions = (role: AppRole): Permission[] => {
  const cfg = getRoleConfigs().find(r => r.role === role);
  return cfg?.permissions ?? [];
};

// --- Users ---
export const getUsers = (): AppUser[] => get(KEYS.users, []);
export const saveUsers = (u: AppUser[]) => set(KEYS.users, u);
export const addUser = (u: AppUser) => { const all = getUsers(); all.push(u); saveUsers(all); };
export const updateUser = (u: AppUser) => { saveUsers(getUsers().map(x => x.id === u.id ? u : x)); };
export const deleteUser = (id: string) => { saveUsers(getUsers().filter(x => x.id !== id)); };

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

// --- Seed ---
export const isSeeded = (): boolean => get(KEYS.seeded, false);
export const markSeeded = () => set(KEYS.seeded, true);

export const clearAllData = () => {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
};
