import { useState, useMemo } from 'react';
import { getCustomRoles, addCustomRole, updateCustomRole, deleteCustomRole, countUsersWithRole } from '@/store/dataStore';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReasonDialog from '@/components/shared/ReasonDialog';
import Pagination, { paginateItems } from '@/components/shared/Pagination';
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import { ALL_PERMISSIONS, expandPermissions } from '@/types';
import type { CustomRole, Permission } from '@/types';

const PAGE_SIZE = 10;

export default function RoleMasterPage() {
  const { currentUser } = useAuth();
  const [roles, setRoles] = useState(getCustomRoles);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomRole | null>(null);
  const [form, setForm] = useState({ name: '', description: '', permissions: [] as Permission[] });
  const [formError, setFormError] = useState('');

  const [reasonTarget, setReasonTarget] = useState<{ type: 'delete' | 'toggle'; role: CustomRole } | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const refresh = () => setRoles(getCustomRoles());

  const permGroups = useMemo(() =>
    ALL_PERMISSIONS.reduce<Record<string, typeof ALL_PERMISSIONS>>((acc, p) => {
      if (!acc[p.group]) acc[p.group] = [];
      acc[p.group].push(p);
      return acc;
    }, {}),
    []
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', permissions: [] });
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (r: CustomRole) => {
    setEditing(r);
    setForm({ name: r.name, description: r.description, permissions: [...r.permissions] });
    setFormError('');
    setDialogOpen(true);
  };

  const togglePerm = (perm: Permission) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) { setFormError('Role name is required'); return; }
    if (form.permissions.length === 0) { setFormError('At least one permission must be selected'); return; }

    if (editing) {
      const updated: CustomRole = { ...editing, name: form.name.trim(), description: form.description.trim(), permissions: form.permissions };
      updateCustomRole(updated);
      logAudit({ entityType: 'Role', entityId: editing.id, action: 'Updated', userId: currentUser!.id, userName: currentUser!.fullName, oldValue: editing.name, newValue: form.name.trim() });
    } else {
      const role: CustomRole = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        description: form.description.trim(),
        isActive: true,
        isSystem: false,
        permissions: form.permissions,
        createdAt: new Date().toISOString(),
      };
      addCustomRole(role);
      logAudit({ entityType: 'Role', entityId: role.id, action: 'Created', userId: currentUser!.id, userName: currentUser!.fullName, newValue: role.name });
    }
    setDialogOpen(false);
    refresh();
  };

  const requestToggle = (r: CustomRole) => {
    if (r.isActive) {
      const count = countUsersWithRole(r.id);
      if (count > 0) {
        alert(`Cannot deactivate "${r.name}" — ${count} user(s) are currently assigned to this role.`);
        return;
      }
    }
    setReasonTarget({ type: 'toggle', role: r });
  };

  const requestDelete = (r: CustomRole) => {
    if (r.isSystem) { alert('System roles cannot be deleted.'); return; }
    const count = countUsersWithRole(r.id);
    if (count > 0) {
      alert(`Cannot delete "${r.name}" — ${count} user(s) are assigned to this role.`);
      return;
    }
    setReasonTarget({ type: 'delete', role: r });
  };

  const handleReasonConfirm = (reason: string) => {
    if (!reasonTarget) return;
    const { type, role } = reasonTarget;

    if (type === 'toggle') {
      const updated = { ...role, isActive: !role.isActive };
      updateCustomRole(updated);
      logAudit({
        entityType: 'Role', entityId: role.id,
        action: updated.isActive ? 'Activated' : 'Deactivated',
        userId: currentUser!.id, userName: currentUser!.fullName,
        remarks: reason,
      });
    } else {
      deleteCustomRole(role.id);
      logAudit({
        entityType: 'Role', entityId: role.id,
        action: 'Deleted', userId: currentUser!.id, userName: currentUser!.fullName,
        oldValue: role.name, remarks: reason,
      });
    }

    setReasonTarget(null);
    refresh();
  };

  const activeRoles = roles.filter(r => r.isActive);
  const inactiveRoles = roles.filter(r => !r.isActive);

  const pagedActive = paginateItems(activeRoles, page, pageSize);
  const pagedInactive = paginateItems(inactiveRoles, page, pageSize);

  const renderTable = (list: CustomRole[], allItems: CustomRole[]) => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>System</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No roles found</TableCell></TableRow>
            )}
            {list.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  {r.name}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.description || '-'}</TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">{expandPermissions(r.permissions).length} permissions</span>
                </TableCell>
                <TableCell>
                  {r.isSystem ? <Badge variant="secondary">System</Badge> : <Badge variant="outline">Custom</Badge>}
                </TableCell>
                <TableCell>
                  <Badge variant={r.isActive ? 'default' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!r.isSystem && (
                      <Button variant="ghost" size="icon" onClick={() => requestDelete(r)} title="Delete">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    <Switch
                      checked={r.isActive}
                      onCheckedChange={() => requestToggle(r)}
                      title={r.isActive ? 'Deactivate' : 'Activate'}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination total={allItems.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Role Master</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{roles.length} total roles — {activeRoles.length} active</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Create Role</Button>
      </div>

      <Tabs defaultValue="active" onValueChange={() => setPage(1)}>
        <TabsList>
          <TabsTrigger value="active">Active ({activeRoles.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactiveRoles.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          {renderTable(pagedActive, activeRoles)}
        </TabsContent>
        <TabsContent value="inactive" className="mt-4">
          {renderTable(pagedInactive, inactiveRoles)}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit Role: ${editing.name}` : 'Create Custom Role'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {formError && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{formError}</div>}
            <div className="space-y-2">
              <label className="text-sm font-medium">Role Name *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} disabled={editing?.isSystem} />
              {editing?.isSystem && <p className="text-xs text-muted-foreground">System role names cannot be changed.</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">Permissions *</label>
              <p className="text-xs text-muted-foreground">
                Read access is automatically granted when a write permission is selected.
              </p>
              {Object.entries(permGroups).map(([group, perms]) => (
                <div key={group} className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{group}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map(p => {
                      const checked = form.permissions.includes(p.key);
                      const expanded = expandPermissions(form.permissions);
                      const impliedOnly = !checked && expanded.includes(p.key);
                      return (
                        <label key={p.key} className={`flex items-center gap-2 rounded-md border p-2.5 cursor-pointer transition-colors ${checked ? 'bg-primary/5 border-primary/30' : impliedOnly ? 'bg-muted/50 border-muted' : 'hover:bg-accent'}`}>
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => togglePerm(p.key)}
                          />
                          <span className="text-sm flex-1">{p.label}</span>
                          {impliedOnly && <Badge variant="outline" className="text-xs ml-auto shrink-0">Auto</Badge>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? 'Update Role' : 'Create Role'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ReasonDialog
        open={!!reasonTarget}
        title={reasonTarget?.type === 'delete' ? 'Delete Role' : (reasonTarget?.role.isActive ? 'Deactivate Role' : 'Activate Role')}
        description={`Please provide a reason for ${reasonTarget?.type === 'delete' ? 'deleting' : (reasonTarget?.role.isActive ? 'deactivating' : 'activating')} role "${reasonTarget?.role.name}".`}
        onConfirm={handleReasonConfirm}
        onCancel={() => setReasonTarget(null)}
      />
    </div>
  );
}
