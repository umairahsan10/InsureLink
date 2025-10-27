interface CoverageOverviewProps {
  totalCoveragePool: string;
  usedCoverage: string;
  availableCoverage: string;
  utilizationPercentage: number;
}

export default function CoverageOverview({
  totalCoveragePool,
  usedCoverage,
  availableCoverage,
  utilizationPercentage,
}: CoverageOverviewProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 md:p-6 border border-gray-200 mb-6 md:mb-8">
      <h2 className="text-xl md:text-xl font-semibold text-gray-900 mb-5 md:mb-6">Company Coverage Overview</h2>
      
      {/* Coverage Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6 mb-5 md:mb-6">
        <div className="text-center">
          <p className="text-3xl md:text-3xl font-bold text-purple-600">{totalCoveragePool}</p>
          <p className="text-sm md:text-sm text-gray-600">Total Coverage Pool</p>
        </div>
        <div className="text-center">
          <p className="text-3xl md:text-3xl font-bold text-green-600">{usedCoverage}</p>
          <p className="text-sm md:text-sm text-gray-600">Used Coverage</p>
        </div>
        <div className="text-center">
          <p className="text-3xl md:text-3xl font-bold text-blue-600">{availableCoverage}</p>
          <p className="text-sm md:text-sm text-gray-600">Available Coverage</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm md:text-sm text-gray-600">Used</span>
          <span className="text-sm md:text-sm font-medium text-gray-900">{utilizationPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 md:h-3">
          <div
            className="bg-purple-600 h-3 md:h-3 rounded-full transition-all duration-300"
            style={{ width: `${utilizationPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
