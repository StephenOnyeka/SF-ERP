import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function AttendanceStatus() {
  const [currentTime, setCurrentTime] = useState<string>(
    format(new Date(), "h:mm a")
  );
  const { toast } = useToast();
  const { user } = useAuth();

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(format(new Date(), "h:mm a"));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Get today's date in YYYY-MM-DD format (local)
  const today = format(new Date(), "yyyy-MM-dd");

  // Get attendance data for today
  const endpoint =
    user?.role === "admin" || user?.role === "hr"
      ? "/api/attendance"
      : "/api/attendance/my-attendance";
  const { data: attendanceData, isLoading: isLoadingAttendance } =
    useQuery<any>({
      queryKey: [endpoint, today],
      refetchInterval: 60000, // Refetch every minute
    });

  // Get current location
  const getCurrentLocation = () => {
    return new Promise<{ latitude: number; longitude: number }>(
      (resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation is not supported by your browser"));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            reject(new Error("Unable to retrieve your location"));
          }
        );
      }
    );
  };

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      let location = undefined;
      try {
        location = await getCurrentLocation();
      } catch (error) {
        // If geolocation fails, proceed without location
        location = undefined;
      }
      const res = await apiRequest(
        "POST",
        "/api/attendance/check-in",
        location ? { location } : {}
      );
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate all attendance-related queries for both HR/admin and employees
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/attendance/my-attendance"],
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].startsWith("/api/attendance"),
      });
      toast({
        title: "Checked in successfully",
        description: `You clocked in at ${format(new Date(), "h:mm a")}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Check-in failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      let location = undefined;
      try {
        location = await getCurrentLocation();
      } catch (error) {
        // If geolocation fails, proceed without location
        location = undefined;
      }
      const res = await apiRequest(
        "POST",
        "/api/attendance/check-out",
        location ? { location } : {}
      );
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate all attendance-related queries for both HR/admin and employees
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/attendance/my-attendance"],
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].startsWith("/api/attendance"),
      });
      toast({
        title: "Checked out successfully",
        description: `You clocked out at ${format(new Date(), "h:mm a")}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Check-out failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if user has already checked in or out today
  const hasTodaysAttendance = attendanceData?.some((record: any) => {
    const recordDate = format(new Date(record.date), "yyyy-MM-dd");
    return recordDate === today;
  });

  const todayAttendance = hasTodaysAttendance
    ? attendanceData.find((record: any) => {
        const recordDate = format(new Date(record.date), "yyyy-MM-dd");
        return recordDate === today;
      })
    : null;

  const hasCheckedIn = todayAttendance?.checkIn?.time;
  const hasCheckedOut = todayAttendance?.checkOut?.time;

  // Format time for display
  const formatTimeFromDB = (timeString: string) => {
    if (!timeString) return "";
    return format(new Date(timeString), "h:mm a");
  };

  return (
    <Card>
      <CardHeader className="border-b px-6 py-3">
        <CardTitle className="text-base font-medium">Attendance</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center">
          <div className="w-32 h-32 rounded-full border-4 border-primary-100 flex items-center justify-center mb-4">
            <div className="text-center">
              <span className="block text-3xl font-semibold text-primary-600">
                {currentTime.split(" ")[0]}
              </span>
              <span className="text-sm text-gray-500">
                {currentTime.split(" ")[1]}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Status:{" "}
            {isLoadingAttendance ? (
              <Loader2 className="h-4 w-4 inline animate-spin" />
            ) : hasCheckedIn ? (
              hasCheckedOut ? (
                <span className="font-medium text-blue-600">
                  Checked Out ({formatTimeFromDB(todayAttendance.checkOut.time)}
                  )
                </span>
              ) : (
                <span className="font-medium text-green-600">
                  Checked In ({formatTimeFromDB(todayAttendance.checkIn.time)})
                </span>
              )
            ) : (
              <span className="font-medium text-gray-600">Not Checked In</span>
            )}
          </p>

          <div className="flex space-x-4">
            <Button
              onClick={() => checkInMutation.mutate()}
              disabled={
                isLoadingAttendance ||
                checkInMutation.isPending ||
                checkOutMutation.isPending ||
                hasCheckedIn
              }
            >
              {checkInMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Check In
            </Button>
            <Button
              onClick={() => checkOutMutation.mutate()}
              disabled={
                isLoadingAttendance ||
                checkInMutation.isPending ||
                checkOutMutation.isPending ||
                !hasCheckedIn ||
                hasCheckedOut
              }
              variant="outline"
            >
              {checkOutMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Check Out
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
