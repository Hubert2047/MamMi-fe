"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Loading from "@/components/Loading";
import { useAuth } from "@/hooks/auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { hydrated, isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";
  const isSuperAdmin = user?.role === "SuperAdmin";
  const adminOnlyRoutes = [
    "/admin/store-pricing",
    "/admin/employees",
    "/admin/attendance",
    "/admin/expenses",
    "/admin/inventory",
    "/admin/inventory-receipts",
    "/admin/stocktakes",
    "/admin/revenues",
    "/admin/orders",
    "/admin/daily-closing",
    "/admin/settings",
    "/admin/print-agents",
    "/admin/tables",
    "/admin/pos-devices",
  ];
  const canAccessRoute =
    isSuperAdmin ||
    (user?.role === "Admin" &&
      adminOnlyRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`),
      ));

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated || !isAdmin || !canAccessRoute) {
      void signOut({ callbackUrl: "/login" });
    }
  }, [canAccessRoute, hydrated, isAdmin, isAuthenticated, pathname]);

  if (!hydrated || !isAuthenticated || !user || !isAdmin || !canAccessRoute) {
    return <Loading />;
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-muted/30">
      <AdminSidebar />
      <main className="admin-content h-full min-h-0 min-w-0 flex-1 overflow-hidden [&>div]:!pt-0 [&>div]:!px-4 [&>div]:!pb-4 [&>div]:md:!px-6 [&>div]:md:!pb-6">
        {children}
      </main>
    </div>
  );
}
