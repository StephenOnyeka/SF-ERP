import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays, addDays, format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

// Define the form schema
const formSchema = z.object({
  leaveTypeId: z.string().min(1, { message: "Leave type is required" }),
  startDate: z.string().min(1, { message: "Start date is required" }),
  endDate: z.string().min(1, { message: "End date is required" }),
  isFirstDayHalf: z.boolean().default(false),
  isLastDayHalf: z.boolean().default(false),
  reason: z.string().min(3, { message: "Reason is required" }).max(500, { message: "Reason must be less than 500 characters" }),
});

export default function LeaveApplicationForm() {
  const { toast } = useToast();
  const [totalDays, setTotalDays] = useState(0);
  
  // Get leave types and quotas
  const { data: leaveTypes, isLoading: isLoadingLeaveTypes } = useQuery<any[]>({
    queryKey: ["/api/leave-types"],
  });
  
  const { data: leaveQuotas, isLoading: isLoadingLeaveQuotas } = useQuery<any[]>({
    queryKey: ["/api/leave-quotas"],
  });
  
  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leaveTypeId: "",
      startDate: "",
      endDate: "",
      isFirstDayHalf: false,
      isLastDayHalf: false,
      reason: "",
    },
  });
  
  const { watch, setValue } = form;
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const isFirstDayHalf = watch("isFirstDayHalf");
  const isLastDayHalf = watch("isLastDayHalf");
  
  // Calculate total days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        setValue("endDate", startDate);
        return;
      }
      
      let days = differenceInDays(end, start) + 1; // Including both start and end dates
      
      // Adjust for half days
      if (isFirstDayHalf) days -= 0.5;
      if (isLastDayHalf) days -= 0.5;
      
      setTotalDays(days);
    } else {
      setTotalDays(0);
    }
  }, [startDate, endDate, isFirstDayHalf, isLastDayHalf, setValue]);
  
  // Set minimum date for date inputs (today)
  const today = format(new Date(), "yyyy-MM-dd");
  
  // Find remaining leave quota for selected leave type
  const findRemainingQuota = (leaveTypeId: string) => {
    if (!leaveQuotas) return 0;
    
    const quota = leaveQuotas.find(
      (q) => q.leaveTypeId === parseInt(leaveTypeId)
    );
    
    return quota ? quota.totalQuota - quota.usedQuota : 0;
  };
  
  // Submit leave application
  const applyLeaveMutation = useMutation({
    mutationFn: async (formData: z.infer<typeof formSchema>) => {
      const payload = {
        leaveTypeId: parseInt(formData.leaveTypeId),
        startDate: formData.startDate,
        endDate: formData.endDate,
        isFirstDayHalf: formData.isFirstDayHalf,
        isLastDayHalf: formData.isLastDayHalf,
        totalDays,
        reason: formData.reason,
      };
      
      const res = await apiRequest("POST", "/api/leave-applications", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-quotas"] });
      
      toast({
        title: "Leave application submitted",
        description: "Your leave application has been submitted successfully",
      });
      
      form.reset();
      setTotalDays(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit leave application",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (formData: z.infer<typeof formSchema>) => {
    const selectedLeaveTypeId = formData.leaveTypeId;
    const remainingQuota = findRemainingQuota(selectedLeaveTypeId);
    
    if (totalDays > remainingQuota) {
      toast({
        title: "Insufficient leave balance",
        description: `You only have ${remainingQuota} days remaining for this leave type`,
        variant: "destructive",
      });
      return;
    }
    
    applyLeaveMutation.mutate(formData);
  };
  
  if (isLoadingLeaveTypes || isLoadingLeaveQuotas) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Apply for Leave</CardTitle>
          <CardDescription>Loading leave types and quotas...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for Leave</CardTitle>
        <CardDescription>Submit a new leave request</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="leaveTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leaveTypes?.map((type) => {
                        const remainingQuota = findRemainingQuota(type.id.toString());
                        return (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name} ({remainingQuota} days left)
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
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
                    <FormLabel>From Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        min={today}
                        {...field}
                      />
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
                    <FormLabel>To Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        min={startDate || today}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isFirstDayHalf"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Half Day (First Day)</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "true")}
                        defaultValue={field.value ? "true" : "false"}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="firstHalfNo" />
                          <label htmlFor="firstHalfNo" className="text-sm">No</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="firstHalfYes" />
                          <label htmlFor="firstHalfYes" className="text-sm">Yes</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isLastDayHalf"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Half Day (Last Day)</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "true")}
                        defaultValue={field.value ? "true" : "false"}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="lastHalfNo" />
                          <label htmlFor="lastHalfNo" className="text-sm">No</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="lastHalfYes" />
                          <label htmlFor="lastHalfYes" className="text-sm">Yes</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide reason for leave..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm text-gray-600">
                  Duration: <span className="font-medium">{totalDays} days</span>
                </p>
              </div>
              
              <Button
                type="submit"
                disabled={applyLeaveMutation.isPending}
              >
                {applyLeaveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Submit Application
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
