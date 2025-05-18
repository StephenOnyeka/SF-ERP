import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DownloadCloud, BarChart2 } from "lucide-react";

export default function AttendanceReport() {
  // State for filters
  const [period, setPeriod] = useState("month");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Calculate date range based on period
  const today = new Date();
  let startDate, endDate;
  
  switch (period) {
    case "week":
      startDate = subDays(today, 7);
      endDate = today;
      break;
    case "month":
      startDate = startOfMonth(today);
      endDate = endOfMonth(today);
      break;
    case "quarter":
      startDate = subDays(today, 90);
      endDate = today;
      break;
    default:
      startDate = startOfMonth(today);
      endDate = endOfMonth(today);
  }
  
  // Query users data
  const { data: users, isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });
  
  // Format dates for API
  const formattedStartDate = format(startDate, 'yyyy-MM-dd');
  const formattedEndDate = format(endDate, 'yyyy-MM-dd');

  // Query attendance report data
  const { data: reportData, isLoading } = useQuery<any[]>({
    queryKey: [
      "/api/reports/attendance",
      formattedStartDate,
      formattedEndDate,
      selectedUserId
    ],
    queryFn: async () => {
      // Determine if we need to add userId to the query
      const userIdParam = selectedUserId && selectedUserId !== "all" ? `&userId=${selectedUserId}` : '';
      
      const url = `/api/reports/attendance?startDate=${formattedStartDate}&endDate=${formattedEndDate}${userIdParam}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch attendance report');
      }
      return response.json();
    }
  });
  
  // Reset user filter when period changes
  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    setSelectedUserId(null);
  };
  
  if (isLoading || isLoadingUsers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary Report</CardTitle>
          <CardDescription>
            Overview of employee attendance during the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-6">
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-40" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Summary Report</CardTitle>
        <CardDescription>
          Overview of employee attendance during the selected period
          ({format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-6">
          <div className="flex gap-2">
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Current Month</SelectItem>
                <SelectItem value="quarter">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={selectedUserId || ""} 
              onValueChange={setSelectedUserId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">All Employees</SelectItem>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline">
            <DownloadCloud className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        
        {reportData && reportData.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Present Days</TableHead>
                  <TableHead>Absent Days</TableHead>
                  <TableHead>Half Days</TableHead>
                  <TableHead>Late Arrivals</TableHead>
                  <TableHead>Avg. Working Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((record) => (
                  <TableRow key={record.user.id}>
                    <TableCell className="font-medium">
                      {record.user.firstName} {record.user.lastName}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 mr-2">
                          {record.presentDays}
                        </Badge>
                        {period === "month" && (
                          <span className="text-xs text-gray-500">
                            {Math.round((record.presentDays / 22) * 100)}%
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        {record.absentDays}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        {record.halfDays}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                        {record.lateArrivals}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{record.avgWorkingHours}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 border rounded-md">
            <BarChart2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No attendance data available for the selected period.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
