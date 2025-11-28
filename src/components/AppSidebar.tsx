
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { AppSidebarProps } from './sidebar/types';
import { useMenuItems } from './sidebar/useMenuItems';
import { SidebarMenuItem } from './sidebar/SidebarMenuItem';
import { SidebarHeaderComponent } from './sidebar/SidebarHeaderComponent';

export function AppSidebar(props: AppSidebarProps) {
  const menuItems = useMenuItems(props);

  return (
    <Sidebar>
      <SidebarHeaderComponent />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 mb-2">Database Tables</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
