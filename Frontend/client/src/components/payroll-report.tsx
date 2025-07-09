import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DownloadCloud, DollarSign } from "lucide-react";

import { useSalaryStore } from "@/stores/salary-store";
import { useAuth } from "@/hooks/use-auth";

export default function PayrollReport() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { users } = useAuth();
  const { getSalarySummaryByPeriod } = useSalaryStore();

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const summary = useMemo(() => {
    return getSalarySummaryByPeriod(selectedMonth, selectedYear, users);
  }, [selectedMonth, selectedYear, users]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    if (status === "paid") {
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };

  const isLoading = !users || users.length === 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payroll Summary Report</CardTitle>
          <CardDescription>
            Overview of salary disbursement for selected month and year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-6">
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
          <Skeleton className="h-64 w-full" />
        </CardContent>
        <CardFooter>
          <div className="w-full flex justify-between">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll Summary Report</CardTitle>
        <CardDescription>
          Overview of salary disbursement for{" "}
          {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-6">
          <div className="flex gap-2">
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
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
          </div>

          <Button variant="outline">
            <DownloadCloud className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {summary && summary.employees.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.employees.map((emp) => {
                    const user = users.find((u) => u.id === emp.userId);
                    const salary = emp.salary;
                    console.log("emp", emp);
                    return (
                      <TableRow key={emp.userId}>
                        <TableCell className="font-medium">
                          {user?.firstName} {user?.lastName}
                        </TableCell>
                        <TableCell>
                          {salary ? formatCurrency(salary.baseSalary) : "-"}
                        </TableCell>
                        <TableCell>
                          {salary ? formatCurrency(salary.deductions) : "-"}
                        </TableCell>
                        <TableCell>
                          {salary ? formatCurrency(salary.bonus) : "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {salary ? formatCurrency(salary.netSalary) : "-"}
                        </TableCell>
                        <TableCell>
                          {salary ? getStatusBadge(salary.paymentStatus) : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-primary-50">
                <CardContent className="p-4">
                  <div className="text-sm text-primary-600 font-medium">
                    Total Salary Amount
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {formatCurrency(summary.totalSalaries || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 font-medium">Paid</div>
                  <div className="text-2xl font-bold mt-1 text-green-600">
                    {summary.paidCount || 0}{" "}
                    <span className="text-sm text-gray-500">employees</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 font-medium">Pending</div>
                  <div className="text-2xl font-bold mt-1 text-yellow-600">
                    {summary.pendingCount || 0}{" "}
                    <span className="text-sm text-gray-500">employees</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500 font-medium">
                    Not Generated
                  </div>
                  <div className="text-2xl font-bold mt-1 text-gray-600">
                    {summary.noSalaryCount || 0}{" "}
                    <span className="text-sm text-gray-500">employees</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500 border rounded-md">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>
              No payroll data available for{" "}
              {months.find((m) => m.value === selectedMonth)?.label}{" "}
              {selectedYear}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
