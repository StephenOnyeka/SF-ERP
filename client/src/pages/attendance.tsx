import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, formatTime, getStatusColor } from "@/lib/utils";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, AlertCircle } from "lucide-react";
import ClockButton from "@/components/clock-button";

export default function Attendance() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Fetch attendance data
  const { data: attendanceData, isLoading, refetch } = useQuery({
    queryKey: [
      "/api/attendance", 
      { 
        userId: user?.id, 
        startDate: dateRange.startDate, 
        endDate: dateRange.endDate 
      }
    ],
    enabled: !!user,
  });

  // Calculate statistics
  const stats = {
    totalDays: attendanceData?.length || 0,
    present: attendanceData?.filter(a => a.status === "present").length || 0,
    absent: attendanceData?.filter(a => a.status === "absent").length || 0,
    late: attendanceData?.filter(a => {
      if (!a.timeIn) return false;
      const [hours, minutes] = a.timeIn.split(":").map(Number);
      return a.status === "present" && (hours > 9 || (hours === 9 && minutes > 30));
    }).length || 0,
    missedPunch: attendanceData?.filter(a => 
      (a.timeIn && !a.timeOut) || (!a.timeIn && a.timeOut)
    ).length || 0,
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  const handleFilter = () => {
    refetch();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Card with Clock In/Out */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Management</CardTitle>
            <CardDescription>Track and manage your attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Today's Status</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getStatusColor("present")}>
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      attendanceData && attendanceData.some(a => 
                        a.date === new Date().toISOString().split('T')[0] && a.timeIn
                      ) ? (
                        attendanceData.some(a => 
                          a.date === new Date().toISOString().split('T')[0] && a.timeIn && a.timeOut
                        ) ? "Clocked Out" : "Clocked In"
                      ) : "Not Clocked In"
                    )}
                  </Badge>
                  <span className="text-sm text-gray-500">{formatDate(new Date())}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                <ClockButton 
                  type="in" 
                  disabled={
                    attendanceData && attendanceData.some(a => 
                      a.date === new Date().toISOString().split('T')[0] && a.timeIn && !a.timeOut
                    )
                  } 
                  onSuccess={() => refetch()} 
                />
                <ClockButton 
                  type="out" 
                  disabled={
                    !attendanceData || !attendanceData.some(a => 
                      a.date === new Date().toISOString().split('T')[0] && a.timeIn && !a.timeOut
                    )
                  } 
                  onSuccess={() => refetch()} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Days</p>
                  <h3 className="text-2xl font-bold">{stats.totalDays}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-green-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Present Days</p>
                  <h3 className="text-2xl font-bold">{stats.present}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Late Arrivals</p>
                  <h3 className="text-2xl font-bold">{stats.late}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Missed Punches</p>
                  <h3 className="text-2xl font-bold">{stats.missedPunch}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>View your attendance history and punches</CardDescription>
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <div className="grid w-full md:w-auto items-center gap-1.5">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                />
              </div>
              <div className="grid w-full md:w-auto items-center gap-1.5">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleFilter}>Filter</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : attendanceData && attendanceData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium">Clock In</th>
                      <th className="text-left py-3 px-4 font-medium">Clock Out</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{formatDate(record.date)}</td>
                        <td className="py-3 px-4">
                          {record.timeIn ? formatTime(record.timeIn) : "---"}
                        </td>
                        <td className="py-3 px-4">
                          {record.timeOut ? formatTime(record.timeOut) : "---"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(record.status)}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {record.timeIn && !record.timeOut && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Missing checkout
                            </Badge>
                          )}
                          {!record.timeIn && record.timeOut && (
                            <Badge variant="outline" className="bg-red-100 text-red-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Missing checkin
                            </Badge>
                          )}
                          {record.notes && (
                            <span className="text-sm text-gray-600">{record.notes}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No attendance records found for the selected period</p>
                <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                  Refresh Data
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
