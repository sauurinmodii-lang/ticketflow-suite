import { useState, useMemo } from 'react';
import { getAuditEntries } from '@/store/dataStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

export default function AuditPage() {
  const entries = getAuditEntries();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(e =>
      e.action.toLowerCase().includes(q) ||
      e.entityType.toLowerCase().includes(q) ||
      e.userName.toLowerCase().includes(q) ||
      (e.oldValue || '').toLowerCase().includes(q) ||
      (e.newValue || '').toLowerCase().includes(q)
    );
  }, [entries, search]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Trail</h1>
      <Input placeholder="Search audit entries..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead><TableHead>User</TableHead><TableHead>Entity</TableHead><TableHead>Action</TableHead><TableHead>Old Value</TableHead><TableHead>New Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No audit entries</TableCell></TableRow>}
              {filtered.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(e.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{e.userName}</TableCell>
                  <TableCell>{e.entityType}</TableCell>
                  <TableCell>{e.action}</TableCell>
                  <TableCell className="text-xs max-w-32 truncate">{e.oldValue || '-'}</TableCell>
                  <TableCell className="text-xs max-w-32 truncate">{e.newValue || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
