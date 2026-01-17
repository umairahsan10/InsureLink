import DocumentExtractor from "@/components/insurer/DocumentExtractor";
import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function DocumentExtractPage() {
  return (
    <DashboardLayout userRole="insurer">
      <DocumentExtractor />
    </DashboardLayout>
  );
}
