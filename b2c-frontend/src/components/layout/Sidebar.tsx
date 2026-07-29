"use client";

import { useState, createContext, useContext, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  GraduationCap,
  Network,
  ClipboardList,
  Award,
  Bell,
  Settings,
  LogOut,
  Shield,
  Sparkles,
  Crown,
  DollarSign,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useLogout, useMe } from "@/src/features/auth";
import { defaultDashboardPath } from "@/src/features/auth/dashboardRoutes";
import { useTranslation } from "@/src/i18n";
import type { MessageKey } from "@/src/i18n";

interface SidebarContextType {
  collapsed: boolean;
  toggle: () => void;
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggle: () => {},
  mobileOpen: false,
  openMobile: () => {},
  closeMobile: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = useCallback(() => setCollapsed((p) => !p), []);
  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, mobileOpen, openMobile, closeMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

interface NavItem {
  labelKey: MessageKey;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const learnerNavGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { labelKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
      { labelKey: "nav.courses", href: "/my-courses", icon: BookOpen },
      { labelKey: "nav.assessments", href: "/assessments", icon: FolderOpen },
      { labelKey: "nav.achievements", href: "/achievements", icon: Award },
    ],
  },
  {
    title: "Learning",
    items: [
      { labelKey: "nav.quizzes", href: "/quizzes", icon: ClipboardList },
      { labelKey: "nav.networkLab", href: "/network-lab", icon: Network },
      { labelKey: "nav.exams", href: "/exams", icon: GraduationCap },
      { labelKey: "common.newCourse", href: "/create-course", icon: Sparkles },
    ],
  },
  {
    title: "Account",
    items: [
      { labelKey: "nav.settings", href: "/settings", icon: Settings },
      { labelKey: "nav.upgrade", href: "/upgrade", icon: Crown },
      { labelKey: "nav.notifications", href: "/notifications", icon: Bell },
    ],
  },
];

const accountSettingsGroup: NavGroup = {
  title: "Account",
  items: [{ labelKey: "nav.settings", href: "/settings", icon: Settings }],
};

const adminGroup: NavGroup = {
  title: "Admin",
  items: [
    { labelKey: "nav.dashboard", href: "/admin/metrics", icon: LayoutDashboard },
    { labelKey: "nav.adminCosts", href: "/admin/costs", icon: DollarSign },
    { labelKey: "nav.adminContent", href: "/admin/content", icon: Shield },
  ],
};

const instructorGroup: NavGroup = {
  title: "Instructor",
  items: [
    { labelKey: "nav.instructorDashboard", href: "/instructor/dashboard", icon: LayoutDashboard },
    { labelKey: "nav.instructorCourses", href: "/instructor/courses", icon: BookOpen },
    { labelKey: "instructor.newCourse", href: "/instructor/courses/new", icon: Sparkles },
    { labelKey: "nav.instructorSales", href: "/instructor/sales", icon: DollarSign },
  ],
};

function sidebarGroupsForRole(role?: string | null): NavGroup[] {
  if (role === "admin") {
    return [adminGroup, accountSettingsGroup];
  }
  if (role === "instructor") {
    return [instructorGroup, accountSettingsGroup];
  }
  return learnerNavGroups;
}

function isNavItemActive(pathname: string, href: string, groupHrefs: string[]): boolean {
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;

  const hasMoreSpecificMatch = groupHrefs.some(
    (other) =>
      other !== href &&
      other.startsWith(`${href}/`) &&
      (pathname === other || pathname.startsWith(`${other}/`)),
  );

  return !hasMoreSpecificMatch;
}

function SidebarNavItem({
  item,
  active,
  collapsed,
  label,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  label: string;
}) {
  return (
    <Link
      href={item.href}
      title={collapsed ? label : undefined}
      className={cn(
        "group flex items-center text-sm font-medium transition-colors duration-200",
        collapsed ? "justify-center rounded-xl px-0 py-2.5" : "gap-3 rounded-xl px-3 py-2.5",
        active
          ? "bg-primary-soft text-primary"
          : "text-ink-2 hover:bg-bg-soft hover:text-ink",
      )}
    >
      <item.icon
        className={cn(
          "size-[18px] shrink-0 stroke-[1.75]",
          active ? "text-primary" : "text-ink-3 group-hover:text-ink-2",
        )}
      />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
    </Link>
  );
}

