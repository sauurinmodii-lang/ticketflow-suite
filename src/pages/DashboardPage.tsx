import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTickets, getSites, getUsers, getCategories } from '@/store/dataStore';
import { useAuth } from '@/contexts/AuthContext';
import { Ticket, BarChart3, Users, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const tickets = getTickets();
  const sites = getSites();
  const users = getUsers();
  const categories = getCategories();

  const stats = useMemo(() => {
    const open = tickets.filter(t => t.status === 'Open').length;
    const inProgress = tickets.filter(t => ['Allocated', 'In Progress'].includes(t.status)).length;
    const resolved = tickets.filter(t => ['Resolved', 'Acknowledged', 'Closed'].includes(t.status)).length;
    const critical = tickets.filter(t => t.priority === 'Critical' && !['Resolved', 'Acknowledged', 'Closed'].includes(t.status)).length;

    const byStatus: Record<string, number> = {};
    tickets.forEach(t => { byStatus[t.status] = (byStatus[t.status] || 0) + 1; });

    const byPriority: Record<string, number> = {};
    tickets.forEach(t => { byPriority[t.priority] = (byPriority[t.priority] || 0) + 1; });

    const bySite: Record<string, number> = {};
    tickets.forEach(t => {
      const site = sites.find(s => s.id === t.siteId);
      const name = site?.name || 'Unknown';
      bySite[name] = (bySite[name] || 0) + 1;
    });

    const byCategory: Record<string, number> = {};
    tickets.forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const name = cat?.name || 'Unknown';
      byCategory[name] = (byCategory[name] || 0) + 1;
    });

    return { open, inProgress, resolved, critical, total: tickets.length, byStatus, byPriority, bySite, byCategory };
  }, [tickets, sites, categories]);

  const statCards = [
    { label: 'Total Tickets', value: stats.total, icon: Ticket, color: 'text-primary' },
    { label: 'Open', value: stats.open, icon: BarChart3, color: 'text-info' },
    { label: 'In Progress', value: stats.inProgress, icon: Users, color: 'text-warning' },
    { label: 'Critical Open', value: stats.critical, icon: AlertTriangle, color: 'text-destructive' },
  ];

  const priorityColors: Record<string, string> = {
    Critical: 'bg-destructive',
    High: 'bg-warning',
    Medium: 'bg-info',
    Low: 'bg-success',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Welcome back, {currentUser?.fullName}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">By Status</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats.byStatus).length === 0 && <p className="text-sm text-muted-foreground">No tickets yet</p>}
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-sm">{status}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(20, (count / Math.max(stats.total, 1)) * 150)}px` }} />
                  <span className="text-sm font-medium w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">By Priority</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats.byPriority).length === 0 && <p className="text-sm text-muted-foreground">No tickets yet</p>}
            {Object.entries(stats.byPriority).map(([priority, count]) => (
              <div key={priority} className="flex justify-between items-center">
                <span className="text-sm">{priority}</span>
                <div className="flex items-center gap-2">
                  <div className={`h-2 rounded-full ${priorityColors[priority] || 'bg-muted'}`} style={{ width: `${Math.max(20, (count / Math.max(stats.total, 1)) * 150)}px` }} />
                  <span className="text-sm font-medium w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">By Site</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats.bySite).length === 0 && <p className="text-sm text-muted-foreground">No tickets yet</p>}
            {Object.entries(stats.bySite).map(([site, count]) => (
              <div key={site} className="flex justify-between text-sm">
                <span>{site}</span><span className="font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">By Category</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats.byCategory).length === 0 && <p className="text-sm text-muted-foreground">No tickets yet</p>}
            {Object.entries(stats.byCategory).map(([cat, count]) => (
              <div key={cat} className="flex justify-between text-sm">
                <span>{cat}</span><span className="font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
