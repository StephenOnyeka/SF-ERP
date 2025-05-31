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

import { format, subDays, parseISO } from "date-fns";

export default function AttendanceTable() {
  // State for filters
  const [period, setPeriod] = useState("7");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Calculate date range based on period
  const endDate = new Date();
  const startDate = subDays(endDate, parseInt(period));

  // Format dates for query key to prevent unnecessary re-renders
  const formattedStartDate = format(startDate, "yyyy-MM-dd");
  const formattedEndDate = format(endDate, "yyyy-MM-dd");

  // Query attendance data with proper caching
  const { data: attendanceData, isLoading } = useQuery<any[]>({
    queryKey: ["attendance", formattedStartDate, formattedEndDate],
    queryFn: async () => {
      const response = await fetch(
        `/api/attendance?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch attendance data");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    cacheTime: 30 * 60 * 1000, // Cache persists for 30 minutes
  });

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

    try {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours, 10);
      const isPM = hour >= 12;
      const displayHour = hour % 12 || 12;

      return `${displayHour}:${minutes} ${isPM ? "PM" : "AM"}`;
    } catch (error) {
      return timeString;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM dd, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Render pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              isActive={currentPage > 1}
            />
          </PaginationItem>

          {Array.from({ length: Math.min(totalPages, 3) }).map((_, index) => {
            const pageNumber = index + 1;
            return (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  isActive={pageNumber === currentPage}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          {totalPages > 3 && currentPage < totalPages && (
            <>
              {currentPage < totalPages - 1 && (
                <PaginationItem>
                  <span className="px-4 py-2">...</span>
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink
                  isActive={totalPages === currentPage}
                  onClick={() => setCurrentPage(totalPages)}
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
              isActive={currentPage < totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <CardTitle>Attendance Log</CardTitle>
            <CardDescription>View your attendance records</CardDescription>
          </div>

          <div className="mt-3 sm:mt-0 sm:flex sm:items-center sm:space-x-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="mt-3 sm:mt-0"
              onClick={() => console.log("Export")}
            >
              <Download className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Working Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {formatDate(record.date)}
                        </TableCell>
                        <TableCell>{formatTime(record.checkInTime)}</TableCell>
                        <TableCell>{formatTime(record.checkOutTime)}</TableCell>
                        <TableCell>{record.workingHours || "--"}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-6 text-gray-500"
                      >
                        No attendance records found for this period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {paginatedData.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalItems)}
                  </span>{" "}
                  of <span className="font-medium">{totalItems}</span> entries
                </div>

                {renderPagination()}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