function resolveNavItemHref(item: NavItem, role?: string | null): NavItem {
  if (item.href === "/dashboard") {
    return { ...item, href: defaultDashboardPath(role) };
  }
  return item;
}

function SidebarGroupSection({
  group,
  collapsed,
  role,
}: {
  group: NavGroup;
  collapsed: boolean;
  role?: string | null;
}) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const groupHrefs = group.items.map((item) => resolveNavItemHref(item, role).href);

  return (
    <div className={collapsed ? "px-2" : "px-4"}>
      {!collapsed && (
        <p className="mb-2 px-3 text-xs font-medium text-ink-3">{group.title}</p>
      )}
      <div className="flex flex-col gap-0.5">
        {group.items.map((item) => {
          const resolved = resolveNavItemHref(item, role);
          const active = isNavItemActive(pathname, resolved.href, groupHrefs);
          return (
            <SidebarNavItem
              key={item.href}
              item={resolved}
              active={active}
              collapsed={collapsed}
              label={t(item.labelKey)}
            />
          );
        })}
      </div>
    </div>
  );
}

function BrandLogo({ collapsed, homeHref }: { collapsed: boolean; homeHref: string }) {
  return (
    <Link href={homeHref} className="flex items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
        <Sparkles className="size-5" />
      </span>
      {!collapsed && (
        <span className="font-heading text-xl font-semibold tracking-tight text-ink">
          <span className="text-primary">AI</span>
          Study
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const { collapsed, mobileOpen, closeMobile } = useSidebar();
  const logout = useLogout();
  const meQ = useMe();
  const { t } = useTranslation();
  const role = meQ.data?.user.role;
  const homeHref = defaultDashboardPath(role);
  const groups = sidebarGroupsForRole(role);
  const showUpgradeCta = !role || role === "user";

  const renderContent = (isCollapsed: boolean) => (
    <div className="flex h-full flex-col bg-bg-elev">
      <div className={cn("border-b border-line py-4", isCollapsed ? "px-3" : "px-4")}>
        <BrandLogo collapsed={isCollapsed} homeHref={homeHref} />
      </div>

      <nav className="flex-1 overflow-y-auto py-4" aria-label="Dashboard navigation">
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <SidebarGroupSection
              key={group.title}
              group={group}
              collapsed={isCollapsed}
              role={role}
            />
          ))}
        </div>
      </nav>

      {showUpgradeCta && (
        <div className={cn("border-t border-line", isCollapsed ? "px-2 py-3" : "px-4 py-4")}>
          {isCollapsed ? (
            <Link
              href="/upgrade"
              title={t("nav.upgrade")}
              className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary transition hover:bg-primary/10"
            >
              <Crown className="size-4" />
            </Link>
          ) : (
            <Link
              href="/upgrade"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-ink transition hover:bg-primary-dark"
            >
              <Crown className="size-4" />
              {t("nav.upgrade")}
            </Link>
          )}
        </div>
      )}

      <div className={cn("border-t border-line", isCollapsed ? "px-2 py-3" : "px-3 py-3")}>
        <button
          onClick={logout}
          title={isCollapsed ? t("nav.logout") : undefined}
          className={cn(
            "flex w-full items-center rounded-xl text-sm font-medium text-ink-2 transition hover:bg-bg-soft hover:text-ink",
            isCollapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5",
          )}
        >
          <LogOut className="size-[18px] shrink-0" />
          {!isCollapsed && <span>{t("nav.logout")}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[rgba(15,23,42,0.45)] backdrop-blur-sm lg:hidden"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-line shadow-card lg:hidden"
          >
            {renderContent(false)}
          </motion.aside>
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-bg-elev transition-[width] duration-300 lg:flex",
          collapsed ? "w-[72px]" : "w-[260px]",
        )}
      >
        {renderContent(collapsed)}
      </aside>
    </>
  );
}
