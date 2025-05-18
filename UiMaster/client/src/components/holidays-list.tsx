import { useQuery } from "@tanstack/react-query";
import { format, parseISO, isAfter } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function HolidaysList() {
  // Query holidays data
  const { data: holidays, isLoading } = useQuery<any[]>({
    queryKey: ["/api/holidays"],
  });
  
  // Filter upcoming holidays
  const today = new Date();
  const upcomingHolidays = holidays
    ? holidays
        .filter(holiday => isAfter(parseISO(holiday.date), today))
        .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
        .slice(0, 3)
    : [];
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b px-6 py-3">
          <CardTitle className="text-base font-medium">Upcoming Holidays</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex items-start space-x-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex items-start space-x-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="border-b px-6 py-3">
        <CardTitle className="text-base font-medium">Upcoming Holidays</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {upcomingHolidays.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {upcomingHolidays.map(holiday => {
              const holidayDate = parseISO(holiday.date);
              const day = format(holidayDate, "d");
              const month = format(holidayDate, "MMM");
              const weekday = format(holidayDate, "EEEE");
              
              return (
                <li key={holiday.id} className="py-3 flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-md bg-primary-100 flex flex-col items-center justify-center mr-3">
                    <span className="text-sm font-medium text-primary-700">{day}</span>
                    <span className="text-xs text-primary-700">{month}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{holiday.name}</p>
                    <p className="text-xs text-gray-500">{weekday}</p>
                  </div>
                  <Badge className="bg-primary-100 text-primary-800 hover:bg-primary-100">
                    {holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)}
                  </Badge>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-6 text-center text-gray-500">
            <p>No upcoming holidays</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
