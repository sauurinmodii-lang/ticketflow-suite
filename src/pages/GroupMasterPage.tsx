import { useState, useMemo } from 'react';
import { getGroups, addGroup, updateGroup, getSites } from '@/store/dataStore';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import ReasonDialog from '@/components/shared/ReasonDialog';
import Pagination, { paginateItems } from '@/components/shared/Pagination';
import { Plus, Pencil } from 'lucide-react';
import type { Group } from '@/types';

const PAGE_SIZE = 10;

export default function GroupMasterPage() {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState(getGroups);
  const sites = getSites().filter(s => s.isActive);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [form, setForm] = useState({ name: '', description: '', siteIds: [] as string[] });
  const [formError, setFormError] = useState('');
  const [pendingPayload, setPendingPayload] = useState<Group | null>(null);

  const [reasonTarget, setReasonTarget] = useState<{ type: 'update' | 'toggle'; group: Group; payload?: Group } | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [search, setSearch] = useState('');

  const refresh = () => setGroups(getGroups());

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups.filter(g => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
  }, [groups, search]);

  const pagedGroups = paginateItems(filteredGroups, page, pageSize);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', siteIds: [] });
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (g: Group) => {
    setEditing(g);
    setForm({ name: g.name, description: g.description, siteIds: [...g.siteIds] });
    setFormError('');
    setDialogOpen(true);
  };

  const toggleSite = (siteId: string) => {
    setForm(prev => ({
      ...prev,
      siteIds: prev.siteIds.includes(siteId)
        ? prev.siteIds.filter(s => s !== siteId)
        : [...prev.siteIds, siteId],
    }));
  };

  const handleSave = () => {
    setFormError('');
    if (!form.name.trim()) { setFormError('Group name is required'); return; }
    if (form.siteIds.length === 0) { setFormError('At least one site must be selected'); return; }

    if (editing) {
      const payload: Group = { ...editing, name: form.name.trim(), description: form.description.trim(), siteIds: form.siteIds };
      setPendingPayload(payload);
      setDialogOpen(false);
      setReasonTarget({ type: 'update', group: editing, payload });
    } else {
      const g: Group = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        description: form.description.trim(),
        siteIds: form.siteIds,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      addGroup(g);
      logAudit({ entityType: 'Group', entityId: g.id, action: 'Created', userId: currentUser!.id, userName: currentUser!.fullName, newValue: g.name });
      setDialogOpen(false);
      refresh();
    }
  };

  const requestToggle = (g: Group) => {
    setReasonTarget({ type: 'toggle', group: g });
  };

  const handleReasonConfirm = (reason: string) => {
    if (!reasonTarget) return;
    const { type, group, payload } = reasonTarget;

    if (type === 'update' && payload) {
      updateGroup(payload);
      logAudit({ entityType: 'Group', entityId: group.id, action: 'Updated', userId: currentUser!.id, userName: currentUser!.fullName, oldValue: group.name, newValue: payload.name, remarks: reason });
    } else if (type === 'toggle') {
      const updated = { ...group, isActive: !group.isActive };
      updateGroup(updated);
      logAudit({ entityType: 'Group', entityId: group.id, action: updated.isActive ? 'Activated' : 'Deactivated', userId: currentUser!.id, userName: currentUser!.fullName, remarks: reason });
    }

    setReasonTarget(null);
    setPendingPayload(null);
    refresh();
  };

  const getSiteNames = (siteIds: string[]) => {
    const allSites = getSites();
    return siteIds.map(id => allSites.find(s => s.id === id)?.name || 'Unknown').join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Group Master</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Group</Button>
      </div>

      <Input
        placeholder="Search groups..."
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        className="max-w-sm"
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Sites</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedGroups.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No groups found</TableCell></TableRow>
              )}
              {pagedGroups.map(g => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="text-sm">{getSiteNames(g.siteIds)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{g.description || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={g.isActive ? 'default' : 'secondary'}>{g.isActive ? 'Active' : 'Inactive'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 items-center">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(g)}><Pencil className="h-3 w-3" /></Button>
                      <Switch checked={g.isActive} onCheckedChange={() => requestToggle(g)} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination total={filteredGroups.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Group' : 'Create Group'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {formError && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{formError}</div>}
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Name *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sites * (select one or more)</label>
              <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                {sites.length === 0 && <p className="text-sm text-muted-foreground">No active sites available</p>}
                {sites.map(s => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={form.siteIds.includes(s.id)} onCheckedChange={() => toggleSite(s.id)} />
                    <span className="text-sm">{s.name} — {s.city}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ReasonDialog
        open={!!reasonTarget}
        title={reasonTarget?.type === 'toggle'
          ? (reasonTarget.group.isActive ? 'Deactivate Group' : 'Activate Group')
          : 'Update Group'}
        description={`Please provide a reason for ${reasonTarget?.type === 'toggle'
          ? (reasonTarget?.group.isActive ? 'deactivating' : 'activating')
          : 'updating'} group "${reasonTarget?.group.name}".`}
        onConfirm={handleReasonConfirm}
        onCancel={() => { setReasonTarget(null); setPendingPayload(null); }}
      />
    </div>
  );
}
