import { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DownloadCloud, PieChart } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useLeaveStore } from "@/stores/leave-store";

export default function LeaveReport() {
  const { users } = useAuth();
  const {
    leaveApplications,
    leaveQuotas,
  } = useLeaveStore();

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const reportData = useMemo(() => {
    return users.map((user) => {
      const userQuotas = leaveQuotas.filter(
        (q) => q.userId === user.id && q.year.toString() === selectedYear
      );

      const userApps = leaveApplications.filter(
        (app) =>
          app.userId === user.id &&
          app.status === "approved" &&
          new Date(app.appliedAt).getFullYear().toString() === selectedYear
      );

      const leaveTypeMap: Record<string, { used: number }> = {};

      userApps.forEach((app) => {
        if (!leaveTypeMap[app.leaveTypeId]) {
          leaveTypeMap[app.leaveTypeId] = { used: 0 };
        }
        leaveTypeMap[app.leaveTypeId].used += app.totalDays;
      });

      const leaveUtilization = userQuotas.map((quota) => {
        const usedQuota = leaveTypeMap[quota.leaveTypeId]?.used || 0;
        const remainingQuota = quota.totalQuota - usedQuota;
        const utilizationPercentage = quota.totalQuota
          ? Math.round((usedQuota / quota.totalQuota) * 100)
          : 0;

        return {
          leaveType: `Leave Type ${quota.leaveTypeId}`, // Replace with lookup if you have names
          totalQuota: quota.totalQuota,
          usedQuota,
          remainingQuota,
          utilizationPercentage,
        };
      });

      return {
        user,
        leaveUtilization,
      };
    }).filter((entry) => entry.leaveUtilization.length > 0);
  }, [users, leaveApplications, leaveQuotas, selectedYear]);

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

        {reportData.length > 0 ? (
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
                  report.leaveUtilization.map((utilization, index) => (
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
