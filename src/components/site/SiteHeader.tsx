import { User } from "lucide-react";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/data";
import { CartTrigger } from "./CartProvider";
import { Logo } from "./Logo";
import { DesktopNav, MobileNav, type NavLink } from "./MobileNav";

export const NAV_LINKS: NavLink[] = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/store", label: "Store" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export async function SiteHeader() {
  const [settings, user] = await Promise.all([
    getSiteSettings(),
    getSessionUser(),
  ]);

  const accountHref = user ? "/account" : "/sign-in";
  const accountLabel = user ? user.name.split(" ")[0] || "Account" : "Sign In";

  return (
    <header className="sticky top-0 z-40 border-b border-gold/20 bg-ink/95 text-ivory backdrop-blur-md">
      <div className="container-page flex h-20 items-center justify-between gap-8">
        <Logo settings={settings} />

        <DesktopNav links={NAV_LINKS} />

        <div className="flex items-center gap-5">
          <Link
            href={accountHref}
            aria-label={user ? "Your account" : "Sign in"}
            className="hidden items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-ivory/75 transition-colors hover:text-gold lg:inline-flex"
          >
            <User className="h-4 w-4 text-gold/85" aria-hidden />
            <span>{accountLabel}</span>
          </Link>

          <CartTrigger />

          <MobileNav
            links={NAV_LINKS}
            accountHref={accountHref}
            accountLabel={accountLabel}
          />
        </div>
      </div>
    </header>
  );
}
