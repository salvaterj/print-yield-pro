import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { user, signInWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (user) navigate('/orcamentos', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async () => {
    if (!isSupabaseConfigured) {
      toast.error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
      return;
    }

    if (!email || !password) {
      toast.error('Informe email e senha');
      return;
    }

    setSubmitting(true);
    const { error } = await signInWithPassword(email, password);
    setSubmitting(false);

    if (error) {
      toast.error('Falha no login: ' + error);
      return;
    }

    toast.success('Login efetuado!');
    navigate('/orcamentos', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center gap-3">
            {!logoError ? (
              <img
                src="/rocha-etiquetas.webp"
                alt="Rocha Etiquetas"
                className={cn("h-12 w-auto object-contain")}
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
                R
              </div>
            )}
            <CardTitle>Entrar</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
