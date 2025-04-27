import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend?: string;
  trendText?: string;
  trendColor?: string;
  icon?: React.ReactNode;
  iconBg?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendText,
  trendColor = "text-green-600",
  icon,
  iconBg = "bg-blue-100"
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {icon && (
            <div className={cn("p-2 rounded-lg", iconBg)}>
              {icon}
            </div>
          )}
        </div>
        <div className="flex items-baseline">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          <span className="ml-2 text-sm text-gray-600">{subtitle}</span>
        </div>
        {trend && (
          <div className="mt-2 text-sm text-gray-600">
            <span className={cn("font-medium", trendColor)}>{trend}</span>
            {trendText && <span> {trendText}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StatCard;
