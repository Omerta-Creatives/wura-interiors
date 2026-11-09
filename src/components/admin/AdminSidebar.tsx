"use client";

import {
  ExternalLink,
  FolderTree,
  Images,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  Settings,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/actions/auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/projects", label: "Projects", icon: Images },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/services", label: "Services", icon: Sparkles },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ email }: { email: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="bg-ink text-ivory md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col">
      <div className="flex items-center justify-between px-5 py-4 md:block md:px-6 md:py-8">
        <Link href="/admin" className="block leading-none">
          <span className="font-display text-2xl font-semibold uppercase tracking-[0.3em] text-gold">
            Wura
          </span>
          <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.45em] text-ivory/70">
            Dashboard
          </span>
        </Link>
        <form action={signOut} className="md:hidden">
          <button
            type="submit"
            className="inline-flex items-center gap-2 text-sm text-ivory/80 hover:text-gold"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </button>
        </form>
      </div>

      <nav
        aria-label="Dashboard"
        className="overflow-x-auto md:flex-1 md:overflow-visible"
      >
        <ul className="flex gap-1 px-3 pb-3 md:block md:space-y-1 md:px-3 md:pb-0">
          {links.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 whitespace-nowrap px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-gold text-ink"
                      : "text-ivory/80 hover:bg-ivory/10 hover:text-ivory",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="hidden border-t border-ivory/10 p-4 md:block">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-2 py-2 text-sm text-ivory/80 hover:text-gold"
        >
          <ExternalLink className="h-4 w-4" aria-hidden /> View website
          <span className="sr-only"> (opens in a new tab)</span>
        </Link>
        {email && (
          <p className="truncate px-2 pt-2 text-xs text-ivory/50">{email}</p>
        )}
        <form action={signOut}>
          <button
            type="submit"
            className="mt-1 flex w-full items-center gap-2 px-2 py-2 text-left text-sm text-ivory/80 hover:text-gold"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
