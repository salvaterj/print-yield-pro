import { 
  UserPlus,
  Package, 
  PackageSearch, 
  FileText, 
  ClipboardList, 
  Settings,
  UserCog,
  Users,
  Truck
} from 'lucide-react';
import { useState } from 'react';
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
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { title: 'Clientes', url: '/clientes', icon: Users, profiles: ['admin', 'vendas'] },
  { title: 'Transportadoras', url: '/transportadoras', icon: Truck, profiles: ['admin', 'vendas'] },
  { title: 'Vendedores', url: '/vendedores', icon: UserCog, profiles: ['admin'] },
  { title: 'Usuários', url: '/usuarios', icon: UserPlus, profiles: ['admin'] },
  { title: 'Configurações', url: '/configuracoes', icon: Settings, profiles: ['admin'] },
  { title: 'Bobinas', url: '/bobinas', icon: Package, profiles: ['admin', 'vendas', 'producao'] },
  { title: 'Produtos', url: '/produtos', icon: PackageSearch, profiles: ['admin', 'vendas', 'producao'] },
  { title: 'Orçamentos', url: '/orcamentos', icon: FileText, profiles: ['admin', 'vendas'] },
  { title: 'Ordens de Serviço', url: '/os', icon: ClipboardList, profiles: ['admin', 'vendas', 'producao'] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const [logoError, setLogoError] = useState(false);
  const { role } = useAuth();
  const filteredItems = menuItems.filter((item) => (role ? item.profiles.includes(role) : false));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          {!logoError ? (
            <img
              src="/rocha-etiquetas.webp"
              alt="Rocha Etiquetas"
              className={cn(
                "h-10 object-contain",
                collapsed ? "w-10" : "w-[180px]",
              )}
              onError={() => setLogoError(true)}
            />
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                R
              </div>
              {!collapsed && (
                <div>
                  <h1 className="font-semibold text-sidebar-foreground">Rocha Etiquetas</h1>
                  <p className="text-xs text-muted-foreground">Sistema</p>
                </div>
              )}
            </>
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
