import { Outlet } from 'react-router-dom';
import { RequireSuperAdmin } from '@/components/admin/RequireSuperAdmin';
import { AdminTabNav } from '@/components/admin/AdminTabNav';

export default function AdminPanel() {
  return (
    <RequireSuperAdmin>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <h1 className="text-lg font-semibold">Adamrit · Super-Admin</h1>
            <p className="text-xs text-muted-foreground">Tools available only to super-admin users.</p>
          </div>
        </header>
        <AdminTabNav />
        <main className="max-w-5xl mx-auto px-4 py-6">
          <Outlet />
        </main>
      </div>
    </RequireSuperAdmin>
  );
}
