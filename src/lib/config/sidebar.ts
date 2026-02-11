import {
  LayoutDashboard,
  Users,
  PlusCircle,
  KeyRound,
  Search,
  Hand,
  UserCircle,
} from "lucide-react";
import type { SidebarConfig } from "@/components/global/app-sidebar";

const sidebarConfig: SidebarConfig = {
  brand: {
    title: "EL Matcher",
    icon: Users,
    href: "/dashboard",
  },
  sections: [
    {
      label: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: "Teams",
      items: [
        {
          title: "Create Team",
          href: "/teams/create",
          icon: PlusCircle,
        },
        {
          title: "Join with Code",
          href: "/teams/join",
          icon: KeyRound,
        },
      ],
    },
    {
      label: "Discover",
      items: [
        {
          title: "Browse Teams",
          href: "/browse",
          icon: Search,
        },
        {
          title: "Looking for Team",
          href: "/looking",
          icon: Hand,
        },
      ],
    },
    {
      label: "Account",
      items: [
        {
          title: "Profile",
          href: "/profile",
          icon: UserCircle,
        },
      ],
    },
  ],
};

export default sidebarConfig;
