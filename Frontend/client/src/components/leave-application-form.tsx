import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { differenceInDays, format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { useToast } from "@/hooks/use-toast";
import { useLeaveStore } from "@/stores/leave-store";
import { useLeaveMetadataStore } from "@/stores/leave-metadata-store";
import { useAuth } from "@/hooks/use-auth";
import { useUserScopedData } from "@/hooks/useUserScopedData";

// Define the form schema
const formSchema = z.object({
  leaveTypeId: z.string().min(1, { message: "Leave type is required" }),
  startDate: z.string().min(1, { message: "Start date is required" }),
  endDate: z.string().min(1, { message: "End date is required" }),
  isFirstDayHalf: z.boolean().default(false),
  isLastDayHalf: z.boolean().default(false),
  reason: z.string().min(3, { message: "Reason is required" }).max(500),
});

export default function LeaveApplicationForm() {
  const { user } = useUserScopedData();
  const { toast } = useToast();
  const [totalDays, setTotalDays] = useState(0);

  const leaveTypes = useLeaveMetadataStore((s) => s.leaveTypes);
  const leaveQuotas = useLeaveStore((s) => s.leaveQuotas);
  const applyForLeave = useLeaveStore((s) => s.applyForLeave);

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

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        setValue("endDate", startDate);
        return;
      }

      let days = differenceInDays(end, start) + 1;
      if (isFirstDayHalf) days -= 0.5;
      if (isLastDayHalf) days -= 0.5;
      setTotalDays(days);
    } else {
      setTotalDays(0);
    }
  }, [startDate, endDate, isFirstDayHalf, isLastDayHalf, setValue]);

  const today = format(new Date(), "yyyy-MM-dd");

  const findRemainingQuota = (leaveTypeId: string) => {
    const quota = leaveQuotas.find(
      (q) => q.userId === user?.id && q.leaveTypeId === leaveTypeId
    );
    return quota ? quota.totalQuota - quota.usedQuota : 0;
  };

  const onSubmit = (formData: z.infer<typeof formSchema>) => {
    const remaining = findRemainingQuota(formData.leaveTypeId);
    if (totalDays > remaining) {
      toast({
        title: "Insufficient leave balance",
        description: `You only have ${remaining} days remaining for this leave type`,
        variant: "destructive",
      });
      return;
    }

    try {
      applyForLeave(
        user!.id!,
        {
          leaveTypeId: formData.leaveTypeId,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          isFirstDayHalf: formData.isFirstDayHalf,
          isLastDayHalf: formData.isLastDayHalf,
          reason: formData.reason,
          totalDays,
        },
        true
      );

      toast({
        title: "Leave application submitted",
        description: "Your leave application has been submitted successfully",
      });

      form.reset();
      setTotalDays(0);
    } catch (e: any) {
      toast({
        title: "Failed to submit leave application",
        description: e.message,
        variant: "destructive",
      });
    }
  };
  // console.log(leaveTypes,"leave types")
  // console.log(user,"this is the user")
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
                      {leaveTypes.map((type) => {
                        const remaining = findRemainingQuota(
                          type.id.toString()
                        );
                        return (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name} ({remaining} days left)
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
                      <Input type="date" min={today} {...field} />
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
                      <Input type="date" min={startDate || today} {...field} />
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
                        onValueChange={(v) => field.onChange(v === "true")}
                        defaultValue={field.value ? "true" : "false"}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="firstHalfNo" />
                          <label htmlFor="firstHalfNo" className="text-sm">
                            No
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="firstHalfYes" />
                          <label htmlFor="firstHalfYes" className="text-sm">
                            Yes
                          </label>
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
                        onValueChange={(v) => field.onChange(v === "true")}
                        defaultValue={field.value ? "true" : "false"}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="lastHalfNo" />
                          <label htmlFor="lastHalfNo" className="text-sm">
                            No
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="lastHalfYes" />
                          <label htmlFor="lastHalfYes" className="text-sm">
                            Yes
                          </label>
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
                  Duration:{" "}
                  <span className="font-medium">{totalDays} days</span>
                </p>
              </div>

              <Button type="submit">Submit Application</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
