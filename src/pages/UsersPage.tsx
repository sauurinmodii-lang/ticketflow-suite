import { useState } from 'react';
import { getUsers, addUser, updateUser, deleteUser, getSites } from '@/store/dataStore';
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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { AppUser, AppRole } from '@/types';

const ROLES: AppRole[] = ['admin', 'manager', 'engineer', 'user'];

export default function UsersPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState(getUsers);
  const sites = getSites().filter(s => s.isActive);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '', role: 'user' as AppRole, siteId: '' });
  const [error, setError] = useState('');

  const refresh = () => setUsers(getUsers());

  const openCreate = () => {
    const defaultSite = currentUser?.siteId || '';
    setEditing(null);
    setForm({ username: '', password: '', fullName: '', email: '', role: 'user', siteId: defaultSite });
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (u: AppUser) => {
    setEditing(u);
    setForm({ username: u.username, password: '', fullName: u.fullName, email: u.email, role: u.role, siteId: u.siteId });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.username.trim()) { setError('Username is required'); return; }
    if (!form.fullName.trim()) { setError('Full name is required'); return; }
    if (!form.siteId) { setError('Site is required — please select a site'); return; }
    if (!editing && !form.password) { setError('Password is required for new user'); return; }

    if (editing) {
      const updated: AppUser = { ...editing, username: form.username, fullName: form.fullName, email: form.email, role: form.role, siteId: form.siteId };
      if (form.password) updated.password = form.password;
      updateUser(updated);
      logAudit({ entityType: 'User', entityId: editing.id, action: 'Updated', userId: currentUser!.id, userName: currentUser!.fullName, oldValue: editing.fullName, newValue: form.fullName });
    } else {
      const exists = getUsers().some(u => u.username === form.username.trim());
      if (exists) { setError('Username already exists'); return; }
      const u: AppUser = { id: crypto.randomUUID(), ...form, username: form.username.trim(), isActive: true, createdAt: new Date().toISOString() };
      addUser(u);
      logAudit({ entityType: 'User', entityId: u.id, action: 'Created', userId: currentUser!.id, userName: currentUser!.fullName, newValue: form.fullName });
    }
    setDialogOpen(false);
    refresh();
  };

  const handleDelete = (u: AppUser) => {
    if (u.id === currentUser?.id) { alert("Cannot delete yourself"); return; }
    if (!confirm(`Delete user "${u.fullName}"?`)) return;
    deleteUser(u.id);
    logAudit({ entityType: 'User', entityId: u.id, action: 'Deleted', userId: currentUser!.id, userName: currentUser!.fullName, oldValue: u.fullName });
    refresh();
  };

  const toggleActive = (u: AppUser) => {
    updateUser({ ...u, isActive: !u.isActive });
    refresh();
  };

  const getSiteName = (id: string) => getSites().find(s => s.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add User</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Username</TableHead><TableHead>Role</TableHead><TableHead>Site</TableHead><TableHead>Active</TableHead><TableHead className="w-24">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No users</TableCell></TableRow>}
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.fullName}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                  <TableCell>{getSiteName(u.siteId)}</TableCell>
                  <TableCell><Switch checked={u.isActive} onCheckedChange={() => toggleActive(u)} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(u)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit User' : 'Add User'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
            <div className="space-y-2"><label className="text-sm font-medium">Full Name *</label><Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Username *</label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} disabled={!!editing} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Email</label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role *</label>
              <Select value={form.role} onValueChange={v => setForm({ ...form, role: v as AppRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Site * <span className="text-destructive">(Required)</span></label>
              <Select value={form.siteId} onValueChange={v => setForm({ ...form, siteId: v })}>
                <SelectTrigger><SelectValue placeholder="Select a site..." /></SelectTrigger>
                <SelectContent>
                  {sites.length === 0 && <SelectItem value="_none" disabled>No active sites — create one first</SelectItem>}
                  {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {!form.siteId && <p className="text-xs text-destructive">Site selection is mandatory</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.siteId}>{editing ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
