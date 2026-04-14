import { useState, useMemo } from 'react';
import { getTickets, addTicket, updateTicket, getSites, getCategories, getUsers, getRolePermissions } from '@/store/dataStore';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Play, CheckCircle, RotateCcw, UserCheck } from 'lucide-react';
import type { Ticket, TicketPriority, TicketStatus } from '@/types';

const PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High', 'Critical'];

const statusColors: Record<string, string> = {
  Open: 'bg-info text-info-foreground',
  Approved: 'bg-primary text-primary-foreground',
  Allocated: 'bg-warning text-warning-foreground',
  'In Progress': 'bg-warning text-warning-foreground',
  Resolved: 'bg-success text-success-foreground',
  Acknowledged: 'bg-success text-success-foreground',
  Closed: 'bg-muted text-muted-foreground',
  Reopened: 'bg-destructive text-destructive-foreground',
};

export default function TicketsPage() {
  const { currentUser, hasPermission } = useAuth();
  const [tickets, setTickets] = useState(getTickets);
  const sites = getSites().filter(s => s.isActive);
  const categories = getCategories().filter(c => c.isActive);
  const allUsers = getUsers().filter(u => u.isActive);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [allocateTicketId, setAllocateTicketId] = useState<string | null>(null);
  const [allocateSiteId, setAllocateSiteId] = useState('');
  const [allocateUserId, setAllocateUserId] = useState('');
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveTicketId, setResolveTicketId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSiteId, setBulkSiteId] = useState('');
  const [bulkUserId, setBulkUserId] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);

  const [form, setForm] = useState({ title: '', description: '', categoryId: '', siteId: currentUser?.siteId || '', priority: 'Medium' as TicketPriority });
  const [error, setError] = useState('');

  const refresh = () => { setTickets(getTickets()); setSelectedIds(new Set()); };

  // Smart filter: users at selected site with resolve permission
  const getAssignableUsers = (siteId: string) => {
    return allUsers.filter(u => {
      if (u.siteId !== siteId) return false;
      const perms = getRolePermissions(u.role);
      return perms.includes('resolve_ticket') || u.role === 'admin';
    });
  };

  // Bulk assign visibility: only when selected tickets are all Open
  const selectedOpenTickets = useMemo(() => {
    if (selectedIds.size === 0) return [];
    return tickets.filter(t => selectedIds.has(t.id) && t.status === 'Open');
  }, [selectedIds, tickets]);
  const showBulkAssign = selectedOpenTickets.length > 0 && selectedOpenTickets.length === selectedIds.size;

  const handleCreate = () => {
    setError('');
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.categoryId) { setError('Category is required'); return; }
    if (!form.siteId) { setError('Site is required'); return; }

    const count = getTickets().length + 1;
    const ticket: Ticket = {
      id: crypto.randomUUID(),
      ticketNumber: `TKT-${String(count).padStart(5, '0')}`,
      title: form.title.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId,
      siteId: form.siteId,
      priority: form.priority,
      status: 'Open',
      createdBy: currentUser!.id,
      assignedTo: null,
      resolvedBy: null,
      resolutionNotes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addTicket(ticket);
    logAudit({ entityType: 'Ticket', entityId: ticket.id, action: 'Created', userId: currentUser!.id, userName: currentUser!.fullName, newValue: ticket.ticketNumber });
    setCreateOpen(false);
    setForm({ title: '', description: '', categoryId: '', siteId: currentUser?.siteId || '', priority: 'Medium' });
    refresh();
  };

  const changeStatus = (ticket: Ticket, newStatus: TicketStatus, extra?: Partial<Ticket>) => {
    const old = ticket.status;
    const updated = { ...ticket, status: newStatus, updatedAt: new Date().toISOString(), ...extra };
    updateTicket(updated);
    logAudit({ entityType: 'Ticket', entityId: ticket.id, action: `Status: ${old} → ${newStatus}`, userId: currentUser!.id, userName: currentUser!.fullName, oldValue: old, newValue: newStatus });
    refresh();
    setDetailTicket(null);
  };

  const handleAllocate = () => {
    if (!allocateUserId) return;
    const ticket = tickets.find(t => t.id === allocateTicketId);
    if (!ticket) return;
    changeStatus(ticket, 'Allocated', { assignedTo: allocateUserId });
    setAllocateOpen(false);
  };

  const handleResolve = () => {
    const ticket = tickets.find(t => t.id === resolveTicketId);
    if (!ticket) return;
    changeStatus(ticket, 'Resolved', { resolvedBy: currentUser!.id, resolutionNotes: resolveNotes });
    setResolveOpen(false);
    setResolveNotes('');
  };

  const handleBulkAssign = () => {
    if (!bulkUserId) return;
    selectedOpenTickets.forEach(t => {
      changeStatus(t, 'Allocated', { assignedTo: bulkUserId });
    });
    setBulkOpen(false);
    setBulkSiteId('');
    setBulkUserId('');
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const getSiteName = (id: string) => getSites().find(s => s.id === id)?.name || '-';
  const getCatName = (id: string) => getCategories().find(c => c.id === id)?.name || '-';
  const getUserName = (id: string | null) => id ? getUsers().find(u => u.id === id)?.fullName || '-' : '-';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <div className="flex gap-2">
          {showBulkAssign && (
            <Button variant="outline" onClick={() => { setBulkSiteId(currentUser?.siteId || ''); setBulkOpen(true); }}>
              <UserCheck className="h-4 w-4 mr-2" /> Bulk Assign ({selectedOpenTickets.length})
            </Button>
          )}
          {hasPermission('create_ticket') && (
            <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" /> Create Ticket</Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Ticket #</TableHead><TableHead>Title</TableHead><TableHead>Site</TableHead><TableHead>Category</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Assigned</TableHead><TableHead className="w-36">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No tickets found</TableCell></TableRow>}
              {tickets.map(t => (
                <TableRow key={t.id} className="cursor-pointer" onClick={() => setDetailTicket(t)}>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.has(t.id)} onCheckedChange={() => toggleSelect(t.id)} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{t.ticketNumber}</TableCell>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell>{getSiteName(t.siteId)}</TableCell>
                  <TableCell>{getCatName(t.categoryId)}</TableCell>
                  <TableCell><Badge variant="outline">{t.priority}</Badge></TableCell>
                  <TableCell><Badge className={statusColors[t.status]}>{t.status}</Badge></TableCell>
                  <TableCell>{getUserName(t.assignedTo)}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      {t.status === 'Open' && hasPermission('approve_ticket') && (
                        <Button size="sm" variant="ghost" onClick={() => changeStatus(t, 'Approved')}>Approve</Button>
                      )}
                      {t.status === 'Approved' && hasPermission('allocate_ticket') && (
                        <Button size="sm" variant="ghost" onClick={() => { setAllocateTicketId(t.id); setAllocateSiteId(t.siteId); setAllocateUserId(''); setAllocateOpen(true); }}>Allocate</Button>
                      )}
                      {t.status === 'Allocated' && t.assignedTo === currentUser?.id && (
                        <Button size="sm" variant="ghost" onClick={() => changeStatus(t, 'In Progress')}><Play className="h-3 w-3 mr-1" /> Start</Button>
                      )}
                      {t.status === 'In Progress' && t.assignedTo === currentUser?.id && hasPermission('resolve_ticket') && (
                        <Button size="sm" variant="ghost" onClick={() => { setResolveTicketId(t.id); setResolveNotes(''); setResolveOpen(true); }}><CheckCircle className="h-3 w-3 mr-1" /> Resolve</Button>
                      )}
                      {t.status === 'Resolved' && hasPermission('acknowledge_ticket') && (
                        <Button size="sm" variant="ghost" onClick={() => changeStatus(t, 'Acknowledged')}>Ack</Button>
                      )}
                      {t.status === 'Resolved' && hasPermission('reopen_ticket') && (
                        <Button size="sm" variant="ghost" onClick={() => changeStatus(t, 'Reopened')}><RotateCcw className="h-3 w-3 mr-1" /> Reopen</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
            <div className="space-y-2"><label className="text-sm font-medium">Title *</label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Description</label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category *</label>
              <Select value={form.categoryId} onValueChange={v => setForm({ ...form, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Site *</label>
              <Select value={form.siteId} onValueChange={v => setForm({ ...form, siteId: v })}>
                <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                <SelectContent>{sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v as TicketPriority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Allocate Dialog */}
      <Dialog open={allocateOpen} onOpenChange={setAllocateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Allocate Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Site</label>
              <Select value={allocateSiteId} onValueChange={v => { setAllocateSiteId(v); setAllocateUserId(''); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign To (users with Resolve permission at selected site)</label>
              <Select value={allocateUserId} onValueChange={setAllocateUserId}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  {getAssignableUsers(allocateSiteId).length === 0 && <SelectItem value="_none" disabled>No eligible users at this site</SelectItem>}
                  {getAssignableUsers(allocateSiteId).map(u => <SelectItem key={u.id} value={u.id}>{u.fullName} ({u.role})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAllocateOpen(false)}>Cancel</Button>
              <Button onClick={handleAllocate} disabled={!allocateUserId}>Assign</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolve Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><label className="text-sm font-medium">Resolution Notes</label><Textarea value={resolveNotes} onChange={e => setResolveNotes(e.target.value)} placeholder="Describe the resolution..." /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResolveOpen(false)}>Cancel</Button>
              <Button onClick={handleResolve}>Resolve</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bulk Assign {selectedOpenTickets.length} Ticket(s)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Site</label>
              <Select value={bulkSiteId} onValueChange={v => { setBulkSiteId(v); setBulkUserId(''); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign To</label>
              <Select value={bulkUserId} onValueChange={setBulkUserId}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  {getAssignableUsers(bulkSiteId).map(u => <SelectItem key={u.id} value={u.id}>{u.fullName} ({u.role})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
              <Button onClick={handleBulkAssign} disabled={!bulkUserId}>Assign All</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!detailTicket} onOpenChange={() => setDetailTicket(null)}>
        <DialogContent className="max-w-lg">
          {detailTicket && (
            <>
              <DialogHeader><DialogTitle>{detailTicket.ticketNumber} — {detailTicket.title}</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Status:</span> <Badge className={statusColors[detailTicket.status]}>{detailTicket.status}</Badge></div>
                  <div><span className="text-muted-foreground">Priority:</span> {detailTicket.priority}</div>
                  <div><span className="text-muted-foreground">Site:</span> {getSiteName(detailTicket.siteId)}</div>
                  <div><span className="text-muted-foreground">Category:</span> {getCatName(detailTicket.categoryId)}</div>
                  <div><span className="text-muted-foreground">Created By:</span> {getUserName(detailTicket.createdBy)}</div>
                  <div><span className="text-muted-foreground">Assigned To:</span> {getUserName(detailTicket.assignedTo)}</div>
                </div>
                {detailTicket.description && <div><span className="text-muted-foreground">Description:</span><p className="mt-1">{detailTicket.description}</p></div>}
                {detailTicket.resolutionNotes && <div><span className="text-muted-foreground">Resolution:</span><p className="mt-1">{detailTicket.resolutionNotes}</p></div>}
                <div className="text-xs text-muted-foreground">Created: {new Date(detailTicket.createdAt).toLocaleString()}</div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
