import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  Trash,
  MoreHorizontal,
  UserCircle,
  UserCog,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { User } from "@shared/schema";

export default function UsersTable() {
  const {
    users,
    fetchUsers,
    updateUser,
    deleteUser,
  } = useAuthStore();

  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState<User["role"]>("employee");
  const itemsPerPage = 8;

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      await updateUser(userId,{});
      toast({ title: "Status updated" });
    } catch {
      toast({ title: "Failed to update user status", variant: "destructive" });
    }
  };

  const confirmChangeRole = async () => {
    if (selectedUser && newRole) {
      await updateUser(selectedUser.id, { role: newRole });
      setIsRoleDialogOpen(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (deleteUserId) {
      await deleteUser(deleteUserId);
      setIsDeleteDialogOpen(false);
    }
  };

  const canDeleteUser = (targetUser: any) => {
    if (!currentUser) return false;
    if (currentUser.id === targetUser.id) return false;
    if (currentUser.role === "admin") return true;
    if (currentUser.role === "hr" && targetUser.role === "employee") return true;
    return false;
  };

  const canChangeRole = () => currentUser?.role === "admin";

  const filteredUsers = users.filter((user) =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" /> Admin
          </Badge>
        );
      case "hr":
        return (
          <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
            <UserCog className="h-3 w-3" /> HR
          </Badge>
        );
      case "employee":
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <UserCircle className="h-3 w-3" /> Employee
          </Badge>
        );
      default:
        return <Badge>{role}</Badge>;
    }
  };

  // if (loading) {
  //   return (
  //     <Card>
  //       <CardHeader>
  //         <CardTitle>Users</CardTitle>
  //         <CardDescription>Manage employee accounts, roles, and permissions</CardDescription>
  //       </CardHeader>
  //       <CardContent>
  //         <Skeleton className="h-10 w-full mb-4" />
  //         <Skeleton className="h-10 w-full mb-2" />
  //         <Skeleton className="h-10 w-full mb-2" />
  //         <Skeleton className="h-10 w-full mb-2" />
  //       </CardContent>
  //     </Card>
  //   );
  // }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage employee accounts, roles, and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs "bg-red-100 text-red-800"}`}>
                          {user.department || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" title="User Actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canChangeRole() && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user);
                                setNewRole(user.role);
                                setIsRoleDialogOpen(true);
                              }}>
                                <UserCog className="h-4 w-4 mr-2" /> Change Role
                              </DropdownMenuItem>
                            )}
                            {canDeleteUser(user) && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeleteUserId(user.id);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <Trash className="h-4 w-4 mr-2" /> Delete User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                      No users found{search && " matching search criteria"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-end mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} isActive={currentPage > 1} />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        isActive={currentPage === index + 1}
                        onClick={() => setCurrentPage(index + 1)}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} isActive={currentPage < totalPages} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>Change role for {selectedUser?.firstName} {selectedUser?.lastName}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={(e) => setNewRole(e as User["role"])}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmChangeRole} disabled={!newRole || newRole === selectedUser?.role}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>This action is irreversible.</DialogDescription>
          </DialogHeader>
          <div className="py-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-destructive">This will permanently remove the user from the system.</span>
          </div>
                    <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={!deleteUserId}
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

