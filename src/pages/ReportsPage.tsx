import { useState, useMemo } from 'react';
import { getTickets, getSites, getCategories } from '@/store/dataStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import type { TicketPriority, TicketStatus } from '@/types';

const STATUSES: TicketStatus[] = ['Open', 'Approved', 'Allocated', 'In Progress', 'Resolved', 'Acknowledged', 'Reopened', 'Closed'];
const PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High', 'Critical'];

export default function ReportsPage() {
  const tickets = getTickets();
  const sites = getSites();
  const categories = getCategories();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [siteFilter, setSiteFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      if (dateFrom && t.createdAt < dateFrom) return false;
      if (dateTo && t.createdAt > dateTo + 'T23:59:59') return false;
      if (siteFilter !== 'all' && t.siteId !== siteFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tickets, dateFrom, dateTo, siteFilter, statusFilter, priorityFilter]);

  const exportCSV = () => {
    const headers = ['Ticket #', 'Title', 'Site', 'Category', 'Priority', 'Status', 'Created'];
    const rows = filtered.map(t => [
      t.ticketNumber,
      t.title,
      sites.find(s => s.id === t.siteId)?.name || '',
      categories.find(c => c.id === t.categoryId)?.name || '',
      t.priority,
      t.status,
      new Date(t.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSiteName = (id: string) => sites.find(s => s.id === id)?.name || '-';
  const getCatName = (id: string) => categories.find(c => c.id === id)?.name || '-';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Button onClick={exportCSV} disabled={filtered.length === 0}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">From</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">To</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Site</label>
              <Select value={siteFilter} onValueChange={setSiteFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b"><span className="text-sm text-muted-foreground">{filtered.length} ticket(s) found</span></div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket #</TableHead><TableHead>Title</TableHead><TableHead>Site</TableHead><TableHead>Category</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No tickets match filters</TableCell></TableRow>}
              {filtered.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.ticketNumber}</TableCell>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{getSiteName(t.siteId)}</TableCell>
                  <TableCell>{getCatName(t.categoryId)}</TableCell>
                  <TableCell><Badge variant="outline">{t.priority}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{t.status}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
