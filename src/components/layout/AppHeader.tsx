import { LogOut, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/types';
import { Badge } from '@/components/ui/badge';

const profileLabels: Record<UserProfile, string> = {
  admin: 'Administrador',
  vendas: 'Vendas',
  producao: 'Produção',
};

const profileColors: Record<UserProfile, string> = {
  admin: 'bg-primary text-primary-foreground border-primary/20',
  vendas: 'bg-[hsl(var(--ring))]/10 text-[hsl(var(--ring))] border-[hsl(var(--ring))]/20',
  producao: 'bg-status-warning/20 text-status-warning',
};

export function AppHeader() {
  const { globalSearch, setGlobalSearch } = useApp();
  const { role, user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-card px-4 shadow-sm">
      <SidebarTrigger className="h-8 w-8" />
      
      {/* Global Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar OS, cliente, pedido..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="pl-10 h-9 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {role && (
          <Badge variant="outline" className={profileColors[role]}>
            {profileLabels[role]}
          </Badge>
        )}

        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{user?.email}</span>
        </div>

        <Button variant="outline" size="sm" onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </header>
  );
}
