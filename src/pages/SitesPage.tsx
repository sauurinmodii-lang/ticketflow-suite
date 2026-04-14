import { useState } from 'react';
import { getSites, addSite, updateSite, deleteSite } from '@/store/dataStore';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Site } from '@/types';

export default function SitesPage() {
  const { currentUser } = useAuth();
  const [sites, setSites] = useState(getSites);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [form, setForm] = useState({ name: '', address: '', city: '' });
  const [error, setError] = useState('');

  const refresh = () => setSites(getSites());

  const openCreate = () => { setEditing(null); setForm({ name: '', address: '', city: '' }); setError(''); setDialogOpen(true); };
  const openEdit = (s: Site) => { setEditing(s); setForm({ name: s.name, address: s.address, city: s.city }); setError(''); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name.trim()) { setError('Site name is required'); return; }
    if (!form.city.trim()) { setError('City is required'); return; }

    if (editing) {
      const updated = { ...editing, ...form };
      updateSite(updated);
      logAudit({ entityType: 'Site', entityId: editing.id, action: 'Updated', userId: currentUser!.id, userName: currentUser!.fullName, oldValue: editing.name, newValue: form.name });
    } else {
      const newSite: Site = { id: crypto.randomUUID(), ...form, isActive: true, createdAt: new Date().toISOString() };
      addSite(newSite);
      logAudit({ entityType: 'Site', entityId: newSite.id, action: 'Created', userId: currentUser!.id, userName: currentUser!.fullName, newValue: form.name });
    }
    setDialogOpen(false);
    refresh();
  };

  const handleDelete = (s: Site) => {
    if (!confirm(`Delete site "${s.name}"?`)) return;
    deleteSite(s.id);
    logAudit({ entityType: 'Site', entityId: s.id, action: 'Deleted', userId: currentUser!.id, userName: currentUser!.fullName, oldValue: s.name });
    refresh();
  };

  const toggleActive = (s: Site) => {
    updateSite({ ...s, isActive: !s.isActive });
    logAudit({ entityType: 'Site', entityId: s.id, action: s.isActive ? 'Deactivated' : 'Activated', userId: currentUser!.id, userName: currentUser!.fullName, oldValue: String(s.isActive), newValue: String(!s.isActive) });
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Site Master</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Site</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Address</TableHead><TableHead>City</TableHead><TableHead>Active</TableHead><TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No sites found</TableCell></TableRow>}
              {sites.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.address}</TableCell>
                  <TableCell>{s.city}</TableCell>
                  <TableCell><Switch checked={s.isActive} onCheckedChange={() => toggleActive(s)} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? 'Edit Site' : 'Add Site'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {error && <div className="text-sm text-destructive">{error}</div>}
            <div className="space-y-2"><label className="text-sm font-medium">Site Name *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Address</label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">City *</label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
