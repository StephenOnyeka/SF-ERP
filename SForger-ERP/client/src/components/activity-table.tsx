import { Activity } from "@shared/schema";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  LogIn, 
  LogOut, 
  FileText, 
  MessageSquare, 
  Settings,
  CheckCircle, 
  XCircle,
  Edit,
  Plus,
  LucideIcon 
} from "lucide-react";

interface ActivityTableProps {
  activities: Activity[];
}

interface ActivityIconMapping {
  [key: string]: {
    icon: LucideIcon,
    bgColor: string,
    textColor: string
  }
}

export function ActivityTable({ activities }: ActivityTableProps) {
  const actionIcons: ActivityIconMapping = {
    "CLOCK_IN": { icon: LogIn, bgColor: "bg-blue-100", textColor: "text-blue-700" },
    "CLOCK_OUT": { icon: LogOut, bgColor: "bg-red-100", textColor: "text-red-700" },
    "APPLY_LEAVE": { icon: Calendar, bgColor: "bg-green-100", textColor: "text-green-700" },
    "APPROVE_LEAVE": { icon: CheckCircle, bgColor: "bg-green-100", textColor: "text-green-700" },
    "REJECT_LEAVE": { icon: XCircle, bgColor: "bg-red-100", textColor: "text-red-700" },
    "LOGIN": { icon: LogIn, bgColor: "bg-purple-100", textColor: "text-purple-700" },
    "LOGOUT": { icon: LogOut, bgColor: "bg-purple-100", textColor: "text-purple-700" },
    "CREATE_USER": { icon: Plus, bgColor: "bg-indigo-100", textColor: "text-indigo-700" },
    "UPDATE_USER": { icon: Edit, bgColor: "bg-indigo-100", textColor: "text-indigo-700" },
    "UPDATE_SETTING": { icon: Settings, bgColor: "bg-gray-100", textColor: "text-gray-700" },
    "CREATE_SETTING": { icon: Settings, bgColor: "bg-gray-100", textColor: "text-gray-700" },
    "REGISTER": { icon: Plus, bgColor: "bg-blue-100", textColor: "text-blue-700" },
  };

  const getActivityStatus = (action: string) => {
    if (action.includes("APPROVE") || action === "CLOCK_IN" || action === "CLOCK_OUT") {
      return "completed";
    } else if (action.includes("REJECT")) {
      return "rejected";
    } else if (action.includes("APPLY")) {
      return "pending";
    } else {
      return "completed";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getActivityTitle = (action: string) => {
    return action
      .replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No activities found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {activities.map((activity) => {
            const ActionIcon = actionIcons[activity.action]?.icon || MessageSquare;
            const bgColor = actionIcons[activity.action]?.bgColor || "bg-gray-100";
            const textColor = actionIcons[activity.action]?.textColor || "text-gray-700";
            const status = getActivityStatus(activity.action);
            
            return (
              <tr key={activity.id}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`${bgColor} p-2 rounded-lg`}>
                      <ActionIcon className={`h-4 w-4 ${textColor}`} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {getActivityTitle(activity.action)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{activity.description}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDateTime(activity.timestamp)}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {getStatusBadge(status)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ActivityTable;
