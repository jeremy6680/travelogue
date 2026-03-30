import React from "react";
import { Link, useLocation } from "wouter";
import { Compass, BookOpen, Map } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Atlas", icon: Map },
    { href: "/posts", label: "Journal", icon: BookOpen },
    { href: "/countries", label: "Countries", icon: Compass },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-secondary/30 selection:text-secondary-foreground">
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md group-hover:bg-secondary transition-colors shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight">Wanderlust</span>
          </Link>
          
          <nav className="flex items-center gap-1 md:gap-4">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
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

      <footer className="w-full border-t py-8 mt-12 bg-card">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p className="font-serif italic">&copy; {new Date().getFullYear()} Wanderlust Journals. Crafted with intention.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/posts" className="hover:text-foreground transition-colors">Journal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
