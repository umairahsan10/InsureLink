export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface AlertNotification {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  category: 'claims' | 'policies' | 'dependents' | 'messaging' | string;
  timestamp: string;
  isRead: boolean;
}

