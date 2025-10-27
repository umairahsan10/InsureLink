interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
}

export default function MetricCard({ title, value, subtitle, icon }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        </div>
        <div className="text-3xl text-gray-400">{icon}</div>
      </div>
    </div>
  );
}
