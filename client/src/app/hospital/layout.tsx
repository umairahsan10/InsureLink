"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { hospitalsApi } from "@/lib/api/hospitals";
import { AlertNotification } from "@/types";

export default function HospitalLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, dismiss, markAsRead } = useNotifications();
  const [hospitalName, setHospitalName] = useState<string>("Hospital");

  useEffect(() => {
    let cancelled = false;

    const loadHospitalName = async () => {
      if (!user?.hospitalId) {
        setHospitalName(user?.name || "Hospital");
        return;
      }

      try {
        const hospital = await hospitalsApi.getHospitalById(user.hospitalId);
        if (!cancelled) {
          setHospitalName(hospital.hospitalName || user?.name || "Hospital");
        }
      } catch {
        if (!cancelled) {
          setHospitalName(user?.name || "Hospital");
        }
      }
    };

    loadHospitalName();

    return () => {
      cancelled = true;
    };
  }, [user?.hospitalId, user?.name]);

  const handleSelectNotification = (notification: AlertNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Use actionUrl if provided, otherwise fall back to category-based routing
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    } else if (notification.category === "messaging") {
      router.push("/hospital/claims");
    }
  };

  const handleDismissNotification = (id: string) => {
    dismiss(id);
  };

  return (
    <DashboardLayout
      userRole="hospital"
      userName={hospitalName}
      notifications={notifications}
      onNotificationSelect={handleSelectNotification}
      onNotificationDismiss={handleDismissNotification}
    >
      {children}
    </DashboardLayout>
  );
}
