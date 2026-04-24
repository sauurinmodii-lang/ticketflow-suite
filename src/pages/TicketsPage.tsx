import { useState, useMemo } from 'react';
import { getTickets, addTicket, updateTicket, getSites, getCategories, getUsers, getGroups, getGroupUsers } from '@/store/dataStore';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/contexts/AuthContext';
import { useTicketAccess } from '@/hooks/useTicketAccess';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import Pagination, { paginateItems } from '@/components/shared/Pagination';
import { Plus, Play, CircleCheck as CheckCircle, RotateCcw, UserCheck, Filter, X } from 'lucide-react';
import type { Ticket, TicketPriority, TicketStatus } from '@/types';

const PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES: TicketStatus[] = ['Open', 'Allocated', 'In Progress', 'Resolved', 'Acknowledged', 'Reopened', 'Closed'];

const statusColors: Record<string, string> = {
  Open: 'bg-info text-info-foreground',
  Allocated: 'bg-warning text-warning-foreground',
  'In Progress': 'bg-warning text-warning-foreground',
  Resolved: 'bg-success text-success-foreground',
  Acknowledged: 'bg-success text-success-foreground',
  Closed: 'bg-muted text-muted-foreground',
  Reopened: 'bg-destructive text-destructive-foreground',
};

const PAGE_SIZE = 10;

