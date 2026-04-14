import { addAuditEntry } from '@/store/dataStore';
import type { AuditEntry } from '@/types';

export function logAudit(params: {
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  userName: string;
  oldValue?: string | null;
  newValue?: string | null;
}) {
  const entry: AuditEntry = {
    id: crypto.randomUUID(),
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    userId: params.userId,
    userName: params.userName,
    oldValue: params.oldValue ?? null,
    newValue: params.newValue ?? null,
    timestamp: new Date().toISOString(),
  };
  addAuditEntry(entry);
}
