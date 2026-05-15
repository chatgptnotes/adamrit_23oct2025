import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/admin/code-assistant',     label: 'Code Assistant', ready: true },
  { to: '/admin/logic-studio',       label: 'Logic Studio',   ready: false },
  { to: '/admin/users',              label: 'Users & Roles',  ready: false },
  { to: '/admin/audit-log',          label: 'Audit Log',      ready: false },
  { to: '/admin/usage',              label: 'Usage & Cost',   ready: false },
  { to: '/admin/deployments',        label: 'Deployments',    ready: false },
  { to: '/admin/settings',           label: 'System Settings',ready: false },
  { to: '/admin/ai-models',          label: 'AI Models',      ready: false },
];

export function AdminTabNav() {
  return (
    <nav className="border-b bg-muted/30">
      <div className="flex gap-1 px-4 overflow-x-auto">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              cn(
                'px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors',
                isActive ? 'border-primary text-foreground font-medium' : 'border-transparent text-muted-foreground hover:text-foreground',
                !t.ready && 'opacity-50',
              )
            }
          >
            {t.label}
            {!t.ready && <span className="ml-1 text-xs">·soon</span>}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
