import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ReasonDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function ReasonDialog({ open, title = 'Reason for Change', description, onConfirm, onCancel }: ReasonDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for this change.');
      return;
    }
    const r = reason.trim();
    setReason('');
    setError('');
    onConfirm(r);
  };

  const handleCancel = () => {
    setReason('');
    setError('');
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason <span className="text-destructive">*</span></Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={e => { setReason(e.target.value); setError(''); }}
              placeholder="Describe why this change is being made..."
              rows={3}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
