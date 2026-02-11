"use client";

import { LogOut, MoreHorizontal, User, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export function NavProfile({ user }: { user: { email?: string; user_metadata?: { display_name?: string } } }) {
  const router = useRouter();
  const [isSignOut, startSignOut] = useTransition();
  const signout = () => {
    startSignOut(async () => {
      const supabase = createSupabaseBrowser();
      await supabase.auth.signOut();
      router.push("/signin");
    });
  };
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
                {
                  "animate-pulse": isSignOut,
                }
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.email}</span>
              </div>
              <MoreHorizontal className="ml-auto h-4 w-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signout}>
              {!isSignOut ? (
                <LogOut className="mr-2 h-4 w-4" />
              ) : (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
