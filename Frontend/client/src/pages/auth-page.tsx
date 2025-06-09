import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Building2,
  Loader2,
  UserCircle,
  Lock,
  Mail,
  User,
  Briefcase,
  Building,
  CalendarClock,
  CalendarCheck,
  Calculator,
  BarChart3,
  CheckCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiCheck } from "@/components/api-check";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  department: z.string().optional(),
  position: z.string().optional(),
});

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [_, setLocation] = useLocation();
  const { user, loginMutation, registerMutation, isLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log("User already logged in, redirecting to /");
      setLocation("/");
    }
  }, [user, setLocation]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({
      username: data.username,
      password: data.password,
    });
  };

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      department: "",
      position: "",
    },
  });

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    console.log("Submitting registration form:", data);
    registerMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your account information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative flex-1 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white p-8 flex flex-col justify-center items-center hidden md:flex overflow-hidden">
        {/* Background pattern - subtle grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0zMHY2aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>

        {/* Abstract shapes with more depth */}
        <div className="absolute top-20 right-20 w-80 h-80 rounded-full bg-gradient-to-br from-blue-400/30 to-indigo-600/20 opacity-40 blur-3xl animate-float"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-600/30 opacity-40 blur-3xl animate-float-delay"></div>
        <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-gradient-to-r from-cyan-400/20 to-blue-500/20 opacity-40 blur-3xl animate-float-slow"></div>

        <div className="relative z-10 max-w-md mx-auto">
          <div className="flex items-center mb-12 fade-in-1">
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm shadow-lg border border-white/20">
              <Building2 className="h-10 w-10 text-white drop-shadow-md" />
            </div>
            <h2 className="text-3xl font-bold text-white ml-4 tracking-tight drop-shadow-md">
              Sforger ERP
            </h2>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight fade-in-2 tracking-tight">
            Transform Your{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-cyan-100">
              Business Operations
            </span>
          </h1>

          <p className="text-xl text-gray-100 mb-10 leading-relaxed fade-in-3">
            A comprehensive solution for managing employees, attendance, leave,
            and payroll—all in one powerful platform.
          </p>

          <div className="grid grid-cols-2 gap-6 mb-10 fade-in-4">
            <div className="group p-5 rounded-xl backdrop-blur-sm bg-white/10 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-primary-500/20">
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                  <UserCircle className="h-6 w-6 text-blue-300 group-hover:text-blue-200 transition-colors" />
                </div>
                <h3 className="font-semibold text-lg ml-3">Employee Mgmt</h3>
              </div>
              <p className="text-gray-200">
                Complete HR solution with detailed employee profiles
              </p>
            </div>

            <div className="group p-5 rounded-xl backdrop-blur-sm bg-white/10 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-primary-500/20">
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                  <CalendarClock className="h-6 w-6 text-green-300 group-hover:text-green-200 transition-colors" />
                </div>
                <h3 className="font-semibold text-lg ml-3">Attendance</h3>
              </div>
              <p className="text-gray-200">
                Automated check-ins with real-time tracking
              </p>
            </div>

            <div className="group p-5 rounded-xl backdrop-blur-sm bg-white/10 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-primary-500/20">
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                  <CalendarCheck className="h-6 w-6 text-purple-300 group-hover:text-purple-200 transition-colors" />
                </div>
                <h3 className="font-semibold text-lg ml-3">Leave Management</h3>
              </div>
              <p className="text-gray-200">
                Streamlined leave request and approval system
              </p>
            </div>

            <div className="group p-5 rounded-xl backdrop-blur-sm bg-white/10 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-primary-500/20">
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
                  <BarChart3 className="h-6 w-6 text-amber-300 group-hover:text-amber-200 transition-colors" />
                </div>
                <h3 className="font-semibold text-lg ml-3">Analytics</h3>
              </div>
              <p className="text-gray-200">
                Real-time reports and data-driven insights
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-8 fade-in-5 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
            <div className="flex flex-wrap gap-4 justify-center sm:justify-start mb-4 sm:mb-0">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
                <span className="text-gray-200">Secure Data</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
                <span className="text-gray-200">Easy Setup</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
                <span className="text-gray-200">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-gray-300 opacity-70">
          &copy; {new Date().getFullYear()} Sforger ERP. All rights reserved.
        </div>
      </div>

      {/* Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8 relative">
        {/* Subtle background elements for login side */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply opacity-30 blur-3xl transform -translate-x-32 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply opacity-30 blur-3xl transform translate-x-16 translate-y-8"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Header (visible only on small screens) */}
          <div className="md:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-lg mb-4">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-900">
              Sforger ERP
            </h1>
            <p className="text-gray-600">Enterprise Resource Planning System</p>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2 text-gray-800 tracking-tight">
              {activeTab === "login" ? "Welcome back" : "Get started"}
            </h2>
            <p className="text-gray-600">
              {activeTab === "login"
                ? "Sign in to your account to continue"
                : "Create your account to join Sforger ERP"}
            </p>

            <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm">
              <p className="font-medium mb-3 text-primary-800">
                Demo credentials:
              </p>
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                  <p className="font-medium text-primary-700 mb-1">Admin</p>
                  <p className="text-xs text-gray-600">
                    username:{" "}
                    <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                      admin
                    </span>
                  </p>
                  <p className="text-xs text-gray-600">
                    password:{" "}
                    <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                      password
                    </span>
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                  <p className="font-medium text-primary-700 mb-1">Employee</p>
                  <p className="text-xs text-gray-600">
                    username:{" "}
                    <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                      employee
                    </span>
                  </p>
                  <p className="text-xs text-gray-600">
                    password:{" "}
                    <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                      password
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* API Connection Check */}
          <ApiCheck />

          <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200">
            <Tabs
              defaultValue="login"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-gray-100 rounded-lg">
                <TabsTrigger
                  value="login"
                  className="rounded-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary-600 data-[state=active]:to-primary-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                >
                  <User className="h-4 w-4 mr-2" />
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-md data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary-600 data-[state=active]:to-primary-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                >
                  <UserCircle className="h-4 w-4 mr-2" />
                  Register
                </TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Card className="border-0 shadow-none">
                  <CardContent className="p-0">
                    <Form {...loginForm}>
                      <form
                        onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                                  <Input
                                    placeholder="Enter your username"
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                                  <Input
                                    type="password"
                                    placeholder="Enter your password"
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-center justify-between">
                          <FormField
                            control={loginForm.control}
                            name="rememberMe"
                            render={({ field }) => (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="remember-me"
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-primary-600"
                                />
                                <label
                                  htmlFor="remember-me"
                                  className="text-sm text-gray-700"
                                >
                                  Remember me
                                </label>
                              </div>
                            )}
                          />

                          <div className="text-sm">
                            <a
                              href="#"
                              className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                            >
                              Forgot password?
                            </a>
                          </div>
                        </div>

                        {loginMutation.error && (
                          <Alert
                            variant="destructive"
                            className="animate-fadeIn"
                          >
                            <AlertDescription>
                              {loginMutation.error.message ||
                                "Invalid credentials. Please try again."}
                            </AlertDescription>
                          </Alert>
                        )}

                        <Button
                          type="submit"
                          className="w-full mt-6 text-lg py-6 font-medium bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Signing in...
                            </>
                          ) : (
                            "Sign in"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <Card className="border-0 shadow-none">
                  <CardContent className="p-0">
                    <Form {...registerForm}>
                      <form
                        onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Smith" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                                  <Input
                                    type="email"
                                    placeholder="you@example.com"
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                                  <Input
                                    placeholder="Choose a username"
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                                  <Input
                                    type="password"
                                    placeholder="Create a password (min. 6 characters)"
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="department"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Department</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                                    <Input
                                      placeholder="HR, Engineering, etc."
                                      className="pl-10"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="position"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Position</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                                    <Input
                                      placeholder="Manager, Developer, etc."
                                      className="pl-10"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {registerMutation.error && (
                          <Alert
                            variant="destructive"
                            className="animate-fadeIn"
                          >
                            <AlertDescription>
                              {registerMutation.error.message ||
                                "There was an error creating your account."}
                            </AlertDescription>
                          </Alert>
                        )}

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Creating account...
                            </>
                          ) : (
                            "Create account"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
