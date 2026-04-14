import { useState } from 'react';
import { getRoleConfigs, saveRoleConfigs } from '@/store/dataStore';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AppRole, Permission, RoleConfig } from '@/types';
import { ALL_PERMISSIONS } from '@/types';

const ROLES: AppRole[] = ['admin', 'manager', 'engineer', 'user'];

export default function RoleAccessPage() {
  const { currentUser } = useAuth();
  const [configs, setConfigs] = useState<RoleConfig[]>(getRoleConfigs);
  const [selectedRole, setSelectedRole] = useState<AppRole>('admin');
  const [success, setSuccess] = useState('');

  const currentConfig = configs.find(c => c.role === selectedRole);
  const currentPerms = currentConfig?.permissions || [];

  const groups = ALL_PERMISSIONS.reduce<Record<string, typeof ALL_PERMISSIONS>>((acc, p) => {
    if (!acc[p.group]) acc[p.group] = [];
    acc[p.group].push(p);
    return acc;
  }, {});

  const togglePerm = (perm: Permission) => {
    const newPerms = currentPerms.includes(perm)
      ? currentPerms.filter(p => p !== perm)
      : [...currentPerms, perm];

    const newConfigs = configs.map(c =>
      c.role === selectedRole ? { ...c, permissions: newPerms } : c
    );

    if (!newConfigs.find(c => c.role === selectedRole)) {
      newConfigs.push({ role: selectedRole, permissions: newPerms });
    }

    setConfigs(newConfigs);
  };

  const handleSave = () => {
    saveRoleConfigs(configs);
    logAudit({
      entityType: 'RoleConfig', entityId: selectedRole, action: 'Updated',
      userId: currentUser!.id, userName: currentUser!.fullName,
      newValue: JSON.stringify(currentPerms),
    });
    setSuccess('Permissions saved!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const permCount = (role: AppRole) => configs.find(c => c.role === role)?.permissions.length || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Role Access Configuration</h1>
      {success && <div className="text-sm text-success bg-success/10 p-3 rounded-md">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Role Selector - Master Panel */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Select Role</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {ROLES.map(role => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-md transition-colors flex items-center justify-between",
                  selectedRole === role
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )}
              >
                <span className="capitalize font-medium">{role}</span>
                <Badge variant={selectedRole === role ? "outline" : "secondary"} className={selectedRole === role ? "border-primary-foreground/30 text-primary-foreground" : ""}>
                  {permCount(role)}
                </Badge>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Permissions Grid - Detail Panel */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Permissions for <span className="capitalize text-primary">{selectedRole}</span>
            </CardTitle>
            <Button onClick={handleSave}>Save Changes</Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(groups).map(([group, perms]) => (
              <div key={group}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{group}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {perms.map(p => (
                    <div key={p.key} className="flex items-center justify-between p-3 rounded-md border bg-card">
                      <span className="text-sm">{p.label}</span>
                      <Switch
                        checked={currentPerms.includes(p.key)}
                        onCheckedChange={() => togglePerm(p.key)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
