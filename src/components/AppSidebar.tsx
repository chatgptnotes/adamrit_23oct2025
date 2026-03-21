
import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { AppSidebarProps } from './sidebar/types';
import { useMenuItems } from './sidebar/useMenuItems';
import { SidebarMenuItem } from './sidebar/SidebarMenuItem';
import { SidebarHeaderComponent } from './sidebar/SidebarHeaderComponent';

export function AppSidebar(props: AppSidebarProps) {
  const menuItems = useMenuItems(props);
  const [search, setSearch] = useState('');

  const filteredItems = menuItems.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Sidebar>
      <SidebarHeaderComponent />
      <SidebarContent>
        <SidebarGroup>
          <div className="px-2 mb-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tabs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
