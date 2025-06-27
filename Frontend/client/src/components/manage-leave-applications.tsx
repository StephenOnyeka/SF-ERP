import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, UserCheck, UserX } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLeaveStore } from "@/stores/leave-store";
import { useAuthStore } from "@/stores/auth-store";

export default function ManageLeaveApplications() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const { leaveApplications, updateLeaveStatus } = useLeaveStore();
  const { users } = useAuthStore();

  const enrichedApplications = leaveApplications.map((app) => {
    const user = users.find((u) => u.id === app.userId);
    return {
      ...app,
      user: user ?? { firstName: "Unknown", lastName: "User" },
      leaveType: {
        name: app.leaveTypeId === "1" ? "Annual" : app.leaveTypeId === "2" ? "Sick" : "Casual",
      },
    };
  });

  const filteredApplications = enrichedApplications.filter(
    (app) =>
      app.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      app.user.lastName.toLowerCase().includes(search.toLowerCase()) ||
      app.leaveType.name.toLowerCase().includes(search.toLowerCase()) ||
      app.reason?.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = (id: string, status: "approved" | "rejected") => {
    updateLeaveStatus(id, status);
    toast({
      title: "Status updated",
      description: `Leave was marked as ${status}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Applications</CardTitle>
        <CardDescription>Review and manage employee leave requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search applications..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length > 0 ? (
                filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      {app.user.firstName} {app.user.lastName}
                    </TableCell>
                    <TableCell>{app.leaveType.name}</TableCell>
                    <TableCell>
                      <div>{format(new Date(app.startDate), "MMM d, yyyy")}</div>
                      <div className="text-xs text-gray-500">
                        to {format(new Date(app.endDate), "MMM d, yyyy")}
                      </div>
                      <div className="text-xs font-medium mt-1">
                        {app.totalDays} day{app.totalDays !== 1 ? "s" : ""}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate">{app.reason}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          app.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : app.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {app.status === "pending" ? (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
                            onClick={() => handleStatusChange(app.id, "approved")}
                          >
                            <UserCheck className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                            onClick={() => handleStatusChange(app.id, "rejected")}
                          >
                            <UserX className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No actions available</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                    No leave applications found
                    {search && " matching search criteria"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
