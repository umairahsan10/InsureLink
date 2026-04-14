"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { corporatesApi } from "@/lib/api/corporates";
import { AlertNotification } from "@/types";

export default function CorporateLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, dismiss, markAsRead } = useNotifications();
  const [corporateName, setCorporateName] = useState<string>("Corporate");

  useEffect(() => {
    let cancelled = false;

    const loadCorporateName = async () => {
      if (!user?.corporateId) {
        setCorporateName(user?.name || "Corporate");
        return;
      }

      try {
        const corporate = await corporatesApi.getCorporateById(
          user.corporateId,
        );
        if (!cancelled) {
          setCorporateName(corporate.name || user?.name || "Corporate");
        }
      } catch {
        if (!cancelled) {
          setCorporateName(user?.name || "Corporate");
        }
      }
    };

    loadCorporateName();

    return () => {
      cancelled = true;
    };
  }, [user?.corporateId, user?.name]);

  const handleSelectNotification = (notification: AlertNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Use actionUrl if provided, otherwise fall back to category-based routing
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    } else if (
      notification.category === "messaging" ||
      notification.category === "claims"
    ) {
      router.push("/corporate/claims");
    }
  };

  const handleDismissNotification = (id: string) => {
    dismiss(id);
  };

  return (
    <DashboardLayout
      userRole="corporate"
      userName={corporateName}
      notifications={notifications}
      onNotificationSelect={handleSelectNotification}
      onNotificationDismiss={handleDismissNotification}
    >
      {children}
    </DashboardLayout>
  );
}
