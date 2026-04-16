import { useState, useMemo } from 'react';
import { getGroups, getSites, getUsers, getGroupMembers, addGroupMember, removeGroupMember, getActiveRoles } from '@/store/dataStore';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Pagination, { paginateItems } from '@/components/shared/Pagination';
import { UserPlus, UserMinus, Filter } from 'lucide-react';

const PAGE_SIZE = 10;

export default function GroupAssignPage() {
  const { currentUser } = useAuth();
  const allGroups = getGroups().filter(g => g.isActive);
  const allSites = getSites();
  const allUsers = getUsers().filter(u => u.isActive);
  const activeRoles = getActiveRoles();

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [members, setMembers] = useState(getGroupMembers);

  const [filterSiteId, setFilterSiteId] = useState('');
  const [filterRoleId, setFilterRoleId] = useState('');
  const [searchAvailable, setSearchAvailable] = useState('');

  const [enrolledPage, setEnrolledPage] = useState(1);
  const [availablePage, setAvailablePage] = useState(1);

  const selectedGroup = allGroups.find(g => g.id === selectedGroupId);

  const refreshMembers = () => setMembers(getGroupMembers());

  const groupUserIds = useMemo(() => {
    return new Set(members.filter(m => m.groupId === selectedGroupId).map(m => m.userId));
  }, [members, selectedGroupId]);

  const eligibleUsers = useMemo(() => {
    if (!selectedGroup) return [];
    return allUsers.filter(u => selectedGroup.siteIds.includes(u.siteId));
  }, [selectedGroup, allUsers]);

  const enrolledUsers = useMemo(() => {
    let list = eligibleUsers.filter(u => groupUserIds.has(u.id));
    if (filterSiteId) list = list.filter(u => u.siteId === filterSiteId);
    if (filterRoleId) list = list.filter(u => u.role === filterRoleId);
    return list;
  }, [eligibleUsers, groupUserIds, filterSiteId, filterRoleId]);

  const availableUsers = useMemo(() => {
    let list = eligibleUsers.filter(u => !groupUserIds.has(u.id));
    if (filterSiteId) list = list.filter(u => u.siteId === filterSiteId);
    if (filterRoleId) list = list.filter(u => u.role === filterRoleId);
    if (searchAvailable.trim()) {
      const q = searchAvailable.toLowerCase();
      list = list.filter(u =>
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
      );
    }
    return list;
  }, [eligibleUsers, groupUserIds, filterSiteId, filterRoleId, searchAvailable]);

  const pagedEnrolled = paginateItems(enrolledUsers, enrolledPage, PAGE_SIZE);
  const pagedAvailable = paginateItems(availableUsers, availablePage, PAGE_SIZE);

  const getSiteName = (id: string) => allSites.find(s => s.id === id)?.name || '-';
  const getRoleName = (id: string) => activeRoles.find(r => r.id === id)?.name || id;

  const handleAdd = (userId: string) => {
    addGroupMember({ groupId: selectedGroupId, userId });
    const user = allUsers.find(u => u.id === userId);
    logAudit({
      entityType: 'GroupMember', entityId: selectedGroupId,
      action: 'User Enrolled',
      userId: currentUser!.id, userName: currentUser!.fullName,
      newValue: user?.fullName || userId,
    });
    refreshMembers();
  };

  const handleRemove = (userId: string) => {
    removeGroupMember(selectedGroupId, userId);
    const user = allUsers.find(u => u.id === userId);
    logAudit({
      entityType: 'GroupMember', entityId: selectedGroupId,
      action: 'User Removed',
      userId: currentUser!.id, userName: currentUser!.fullName,
      oldValue: user?.fullName || userId,
    });
    refreshMembers();
  };

  const resetFilters = () => {
    setFilterSiteId('');
    setFilterRoleId('');
    setSearchAvailable('');
    setEnrolledPage(1);
    setAvailablePage(1);
  };

  const sitesForFilter = useMemo(() => {
    if (!selectedGroup) return allSites.filter(s => s.isActive);
    return allSites.filter(s => selectedGroup.siteIds.includes(s.id));
  }, [selectedGroup, allSites]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Group Assignment</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Assign users to support groups</p>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1 min-w-[220px]">
          <label className="text-sm font-medium">Select Group *</label>
          <Select value={selectedGroupId} onValueChange={v => { setSelectedGroupId(v); resetFilters(); }}>
            <SelectTrigger><SelectValue placeholder="Choose a group..." /></SelectTrigger>
            <SelectContent>
              {allGroups.length === 0 && <SelectItem value="_none" disabled>No active groups</SelectItem>}
              {allGroups.map(g => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedGroup && (
          <>
            <div className="space-y-1 min-w-[180px]">
              <label className="text-sm font-medium flex items-center gap-1"><Filter className="h-3 w-3" /> Filter by Site</label>
              <Select value={filterSiteId || 'all'} onValueChange={v => { setFilterSiteId(v === 'all' ? '' : v); setEnrolledPage(1); setAvailablePage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {sitesForFilter.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 min-w-[180px]">
              <label className="text-sm font-medium flex items-center gap-1"><Filter className="h-3 w-3" /> Filter by Role</label>
              <Select value={filterRoleId || 'all'} onValueChange={v => { setFilterRoleId(v === 'all' ? '' : v); setEnrolledPage(1); setAvailablePage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {activeRoles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      {selectedGroup && (
        <p className="text-sm text-muted-foreground">
          Sites covered: {selectedGroup.siteIds.map(id => getSiteName(id)).join(', ')}
        </p>
      )}

      {selectedGroupId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enrolled Members ({enrolledUsers.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedEnrolled.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No members enrolled</TableCell></TableRow>
                  )}
                  {pagedEnrolled.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.fullName}</TableCell>
                      <TableCell className="text-sm">{getSiteName(u.siteId)}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{getRoleName(u.role)}</Badge></TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="text-destructive h-7 w-7 p-0" onClick={() => handleRemove(u.id)} title="Remove from group">
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination total={enrolledUsers.length} page={enrolledPage} pageSize={PAGE_SIZE} onPageChange={setEnrolledPage} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Available Users ({availableUsers.length})</CardTitle>
              <Input
                placeholder="Search by name or username..."
                value={searchAvailable}
                onChange={e => { setSearchAvailable(e.target.value); setAvailablePage(1); }}
                className="mt-2 h-8 text-sm"
              />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedAvailable.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No available users</TableCell></TableRow>
                  )}
                  {pagedAvailable.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.fullName}</TableCell>
                      <TableCell className="text-sm">{getSiteName(u.siteId)}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{getRoleName(u.role)}</Badge></TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="text-primary h-7 w-7 p-0" onClick={() => handleAdd(u.id)} title="Add to group">
                          <UserPlus className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination total={availableUsers.length} page={availablePage} pageSize={PAGE_SIZE} onPageChange={setAvailablePage} />
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedGroupId && (
        <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
          <p className="text-sm">Select a group above to manage its members</p>
        </div>
      )}
    </div>
  );
}
