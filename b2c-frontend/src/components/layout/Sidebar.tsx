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
    title: "CLIENT APP",
    items: [
      { labelKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
      { labelKey: "nav.courses", href: "/my-courses", icon: BookOpen },
      { labelKey: "nav.assessments", href: "/assessments", icon: FolderOpen },
      { labelKey: "nav.achievements", href: "/achievements", icon: Award },
    ],
  },
  {
    title: "LEARNING",
    items: [
      { labelKey: "nav.quizzes", href: "/quizzes", icon: ClipboardList },
      { labelKey: "nav.exams", href: "/exams", icon: GraduationCap },
      { labelKey: "common.newCourse", href: "/create-course", icon: Sparkles },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { labelKey: "nav.settings", href: "/settings", icon: Settings },
      { labelKey: "nav.upgrade", href: "/upgrade", icon: Crown },
      { labelKey: "nav.notifications", href: "/notifications", icon: Bell },
    ],
  },
];

const accountSettingsGroup: NavGroup = {
  title: "ACCOUNT",
  items: [{ labelKey: "nav.settings", href: "/settings", icon: Settings }],
};

const adminGroup: NavGroup = {
  title: "ADMIN PANEL",
  items: [
    { labelKey: "nav.dashboard", href: "/admin/metrics", icon: LayoutDashboard },
    { labelKey: "nav.adminCosts", href: "/admin/costs", icon: DollarSign },
    { labelKey: "nav.adminContent", href: "/admin/content", icon: Shield },
  ],
};

const instructorGroup: NavGroup = {
  title: "INSTRUCTOR",
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
        "flex items-center rounded-xl text-[15px] font-medium transition-colors duration-200",
        collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-2.5",
        active
          ? "bg-primary-soft text-primary"
          : "text-ink-2 hover:bg-bg-soft hover:text-ink",
      )}
    >
      <item.icon className="size-[18px] shrink-0 stroke-[1.75]" />
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

  return (
    <div className={collapsed ? "px-2" : "px-5"}>
      {!collapsed && (
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
          {group.title}
        </p>
      )}
      <div className="flex flex-col gap-0.5">
        {group.items.map((item) => {
          const resolved = resolveNavItemHref(item, role);
          const active =
            pathname === resolved.href || pathname.startsWith(`${resolved.href}/`);
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
    <Link href={homeHref} className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-2 shadow-[var(--shadow-primary)]">
        <GraduationCap className="size-5 text-primary-ink" strokeWidth={2} />
      </span>
      {!collapsed && (
        <span className="text-[22px] font-bold tracking-tight">
          <span className="text-primary">AI</span>
          <span className="text-ink">Study</span>
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
      <div className={cn("border-b border-line py-5", isCollapsed ? "px-3" : "px-5")}>
        <BrandLogo collapsed={isCollapsed} homeHref={homeHref} />
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <div className="flex flex-col gap-5">
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

      {!isCollapsed && showUpgradeCta && (
        <div className="border-t border-line px-5 py-5">
          <Link
            href="/upgrade"
            className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-ink shadow-[var(--shadow-primary)] transition hover:bg-primary-dark"
          >
            Purchase now
          </Link>
        </div>
      )}

      <div className="border-t border-line px-3 py-3">
        <button
          onClick={logout}
          title={isCollapsed ? "Logout" : undefined}
          className={cn(
            "flex w-full items-center rounded-xl text-[15px] font-medium text-ink-2 transition hover:bg-bg-soft hover:text-ink",
            isCollapsed ? "justify-center py-3" : "gap-3 px-4 py-2.5",
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
            className="fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-line lg:hidden"
          >
            {renderContent(false)}
          </motion.aside>
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line transition-[width] duration-300 lg:flex",
          collapsed ? "w-[72px]" : "w-[270px]",
        )}
      >
        {renderContent(collapsed)}
      </aside>
    </>
  );
}
