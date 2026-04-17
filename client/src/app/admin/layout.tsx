"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { AlertNotification } from "@/types";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, dismiss, markAsRead } = useNotifications();

  const handleSelectNotification = (notification: AlertNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    } else if (notification.category === "claims") {
      router.push("/admin/dashboard");
    }
  };

  const handleDismissNotification = (id: string) => {
    dismiss(id);
  };

  return (
    <DashboardLayout
      userRole="admin"
      userName={user?.name || "Admin"}
      notifications={notifications}
      onNotificationSelect={handleSelectNotification}
      onNotificationDismiss={handleDismissNotification}
    >
      {children}
    </DashboardLayout>
  );
}
