interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
}

export default function MetricCard({ title, value, subtitle, icon }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 md:p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm md:text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900 truncate">{value}</p>
          <p className="text-sm md:text-sm text-gray-600 mt-1">{subtitle}</p>
        </div>
        <div className="text-4xl md:text-3xl text-gray-400 flex-shrink-0 ml-2">{icon}</div>
      </div>
    </div>
  );
}
