import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { useAttendanceStore } from "@/stores/attendance-store";
import { useAuth } from "@/hooks/use-auth";

export default function AttendanceStats() {
  const { user } = useAuth();
  const attendanceRecords = useAttendanceStore((state) => state.attendanceRecords);

  const today = new Date();
  const startDate = startOfMonth(today);
  const endDate = endOfMonth(today);

  const attendanceData = attendanceRecords.filter((record) => {
    const date = new Date(record.date);
    return (
      record.userId === user?.id &&
      date >= startDate &&
      date <= endDate
    );
  });

  const calculateStats = () => {
    const totalWorkingDays = 22;
    const presentDays = attendanceData.filter((a) => a.status === "present").length;
    const leaveDays = attendanceData.filter((a) => a.status === "leave").length;
    const lateDays = attendanceData.filter((a) => {
      if (!a.checkInTime) return false;
      const time = new Date(a.checkInTime);
      const hour = time.getHours();
      const minute = time.getMinutes();
      return hour > 9 || (hour === 9 && minute > 30);
    }).length;

    let totalMinutes = 0;
    attendanceData.forEach((a) => {
      if (a.workingHours) {
        const match = a.workingHours.match(/(\d+)h\s+(\d+)m/);
        if (match) {
          const hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          totalMinutes += hours * 60 + minutes;
        }
      }
    });

    const avgHoursPerDay = presentDays > 0 ? Math.floor(totalMinutes / presentDays / 60) : 0;
    const avgMinutesPerDay = presentDays > 0 ? Math.floor((totalMinutes / presentDays) % 60) : 0;

    const attendanceRatio = Math.round((presentDays / totalWorkingDays) * 100);

    return {
      presentDays,
      leaveDays,
      lateDays,
      avgWorkingHours: `${avgHoursPerDay}h ${avgMinutesPerDay}m`,
      attendanceRatio,
      totalWorkingDays,
    };
  };

  const stats = calculateStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Overview - {format(today, "MMMM yyyy")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="border rounded-md p-4">
            <div className="text-sm text-gray-500">Present Days</div>
            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-semibold text-gray-800">
                {stats?.presentDays || 0}
              </span>
              <span className="ml-2 text-sm text-gray-500">
                / {stats?.totalWorkingDays || 22} days
              </span>
            </div>
          </div>

          <div className="border rounded-md p-4">
            <div className="text-sm text-gray-500">Leave Days</div>
            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-semibold text-gray-800">
                {stats?.leaveDays || 0}
              </span>
              <span className="ml-2 text-sm text-gray-500">
                / {stats?.totalWorkingDays || 22} days
              </span>
            </div>
          </div>

          <div className="border rounded-md p-4">
            <div className="text-sm text-gray-500">Late Arrivals</div>
            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-semibold text-gray-800">
                {stats?.lateDays || 0}
              </span>
              <span className="ml-2 text-sm text-gray-500">days</span>
            </div>
          </div>

          <div className="border rounded-md p-4">
            <div className="text-sm text-gray-500">Average Work Hours</div>
            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-semibold text-gray-800">
                {stats?.avgWorkingHours || "0h 0m"}
              </span>
              <span className="ml-2 text-sm text-gray-500">hours/day</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Attendance Ratio</h4>
          <Progress value={stats?.attendanceRatio || 0} className="h-2.5 bg-gray-200 mb-1" />
          <div className="flex text-xs justify-between">
            <span className="text-gray-500">
              Present: {stats?.attendanceRatio || 0}%
            </span>
            <span className="text-gray-500">Target: 90%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
