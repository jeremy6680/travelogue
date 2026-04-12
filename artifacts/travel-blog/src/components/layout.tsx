import React from "react";
import { Link, useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import {
  Compass,
  BookOpen,
  Map,
  Globe,
  BarChart3,
  CalendarRange,
  Instagram,
  Twitter,
  Mail,
} from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { locale, setLocale, t, isLocaleSwitcherEnabled } = useI18n();

  const navItems = [
    { href: "/atlas", label: t("navAtlas"), icon: Map },
    { href: "/posts", label: t("navJournal"), icon: BookOpen },
    { href: "/trips", label: t("navTrips"), icon: Globe },
    { href: "/events", label: t("navEvents"), icon: CalendarRange },
    { href: "/dataviz", label: t("navDataViz"), icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-[var(--color-primary-lightest)] selection:text-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-[#DDD6CDCC] bg-[#F7F3EED1] backdrop-blur-md supports-[backdrop-filter]:bg-[#F7F3EEB8]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 group"
            data-testid="link-home-logo"
          >
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md group-hover:bg-[var(--color-primary-hover)] transition-colors shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight text-foreground">
              Travelogue
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                location === item.href || location.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-foreground"
                  }`}
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
            {isLocaleSwitcherEnabled && (
              <div className="ml-2 hidden md:flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-background/70 p-1">
                {(["fr", "en"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLocale(value)}
                    className={`rounded px-2 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                      locale === value
                        ? "bg-primary text-primary-foreground"
                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-foreground"
                    }`}
                    aria-label={`${t("languageLabel")} ${value.toUpperCase()}`}
                  >
                    {value.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 md:py-12">
        {children}
      </main>

      <footer className="w-full border-t mt-16 bg-card">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1 rounded-md">
              <Compass className="w-4 h-4" />
            </div>
            <span className="font-serif font-bold text-lg">Travelogue</span>
          </div>

          <p className="text-sm text-muted-foreground font-serif italic text-center">
            &copy; {new Date().getFullYear()} Travelogue Journals.{" "}
            {t("footerTagline")}
          </p>

          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-3.5 h-3.5" />
            </a>
            <a
              href="mailto:hey@jeremymarchandeau.com"
              className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
              aria-label="Email"
            >
              <Mail className="w-3.5 h-3.5" />
            </a>
            {import.meta.env.VITE_SHOW_ADMIN_LINK === "true" && (
              <Link
                href="/admin"
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors ml-2"
              >
                {t("navAdmin")}
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
