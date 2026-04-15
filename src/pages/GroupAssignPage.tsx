import { useState, useMemo } from 'react';
import { getGroups, getSites, getUsers, getGroupMembers, addGroupMember, removeGroupMember } from '@/store/dataStore';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserMinus } from 'lucide-react';

export default function GroupAssignPage() {
  const { currentUser } = useAuth();
  const groups = getGroups().filter(g => g.isActive);
  const allSites = getSites();
  const allUsers = getUsers().filter(u => u.isActive);

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [members, setMembers] = useState(getGroupMembers);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const refreshMembers = () => setMembers(getGroupMembers());

  // Users at sites belonging to the selected group
  const eligibleUsers = useMemo(() => {
    if (!selectedGroup) return [];
    return allUsers.filter(u => selectedGroup.siteIds.includes(u.siteId));
  }, [selectedGroup, allUsers]);

  const groupUserIds = useMemo(() => {
    return new Set(members.filter(m => m.groupId === selectedGroupId).map(m => m.userId));
  }, [members, selectedGroupId]);

  const enrolledUsers = eligibleUsers.filter(u => groupUserIds.has(u.id));
  const availableUsers = eligibleUsers.filter(u => !groupUserIds.has(u.id));

  const getSiteName = (id: string) => allSites.find(s => s.id === id)?.name || '-';

  const handleAdd = (userId: string) => {
    addGroupMember({ groupId: selectedGroupId, userId });
    const user = allUsers.find(u => u.id === userId);
    logAudit({ entityType: 'GroupMember', entityId: selectedGroupId, action: 'User Enrolled', userId: currentUser!.id, userName: currentUser!.fullName, newValue: user?.fullName || userId });
    refreshMembers();
  };

  const handleRemove = (userId: string) => {
    removeGroupMember(selectedGroupId, userId);
    const user = allUsers.find(u => u.id === userId);
    logAudit({ entityType: 'GroupMember', entityId: selectedGroupId, action: 'User Removed', userId: currentUser!.id, userName: currentUser!.fullName, oldValue: user?.fullName || userId });
    refreshMembers();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Group Assignment</h1>

      <div className="max-w-sm space-y-2">
        <label className="text-sm font-medium">Select Group</label>
        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
          <SelectTrigger><SelectValue placeholder="Choose a group..." /></SelectTrigger>
          <SelectContent>
            {groups.map(g => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedGroup && (
        <div className="text-sm text-muted-foreground">
          Sites: {selectedGroup.siteIds.map(id => getSiteName(id)).join(', ')}
        </div>
      )}

      {selectedGroupId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enrolled Members */}
          <Card>
            <CardHeader><CardTitle className="text-base">Enrolled Members ({enrolledUsers.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledUsers.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No members enrolled</TableCell></TableRow>
                  )}
                  {enrolledUsers.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.fullName}</TableCell>
                      <TableCell className="text-sm">{getSiteName(u.siteId)}</TableCell>
                      <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRemove(u.id)}>
                          <UserMinus className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Available Users */}
          <Card>
            <CardHeader><CardTitle className="text-base">Available Users ({availableUsers.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableUsers.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No available users</TableCell></TableRow>
                  )}
                  {availableUsers.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.fullName}</TableCell>
                      <TableCell className="text-sm">{getSiteName(u.siteId)}</TableCell>
                      <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="text-primary" onClick={() => handleAdd(u.id)}>
                          <UserPlus className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
