"use client";

import { AppSidebar } from "@/components/global/app-sidebar";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

const routes = {
  "/dashboard": { name: "Dashboard", path: "/dashboard" },
  "/teams": { name: "Teams", path: "/teams/create" },
  "/teams/create": { name: "Create Team", path: "/teams/create" },
  "/teams/join": { name: "Join Team", path: "/teams/join" },
  "/browse": { name: "Browse Teams", path: "/browse" },
  "/looking": { name: "Looking for Team", path: "/looking" },
  "/profile": { name: "Profile", path: "/profile" },
};

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Breadcrumbs routes={routes} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
