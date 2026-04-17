import { useState, useMemo } from 'react';
import { getUsers, addUser, updateUser, deleteUser, getSites, getGroups, getActiveRoles } from '@/store/dataStore';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import ReasonDialog from '@/components/shared/ReasonDialog';
import Pagination, { paginateItems } from '@/components/shared/Pagination';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { AppUser } from '@/types';

const PAGE_SIZE = 10;

export default function UsersPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState(getUsers);
  const allSites = getSites().filter(s => s.isActive);
  const allGroups = getGroups().filter(g => g.isActive);
  const activeRoles = getActiveRoles();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '', role: '', siteId: '', groupId: '' });
  const [formError, setFormError] = useState('');

  const [reasonTarget, setReasonTarget] = useState<{ type: 'delete' | 'update'; user: AppUser; payload?: AppUser } | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [search, setSearch] = useState('');

  const refresh = () => setUsers(getUsers());

  const siteGroups = useMemo(() =>
    allGroups.filter(g => form.siteId && g.siteIds.includes(form.siteId)),
    [form.siteId, allGroups]
  );

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  const pagedUsers = paginateItems(filteredUsers, page, pageSize);

  const openCreate = () => {
    setEditing(null);
    setForm({ username: '', password: '', fullName: '', email: '', role: '', siteId: currentUser?.siteId || '', groupId: '' });
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (u: AppUser) => {
    setEditing(u);
    setForm({ username: u.username, password: '', fullName: u.fullName, email: u.email, role: u.role, siteId: u.siteId, groupId: u.groupId || '' });
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.username.trim()) { setFormError('Username is required'); return; }
    if (!form.fullName.trim()) { setFormError('Full name is required'); return; }
    if (!form.role) { setFormError('Role is required'); return; }
    if (!form.siteId) { setFormError('Site is required'); return; }
    if (!editing && !form.password) { setFormError('Password is required for new users'); return; }

    if (editing) {
      const updated: AppUser = {
        ...editing,
        username: form.username,
        fullName: form.fullName,
        email: form.email,
        role: form.role,
        siteId: form.siteId,
        groupId: form.groupId || null,
      };
      if (form.password) updated.password = form.password;
      setReasonTarget({ type: 'update', user: editing, payload: updated });
      setDialogOpen(false);
    } else {
      const exists = getUsers().some(u => u.username === form.username.trim());
      if (exists) { setFormError('Username already exists'); return; }
      const u: AppUser = {
        id: crypto.randomUUID(),
        username: form.username.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role,
        siteId: form.siteId,
        groupId: form.groupId || null,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      addUser(u);
      logAudit({ entityType: 'User', entityId: u.id, action: 'Created', userId: currentUser!.id, userName: currentUser!.fullName, newValue: u.fullName });
      setDialogOpen(false);
      refresh();
    }
  };

  const requestDelete = (u: AppUser) => {
    if (u.id === currentUser?.id) { alert('Cannot delete your own account.'); return; }
    setReasonTarget({ type: 'delete', user: u });
  };

  const handleReasonConfirm = (reason: string) => {
    if (!reasonTarget) return;
    const { type, user, payload } = reasonTarget;

    if (type === 'delete') {
      deleteUser(user.id);
      logAudit({ entityType: 'User', entityId: user.id, action: 'Deleted', userId: currentUser!.id, userName: currentUser!.fullName, oldValue: user.fullName, remarks: reason });
    } else if (type === 'update' && payload) {
      updateUser(payload);
      logAudit({ entityType: 'User', entityId: user.id, action: 'Updated', userId: currentUser!.id, userName: currentUser!.fullName, oldValue: user.fullName, newValue: payload.fullName, remarks: reason });
    }

    setReasonTarget(null);
    refresh();
  };

  const toggleActive = (u: AppUser) => {
    updateUser({ ...u, isActive: !u.isActive });
    logAudit({ entityType: 'User', entityId: u.id, action: u.isActive ? 'Deactivated' : 'Activated', userId: currentUser!.id, userName: currentUser!.fullName });
    refresh();
  };

  const getSiteName = (id: string) => allSites.find(s => s.id === id)?.name || getSites().find(s => s.id === id)?.name || 'Unknown';
  const getRoleName = (id: string) => activeRoles.find(r => r.id === id)?.name || id;
  const getGroupName = (id: string | null | undefined) => id ? allGroups.find(g => g.id === id)?.name || '-' : '-';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add User</Button>
      </div>

      <Input
        placeholder="Search by name, username, email..."
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        className="max-w-sm"
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedUsers.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
              )}
              {pagedUsers.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.fullName}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell><Badge variant="secondary">{getRoleName(u.role)}</Badge></TableCell>
                  <TableCell>{getSiteName(u.siteId)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{getGroupName(u.groupId)}</TableCell>
                  <TableCell><Switch checked={u.isActive} onCheckedChange={() => toggleActive(u)} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => requestDelete(u)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination total={filteredUsers.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit User' : 'Add User'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {formError && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{formError}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Full Name *</label>
                <Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Username *</label>
                <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} disabled={!!editing} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{editing ? 'New Password (optional)' : 'Password *'}</label>
                <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Role * <span className="text-xs text-muted-foreground">(active roles only)</span></label>
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a role..." /></SelectTrigger>
                  <SelectContent>
                    {activeRoles.length === 0 && <SelectItem value="_none" disabled>No active roles available</SelectItem>}
                    {activeRoles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Site *</label>
                <Select value={form.siteId} onValueChange={v => setForm({ ...form, siteId: v, groupId: '' })}>
                  <SelectTrigger><SelectValue placeholder="Select site..." /></SelectTrigger>
                  <SelectContent>
                    {allSites.length === 0 && <SelectItem value="_none" disabled>No active sites</SelectItem>}
                    {allSites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Group <span className="text-xs text-muted-foreground">(optional)</span></label>
                <Select value={form.groupId || '_none_group'} onValueChange={v => setForm({ ...form, groupId: v === '_none_group' ? '' : v })} disabled={!form.siteId}>
                  <SelectTrigger><SelectValue placeholder={form.siteId ? 'Select group...' : 'Select site first'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none_group">No Group</SelectItem>
                    {siteGroups.length === 0 && form.siteId && <SelectItem value="_no_site_groups" disabled>No groups for this site</SelectItem>}
                    {siteGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.siteId || !form.role}>{editing ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ReasonDialog
        open={!!reasonTarget}
        title={reasonTarget?.type === 'delete' ? 'Delete User' : 'Update User'}
        description={`Provide a reason for ${reasonTarget?.type === 'delete' ? 'deleting' : 'updating'} user "${reasonTarget?.user.fullName}".`}
        onConfirm={handleReasonConfirm}
        onCancel={() => setReasonTarget(null)}
      />
    </div>
  );
}
