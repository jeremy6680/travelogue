import React from "react";
import { Link, useLocation } from "wouter";
import { Compass, BookOpen, Map, Globe, Instagram, Twitter, Mail } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Compass, exact: true },
    { href: "/atlas", label: "Atlas", icon: Map },
    { href: "/posts", label: "Journal", icon: BookOpen },
    { href: "/trips", label: "Trips", icon: Globe },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-secondary/30 selection:text-secondary-foreground">
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group" data-testid="link-home-logo">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md group-hover:bg-secondary transition-colors shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight">Wanderlust</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? location === item.href
                : location === item.href || location.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
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
            <span className="font-serif font-bold text-lg">Wanderlust</span>
          </div>

          <p className="text-sm text-muted-foreground font-serif italic text-center">
            &copy; {new Date().getFullYear()} Wanderlust Journals. Crafted with intention.
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
              href="mailto:hello@wanderlust.blog"
              className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
              aria-label="Email"
            >
              <Mail className="w-3.5 h-3.5" />
            </a>
            <Link
              href="/admin"
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors ml-2"
            >
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
