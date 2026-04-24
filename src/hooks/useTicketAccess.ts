import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getGroupMembers } from '@/store/dataStore';
import type { Ticket } from '@/types';

export function useTicketAccess(tickets: Ticket[]) {
  const { currentUser, hasPermission } = useAuth();

  const visibleTickets = useMemo(() => {
    if (!currentUser) return [];

    const canSeeAll = hasPermission('view_all_sites_data');
    const canSeeAssignedSite = hasPermission('view_assigned_site_data');

    if (canSeeAll) {
      return tickets;
    }

    if (canSeeAssignedSite) {
      return tickets.filter(t => t.siteId === currentUser.siteId);
    }

    return tickets.filter(t => t.createdBy === currentUser.id);
  }, [tickets, currentUser, hasPermission]);

  return visibleTickets;
}

export function getVisibleTickets(
  tickets: Ticket[],
  userId: string,
  siteId: string,
  canSeeAll: boolean,
  canSeeAssignedSite: boolean
): Ticket[] {
  if (canSeeAll) return tickets;
  if (canSeeAssignedSite) return tickets.filter(t => t.siteId === siteId);
  return tickets.filter(t => t.createdBy === userId);
}
