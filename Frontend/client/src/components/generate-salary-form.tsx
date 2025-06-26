import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useSalaryStore } from "@/stores/salary-store";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  userId: z.string().min(1, { message: "Employee is required" }),
  baseSalary: z.string().min(1, { message: "Base salary is required" }),
  deductions: z.string().optional(),
  bonus: z.string().optional(),
  notes: z.string().optional(),
});

interface GenerateSalaryFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: number;
  selectedYear: number;
}

export default function GenerateSalaryForm({
  isOpen,
  onClose,
  selectedMonth,
  selectedYear,
}: GenerateSalaryFormProps) {
  const { toast } = useToast();
  const addSalaryRecord = useSalaryStore((s) => s.addSalaryRecord);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { users } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      baseSalary: "",
      deductions: "0",
      bonus: "0",
      notes: "",
    },
  });

  const baseSalary = parseInt(form.watch("baseSalary") || "0");
  const deductions = parseInt(form.watch("deductions") || "0");
  const bonus = parseInt(form.watch("bonus") || "0");
  const netSalary = baseSalary - deductions + bonus;

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      addSalaryRecord({
        userId: data.userId,
        month: selectedMonth,
        year: selectedYear,
        baseSalary: parseInt(data.baseSalary),
        deductions: parseInt(data.deductions || "0"),
        bonus: parseInt(data.bonus || "0"),
        netSalary,
        paymentStatus: "pending",
        notes: data.notes ?? "",
      });

      toast({
        title: "Salary Generated",
        description: "Salary record successfully created",
      });
      onClose();
    } catch (err: any) {
      toast({
        title: "Error Generating Salary",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Generate Salary</DialogTitle>
          <DialogDescription>
            For{" "}
            {new Date(selectedYear, selectedMonth - 1).toLocaleString(
              "default",
              {
                month: "long",
              }
            )}{" "}
            {selectedYear}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.username}>
                          {user.firstName} {user.lastName} ({user.position})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="baseSalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Salary</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deductions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deductions</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bonus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bonus</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-gray-50 p-3 rounded border">
              <div className="flex justify-between items-center">
                <span className="font-medium">Net Salary:</span>
                <span className="text-lg font-semibold">
                  ${netSalary.toLocaleString()}
                </span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate Salary
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
