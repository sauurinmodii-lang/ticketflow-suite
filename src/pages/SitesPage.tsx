import { useState, useMemo } from 'react';
import { getSites, addSite, updateSite, deleteSite } from '@/store/dataStore';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import ReasonDialog from '@/components/shared/ReasonDialog';
import Pagination, { paginateItems } from '@/components/shared/Pagination';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Site } from '@/types';

const PAGE_SIZE = 10;

export default function SitesPage() {
  const { currentUser } = useAuth();
  const [sites, setSites] = useState(getSites);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [form, setForm] = useState({ name: '', address: '', city: '' });
  const [formError, setFormError] = useState('');

  const [reasonTarget, setReasonTarget] = useState<{ type: 'update' | 'delete'; site: Site; payload?: Site } | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [search, setSearch] = useState('');

  const refresh = () => setSites(getSites());

  const filteredSites = useMemo(() => {
    if (!search.trim()) return sites;
    const q = search.toLowerCase();
    return sites.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q)
    );
  }, [sites, search]);

  const pagedSites = paginateItems(filteredSites, page, pageSize);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', address: '', city: '' });
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (s: Site) => {
    setEditing(s);
    setForm({ name: s.name, address: s.address, city: s.city });
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { setFormError('Site name is required'); return; }
    if (!form.city.trim()) { setFormError('City is required'); return; }

    if (editing) {
      const payload = { ...editing, ...form };
      setDialogOpen(false);
      setReasonTarget({ type: 'update', site: editing, payload });
    } else {
      const newSite: Site = { id: crypto.randomUUID(), ...form, isActive: true, createdAt: new Date().toISOString() };
      addSite(newSite);
      logAudit({ entityType: 'Site', entityId: newSite.id, action: 'Created', userId: currentUser!.id, userName: currentUser!.fullName, newValue: form.name });
      setDialogOpen(false);
      refresh();
    }
  };

  const requestDelete = (s: Site) => {
    setReasonTarget({ type: 'delete', site: s });
  };

  const toggleActive = (s: Site) => {
    updateSite({ ...s, isActive: !s.isActive });
    logAudit({ entityType: 'Site', entityId: s.id, action: s.isActive ? 'Deactivated' : 'Activated', userId: currentUser!.id, userName: currentUser!.fullName });
    refresh();
  };

  const handleReasonConfirm = (reason: string) => {
    if (!reasonTarget) return;
    const { type, site, payload } = reasonTarget;

    if (type === 'update' && payload) {
      updateSite(payload);
      logAudit({ entityType: 'Site', entityId: site.id, action: 'Updated', userId: currentUser!.id, userName: currentUser!.fullName, oldValue: site.name, newValue: payload.name, remarks: reason });
    } else if (type === 'delete') {
      deleteSite(site.id);
      logAudit({ entityType: 'Site', entityId: site.id, action: 'Deleted', userId: currentUser!.id, userName: currentUser!.fullName, oldValue: site.name, remarks: reason });
    }

    setReasonTarget(null);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Site Master</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Site</Button>
      </div>

      <Input
        placeholder="Search sites..."
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
                <TableHead>Address</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedSites.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No sites found</TableCell></TableRow>
              )}
              {pagedSites.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.address}</TableCell>
                  <TableCell>{s.city}</TableCell>
                  <TableCell><Switch checked={s.isActive} onCheckedChange={() => toggleActive(s)} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => requestDelete(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination total={filteredSites.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Site' : 'Add Site'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {formError && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{formError}</div>}
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

      <ReasonDialog
        open={!!reasonTarget}
        title={reasonTarget?.type === 'delete' ? 'Delete Site' : 'Update Site'}
        description={`Please provide a reason for ${reasonTarget?.type === 'delete' ? 'deleting' : 'updating'} site "${reasonTarget?.site.name}".`}
        onConfirm={handleReasonConfirm}
        onCancel={() => setReasonTarget(null)}
      />
    </div>
  );
}
