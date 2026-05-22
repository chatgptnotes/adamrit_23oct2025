import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getModule } from "@/tablet/config/modules";
import { setOverride } from "@/lib/device-class";
import { useTabletTheme } from "@/tablet/theme/TabletTheme";
import { SyncIndicator } from "./SyncIndicator";
import { InstallButton } from "./InstallButton";

/** Tablet top bar: back, left-aligned hospital brand, role, sync, theme, full-site, exit. */
export function TabletTopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hospitalConfig, logout } = useAuth();
  const { theme, toggleTheme } = useTabletTheme();

  const isHome = location.pathname === "/";
  const moduleId = location.pathname.split("/")[1];
  const moduleLabel = getModule(moduleId)?.label;
  const subtitle = moduleLabel || user?.username || user?.email || "";

  const handleLogout = async () => {
    await logout();
  };

  // Switch this browser to the desktop full site (the choice is saved per
  // device). Always land on "/" — the editions don't share routes.
  const handleFullSite = () => {
    setOverride("full");
    window.location.assign("/");
  };

  return (
    <header className="tablet-safe-top tablet-topbar relative z-10 flex-shrink-0 border-b border-border px-4 py-3 sm:px-6 lg:px-8">
      {/* Same max-width envelope as the dashboard so the brand lines up above
          the first tile (Register Patient). */}
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3">
        {/* Back — module screens only */}
        {!isHome ? (
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-foreground transition-transform active:scale-95"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        ) : null}

        {/* Hospital brand — left aligned */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 select-none items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-xl font-bold text-white shadow-[0_0_20px_-4px_hsl(152_56%_45%/0.75)]">
            {hospitalConfig?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-tight text-foreground sm:text-lg md:text-xl">
              {hospitalConfig?.fullName || "Adamrit Tablet"}
            </p>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        {/* Right — role, sync, theme, full-site, exit */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {user?.role ? (
            <span className="hidden text-sm capitalize text-muted-foreground lg:inline">
              {user.role} console
            </span>
          ) : null}

          <SyncIndicator />

          <InstallButton />

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-secondary text-foreground transition-all active:scale-95"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleFullSite}
            aria-label="Switch to full site"
            className="flex h-11 items-center gap-2 rounded-xl border border-border bg-secondary px-3 text-sm font-semibold text-muted-foreground transition-all hover:text-foreground active:scale-95"
          >
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">FULL SITE</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-11 items-center gap-2 rounded-xl border border-border bg-secondary px-4 text-sm font-semibold text-muted-foreground transition-all hover:text-foreground active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            EXIT
          </button>
        </div>
      </div>
    </header>
  );
}
