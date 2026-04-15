import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, Users, Building2, FolderCog, Shield, ScrollText,
  BarChart3, Settings, LogOut, UsersRound, UserCog
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCompany } from '@/store/dataStore';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'view_dashboard' as const },
  { to: '/tickets', label: 'Tickets', icon: Ticket, perm: 'create_ticket' as const },
  { to: '/users', label: 'Users', icon: Users, perm: 'manage_users' as const },
  { to: '/sites', label: 'Site Master', icon: Building2, perm: 'manage_masters' as const },
  { to: '/categories', label: 'Category Master', icon: FolderCog, perm: 'manage_masters' as const },
  { to: '/groups', label: 'Group Master', icon: UsersRound, perm: 'manage_masters' as const },
  { to: '/group-assign', label: 'Group Assignment', icon: UserCog, perm: 'manage_masters' as const },
  { to: '/role-access', label: 'Role Access Config', icon: Shield, perm: 'manage_roles' as const },
  { to: '/audit', label: 'Audit Trail', icon: ScrollText, perm: 'view_audit' as const },
  { to: '/reports', label: 'Reports', icon: BarChart3, perm: 'view_reports' as const },
  { to: '/company', label: 'Company Profile', icon: Settings, perm: 'manage_masters' as const },
];

export default function AppSidebar() {
  const { currentUser, logout, hasPermission } = useAuth();
  const location = useLocation();
  const company = getCompany();

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        {company.logoDataUrl && (
          <img src={company.logoDataUrl} alt="Logo" className="h-8 w-8 rounded object-contain" />
        )}
        <span className="font-semibold text-sm truncate">{company.companyName}</span>
      </div>

      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
        {navItems.filter(n => hasPermission(n.perm)).map(item => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors rounded-md mx-2",
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="text-xs text-sidebar-foreground/60 mb-2 truncate">
          {currentUser?.fullName} ({currentUser?.role})
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
