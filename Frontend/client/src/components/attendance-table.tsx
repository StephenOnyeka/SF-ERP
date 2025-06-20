import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

import { format, subDays, parseISO } from "date-fns";

type AttendanceRecord = {
  _id: string;
  date: string;
  checkIn?: { time: string };
  checkOut?: { time: string };
  status: string;
  workHours?: string;
  notes?: string;
};

export default function AttendanceTable() {
  const { user } = useAuth();
  // State for filters
  const [period, setPeriod] = useState("7");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Calculate date range based on period
  const endDate = new Date();
  const startDate = subDays(endDate, parseInt(period) - 1);

  // Format dates for query key to prevent unnecessary re-renders
  const formattedStartDate = format(startDate, "yyyy-MM-dd");
  const formattedEndDate = format(endDate, "yyyy-MM-dd");

  // Query attendance data with proper caching
  const endpoint =
    user?.role === "admin" || user?.role === "hr"
      ? `/api/attendance?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
      : `/api/attendance/my-attendance?startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
  const {
    data: attendanceData,
    isLoading,
    error: attendanceError,
  } = useQuery<AttendanceRecord[], Error>({
    queryKey: [endpoint],
    queryFn: async () => {
      const response = await fetch(endpoint);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Attendance fetch failed:", response.status, errorText);
        throw new Error("Failed to fetch attendance data");
      }
      try {
        const json = await response.json();
        console.log("AttendanceTable fetched JSON:", json);
        return json;
      } catch (err) {
        console.error("Failed to parse JSON. Response object:", response, err);
        throw new Error("Failed to parse attendance data as JSON.");
      }
    },
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    initialData: [],
  });

  // Debug: Log attendance data and endpoint
  console.log("AttendanceTable endpoint:", endpoint);
  console.log("AttendanceTable data:", attendanceData);

  // Reset to first page when period changes
  useEffect(() => {
    setCurrentPage(1);
  }, [period]);

  // Calculate pagination
  const totalItems = attendanceData?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedData = attendanceData
    ? attendanceData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : [];

  // Status badge color mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Present
          </Badge>
        );
      case "absent":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Absent
          </Badge>
        );
      case "half-day":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Half-day
          </Badge>
        );
      case "weekend":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Weekend
          </Badge>
        );
      case "holiday":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Holiday
          </Badge>
        );
      case "leave":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Leave
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            {status}
          </Badge>
        );
    }
  };

  // Format time for display
  const formatTime = (timeString: string | null) => {
    if (!timeString) return "--";
    return format(new Date(timeString), "h:mm a");
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Render pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    // Show up to 3 page numbers: previous, current, next
    let pages: number[] = [];
    if (totalPages <= 3) {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else if (currentPage === 1) {
      pages = [1, 2, 3];
    } else if (currentPage === totalPages) {
      pages = [totalPages - 2, totalPages - 1, totalPages];
    } else {
      pages = [currentPage - 1, currentPage, currentPage + 1];
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              aria-disabled={currentPage <= 1}
            />
          </PaginationItem>
          {pages.map((pageNumber) => (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                aria-current={pageNumber === currentPage ? "page" : undefined}
                onClick={() => setCurrentPage(pageNumber)}
                className={pageNumber === currentPage ? "font-bold" : ""}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}
          {pages[pages.length - 1] < totalPages && (
            <>
              <PaginationItem>
                <span className="px-4 py-2">...</span>
              </PaginationItem>
              <PaginationItem key={totalPages}>
                <PaginationLink
                  onClick={() => setCurrentPage(totalPages)}
                  className={totalPages === currentPage ? "font-bold" : ""}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              aria-disabled={currentPage >= totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Attendance Log</CardTitle>
            <CardDescription>
              View your attendance history and status
            </CardDescription>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !attendanceData ? (
          <div className="text-center text-gray-500 py-8">
            {attendanceError ? (
              <>
                Error loading attendance data.
                <br />
                {attendanceError.message}
              </>
            ) : (
              <>
                No attendance data received from the server.
                <br />
                Please check your network or contact support.
              </>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Working Hours</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((record: AttendanceRecord) => (
                    <TableRow key={record._id}>
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell>
                        {record.checkIn
                          ? formatTime(record.checkIn.time)
                          : "--"}
                      </TableCell>
                      <TableCell>
                        {record.checkOut
                          ? formatTime(record.checkOut.time)
                          : "--"}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>{record.workHours || "--"}</TableCell>
                      <TableCell>{record.notes || "--"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {renderPagination()}
          </>
        )}
      </CardContent>
    </Card>
  );
}
