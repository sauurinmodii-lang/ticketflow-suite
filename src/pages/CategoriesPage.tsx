import { useState } from 'react';
import { getCategories, addCategory, updateCategory, deleteCategory } from '@/store/dataStore';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Category } from '@/types';

export default function CategoriesPage() {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState(getCategories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const refresh = () => setCategories(getCategories());

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setError(''); setDialogOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, description: c.description }); setError(''); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name.trim()) { setError('Category name is required'); return; }
    if (editing) {
      updateCategory({ ...editing, ...form });
      logAudit({ entityType: 'Category', entityId: editing.id, action: 'Updated', userId: currentUser!.id, userName: currentUser!.fullName, oldValue: editing.name, newValue: form.name });
    } else {
      const c: Category = { id: crypto.randomUUID(), ...form, isActive: true, createdAt: new Date().toISOString() };
      addCategory(c);
      logAudit({ entityType: 'Category', entityId: c.id, action: 'Created', userId: currentUser!.id, userName: currentUser!.fullName, newValue: form.name });
    }
    setDialogOpen(false);
    refresh();
  };

  const handleDelete = (c: Category) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    deleteCategory(c.id);
    logAudit({ entityType: 'Category', entityId: c.id, action: 'Deleted', userId: currentUser!.id, userName: currentUser!.fullName, oldValue: c.name });
    refresh();
  };

  const toggleActive = (c: Category) => {
    updateCategory({ ...c, isActive: !c.isActive });
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Category Master</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead>Active</TableHead><TableHead className="w-24">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No categories found</TableCell></TableRow>}
              {categories.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.description}</TableCell>
                  <TableCell><Switch checked={c.isActive} onCheckedChange={() => toggleActive(c)} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {error && <div className="text-sm text-destructive">{error}</div>}
            <div className="space-y-2"><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Description</label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
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
