import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, downloadAsExcel } from "@/lib/utils";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Download, 
  BarChart2, 
  PieChart,
  Users,
  Calendar,
  Clock,
  Filter,
  RefreshCw,
} from "lucide-react";

export default function Reports() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<string>("attendance");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [department, setDepartment] = useState<string>("");
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());

  // Check if user can access reports
  const canAccessReports = user && (user.role === "admin" || user.role === "hr");

  // Fetch attendance report
  const { 
    data: attendanceReport, 
    isLoading: isLoadingAttendance,
    refetch: refetchAttendanceReport
  } = useQuery({
    queryKey: [
      "/api/reports/attendance", 
      { 
        startDate: dateRange.startDate, 
        endDate: dateRange.endDate,
        department: department || undefined
      }
    ],
    enabled: !!user && canAccessReports && reportType === "attendance",
  });

  // Fetch leave report
  const { 
    data: leaveReport, 
    isLoading: isLoadingLeave,
    refetch: refetchLeaveReport
  } = useQuery({
    queryKey: [
      "/api/reports/leave", 
      { 
        year: parseInt(year),
        department: department || undefined
      }
    ],
    enabled: !!user && canAccessReports && reportType === "leave",
  });

  // Handle date range change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  // Handle filter button click
  const handleFilter = () => {
    if (reportType === "attendance") {
      refetchAttendanceReport();
    } else {
      refetchLeaveReport();
    }
  };

  // Handle export to Excel
  const handleExportExcel = () => {
    if (reportType === "attendance" && attendanceReport) {
      downloadAsExcel(attendanceReport, `Attendance_Report_${dateRange.startDate}_to_${dateRange.endDate}`);
    } else if (reportType === "leave" && leaveReport) {
      downloadAsExcel(leaveReport, `Leave_Report_${year}`);
    }
  };

  // Get years for filter
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  // Mock departments for filter - in a real app these would come from an API
  const departments = ["Engineering", "Human Resources", "Marketing", "Finance", "Operations"];

  // Check if data is available for charts
  const hasAttendanceData = attendanceReport && attendanceReport.length > 0;
  const hasLeaveData = leaveReport && leaveReport.length > 0;

  return (
    <Layout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Reports & Analytics</CardTitle>
            <CardDescription>
              View and analyze company-wide attendance and leave data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canAccessReports ? (
              <Tabs defaultValue="attendance" value={reportType} onValueChange={setReportType} className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                  <TabsList>
                    <TabsTrigger value="attendance">Attendance Report</TabsTrigger>
                    <TabsTrigger value="leave">Leave Report</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleExportExcel}
                      disabled={(reportType === "attendance" && !hasAttendanceData) || (reportType === "leave" && !hasLeaveData)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export to Excel
                    </Button>
                  </div>
                </div>
                
                <TabsContent value="attendance" className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">Attendance Report Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          name="startDate"
                          type="date"
                          value={dateRange.startDate}
                          onChange={handleDateChange}
                        />
                      </div>
                      
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          name="endDate"
                          type="date"
                          value={dateRange.endDate}
                          onChange={handleDateChange}
                        />
                      </div>
                      
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="department">Department</Label>
                        <Select value={department} onValueChange={setDepartment}>
                          <SelectTrigger id="department">
                            <SelectValue placeholder="All Departments" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Departments</SelectItem>
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-end gap-2">
                        <Button className="flex-1" onClick={handleFilter}>
                          <Filter className="h-4 w-4 mr-2" />
                          Apply Filter
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setDateRange({
                            startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                            endDate: new Date().toISOString().split('T')[0]
                          });
                          setDepartment("");
                        }}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Attendance Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Average Attendance Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingAttendance ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : hasAttendanceData ? (
                          <div className="flex flex-col items-center">
                            <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-primary-50 mb-2">
                              <span className="text-2xl font-bold text-primary">
                                {Math.round(attendanceReport.reduce((acc, user) => acc + user.attendanceRate, 0) / attendanceReport.length)}%
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">Overall attendance rate</span>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-500">No data available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Late Arrivals</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingAttendance ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : hasAttendanceData ? (
                          <div className="flex flex-col items-center">
                            <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-yellow-50 mb-2">
                              <span className="text-2xl font-bold text-yellow-600">
                                {attendanceReport.reduce((acc, user) => acc + user.lateDays, 0)}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">Total late arrivals</span>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-500">No data available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Absent Days</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingAttendance ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : hasAttendanceData ? (
                          <div className="flex flex-col items-center">
                            <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-red-50 mb-2">
                              <span className="text-2xl font-bold text-red-600">
                                {attendanceReport.reduce((acc, user) => acc + user.absentDays, 0)}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">Total absent days</span>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-500">No data available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Attendance Data Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance Details</CardTitle>
                      <CardDescription>
                        Employee attendance data for the selected period
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingAttendance ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : hasAttendanceData ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4 font-medium">Employee</th>
                                <th className="text-left py-3 px-4 font-medium">Department</th>
                                <th className="text-left py-3 px-4 font-medium">Present Days</th>
                                <th className="text-left py-3 px-4 font-medium">Absent Days</th>
                                <th className="text-left py-3 px-4 font-medium">Late Arrivals</th>
                                <th className="text-left py-3 px-4 font-medium">Attendance Rate</th>
                              </tr>
                            </thead>
                            <tbody>
                              {attendanceReport.map((record, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                  <td className="py-3 px-4">{record.userName}</td>
                                  <td className="py-3 px-4">{record.department || '-'}</td>
                                  <td className="py-3 px-4">{record.presentDays}</td>
                                  <td className="py-3 px-4">{record.absentDays}</td>
                                  <td className="py-3 px-4">{record.lateDays}</td>
                                  <td className="py-3 px-4">{record.attendanceRate.toFixed(1)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-10">
                          <BarChart2 className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                          <p className="text-gray-500">No attendance data available for the selected period</p>
                          <Button variant="outline" className="mt-4" onClick={handleFilter}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Data
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="leave" className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">Leave Report Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="year">Year</Label>
                        <Select value={year} onValueChange={setYear}>
                          <SelectTrigger id="year">
                            <SelectValue placeholder="Select Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((y) => (
                              <SelectItem key={y} value={y}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="leaveDepartment">Department</Label>
                        <Select value={department} onValueChange={setDepartment}>
                          <SelectTrigger id="leaveDepartment">
                            <SelectValue placeholder="All Departments" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Departments</SelectItem>
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-end gap-2">
                        <Button className="flex-1" onClick={handleFilter}>
                          <Filter className="h-4 w-4 mr-2" />
                          Apply Filter
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setYear(new Date().getFullYear().toString());
                          setDepartment("");
                        }}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Leave Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Total Leave Days Taken</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingLeave ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : hasLeaveData ? (
                          <div className="flex flex-col items-center">
                            <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-primary-50 mb-2">
                              <span className="text-2xl font-bold text-primary">
                                {leaveReport.reduce((acc, user) => 
                                  acc + user.leaveByType.reduce((typeAcc, type) => typeAcc + type.totalDays, 0), 0
                                )}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">Days of leave taken</span>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-500">No data available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Average Leave Per Employee</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingLeave ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : hasLeaveData ? (
                          <div className="flex flex-col items-center">
                            <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-blue-50 mb-2">
                              <span className="text-2xl font-bold text-blue-600">
                                {(leaveReport.reduce((acc, user) => 
                                  acc + user.leaveByType.reduce((typeAcc, type) => typeAcc + type.totalDays, 0), 0
                                ) / leaveReport.length).toFixed(1)}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">Avg days per employee</span>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-500">No data available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Remaining Leave Balance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingLeave ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : hasLeaveData ? (
                          <div className="flex flex-col items-center">
                            <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-green-50 mb-2">
                              <span className="text-2xl font-bold text-green-600">
                                {leaveReport.reduce((acc, user) => 
                                  acc + user.leaveBalances.reduce((balAcc, bal) => balAcc + bal.remainingDays, 0), 0
                                )}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">Remaining balance days</span>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-500">No data available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Leave Data Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Leave Details</CardTitle>
                      <CardDescription>
                        Employee leave data for the selected year
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingLeave ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : hasLeaveData ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4 font-medium">Employee</th>
                                <th className="text-left py-3 px-4 font-medium">Department</th>
                                <th className="text-left py-3 px-4 font-medium">Paid Leave</th>
                                <th className="text-left py-3 px-4 font-medium">Sick Leave</th>
                                <th className="text-left py-3 px-4 font-medium">Casual Leave</th>
                                <th className="text-left py-3 px-4 font-medium">Total Taken</th>
                                <th className="text-left py-3 px-4 font-medium">Remaining</th>
                              </tr>
                            </thead>
                            <tbody>
                              {leaveReport.map((record, index) => {
                                const paidLeave = record.leaveByType.find(t => t.leaveTypeName === "Paid Leave")?.totalDays || 0;
                                const sickLeave = record.leaveByType.find(t => t.leaveTypeName === "Sick Leave")?.totalDays || 0;
                                const casualLeave = record.leaveByType.find(t => t.leaveTypeName === "Casual Leave")?.totalDays || 0;
                                const totalTaken = record.leaveByType.reduce((acc, t) => acc + t.totalDays, 0);
                                const totalRemaining = record.leaveBalances.reduce((acc, b) => acc + b.remainingDays, 0);
                                
                                return (
                                  <tr key={index} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4">{record.userName}</td>
                                    <td className="py-3 px-4">{record.department || '-'}</td>
                                    <td className="py-3 px-4">{paidLeave}</td>
                                    <td className="py-3 px-4">{sickLeave}</td>
                                    <td className="py-3 px-4">{casualLeave}</td>
                                    <td className="py-3 px-4">{totalTaken}</td>
                                    <td className="py-3 px-4">{totalRemaining}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-10">
                          <PieChart className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                          <p className="text-gray-500">No leave data available for the selected year</p>
                          <Button variant="outline" className="mt-4" onClick={handleFilter}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Data
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-10">
                <BarChart2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Access Restricted</h3>
                <p className="text-gray-500">
                  You need administrator or HR permissions to view reports.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