export default function TicketsPage() {
  const { currentUser, hasPermission } = useAuth();
  const [rawTickets, setRawTickets] = useState(getTickets);
  const sites = getSites().filter(s => s.isActive);
  const categories = getCategories().filter(c => c.isActive);
  const allUsers = getUsers().filter(u => u.isActive);
  const allGroups = getGroups().filter(g => g.isActive);

  const tickets = useTicketAccess(rawTickets);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [allocateTicketId, setAllocateTicketId] = useState<string | null>(null);
  const [allocateGroupId, setAllocateGroupId] = useState('');
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveTicketId, setResolveTicketId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkGroupId, setBulkGroupId] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);

  const [form, setForm] = useState({ title: '', description: '', categoryId: '', siteId: currentUser?.siteId || '', priority: 'Medium' as TicketPriority });
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterSite, setFilterSite] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const refresh = () => { setRawTickets(getTickets()); setSelectedIds(new Set()); };

  const getGroupsForSite = (siteId: string) => allGroups.filter(g => g.siteIds.includes(siteId));

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterSite !== 'all' && t.siteId !== filterSite) return false;
      if (filterGroup !== 'all' && t.assignedGroupId !== filterGroup) return false;
      if (filterSearch.trim()) {
        const q = filterSearch.toLowerCase();
        if (!t.ticketNumber.toLowerCase().includes(q) && !t.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tickets, filterStatus, filterPriority, filterSite, filterGroup, filterSearch]);

  const pagedTickets = paginateItems(filteredTickets, page, pageSize);

  const selectedOpenTickets = useMemo(() => {
    if (selectedIds.size === 0) return [];
    return filteredTickets.filter(t => selectedIds.has(t.id) && t.status === 'Open');
  }, [selectedIds, filteredTickets]);
  const showBulkAssign = selectedOpenTickets.length > 0 && selectedOpenTickets.length === selectedIds.size;

  const hasActiveFilters = filterStatus !== 'all' || filterPriority !== 'all' || filterSite !== 'all' || filterGroup !== 'all' || filterSearch.trim();

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterSite('all');
    setFilterGroup('all');
    setFilterSearch('');
    setPage(1);
  };

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
      assignedGroupId: null,
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
    if (!allocateGroupId) return;
    const ticket = rawTickets.find(t => t.id === allocateTicketId);
    if (!ticket) return;
    const groupName = allGroups.find(g => g.id === allocateGroupId)?.name || '';
    changeStatus(ticket, 'Allocated', { assignedGroupId: allocateGroupId, assignedTo: null });
    logAudit({ entityType: 'Ticket', entityId: ticket.id, action: 'Group Assigned', userId: currentUser!.id, userName: currentUser!.fullName, newValue: groupName });
    setAllocateOpen(false);
  };

  const handleResolve = () => {
    const ticket = rawTickets.find(t => t.id === resolveTicketId);
    if (!ticket) return;
    changeStatus(ticket, 'Resolved', { resolvedBy: currentUser!.id, resolutionNotes: resolveNotes });
    setResolveOpen(false);
    setResolveNotes('');
  };

  const handleBulkAssign = () => {
    if (!bulkGroupId) return;
    selectedOpenTickets.forEach(t => {
      changeStatus(t, 'Allocated', { assignedGroupId: bulkGroupId, assignedTo: null });
    });
    setBulkOpen(false);
    setBulkGroupId('');
  };

  const handleReopen = (ticket: Ticket) => {
    changeStatus(ticket, 'Reopened', { assignedTo: null, resolvedBy: null, resolutionNotes: null });
  };

  const isUserInTicketGroup = (ticket: Ticket) => {
    if (!ticket.assignedGroupId || !currentUser) return false;
    const memberIds = getGroupUsers(ticket.assignedGroupId);
    return memberIds.includes(currentUser.id);
  };

  const canStartWork = (ticket: Ticket) => {
    return (ticket.status === 'Allocated' || ticket.status === 'Reopened') && isUserInTicketGroup(ticket);
  };

  const canReassignGroup = (ticket: Ticket) => {
    return (ticket.status === 'Allocated' || ticket.status === 'Reopened') && hasPermission('allocate_ticket');
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const getSiteName = (id: string) => getSites().find(s => s.id === id)?.name || '-';
  const getCatName = (id: string) => getCategories().find(c => c.id === id)?.name || '-';
  const getUserName = (id: string | null) => id ? getUsers().find(u => u.id === id)?.fullName || '-' : '-';
  const getGroupName = (id: string | null) => id ? allGroups.find(g => g.id === id)?.name || '-' : '-';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <div className="flex gap-2">
          {showBulkAssign && hasPermission('allocate_ticket') && (
            <Button variant="outline" onClick={() => { setBulkGroupId(''); setBulkOpen(true); }}>
              <UserCheck className="h-4 w-4 mr-2" /> Bulk Assign ({selectedOpenTickets.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowFilters(v => !v)} className={hasActiveFilters ? 'border-primary text-primary' : ''}>
            <Filter className="h-4 w-4 mr-1" /> Filters{hasActiveFilters ? ' (active)' : ''}
          </Button>
          {hasPermission('create_ticket') && (
            <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" /> Create Ticket</Button>
          )}
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Search</label>
                <Input placeholder="# or title..." value={filterSearch} onChange={e => { setFilterSearch(e.target.value); setPage(1); }} className="h-9" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Status</label>
                <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1); }}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Priority</label>
                <Select value={filterPriority} onValueChange={v => { setFilterPriority(v); setPage(1); }}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Site</label>
                <Select value={filterSite} onValueChange={v => { setFilterSite(v); setPage(1); }}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sites</SelectItem>
                    {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Group</label>
                <Select value={filterGroup} onValueChange={v => { setFilterGroup(v); setPage(1); }}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {allGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="mt-3 h-7 text-xs" onClick={clearFilters}>
                <X className="h-3 w-3 mr-1" /> Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-2 border-b text-sm text-muted-foreground">
            {filteredTickets.length} ticket(s) visible
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Ticket #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Working By</TableHead>
                <TableHead className="w-44">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedTickets.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No tickets found</TableCell></TableRow>
              )}
              {pagedTickets.map(t => (
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
                  <TableCell className="text-sm">{getGroupName(t.assignedGroupId)}</TableCell>
                  <TableCell className="text-sm">{getUserName(t.assignedTo)}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1 flex-wrap">
                      {t.status === 'Open' && hasPermission('allocate_ticket') && (
                        <Button size="sm" variant="ghost" onClick={() => { setAllocateTicketId(t.id); setAllocateGroupId(t.assignedGroupId || ''); setAllocateOpen(true); }}>
                          Assign Group
                        </Button>
                      )}
                      {canReassignGroup(t) && (
                        <Button size="sm" variant="ghost" onClick={() => { setAllocateTicketId(t.id); setAllocateGroupId(t.assignedGroupId || ''); setAllocateOpen(true); }}>
                          Change Group
                        </Button>
                      )}
                      {canStartWork(t) && (
                        <Button size="sm" variant="ghost" onClick={() => changeStatus(t, 'In Progress', { assignedTo: currentUser!.id })}>
                          <Play className="h-3 w-3 mr-1" /> Start
                        </Button>
                      )}
                      {t.status === 'In Progress' && t.assignedTo === currentUser?.id && hasPermission('resolve_ticket') && (
                        <Button size="sm" variant="ghost" onClick={() => { setResolveTicketId(t.id); setResolveNotes(''); setResolveOpen(true); }}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Resolve
                        </Button>
                      )}
                      {t.status === 'Resolved' && hasPermission('acknowledge_ticket') && (
                        <Button size="sm" variant="ghost" onClick={() => changeStatus(t, 'Acknowledged')}>Ack</Button>
                      )}
                      {t.status === 'Resolved' && hasPermission('reopen_ticket') && (
                        <Button size="sm" variant="ghost" onClick={() => handleReopen(t)}>
                          <RotateCcw className="h-3 w-3 mr-1" /> Reopen
                        </Button>
                      )}
                      {t.status === 'Acknowledged' && hasPermission('close_ticket') && (
                        <Button size="sm" variant="ghost" onClick={() => changeStatus(t, 'Closed')}>Close</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            total={filteredTickets.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={s => { setPageSize(s); setPage(1); }}
          />
        </CardContent>
      </Card>

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

      <Dialog open={allocateOpen} onOpenChange={setAllocateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Group to Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Group</label>
              {(() => {
                const ticket = rawTickets.find(t => t.id === allocateTicketId);
                const groups = ticket ? getGroupsForSite(ticket.siteId) : [];
                return (
                  <Select value={allocateGroupId} onValueChange={setAllocateGroupId}>
                    <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                    <SelectContent>
                      {groups.length === 0 && <SelectItem value="_none" disabled>No groups for this site</SelectItem>}
                      {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                );
              })()}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAllocateOpen(false)}>Cancel</Button>
              <Button onClick={handleAllocate} disabled={!allocateGroupId}>Assign</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bulk Assign {selectedOpenTickets.length} Ticket(s)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Group</label>
              <Select value={bulkGroupId} onValueChange={setBulkGroupId}>
                <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                <SelectContent>
                  {allGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
              <Button onClick={handleBulkAssign} disabled={!bulkGroupId}>Assign All</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  <div><span className="text-muted-foreground">Group:</span> {getGroupName(detailTicket.assignedGroupId)}</div>
                  <div><span className="text-muted-foreground">Working By:</span> {getUserName(detailTicket.assignedTo)}</div>
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
