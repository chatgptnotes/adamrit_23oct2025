import { Outlet } from "react-router-dom";
import { TabletTopBar } from "./TabletTopBar";

/** Layout route for the tablet edition: top bar + routed content. No sidebar. */
export function TabletShell() {
  return (
    <div className="flex h-[100dvh] flex-col">
      <TabletTopBar />
      <main className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
