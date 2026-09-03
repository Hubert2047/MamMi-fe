"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth";
import { getPosDeviceSession } from "@/api/pos-device";
import Loading from "@/components/Loading";

export default function HomePage() {
  const router = useRouter();
  const { hydrated, isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";
  const isStoreAdmin = user?.role === "Admin";
  const isSuperAdmin = user?.role === "SuperAdmin";
  useEffect(() => {
    if (!hydrated) return;
    if (isAuthenticated) {
      router.replace(
        isSuperAdmin
          ? "/admin/overview"
          : isStoreAdmin
            ? "/admin/store-pricing"
            : isAdmin
              ? "/admin"
              : "/login",
      );
      return;
    }
    void getPosDeviceSession()
      .then(() => router.replace("/pos"))
      .catch(() => router.replace("/login"));
  }, [hydrated, isAuthenticated, isAdmin, isStoreAdmin, isSuperAdmin, router]);
  return <Loading />;
}
