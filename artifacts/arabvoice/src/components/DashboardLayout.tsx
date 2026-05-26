import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Mic, History, CreditCard, User, LayoutDashboard, Wand2, Shield, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/generate", label: "Generate", icon: Mic },
  { href: "/dashboard/clone", label: "Voice Clone", icon: Wand2 },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.email?.endsWith("@admin.arabvoice.ai");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
          <Link href="/">
            <span className="text-xl font-bold text-primary tracking-tight cursor-pointer">ArabVoice AI</span>
          </Link>
          <button className="md:hidden text-muted-foreground" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link key={href} href={href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                  data-testid={`nav-${label.toLowerCase().replace(" ", "-")}`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </div>
              </Link>
            );
          })}

          {isAdmin && (
            <Link href="/admin">
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors mt-4",
                  location.startsWith("/admin")
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Shield className="h-4 w-4 flex-shrink-0" />
                Admin
              </div>
            </Link>
          )}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary-foreground">
                {user?.email?.[0]?.toUpperCase() ?? "U"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            onClick={signOut}
            data-testid="button-sign-out"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <span className="font-bold text-primary">ArabVoice AI</span>
          <div className="w-5" />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
