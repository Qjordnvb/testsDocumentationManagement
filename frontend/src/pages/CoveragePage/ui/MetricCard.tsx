interface Props {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: 'green' | 'yellow' | 'red';
}

export const MetricCard: React.FC<Props> = ({ icon, title, value, subtitle, color }) => {
  const colorClasses = {
    green: 'from-green-50 to-emerald-50 border-green-200',
    yellow: 'from-yellow-50 to-orange-50 border-yellow-200',
    red: 'from-red-50 to-pink-50 border-red-200'
  };

  const iconColorClasses = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-6`}>
      <div className={`mb-3 ${iconColorClasses[color]}`}>{icon}</div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
};
