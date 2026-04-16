import { useState, useMemo } from 'react';
import { getCategories, addCategory, updateCategory, deleteCategory } from '@/store/dataStore';
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
import type { Category } from '@/types';

const PAGE_SIZE = 10;

export default function CategoriesPage() {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState(getCategories);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [formError, setFormError] = useState('');

  const [reasonTarget, setReasonTarget] = useState<{ type: 'update' | 'delete'; category: Category; payload?: Category } | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [search, setSearch] = useState('');

  const refresh = () => setCategories(getCategories());

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  }, [categories, search]);

  const pagedCategories = paginateItems(filteredCategories, page, pageSize);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description });
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { setFormError('Category name is required'); return; }

    if (editing) {
      const payload = { ...editing, ...form };
      setDialogOpen(false);
      setReasonTarget({ type: 'update', category: editing, payload });
    } else {
      const c: Category = { id: crypto.randomUUID(), ...form, isActive: true, createdAt: new Date().toISOString() };
      addCategory(c);
      logAudit({ entityType: 'Category', entityId: c.id, action: 'Created', userId: currentUser!.id, userName: currentUser!.fullName, newValue: form.name });
      setDialogOpen(false);
      refresh();
    }
  };

  const requestDelete = (c: Category) => {
    setReasonTarget({ type: 'delete', category: c });
  };

  const toggleActive = (c: Category) => {
    updateCategory({ ...c, isActive: !c.isActive });
    logAudit({ entityType: 'Category', entityId: c.id, action: c.isActive ? 'Deactivated' : 'Activated', userId: currentUser!.id, userName: currentUser!.fullName });
    refresh();
  };

  const handleReasonConfirm = (reason: string) => {
    if (!reasonTarget) return;
    const { type, category, payload } = reasonTarget;

    if (type === 'update' && payload) {
      updateCategory(payload);
      logAudit({ entityType: 'Category', entityId: category.id, action: 'Updated', userId: currentUser!.id, userName: currentUser!.fullName, oldValue: category.name, newValue: payload.name, remarks: reason });
    } else if (type === 'delete') {
      deleteCategory(category.id);
      logAudit({ entityType: 'Category', entityId: category.id, action: 'Deleted', userId: currentUser!.id, userName: currentUser!.fullName, oldValue: category.name, remarks: reason });
    }

    setReasonTarget(null);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Category Master</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
      </div>

      <Input
        placeholder="Search categories..."
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
                <TableHead>Description</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedCategories.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No categories found</TableCell></TableRow>
              )}
              {pagedCategories.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.description || '-'}</TableCell>
                  <TableCell><Switch checked={c.isActive} onCheckedChange={() => toggleActive(c)} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => requestDelete(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination total={filteredCategories.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {formError && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{formError}</div>}
            <div className="space-y-2"><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Description</label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ReasonDialog
        open={!!reasonTarget}
        title={reasonTarget?.type === 'delete' ? 'Delete Category' : 'Update Category'}
        description={`Please provide a reason for ${reasonTarget?.type === 'delete' ? 'deleting' : 'updating'} category "${reasonTarget?.category.name}".`}
        onConfirm={handleReasonConfirm}
        onCancel={() => setReasonTarget(null)}
      />
    </div>
  );
}
