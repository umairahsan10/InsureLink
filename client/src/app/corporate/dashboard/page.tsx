import CorporateDashboard from '@/components/corporate/CorporateDashboard';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import notificationsData from '@/data/corporateNotifications.json';
import { AlertNotification } from '@/types';

export default function CorporateDashboardPage() {
  const corporateNotifications = notificationsData as AlertNotification[];

  return (
    <DashboardLayout
      userRole="corporate"
      userName="TechCorp Ltd."
      notifications={corporateNotifications}
    >
      <CorporateDashboard />
    </DashboardLayout>
  );
}







