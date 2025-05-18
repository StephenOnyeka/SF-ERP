import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Users, 
  PlusCircle, 
  UserPlus, 
  Pencil, 
  Trash2, 
  Search, 
  Loader2,
  ChevronDown,
  Filter,
  RefreshCw,
  Mail,
  Building2,
  Briefcase
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// User form schema
const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  companyId: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  profileImage: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function Employees() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Check if user is admin
  const isAdmin = user?.role === "admin";

  // Fetch all users
  const { data: employees, isLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user && (user.role === "admin" || user.role === "hr"),
  });

  // Get form with default values
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: "employee",
      department: "",
      position: "",
      profileImage: "",
    }
  });

  // Reset form when dialog closes
  const resetForm = () => {
    form.reset();
    setSelectedUser(null);
    setIsEditMode(false);
  };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const res = await apiRequest("POST", "/api/users", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "User Created",
        description: "New employee has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddUserOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create User",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<UserFormValues> }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "Employee information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddUserOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update User",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: UserFormValues) => {
    if (isEditMode && selectedUser) {
      // If password is empty, remove it from the data
      if (!data.password) {
        const { password, ...restData } = data;
        updateUserMutation.mutate({ id: selectedUser.id, data: restData });
      } else {
        updateUserMutation.mutate({ id: selectedUser.id, data });
      }
    } else {
      createUserMutation.mutate(data);
    }
  };

  // Edit user handler
  const handleEditUser = (employee: any) => {
    setSelectedUser(employee);
    setIsEditMode(true);
    
    form.reset({
      username: employee.username,
      password: "", // Don't fill password for security
      fullName: employee.fullName,
      email: employee.email,
      role: employee.role,
      companyId: employee.companyId,
      department: employee.department || "",
      position: employee.position || "",
      profileImage: employee.profileImage || "",
    });
    
    setIsAddUserOpen(true);
  };

  // Get unique departments for filter
  const departments = employees ? 
    [...new Set(employees.map(emp => emp.department).filter(Boolean))] : 
    [];
  
  // Filter employees based on search and department
  const filteredEmployees = employees?.filter(emp => {
    const matchesSearch = 
      !searchTerm || 
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepartment = 
      !departmentFilter || 
      emp.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <CardTitle>Employee Management</CardTitle>
                <CardDescription>
                  Manage employee accounts, departments, and roles
                </CardDescription>
              </div>
              
              {isAdmin && (
                <Button onClick={() => {
                  resetForm();
                  setIsAddUserOpen(true);
                }}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search by name, email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Filter by Department" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Button variant="outline" className="w-full md:w-auto" onClick={() => {
                  setSearchTerm("");
                  setDepartmentFilter("");
                }}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
                
                <Button variant="outline" className="w-full md:w-auto" onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/users"] });
                }}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search by name, email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Filter by Department" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button variant="outline" className="w-full md:w-auto" onClick={() => {
                setSearchTerm("");
                setDepartmentFilter("");
              }}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
              
              <Button variant="outline" className="w-full md:w-auto" onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/users"] });
              }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredEmployees && filteredEmployees.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Company ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={employee.profileImage} />
                            <AvatarFallback className="bg-primary text-white">
                              {employee.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{employee.fullName}</p>
                            <p className="text-sm text-gray-500">@{employee.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.companyId || "-"}</TableCell>
                      <TableCell>{employee.department || "-"}</TableCell>
                      <TableCell>{employee.position || "-"}</TableCell>
                      <TableCell>
                        <Badge className={
                          employee.role === "admin" 
                            ? "bg-purple-100 text-purple-800" 
                            : employee.role === "hr" 
                              ? "bg-blue-100 text-blue-800" 
                              : "bg-gray-100 text-gray-800"
                        }>
                          {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{employee.email}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditUser(employee)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10">
              <Users className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No employees found</p>
              {(searchTerm || departmentFilter) && (
                <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add/Edit User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={(open) => {
        setIsAddUserOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Update employee information in the system.' 
                : 'Add a new employee to the system. They will receive login credentials.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          {...field} 
                          placeholder="Enter username" 
                          className="pl-10"
                          disabled={isEditMode}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password" 
                        placeholder={isEditMode ? "Enter new password (optional)" : "Enter password"} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input {...field} placeholder="Enter full name" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input {...field} placeholder="Enter email address" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input {...field} placeholder="Department" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input {...field} placeholder="Position" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={async (value) => {
                          if (isEditMode && isAdmin && selectedUser && selectedUser.role !== value) {
                            // Call backend to change role
                            try {
                              const res = await apiRequest("POST", "/api/admin/change-role", {
                                userId: selectedUser._id || selectedUser.id,
                                newRole: value
                              }, {
                                Authorization: `Bearer ${user?.token}`
                              });
                              if (res.ok) {
                                toast({ title: "Role Updated", description: `Role changed to ${value}` });
                                queryClient.invalidateQueries({ queryKey: ["/api/users"] });
                              } else {
                                const err = await res.json();
                                toast({ title: "Failed to Change Role", description: err.message, variant: "destructive" });
                              }
                            } catch (e: any) {
                              toast({ title: "Failed to Change Role", description: e.message, variant: "destructive" });
                            }
                          }
                          field.onChange(value);
                        }}
                        disabled={!isAdmin || (isEditMode && selectedUser?.username === user?.username)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="hr">HR</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Company ID (read-only) */}
              {form.getValues("companyId") && (
                <FormItem>
                  <FormLabel>Company ID</FormLabel>
                  <FormControl>
                    <Input value={form.getValues("companyId") || "-"} disabled readOnly />
                  </FormControl>
                </FormItem>
              )}
              
              <FormField
                control={form.control}
                name="profileImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Image URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Profile image URL (optional)" />
                    </FormControl>
                    <FormDescription>
                      Enter a URL for the employee's profile image (optional).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddUserOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                >
                  {(createUserMutation.isPending || updateUserMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {isEditMode ? 'Update Employee' : 'Add Employee'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  </Layout>
);
                <FormField
                  control={form.control}
                  name="profileImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Image URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Profile image URL (optional)" />
                      </FormControl>
                      <FormDescription>
                        Enter a URL for the employee's profile image (optional).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddUserOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                  >
                    {(createUserMutation.isPending || updateUserMutation.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {isEditMode ? 'Update Employee' : 'Add Employee'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
