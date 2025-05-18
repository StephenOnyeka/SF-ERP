import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DownloadCloud, PieChart } from "lucide-react";

export default function LeaveReport() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  // Generate year options (current year and previous 2 years)
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];
  
  // Query leave utilization report
  const { data: reportData, isLoading } = useQuery<any[]>({
    queryKey: ["/api/reports/leave-utilization", selectedYear],
    queryFn: async () => {
      const url = `/api/reports/leave-utilization?year=${selectedYear}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch leave utilization report');
      }
      return response.json();
    }
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave Utilization Report</CardTitle>
          <CardDescription>
            Overview of employee leave usage for {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-6">
            <Skeleton className="h-10 w-32" />
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
        <CardTitle>Leave Utilization Report</CardTitle>
        <CardDescription>
          Overview of employee leave usage for {selectedYear}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-6">
          <Select 
            value={selectedYear} 
            onValueChange={setSelectedYear}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
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
                  <TableHead>Leave Type</TableHead>
                  <TableHead className="w-[140px]">Quota</TableHead>
                  <TableHead className="w-[140px]">Utilized</TableHead>
                  <TableHead className="w-[140px]">Available</TableHead>
                  <TableHead className="text-right">Utilization %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.flatMap((report) => 
                  report.leaveUtilization.map((utilization: any, index: number) => (
                    <TableRow key={`${report.user.id}-${index}`}>
                      {index === 0 ? (
                        <TableCell 
                          className="font-medium"
                          rowSpan={report.leaveUtilization.length}
                        >
                          {report.user.firstName} {report.user.lastName}
                        </TableCell>
                      ) : null}
                      <TableCell>{utilization.leaveType}</TableCell>
                      <TableCell>{utilization.totalQuota} days</TableCell>
                      <TableCell>{utilization.usedQuota} days</TableCell>
                      <TableCell>{utilization.remainingQuota} days</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24">
                            <Progress 
                              value={utilization.utilizationPercentage} 
                              className="h-2"
                            />
                          </div>
                          <span className="text-sm">
                            {utilization.utilizationPercentage}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 border rounded-md">
            <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No leave utilization data available for {selectedYear}.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
