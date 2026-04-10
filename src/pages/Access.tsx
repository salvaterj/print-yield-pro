import { ShieldAlert } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function Access() {
  const { profile, role, user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role) navigate('/orcamentos', { replace: true });
  }, [role, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Acesso não liberado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <div>Email: {user?.email}</div>
            <div>Perfil: {role || 'não definido'}</div>
          </div>
          {profile && !profile.active && (
            <div className="text-sm">
              Seu usuário está inativo. Solicite ao administrador para reativar.
            </div>
          )}
          {!profile && (
            <div className="text-sm">
              Seu usuário autenticou, mas ainda não tem um perfil atribuído. Solicite ao administrador para liberar seu acesso.
            </div>
          )}
          <Button variant="outline" onClick={() => signOut()}>
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
