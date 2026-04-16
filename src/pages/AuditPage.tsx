import { useState, useMemo } from 'react';
import { getAuditEntries } from '@/store/dataStore';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import Pagination, { paginateItems } from '@/components/shared/Pagination';

const PAGE_SIZE = 20;

export default function AuditPage() {
  const [entries] = useState(getAuditEntries);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(e =>
      e.action.toLowerCase().includes(q) ||
      e.entityType.toLowerCase().includes(q) ||
      e.userName.toLowerCase().includes(q) ||
      (e.oldValue || '').toLowerCase().includes(q) ||
      (e.newValue || '').toLowerCase().includes(q) ||
      (e.remarks || '').toLowerCase().includes(q)
    );
  }, [entries, search]);

  const paged = paginateItems(filtered, page, pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Trail</h1>
      <Input
        placeholder="Search by action, entity, user, value or remarks..."
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        className="max-w-md"
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Old Value</TableHead>
                <TableHead>New Value</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No audit entries</TableCell></TableRow>
              )}
              {paged.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(e.timestamp).toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{e.userName}</TableCell>
                  <TableCell className="text-sm">{e.entityType}</TableCell>
                  <TableCell className="text-sm">{e.action}</TableCell>
                  <TableCell className="text-xs max-w-28 truncate text-muted-foreground">{e.oldValue || '-'}</TableCell>
                  <TableCell className="text-xs max-w-28 truncate text-muted-foreground">{e.newValue || '-'}</TableCell>
                  <TableCell className="text-xs max-w-36 truncate italic text-muted-foreground">{e.remarks || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={s => { setPageSize(s); setPage(1); }}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
