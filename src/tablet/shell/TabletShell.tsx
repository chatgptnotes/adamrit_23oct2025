import { Outlet } from "react-router-dom";
import { TabletTopBar } from "./TabletTopBar";
import { TabletBottomNav } from "./TabletBottomNav";
import { InstallSheet } from "./InstallSheet";

/** Layout route for the tablet edition: top bar + routed content + tab bar. */
export function TabletShell() {
  return (
    <div className="flex h-[100dvh] flex-col">
      <TabletTopBar />
      <main className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
      <TabletBottomNav />
      <InstallSheet />
    </div>
  );
}
