import { useEffect, useState } from 'react';
import { Trash2, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/types';
import { logError } from '@/lib/logger';

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

type DeleteUserResponse = {
  ok?: boolean;
  error?: string;
};

const roleLabel: Record<UserProfile, string> = {
  admin: 'Administrador',
  vendas: 'Vendas',
  producao: 'Produção',
};

export default function UserManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserProfile>('vendas');
  const [creating, setCreating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState<ProfileRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProfiles = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      toast.error('Erro ao carregar usuários: ' + error.message);
      void logError('Erro ao carregar usuários', { message: error.message });
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
      void logError('Falha ao criar usuário', { message: error.message });
      return;
    }

    const resp = (data as CreateUserResponse | null) ?? null;
    if (resp?.error) {
      toast.error(resp.error);
      void logError('Falha ao criar usuário', { message: resp.error });
      return;
    }

    toast.success('Usuário criado com sucesso!');
    setEmail('');
    setPassword('');
    setRole('vendas');
    await loadProfiles();
  };

  const openDeleteDialog = (profile: ProfileRow) => {
    setDeletingProfile(profile);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!supabase) {
      toast.error('Supabase não configurado');
      return;
    }

    if (!deletingProfile) return;

    if (user?.id && deletingProfile.id === user.id) {
      toast.error('Você não pode excluir o próprio usuário');
      setIsDeleteDialogOpen(false);
      return;
    }

    setDeleting(true);
    const { data, error } = await supabase.functions.invoke('admin-delete-user', {
      body: { user_id: deletingProfile.id },
    });
    setDeleting(false);
    setIsDeleteDialogOpen(false);

    if (error) {
      toast.error('Falha ao excluir usuário: ' + error.message);
      void logError('Falha ao excluir usuário', { message: error.message });
      return;
    }

    const resp = (data as DeleteUserResponse | null) ?? null;
    if (resp?.error) {
      toast.error(resp.error);
      void logError('Falha ao excluir usuário', { message: resp.error });
      return;
    }

    toast.success('Usuário excluído com sucesso!');
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
                <TableHead className="w-[140px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && profiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => openDeleteDialog(p)}
                        disabled={Boolean(user?.id && p.id === user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário "{deletingProfile?.email}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
