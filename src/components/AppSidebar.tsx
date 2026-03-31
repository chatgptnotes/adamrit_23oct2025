
import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { AppSidebarProps } from './sidebar/types';
import { useMenuItems } from './sidebar/useMenuItems';
import { SidebarMenuItem } from './sidebar/SidebarMenuItem';
import { SidebarHeaderComponent } from './sidebar/SidebarHeaderComponent';

export function AppSidebar(props: AppSidebarProps) {
  const { mainItems, masterItems } = useMenuItems(props);
  const [search, setSearch] = useState('');

  const filteredMain = mainItems.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMasters = masterItems.filter(item =>
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
              {filteredMain.map((item) => (
                <SidebarMenuItem key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredMasters.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Masters
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredMasters.map((item) => (
                    <SidebarMenuItem key={item.title} item={item} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
