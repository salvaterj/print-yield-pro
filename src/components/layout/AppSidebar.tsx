import { 
  LayoutDashboard, 
  Users, 
  Package, 
  PackageSearch, 
  FileText, 
  ClipboardList, 
  Kanban, 
  Receipt,
  Settings,
  UserCog
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, profiles: ['admin', 'vendas', 'producao', 'fiscal', 'impressao'] },
  { title: 'Clientes', url: '/clientes', icon: Users, profiles: ['admin', 'vendas'] },
  { title: 'Vendedores', url: '/vendedores', icon: UserCog, profiles: ['admin', 'vendas'] },
  { title: 'Bobinas', url: '/bobinas', icon: Package, profiles: ['admin', 'vendas', 'producao'] },
  { title: 'Produtos', url: '/produtos', icon: PackageSearch, profiles: ['admin', 'vendas'] },
  { title: 'Orçamentos', url: '/orcamentos', icon: FileText, profiles: ['admin', 'vendas'] },
  { title: 'Ordens de Serviço', url: '/os', icon: ClipboardList, profiles: ['admin', 'vendas', 'producao', 'impressao'] },
  { title: 'Produção (Kanban)', url: '/kanban', icon: Kanban, profiles: ['admin', 'producao', 'impressao'] },
  { title: 'Fiscal (NF)', url: '/fiscal', icon: Receipt, profiles: ['admin', 'fiscal'] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { currentProfile } = useApp();
  
  const filteredItems = menuItems.filter(item => 
    item.profiles.includes(currentProfile)
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            LF
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-semibold text-sidebar-foreground">LabelFlow</h1>
              <p className="text-xs text-muted-foreground">Sistema de Gráfica</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="scrollbar-thin">
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/'}
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border p-4">
        {!collapsed && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Settings className="h-4 w-4" />
            <span>v1.0.0</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
