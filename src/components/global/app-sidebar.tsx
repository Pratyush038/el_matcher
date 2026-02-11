"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavSection } from "@/components/navigation/nav-section"
import Link from "next/link"
import { NavProfile } from "@/components/navigation/nav-profile"
import useUser from "@/hooks/use-user"
import { useAuth, useTeamStatus } from "@/lib/hooks"
import { LucideIcon } from "lucide-react"
import defaultConfig from "@/lib/config/sidebar"

type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  description?: string
  disabled?: boolean
}

type NavSection = {
  label: string
  items: NavItem[]
}

export type SidebarConfig = {
  brand?: {
    title: string
    icon?: LucideIcon
    href?: string
  }
  sections: NavSection[]
}

// Default configuration - can be overridden via props


interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  config?: SidebarConfig
}

export function AppSidebar({ config = defaultConfig, ...props }: AppSidebarProps) {
  const { data: user } = useUser()
  const { user: student } = useAuth()
  const { isInTeam } = useTeamStatus(student?.usn)

  if (!user) return null

  // Hide certain nav items when user is already in a team
  const hiddenWhenInTeam = ["/teams/create", "/teams/join", "/browse"]
  const filteredSections = config.sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !(isInTeam && hiddenWhenInTeam.includes(item.href))
      ),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <div className="relative border-b border-border/10 px-6 py-5 backdrop-blur-xl">
          <Link href={config.brand?.href || "/"} className="relative flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-400 shadow-lg ring-2 ring-amber-400/20 dark:from-amber-300 dark:via-amber-400 dark:to-orange-400">
              {config.brand?.icon && (
                <config.brand.icon className="h-5 w-5 text-white shadow-sm" />
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {config.brand?.title}
              </h1>
            </div>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="space-y-4 py-4">
          {filteredSections.map((section, index) => (
            <NavSection 
              key={section.label + index}
              label={section.label}
              items={section.items}
            />
          ))}
        </div>
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
        <NavProfile user={user} />
      </SidebarFooter>
    </Sidebar>
  )
} 