import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAttendanceStore } from "@/stores/attendance-store";
import { useAuth } from "@/hooks/use-auth";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  date: z.string().min(1, { message: "Date is required" }),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  notes: z.string().min(3, { message: "Reason is required for regularization" }),
});

export default function AttendanceRegularizeForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const checkIn = useAttendanceStore((state) => state.checkIn);
  const checkOut = useAttendanceStore((state) => state.checkOut);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: today,
      checkInTime: "",
      checkOutTime: "",
      notes: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (!data.checkInTime && !data.checkOutTime) {
      toast({
        title: "Validation error",
        description: "Please provide either check-in time or check-out time",
        variant: "destructive",
      });
      return;
    }

    try {
      const date = new Date(data.date);

      if (data.checkInTime) {
        const [h, m] = data.checkInTime.split(":");
        const checkInDate = new Date(date);
        checkInDate.setHours(parseInt(h), parseInt(m));

        checkIn(user!.id!);
      }

      if (data.checkOutTime) {
        const [h, m] = data.checkOutTime.split(":");
        const checkOutDate = new Date(date);
        checkOutDate.setHours(parseInt(h), parseInt(m));

        checkOut(user!.id!);
      }

      toast({
        title: "Attendance regularized",
        description: "Your request has been submitted successfully",
      });

      form.reset({
        date: today,
        checkInTime: "",
        checkOutTime: "",
        notes: "",
      });
    } catch (error) {
      toast({
        title: "Failed to regularize attendance",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regularize Attendance</CardTitle>
        <CardDescription>
          Request to regularize a missed check-in or check-out
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" max={today} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="checkInTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check In Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="checkOutTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check Out Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide reason for regularization..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit">
              <Loader2 className="mr-2 h-4 w-4 animate-spin hidden" />
              Submit Request
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
