"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { AlertNotification } from "@/types";

export default function PatientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const { notifications, dismiss, markAsRead } = useNotifications();

  const handleSelectNotification = (notification: AlertNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Use actionUrl if provided, otherwise fall back to category-based routing
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    } else if (notification.category === "claims") {
      router.push("/patient/claims");
    } else if (notification.category === "benefits") {
      router.push("/patient/profile");
    }
  };

  const handleDismissNotification = (id: string) => {
    dismiss(id);
  };

  return (
    <DashboardLayout
      userRole="patient"
      userName={mounted ? user?.name || "Patient" : "Patient"}
      notifications={notifications}
      onNotificationSelect={handleSelectNotification}
      onNotificationDismiss={handleDismissNotification}
    >
      {children}
    </DashboardLayout>
  );
}
