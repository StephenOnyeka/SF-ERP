import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { calculateLeaveRange } from "@/lib/utils";

import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Loader2 } from "lucide-react";

// Define the form schema
const leaveFormSchema = z.object({
  leaveTypeId: z.string().min(1, "Please select a leave type"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(3, "Please provide a reason for your leave").max(500, "Reason is too long"),
});

type LeaveFormValues = z.infer<typeof leaveFormSchema>;

interface LeaveFormProps {
  onSuccess?: () => void;
}

export function LeaveForm({ onSuccess }: LeaveFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [daysRequested, setDaysRequested] = useState<number>(0);

  // Get leave types
  const { data: leaveTypes, isLoading: isLoadingLeaveTypes } = useQuery({
    queryKey: ["/api/leave-types"],
    enabled: !!user,
  });

  // Get leave balances
  const { data: leaveBalances, isLoading: isLoadingBalances } = useQuery({
    queryKey: ["/api/leave-balances", { userId: user?.id }],
    enabled: !!user,
  });

  // Initialize form
  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      leaveTypeId: "",
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  // Calculate days when dates change
  const watchStartDate = form.watch("startDate");
  const watchEndDate = form.watch("endDate");
  const watchLeaveTypeId = form.watch("leaveTypeId");

  // Update days calculation when dates change
  useState(() => {
    if (watchStartDate && watchEndDate) {
      const days = calculateLeaveRange(watchStartDate, watchEndDate);
      setDaysRequested(days);
    } else {
      setDaysRequested(0);
    }
  });

  // Get available days for selected leave type
  const getAvailableDays = (leaveTypeId: string) => {
    if (!leaveTypeId || !leaveBalances) return 0;
    
    const balance = leaveBalances.find(
      (balance) => balance.leaveTypeId === parseInt(leaveTypeId)
    );
    
    return balance ? balance.totalDays - balance.usedDays : 0;
  };

  // Apply leave mutation
  const applyLeaveMutation = useMutation({
    mutationFn: async (data: LeaveFormValues) => {
      const leaveData = {
        ...data,
        userId: user?.id,
        leaveTypeId: parseInt(data.leaveTypeId),
      };
      const res = await apiRequest("POST", "/api/leave-applications", leaveData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Leave Application Submitted",
        description: "Your leave application has been submitted successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-balances"] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Apply Leave",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: LeaveFormValues) => {
    // Validate leave balance
    const availableDays = getAvailableDays(data.leaveTypeId);
    if (daysRequested > availableDays) {
      toast({
        title: "Insufficient Leave Balance",
        description: `You requested ${daysRequested} days but only have ${availableDays} days available for this leave type.`,
        variant: "destructive",
      });
      return;
    }
    
    applyLeaveMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for Leave</CardTitle>
        <CardDescription>
          Submit your leave request for approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingLeaveTypes || isLoadingBalances ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="leaveTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a leave type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leaveTypes?.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name} ({getAvailableDays(type.id.toString())} days available)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {watchLeaveTypeId && (
                        <span className="text-sm text-muted-foreground">
                          Available Balance: {getAvailableDays(watchLeaveTypeId)} days
                        </span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            {...field} 
                            type="date" 
                            className="pl-10" 
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            {...field} 
                            type="date" 
                            className="pl-10" 
                            min={watchStartDate || new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchStartDate && watchEndDate && (
                <div className="bg-muted px-4 py-2 rounded-md text-sm">
                  You are requesting <strong>{daysRequested} day(s)</strong> of leave.
                </div>
              )}

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Leave</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Please provide details about your leave request"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={applyLeaveMutation.isPending}
              >
                {applyLeaveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Leave Application"
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}

export default LeaveForm;
