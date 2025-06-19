import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar, Check, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

type Activity = {
  id: string;
  type: "attendance" | "leave" | "salary" | "other";
  title: string;
  timestamp: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
};

export default function ActivityFeed() {
  const { user } = useAuth();
  // Fetch attendance data
  const endpoint =
    user?.role === "admin" || user?.role === "hr"
      ? "/api/attendance"
      : "/api/attendance/my-attendance";
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery<
    any[]
  >({
    queryKey: [endpoint],
  });

  // Fetch leave applications
  const { data: leaveData, isLoading: isLoadingLeaves } = useQuery<any[]>({
    queryKey: ["/api/leave-applications"],
  });

  // Fetch salary data
  const { data: salaryData, isLoading: isLoadingSalaries } = useQuery<any[]>({
    queryKey: ["/api/salary"],
  });

  const isLoading = isLoadingAttendance || isLoadingLeaves || isLoadingSalaries;

  // Process activities from data
  const activities: Activity[] = [];

  // Add attendance activities
  if (attendanceData) {
    attendanceData.slice(0, 3).forEach((attendance) => {
      if (attendance.checkInTime) {
        activities.push({
          id: `attendance-in-${attendance.id}`,
          type: "attendance",
          title: `You checked in at ${formatTime(attendance.checkInTime)}`,
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
          title: `You checked out at ${formatTime(attendance.checkOutTime)}`,
          timestamp: attendance.date,
          icon: <Clock className="h-4 w-4" />,
          iconBg: "bg-primary-100",
          iconColor: "text-primary-600",
        });
      }
    });
  }

  // Add leave activities
  if (leaveData) {
    leaveData.slice(0, 3).forEach((leave) => {
      const leaveStatus =
        leave.status.charAt(0).toUpperCase() + leave.status.slice(1);

      activities.push({
        id: `leave-${leave.id}`,
        type: "leave",
        title: `Your leave request has been ${
          leave.status === "pending" ? "submitted" : leave.status
        }`,
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
  }

  // Add salary activities
  if (salaryData) {
    salaryData.slice(0, 2).forEach((salary) => {
      activities.push({
        id: `salary-${salary.id}`,
        type: "salary",
        title: `Your ${getMonthName(
          salary.month
        )} salary statement is available`,
        timestamp: new Date().toISOString(), // Use current date as timestamp
        icon: <FileText className="h-4 w-4" />,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
      });
    });
  }

  // Sort activities by timestamp (most recent first)
  activities.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Helper function to format time
  function formatTime(timeString: string) {
    if (!timeString) return "";

    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const isPM = hour >= 12;
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minutes} ${isPM ? "PM" : "AM"}`;
  }

  // Helper function to get month name
  function getMonthName(monthNumber: number) {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString("default", { month: "long" });
  }

  // Helper function to format relative time
  function formatRelativeTime(timestamp: string) {
    try {
      const date = parseISO(timestamp);
      const now = new Date();
      const diffInDays = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffInDays === 0) {
        return "Today";
      } else if (diffInDays === 1) {
        return "Yesterday";
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
      } else {
        return format(date, "MMM d, yyyy");
      }
    } catch (error) {
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
            <div className="flex items-start space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          </div>
        ) : activities.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {activities.slice(0, 5).map((activity) => (
              <li key={activity.id} className="py-3 flex items-start">
                <span
                  className={`flex-shrink-0 h-8 w-8 rounded-full ${activity.iconBg} flex items-center justify-center mr-3`}
                >
                  <span className={activity.iconColor}>{activity.icon}</span>
                </span>
                <div>
                  <p className="text-sm text-gray-800">{activity.title}</p>
                  <p className="text-xs text-gray-500">
                    {formatRelativeTime(activity.timestamp)}
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
