"use client";

interface SubmitClaimHeaderProps {
  onOpenModal: () => void;
}

export default function SubmitClaimHeader({
  onOpenModal,
}: SubmitClaimHeaderProps) {
  return (
    <div className="px-4 lg:px-6 py-4 flex justify-between items-center">
      <h1 className="text-3xl font-bold text-gray-900">Claims Management</h1>
      <button
        onClick={onOpenModal}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        + Submit New Claim
      </button>
    </div>
  );
}
