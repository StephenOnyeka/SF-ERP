import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { format, parseISO } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ManageLeaveApplications() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  
  // Query leave applications data
  const { data: leaveApplications, isLoading } = useQuery<any[]>({
    queryKey: ["/api/leave-applications"],
  });
  
  // Update leave application status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/leave-applications/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
      toast({
        title: "Status updated",
        description: "Leave application status has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter leave applications based on search
  const filteredApplications = leaveApplications
    ? leaveApplications.filter(
        (app) =>
          app.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
          app.user.lastName.toLowerCase().includes(search.toLowerCase()) ||
          app.leaveType.name.toLowerCase().includes(search.toLowerCase()) ||
          app.reason.toLowerCase().includes(search.toLowerCase())
      )
    : [];
  
  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const handleApprove = (id: number) => {
    updateStatusMutation.mutate({ id, status: "approved" });
  };
  
  const handleReject = (id: number) => {
    updateStatusMutation.mutate({ id, status: "rejected" });
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave Applications</CardTitle>
          <CardDescription>
            Manage employee leave requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Applications</CardTitle>
        <CardDescription>
          Review and manage employee leave requests
        </CardDescription>
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
                filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">
                      {application.user.firstName} {application.user.lastName}
                    </TableCell>
                    <TableCell>{application.leaveType.name}</TableCell>
                    <TableCell>
                      <div>{format(parseISO(application.startDate), "MMM d, yyyy")}</div>
                      <div className="text-xs text-gray-500">
                        to {format(parseISO(application.endDate), "MMM d, yyyy")}
                      </div>
                      <div className="text-xs font-medium mt-1">
                        {application.days} day{application.days !== 1 ? "s" : ""}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate">{application.reason}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(application.status)}</TableCell>
                    <TableCell>
                      {application.status === "pending" ? (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
                            onClick={() => handleApprove(application.id)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <UserCheck className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                            onClick={() => handleReject(application.id)}
                            disabled={updateStatusMutation.isPending}
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