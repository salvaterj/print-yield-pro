import { Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useApp } from '@/contexts/AppContext';
import { UserProfile } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const profileLabels: Record<UserProfile, string> = {
  admin: 'Administrador',
  vendas: 'Vendas',
  producao: 'Produção',
  fiscal: 'Fiscal',
  impressao: 'Impressão',
};

const profileColors: Record<UserProfile, string> = {
  admin: 'bg-primary text-primary-foreground',
  vendas: 'bg-status-info/20 text-status-info',
  producao: 'bg-status-warning/20 text-status-warning',
  fiscal: 'bg-status-success/20 text-status-success',
  impressao: 'bg-purple-100 text-purple-700',
};

export function AppHeader() {
  const { currentProfile, setCurrentProfile, globalSearch, setGlobalSearch } = useApp();

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
      
      {/* Profile Selector */}
      <div className="flex items-center gap-3">
        <Badge variant="outline" className={profileColors[currentProfile]}>
          {profileLabels[currentProfile]}
        </Badge>
        
        <Select value={currentProfile} onValueChange={(v) => setCurrentProfile(v as UserProfile)}>
          <SelectTrigger className="w-[160px] h-9">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="vendas">Vendas</SelectItem>
            <SelectItem value="producao">Produção</SelectItem>
            <SelectItem value="fiscal">Fiscal</SelectItem>
            <SelectItem value="impressao">Impressão</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}
