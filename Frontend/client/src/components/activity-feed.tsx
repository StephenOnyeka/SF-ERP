import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useAttendanceStore } from "@/stores/attendance-store";
import { useSalaryStore } from "@/stores/salary-store";
import { useLeaveStore } from "@/stores/leave-store";

export default function ActivityFeed() {
  const { user, users } = useAuth();
  const { attendanceRecords } = useAttendanceStore();
  const { salaryRecords } = useSalaryStore();
  const { leaveApplications } = useLeaveStore();

  const isLoading = !user;

  const activities: {
    id: string;
    type: string;
    title: string;
    timestamp: Date | string;
    icon: React.JSX.Element;
    iconBg: string;
    iconColor: string;
  }[] = [];

  const getUserName = (userId: string) => {
    const u = users.find((u) => u.id === userId);
    return u ? `${u.firstName} ${u.lastName}` : "Unknown User";
  };

  // --- Attendance ---
  const scopedAttendance =
    user?.role === "admin" ? attendanceRecords : attendanceRecords.filter((a) => a.userId === user?.id);
  console.log("Scoped Attendance Records:", scopedAttendance);
  scopedAttendance.forEach((attendance) => {
    if (attendance.checkInTime) {
      activities.push({
        id: `attendance-in-${attendance.id}`,
        type: "attendance",
        title:
          user?.role === "admin"
            ? `${getUserName(attendance.userId)} checked in at ${formatTime(attendance.checkInTime)}`
            : `You checked in at ${formatTime(attendance.checkInTime)}`,
        timestamp: attendance.date,
        icon: <Clock className="h-4 w-4" />,
        iconBg: "bg-primary-100",
        iconColor: "text-primary-600",
      });
    }

    if (attendance.checkOutTime) {
      activities.push({
        id: `attendance-out-${attendance.id}`,
        type: "attendance",
        title:
          user?.role === "admin"
            ? `${getUserName(attendance.userId)} checked out at ${formatTime(attendance.checkOutTime)}`
            : `You checked out at ${formatTime(attendance.checkOutTime)}`,
        timestamp: attendance.date,
        icon: <Clock className="h-4 w-4" />,
        iconBg: "bg-primary-100",
        iconColor: "text-primary-600",
      });
    }
  });

  // --- Leave ---
  leaveApplications
    .filter((l) => user?.role === "admin" || l.userId === user?.id)
    .forEach((leave) => {
      activities.push({
        id: `leave-${leave.id}`,
        type: "leave",
        title:
          user?.role === "admin"
            ? `${getUserName(leave.userId)}'s leave was ${leave.status}`
            : `Your leave request has been ${leave.status}`,
        timestamp: leave.appliedAt,
        icon: <Calendar className="h-4 w-4" />,
        iconBg:
          leave.status === "approved"
            ? "bg-green-100"
            : leave.status === "rejected"
            ? "bg-red-100"
            : "bg-yellow-100",
        iconColor:
          leave.status === "approved"
            ? "text-green-600"
            : leave.status === "rejected"
            ? "text-red-600"
            : "text-yellow-600",
      });
    });

  // --- Salary (optional: admin could also see all salary statements) ---
  salaryRecords
    .filter((s) => s.userId === user?.id)
    .forEach((salary) => {
      activities.push({
        id: `salary-${salary.id}`,
        type: "salary",
        title: `Your ${getMonthName(salary.month)} salary statement is available`,
        timestamp: salary.createdAt,
        icon: <FileText className="h-4 w-4" />,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
      });
    });

  // Sort by most recent
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  console.log("Activities:", activities);
  function formatTime(timeString: string) {
    if (!timeString) return "";
    try {
      const date = typeof timeString === "string" ? parseISO(timeString) : timeString;
      return format(date, "h:mm a");
    } catch {
      return timeString;
    }
  }

  function getMonthName(monthNumber: number) {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString("default", { month: "long" });
  }

  function formatRelativeTime(timestamp: string) {
    try {
      const date = parseISO(timestamp);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffInDays === 0) return "Today";
      if (diffInDays === 1) return "Yesterday";
      if (diffInDays < 7) return `${diffInDays} days ago`;
      return format(date, "MMM d, yyyy");
    } catch {
      return timestamp;
    }
  }

  return (
    <Card>
      <CardHeader className="border-b px-6 py-3">
        <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <li key={activity.id} className="py-3 flex items-start">
                <span
                  className={`flex-shrink-0 h-8 w-8 rounded-full ${activity.iconBg} flex items-center justify-center mr-3`}
                >
                  <span className={activity.iconColor}>{activity.icon}</span>
                </span>
                <div>
                  <p className="text-sm text-gray-800">{activity.title}</p>
                  <p className="text-xs text-gray-500">
                    {formatRelativeTime(
                      typeof activity.timestamp === "string"
                        ? activity.timestamp
                        : activity.timestamp.toISOString()
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-6 text-center text-gray-500">
            <p>No recent activities found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
