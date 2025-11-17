/**
 * Metric Card Component
 * Displays a single metric with icon, value, and label
 */

interface MetricCardProps {
  icon: string;
  label: string;
  value: number | string;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  red: 'from-red-500 to-red-600',
  purple: 'from-purple-500 to-purple-600',
  yellow: 'from-yellow-500 to-yellow-600',
};

export const MetricCard = ({
  icon,
  label,
  value,
  color = 'blue',
  trend,
  onClick,
}: MetricCardProps) => {
  const baseClasses = "metric-card hover:scale-105 transition-transform duration-200";
  const clickableClasses = onClick ? "cursor-pointer hover:shadow-lg" : "";

  const content = (
    <>
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-2xl text-white shadow-md`}
        >
          {icon}
        </div>

        {/* Trend indicator */}
        {trend && (
          <div
            className={`text-sm font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mt-4">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600 mt-1">{label}</p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${clickableClasses} text-left w-full`}
        aria-label={`View ${label}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={baseClasses}>
      {content}
    </div>
  );
};
