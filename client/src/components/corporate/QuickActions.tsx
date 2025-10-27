'use client';

interface QuickActionButtonProps {
  title: string;
  icon: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

function QuickActionButton({ title, icon, onClick, variant = 'secondary' }: QuickActionButtonProps) {
  const baseClasses = "flex items-center space-x-3 px-6 py-4 rounded-lg font-medium transition-colors";
  const variantClasses = variant === 'primary' 
    ? "bg-purple-600 text-white hover:bg-purple-700" 
    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses}`}
    >
      <span className="text-xl">{icon}</span>
      <span>{title}</span>
    </button>
  );
}

export default function QuickActions() {
  const handleManagePolicies = () => {
    // Navigate to employee policies management
    console.log('Navigate to manage employee policies');
  };

  const handleGenerateReport = () => {
    // Generate usage report
    console.log('Generate usage report');
  };

  const handleViewAnalytics = () => {
    // Navigate to analytics dashboard
    console.log('Navigate to analytics dashboard');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionButton
          title="Manage Employee Policies"
          icon="👥"
          onClick={handleManagePolicies}
          variant="primary"
        />
        <QuickActionButton
          title="Generate Usage Report"
          icon="📄"
          onClick={handleGenerateReport}
        />
        <QuickActionButton
          title="View Analytics Dashboard"
          icon="📊"
          onClick={handleViewAnalytics}
        />
      </div>
    </div>
  );
}
