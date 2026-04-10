import { useEffect, useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { UserProfile } from '@/types';

type ProfileRow = {
  id: string;
  email: string;
  role: UserProfile;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type CreateUserResponse = {
  ok?: boolean;
  id?: string;
  error?: string;
};

const roleLabel: Record<UserProfile, string> = {
  admin: 'Administrador',
  vendas: 'Vendas',
  producao: 'Produção',
};

export default function UserManagement() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserProfile>('vendas');
  const [creating, setCreating] = useState(false);

  const loadProfiles = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      toast.error('Erro ao carregar usuários: ' + error.message);
      return;
    }
    setProfiles((data as ProfileRow[]) ?? []);
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleCreate = async () => {
    if (!supabase) {
      toast.error('Supabase não configurado');
      return;
    }

    if (!email || !password) {
      toast.error('Informe email e senha');
      return;
    }

    setCreating(true);
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { email, password, role },
    });
    setCreating(false);

    if (error) {
      toast.error('Falha ao criar usuário: ' + error.message);
      return;
    }

    const resp = (data as CreateUserResponse | null) ?? null;
    if (resp?.error) {
      toast.error(resp.error);
      return;
    }

    toast.success('Usuário criado com sucesso!');
    setEmail('');
    setPassword('');
    setRole('vendas');
    await loadProfiles();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Usuários
        </h1>
        <p className="text-muted-foreground">Administrador cadastra usuários e define perfis</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Cadastrar usuário
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserProfile)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Criando...' : 'Criar usuário'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuários cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && profiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{roleLabel[p.role]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.active ? 'default' : 'secondary'}>{p.active ? 'Ativo' : 'Inativo'}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
