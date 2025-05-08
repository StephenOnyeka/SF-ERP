import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Receipt,
  MessageSquare,
  Award,
  UserPlus,
  LogOut,
  BarChart2,
  Clock,
  Calendar,
  Lock
} from "lucide-react";

export default function FutureModules() {
  const { user } = useAuth();

  // Define future modules
  const modules = [
    {
      id: 1,
      title: "Task Management",
      description: "Create, assign, and track tasks for your team. Set deadlines, priorities, and monitor progress.",
      icon: <ClipboardList className="h-10 w-10 text-primary-300" />,
      comingSoon: "Q1 2024"
    },
    {
      id: 2,
      title: "Expense Claims",
      description: "Submit and manage expense reports, receipts, and reimbursement requests with automated approval workflows.",
      icon: <Receipt className="h-10 w-10 text-primary-300" />,
      comingSoon: "Q1 2024"
    },
    {
      id: 3,
      title: "Feedback & Appraisal",
      description: "Conduct performance reviews, set goals, provide feedback, and track employee growth and development.",
      icon: <MessageSquare className="h-10 w-10 text-primary-300" />,
      comingSoon: "Q2 2024"
    },
    {
      id: 4,
      title: "Rewards & Recognition",
      description: "Recognize outstanding performance and milestones. Create reward programs and celebrate achievements.",
      icon: <Award className="h-10 w-10 text-primary-300" />,
      comingSoon: "Q2 2024"
    },
    {
      id: 5,
      title: "Onboarding & Exit",
      description: "Streamline employee onboarding processes and exit procedures with automated checklists and documentation.",
      icon: <UserPlus className="h-10 w-10 text-primary-300" />,
      comingSoon: "Q3 2024"
    },
    {
      id: 6,
      title: "Training & Development",
      description: "Manage training programs, track employee skills, certifications, and development opportunities.",
      icon: <BarChart2 className="h-10 w-10 text-primary-300" />,
      comingSoon: "Q3 2024"
    }
  ];

  // Current modules (already implemented)
  const currentModules = [
    {
      id: 101,
      title: "Attendance Management",
      description: "Track employee time with ease using our clock-in/out system and attendance monitoring.",
      icon: <Clock className="h-10 w-10 text-primary" />,
      status: "Active"
    },
    {
      id: 102,
      title: "Leave Management",
      description: "Simplify leave applications and approvals with streamlined workflows and balance tracking.",
      icon: <Calendar className="h-10 w-10 text-primary" />,
      status: "Active"
    },
    {
      id: 103,
      title: "Payroll Processing",
      description: "Manage salary disbursements and provide detailed salary reports to employees.",
      icon: <Receipt className="h-10 w-10 text-primary" />,
      status: "Active"
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Future Modules</CardTitle>
            <CardDescription>
              Explore upcoming features and modules that will be added to Sforger ERP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Our Product Roadmap
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Sforger ERP is continuously evolving. Below you'll find modules that are currently in development
                and will be released according to our roadmap. Stay tuned for these exciting new features!
              </p>
            </div>

            <h3 className="text-xl font-semibold mb-6">Current Modules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {currentModules.map(module => (
                <Card key={module.id} className="hover:shadow-md transition-shadow duration-300">
                  <CardContent className="pt-6">
                    <div className="bg-primary-50 p-4 rounded-full inline-flex mb-4">
                      {module.icon}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium">{module.title}</h3>
                      <Badge className="bg-green-100 text-green-800">
                        {module.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm">{module.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <h3 className="text-xl font-semibold mb-6">Coming Soon</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map(module => (
                <Card key={module.id} className="hover:shadow-md transition-shadow duration-300 opacity-75">
                  <CardContent className="pt-6">
                    <div className="bg-gray-100 p-4 rounded-full inline-flex mb-4">
                      {module.icon}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-700">{module.title}</h3>
                      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                        {module.comingSoon}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm">{module.description}</p>
                    <div className="flex items-center mt-4 text-gray-500 text-sm">
                      <Lock className="h-3 w-3 mr-1" />
                      Coming soon
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Feedback section */}
            <div className="mt-10 bg-primary-50 p-6 rounded-lg text-center">
              <h3 className="text-lg font-medium text-primary mb-2">Have suggestions for new modules?</h3>
              <p className="text-gray-600 mb-2">
                We're always looking to improve and expand Sforger ERP based on your needs.
              </p>
              <p className="text-gray-600 text-sm">
                Please contact your administrator to share your ideas and help shape the future of the platform.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
