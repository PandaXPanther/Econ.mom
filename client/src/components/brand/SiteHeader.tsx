import { Link, useLocation } from "wouter";
import { Logo } from "./Logo";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/tools", label: "All Tools" },
  { href: "/methodology", label: "Methodology" },
  { href: "/founder", label: "Founder" },
];

export function SiteHeader() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" data-testid="link-home">
          <a className="cursor-pointer">
            <Logo size={32} withWordmark />
          </a>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/"
                ? location === "/"
                : location.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} data-testid={`link-nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}>
                <a
                  className={`relative cursor-pointer text-[0.85rem] font-medium tracking-wide transition-colors hover:text-foreground ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute -bottom-1 left-0 right-0 h-px bg-primary" />
                  )}
                </a>
              </Link>
            );
          })}
          <ThemeToggle />
        </nav>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          data-testid="button-menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} data-testid={`link-mobile-${link.label.toLowerCase().replace(/\s/g, "-")}`}>
                <a
                  onClick={() => setOpen(false)}
                  className="cursor-pointer text-base font-medium text-foreground"
                >
                  {link.label}
                </a>
              </Link>
            ))}
            <div className="pt-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
