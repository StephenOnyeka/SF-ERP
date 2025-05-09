import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, downloadAsExcel, downloadAsPDF } from "@/lib/utils";
import Layout from "@/components/layout";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Loader2, Download, FileText, Filter, RefreshCw, Printer, DollarSign
} from "lucide-react";

export default function Payroll() {
  const { user } = useAuth();
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>("all");

  // Months and Years
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const getMonthName = (monthNum: number) =>
    new Date(0, monthNum - 1).toLocaleString("default", { month: "long" });

  const { data: payrollData, isLoading, refetch } = useQuery({
    queryKey: ["/api/payroll", { userId: user?.id, year, month }],
    queryFn: async () => {
      const queryParams = new URLSearchParams({ userId: user?.id || "", year });
      if (month !== "all") queryParams.append("month", month);
      const res = await fetch(`/api/payroll?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch payroll data");
      return res.json();
    },
    enabled: !!user,
  });

  const handleExportExcel = (payroll: any) => {
    const data = {
      employeeName: user?.fullName,
      employeeId: user?.id,
      department: user?.department,
      position: user?.position,
      month: getMonthName(payroll.month),
      year: payroll.year,
      baseSalary: payroll.baseSalary,
      allowances: payroll.allowances,
      deductions: payroll.deductions,
      netSalary: payroll.netSalary,
      paymentStatus: payroll.paymentStatus,
      payDate: formatDate(payroll.payDate),
      ...payroll.details,
    };
    downloadAsExcel([data], `Payslip_${user?.username}_${payroll.month}_${payroll.year}`);
  };

  const handleDownloadPDF = (payrollId: number) => {
    downloadAsPDF(`payslip-${payrollId}`, `Payslip_${user?.username}_${month}_${year}`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payroll</CardTitle>
            <CardDescription>View and download your salary slips</CardDescription>
            <div className="flex flex-col sm:flex-row items-end gap-4 mt-4">
              <div className="grid w-full sm:w-auto gap-1.5">
                <Label htmlFor="year">Year</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid w-full sm:w-auto gap-1.5">
                <Label htmlFor="month">Month</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={refetch}>
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>

              <Button variant="outline" onClick={refetch}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !payrollData || payrollData.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-4">No payroll records found</p>
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-400">
                  Your salary information will appear here once processed.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Allowances</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollData.map((payroll) => (
                      <TableRow key={payroll.id}>
                        <TableCell>{getMonthName(payroll.month)} {payroll.year}</TableCell>
                        <TableCell>${payroll.baseSalary.toLocaleString()}</TableCell>
                        <TableCell>${payroll.allowances.toLocaleString()}</TableCell>
                        <TableCell>${payroll.deductions.toLocaleString()}</TableCell>
                        <TableCell className="font-bold">${payroll.netSalary.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={
                            payroll.paymentStatus === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }>
                            {payroll.paymentStatus.charAt(0).toUpperCase() + payroll.paymentStatus.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleExportExcel(payroll)}>
                              <Download className="h-4 w-4 mr-1" />
                              Excel
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(payroll.id)}>
                              <FileText className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Optional detailed slip display */}
                {payrollData[0] && (
                  <div id={`payslip-${payrollData[0].id}`} className="border rounded-lg p-6 mt-8">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-2xl font-bold">Salary Slip</h3>
                        <p className="text-gray-500">
                          {getMonthName(payrollData[0].month)} {payrollData[0].year}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleExportExcel(payrollData[0])}>
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.print()}>
                          <Printer className="h-4 w-4 mr-1" />
                          Print
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Employee Details</h4>
                        <p className="font-semibold">{user?.fullName}</p>
                        <p className="text-sm">{user?.department}</p>
                        <p className="text-sm">{user?.position}</p>
                        <p className="text-sm">Employee ID: {user?.id}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Payment Details</h4>
                        <p className="text-sm">Pay Date: {formatDate(payrollData[0].payDate)}</p>
                        <p className="text-sm">
                          Payment Status: <Badge className="ml-2 bg-green-100 text-green-800">{payrollData[0].paymentStatus}</Badge>
                        </p>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="col-span-2 space-y-3">
                        <h4 className="text-lg font-medium mb-2">Earnings & Deductions</h4>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Basic Salary</span>
                          <span className="font-medium">${payrollData[0].baseSalary.toLocaleString()}</span>
                        </div>

                        {payrollData[0].details?.earnings &&
                          Object.entries(payrollData[0].details.earnings).map(([key, val]) => (
                            <div className="flex justify-between" key={key}>
                              <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span>${(val as number).toLocaleString()}</span>
                            </div>
                          ))}

                        <Separator />

                        <div className="flex justify-between font-medium">
                          <span>Total Earnings</span>
                          <span>${(payrollData[0].baseSalary + payrollData[0].allowances).toLocaleString()}</span>
                        </div>

                        <Separator />

                        {payrollData[0].details?.deductions &&
                          Object.entries(payrollData[0].details.deductions).map(([key, val]) => (
                            <div className="flex justify-between text-red-600" key={key}>
                              <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span>-${(val as number).toLocaleString()}</span>
                            </div>
                          ))}

                        <div className="flex justify-between font-medium text-red-600">
                          <span>Total Deductions</span>
                          <span>-${payrollData[0].deductions.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="lg:border-l lg:pl-6">
                        <div className="bg-gray-50 p-6 rounded-lg">
                          <h4 className="text-lg font-medium mb-4">Net Pay</h4>
                          <div className="flex items-center">
                            <DollarSign className="h-8 w-8 text-primary mr-2" />
                            <span className="text-3xl font-bold">${payrollData[0].netSalary.toLocaleString()}</span>
                          </div>
                          <Separator className="my-4" />
                          <div className="text-sm text-gray-500">
                            <p>Paid via bank transfer</p>
                            <p>Tax Year: {payrollData[0].year}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 text-sm text-gray-500 text-center">
                      <p>This is a computer-generated payslip. No signature required.</p>
                      <p>Contact HR for any queries.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
