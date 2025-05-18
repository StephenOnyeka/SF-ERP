import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, DownloadCloud, Plus } from "lucide-react";
import GenerateSalaryForm from "@/components/generate-salary-form";

export default function PayrollTable() {
  const [activeTab, setActiveTab] = useState("salaries");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  
  // Query salary data
  const { data: salaries, isLoading } = useQuery<any[]>({
    queryKey: ["/api/salary"],
  });
  
  // Filter salaries based on selected month and year
  const filteredSalaries = salaries
    ? salaries.filter(
        (salary) => salary.month === selectedMonth && salary.year === selectedYear
      )
    : [];
  
  // Generate month options
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
  
  // Generate year options (current year and 3 previous years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear - i);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    if (status === "paid") {
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };
  
  // Get payment date
  const getPaymentDate = (date: string | null, status: string) => {
    if (status === "paid" && date) {
      return format(new Date(date), "MMM d, yyyy");
    }
    return "-";
  };
  
  return (
    <>
      <Tabs
        defaultValue="salaries"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="salaries">Salary Records</TabsTrigger>
            <TabsTrigger value="settings">Payroll Settings</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
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
            
            <Button 
              variant="outline" 
              size="icon"
              title="Download Payroll Report"
            >
              <DownloadCloud className="h-4 w-4" />
            </Button>
            
            <Button 
              onClick={() => setIsGenerateModalOpen(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Salary
            </Button>
          </div>
        </div>
        
        <TabsContent value="salaries">
          <Card>
            <CardHeader>
              <CardTitle>
                Salary Records - {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
              </CardTitle>
              <CardDescription>
                View and manage employee salary records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : filteredSalaries.length > 0 ? (
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
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSalaries.map((salary) => (
                        <TableRow key={salary.id}>
                          <TableCell className="font-medium">
                            {/* In a real app, we would use employee name */}
                            Employee #{salary.userId}
                          </TableCell>
                          <TableCell>{formatCurrency(salary.baseSalary)}</TableCell>
                          <TableCell>{formatCurrency(salary.deductions)}</TableCell>
                          <TableCell>{formatCurrency(salary.bonus)}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(salary.netSalary)}
                          </TableCell>
                          <TableCell>{getStatusBadge(salary.paymentStatus)}</TableCell>
                          <TableCell>
                            {getPaymentDate(salary.paymentDate, salary.paymentStatus)}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" title="View Salary Slip">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p>No salary records found for {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}</p>
                  <Button 
                    className="mt-4"
                    onClick={() => setIsGenerateModalOpen(true)}
                  >
                    Generate Salary Records
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Settings</CardTitle>
              <CardDescription>
                Configure payroll calculation settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-gray-500">
                <p>Payroll settings will be implemented in a future update.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Generate Salary Modal */}
      {isGenerateModalOpen && (
        <GenerateSalaryForm 
          isOpen={isGenerateModalOpen} 
          onClose={() => setIsGenerateModalOpen(false)}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
      )}
    </>
  );
}
