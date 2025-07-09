// app/components/attendance-report.tsx

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

import { useState, useMemo } from "react";
import {
  subDays,
  startOfMonth,
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  addDays,
  isSameDay,
  differenceInMinutes,
} from "date-fns";

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
import { Badge } from "@/components/ui/badge";
import { DownloadCloud } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useAttendanceStore } from "@/stores/attendance-store";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const LATE_THRESHOLD_MINUTES = 9 * 60 + 15; // 9:15 AM
const HALF_DAY_MINUTES = 240; // 4 hours

export default function AttendanceReport() {
  const { users } = useAuth();
  const { attendanceRecords } = useAttendanceStore();

  const [period, setPeriod] = useState("month");
  const [selectedUserId, setSelectedUserId] = useState<string | null>("all");

  const today = new Date();

  const [startDate, endDate] = useMemo(() => {
    switch (period) {
      case "week":
        return [subDays(today, 7), today];
      case "quarter":
        return [subDays(today, 90), today];
      case "month":
      default:
        return [startOfMonth(today), endOfMonth(today)];
    }
  }, [period]);

  const dateRange: Date[] = [];
  for (let d = startDate; d <= endDate; d = addDays(d, 1)) {
    dateRange.push(d);
  }

  const filteredUsers = selectedUserId === "all"
    ? users
    : users.filter((u) => u.id === selectedUserId);

  const reportData = filteredUsers.map((user) => {
    const userRecords = attendanceRecords.filter(
      (rec) =>
        rec.userId === user.id &&
        isWithinInterval(new Date(rec.date), { start: startDate, end: endDate })
    );

    let presentDays = 0;
    let halfDays = 0;
    let lateArrivals = 0;
    let totalMinutes = 0;
    let attendedDates: string[] = [];

    userRecords.forEach((rec) => {
      const dateStr = new Date(rec.date).toISOString().split("T")[0];
      attendedDates.push(dateStr);

      if (rec.status === "present") {
        presentDays++;

        if (rec.checkInTime) {
          const checkIn = new Date(rec.checkInTime);
          const mins = checkIn.getHours() * 60 + checkIn.getMinutes();
          if (mins > LATE_THRESHOLD_MINUTES) lateArrivals++;
        }

        if (rec.workingHours) {
          const [h, m] = rec.workingHours.split(/[hm\s]+/).filter(Boolean).map(Number);
          const durationMin = h * 60 + m;
          totalMinutes += durationMin;
          if (durationMin < HALF_DAY_MINUTES) halfDays++;
        }
      }
    });

    const allDateStrings = dateRange.map((d) => format(d, "yyyy-MM-dd"));
    const absentDays = allDateStrings.filter(
      (d) => !attendedDates.includes(d)
    ).length;

    const avgMins = presentDays > 0 ? totalMinutes / presentDays : 0;
    const avgH = Math.floor(avgMins / 60);
    const avgM = Math.floor(avgMins % 60);
    const avgWorkingHours = presentDays > 0 ? `${avgH}h ${avgM}m` : "—";

    return {
      user,
      presentDays,
      halfDays,
      lateArrivals,
      absentDays,
      avgWorkingHours,
    };
  });

  const chartData = {
    labels: reportData.map((r) => `${r.user.firstName} ${r.user.lastName}`),
    datasets: [
      {
        label: "Present",
        data: reportData.map((r) => r.presentDays),
        backgroundColor: "#34d399", // green-400
      },
      {
        label: "Absent",
        data: reportData.map((r) => r.absentDays),
        backgroundColor: "#f87171", // red-400
      },
      {
        label: "Half Days",
        data: reportData.map((r) => r.halfDays),
        backgroundColor: "#fbbf24", // yellow-400
      },
    ],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Summary Report</CardTitle>
        <CardDescription>
          Overview from {format(startDate, "MMM d")} to {format(endDate, "MMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-6 flex-wrap gap-2">
          <div className="flex gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedUserId || ""}
              onValueChange={(v) => setSelectedUserId(v)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
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

        {reportData.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Half Days</TableHead>
                    <TableHead>Late Arrivals</TableHead>
                    <TableHead>Avg. Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((r) => (
                    <TableRow key={r.user.id}>
                      <TableCell>
                        {r.user.firstName} {r.user.lastName}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">{r.presentDays}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-red-100 text-red-800">{r.absentDays}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-100 text-yellow-800">{r.halfDays}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-orange-100 text-orange-800">{r.lateArrivals}</Badge>
                      </TableCell>
                      <TableCell>{r.avgWorkingHours}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-10">
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "top" as const,
                    },
                    tooltip: {
                      mode: "index",
                      intersect: false,
                    },
                  },
                }}
              />
            </div>
          </>
        ) : (
          <p className="text-center py-6 text-gray-500">No data available for selected filters.</p>
        )}
      </CardContent>
    </Card>
  );
}
