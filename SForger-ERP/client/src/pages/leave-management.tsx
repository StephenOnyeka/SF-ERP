import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, getStatusColor, calculateLeaveRange } from "@/lib/utils";
import Layout from "@/components/layout";
import LeaveForm from "@/components/leave-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CalendarDays, 
  Clock, 
  Filter, 
  Loader2, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  Calendar
} from "lucide-react";

export default function LeaveManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("apply");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Fetch leave applications
  const { 
    data: leaveApplications, 
    isLoading: isLoadingApplications,
    refetch: refetchApplications
  } = useQuery({
    queryKey: ["/api/leave-applications", { userId: user?.id, status: statusFilter || undefined }],
    enabled: !!user,
  });

  // Fetch leave balances
  const { data: leaveBalances, isLoading: isLoadingBalances } = useQuery({
    queryKey: ["/api/leave-balances", { userId: user?.id }],
    enabled: !!user,
  });

  // Fetch leave types for display names
  const { data: leaveTypes } = useQuery({
    queryKey: ["/api/leave-types"],
    enabled: !!user,
  });

  // For HR/Admin: Get pending leave requests to approve/reject
  const isApprover = user?.role === "admin" || user?.role === "hr";
  const { 
    data: pendingApplications, 
    isLoading: isLoadingPending,
    refetch: refetchPending
  } = useQuery({
    queryKey: ["/api/leave-applications", { status: "pending" }],
    enabled: !!user && isApprover,
  });

  // Handle leave application refresh
  const handleRefresh = () => {
    refetchApplications();
    if (isApprover) {
      refetchPending();
    }
  };

  // Get leave type name by ID
  const getLeaveTypeName = (id: number) => {
    return leaveTypes?.find(type => type.id === id)?.name || "Unknown";
  };

  // Calculate leave days
  const getLeaveDays = (startDate: string, endDate: string) => {
    return calculateLeaveRange(startDate, endDate);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <Tabs 
          defaultValue="apply" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="apply">Apply for Leave</TabsTrigger>
              <TabsTrigger value="history">Leave History</TabsTrigger>
              {isApprover && (
                <TabsTrigger value="approvals">Approvals</TabsTrigger>
              )}
            </TabsList>
            
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Leave Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isLoadingBalances ? (
              <div className="col-span-3 flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : leaveBalances?.map((balance) => (
              <Card key={balance.id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary-50 p-3 rounded-full">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{getLeaveTypeName(balance.leaveTypeId)}</p>
                      <div className="flex items-baseline mt-1">
                        <h3 className="text-2xl font-bold">{balance.totalDays - balance.usedDays}</h3>
                        <span className="ml-2 text-sm text-gray-600">/ {balance.totalDays} days available</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <TabsContent value="apply" className="space-y-4 pt-2">
            <LeaveForm onSuccess={handleRefresh} />
          </TabsContent>

          <TabsContent value="history" className="space-y-4 pt-2">
            <Card>
              <CardHeader>
                <CardTitle>Leave History</CardTitle>
                <CardDescription>
                  View all your leave applications and their status
                </CardDescription>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
                  <div className="w-full sm:w-auto flex-1">
                    <Label htmlFor="statusFilter">Filter by Status</Label>
                    <select
                      id="statusFilter"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <Button 
                    variant="outline" 
                    className="sm:mt-8 w-full sm:w-auto"
                    onClick={() => refetchApplications()}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Apply Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingApplications ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : leaveApplications && leaveApplications.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Leave Type</th>
                          <th className="text-left py-3 px-4 font-medium">Dates</th>
                          <th className="text-left py-3 px-4 font-medium">Duration</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                          <th className="text-left py-3 px-4 font-medium">Applied On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveApplications.map((application) => (
                          <tr key={application.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{getLeaveTypeName(application.leaveTypeId)}</td>
                            <td className="py-3 px-4">
                              {formatDate(application.startDate)} - {formatDate(application.endDate)}
                            </td>
                            <td className="py-3 px-4">
                              {getLeaveDays(application.startDate, application.endDate)} days
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={getStatusColor(application.status)}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">{formatDate(application.appliedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No leave applications found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isApprover && (
            <TabsContent value="approvals" className="space-y-4 pt-2">
              <Card>
                <CardHeader>
                  <CardTitle>Leave Approvals</CardTitle>
                  <CardDescription>
                    Review and manage leave requests from employees
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingPending ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : pendingApplications && pendingApplications.length > 0 ? (
                    <div className="space-y-6">
                      {pendingApplications.map((application) => {
                        const leaveTypeName = getLeaveTypeName(application.leaveTypeId);
                        const daysRequested = getLeaveDays(application.startDate, application.endDate);
                        
                        return (
                          <div key={application.id} className="border rounded-lg p-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                              <div>
                                <h4 className="text-lg font-semibold">
                                  {application.user?.fullName || `User ID: ${application.userId}`}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {application.user?.department || "Department not specified"} - 
                                  {application.user?.position || "Position not specified"}
                                </p>
                              </div>
                              <Badge className="mt-2 md:mt-0 bg-yellow-100 text-yellow-800">Pending Approval</Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-500">Leave Type</p>
                                <p className="font-medium">{leaveTypeName}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Duration</p>
                                <p className="font-medium">
                                  {formatDate(application.startDate)} - {formatDate(application.endDate)}
                                  <span className="text-sm text-gray-500 ml-2">({daysRequested} days)</span>
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Applied On</p>
                                <p className="font-medium">{formatDate(application.appliedAt)}</p>
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <p className="text-sm text-gray-500">Reason</p>
                              <p className="bg-gray-50 p-3 rounded-md mt-1">{application.reason}</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-2 justify-end">
                              <Button variant="outline" className="sm:w-auto">
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                              <Button className="sm:w-auto">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500">No pending leave applications to approve</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
