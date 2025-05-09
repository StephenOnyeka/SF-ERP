import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Loader2, 
  Save, 
  RefreshCw, 
  Settings as SettingsIcon,
  Calendar,
  Clock,
  Plus
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Setting form schema
const settingFormSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
  description: z.string().optional(),
});

// Holiday form schema
const holidayFormSchema = z.object({
  name: z.string().min(1, "Holiday name is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

type SettingFormValues = z.infer<typeof settingFormSchema>;
type HolidayFormValues = z.infer<typeof holidayFormSchema>;

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  
  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <SettingsIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700">Access Restricted</h2>
            <p className="text-gray-500 mt-2">
              You don't have permission to access the settings page.
            </p>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Fetch settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/settings"],
    enabled: !!user && user.role === "admin",
  });
  
  // Fetch holidays
  const { data: holidays, isLoading: isLoadingHolidays } = useQuery({
    queryKey: ["/api/holidays", { year: new Date().getFullYear() }],
    enabled: !!user && user.role === "admin",
  });
  
  // Setting form
  const settingForm = useForm<SettingFormValues>({
    resolver: zodResolver(settingFormSchema),
    defaultValues: {
      key: "",
      value: "",
      description: "",
    },
  });
  
  // Holiday form
  const holidayForm = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: {
      name: "",
      date: "",
      description: "",
      isRecurring: false,
    },
  });
  
  // Save setting mutation
  const saveSettingMutation = useMutation({
    mutationFn: async (data: SettingFormValues) => {
      const res = await apiRequest("POST", "/api/settings", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Setting Saved",
        description: "The setting has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      settingForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Save Setting",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create holiday mutation
  const createHolidayMutation = useMutation({
    mutationFn: async (data: HolidayFormValues) => {
      const res = await apiRequest("POST", "/api/holidays", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Holiday Created",
        description: "The holiday has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      holidayForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Holiday",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle setting form submission
  const onSettingSubmit = (data: SettingFormValues) => {
    saveSettingMutation.mutate(data);
  };
  
  // Handle holiday form submission
  const onHolidaySubmit = (data: HolidayFormValues) => {
    createHolidayMutation.mutate(data);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>
              Configure company-wide settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="general">General Settings</TabsTrigger>
                <TabsTrigger value="holidays">Holidays</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-6">
                {/* Current Settings */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Current Settings</h3>
                  {isLoadingSettings ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : settings && settings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Key</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Last Updated</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {settings.map((setting) => (
                            <TableRow key={setting.id}>
                              <TableCell className="font-medium">{setting.key}</TableCell>
                              <TableCell>{setting.value}</TableCell>
                              <TableCell>{setting.description}</TableCell>
                              <TableCell>{formatDate(setting.updatedAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No settings found</p>
                      <Button variant="outline" className="mt-2" onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
                      }}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Add/Update Setting */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Add or Update Setting</h3>
                  <Form {...settingForm}>
                    <form onSubmit={settingForm.handleSubmit(onSettingSubmit)} className="space-y-4">
                      <FormField
                        control={settingForm.control}
                        name="key"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Setting Key</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. working_hours, company_name" />
                            </FormControl>
                            <FormDescription>
                              Use snake_case for setting keys (e.g. working_hours)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={settingForm.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Setting value" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={settingForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Description of what this setting controls"
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit"
                        disabled={saveSettingMutation.isPending}
                      >
                        {saveSettingMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Setting
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
              </TabsContent>
              
              <TabsContent value="holidays" className="space-y-6">
                {/* Current Holidays */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Company Holidays ({new Date().getFullYear()})</h3>
                  {isLoadingHolidays ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : holidays && holidays.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Holiday Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Recurring</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {holidays.map((holiday) => (
                            <TableRow key={holiday.id}>
                              <TableCell className="font-medium">{holiday.name}</TableCell>
                              <TableCell>{formatDate(holiday.date)}</TableCell>
                              <TableCell>{holiday.description}</TableCell>
                              <TableCell>{holiday.isRecurring ? "Yes" : "No"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No holidays configured for this year</p>
                      <Button variant="outline" className="mt-2" onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
                      }}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Add Holiday */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Add Holiday</h3>
                  <Form {...holidayForm}>
                    <form onSubmit={holidayForm.handleSubmit(onHolidaySubmit)} className="space-y-4">
                      <FormField
                        control={holidayForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Holiday Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} placeholder="e.g. Christmas Day" className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={holidayForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} type="date" className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={holidayForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Brief description of the holiday"
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={holidayForm.control}
                        name="isRecurring"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4 mt-1"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Recurring Holiday</FormLabel>
                              <FormDescription>
                                If checked, this holiday will repeat every year on the same date
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit"
                        disabled={createHolidayMutation.isPending}
                      >
                        {createHolidayMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Holiday
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
