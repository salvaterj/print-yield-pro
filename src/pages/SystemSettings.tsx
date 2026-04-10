import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemSettings() {
  const { systemSettings, saveSystemSettings } = useApp();
  const [formData, setFormData] = useState(systemSettings);

  useEffect(() => {
    setFormData(systemSettings);
  }, [systemSettings]);

  const handleSave = async () => {
    if (!formData.company_name) {
      toast.error('Preencha o nome da empresa emissora');
      return;
    }

    try {
      await saveSystemSettings({
        company_name: formData.company_name,
        document_footer: formData.document_footer,
        default_quote_validity_days: formData.default_quote_validity_days,
        default_waste_percentage: formData.default_waste_percentage,
      });
      toast.success('Configurações salvas!');
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao salvar configurações');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configurações
        </h1>
        <p className="text-muted-foreground">Configurações básicas do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da empresa emissora</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome da empresa *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_quote_validity_days">Validade padrão do orçamento (dias)</Label>
              <Input
                id="default_quote_validity_days"
                type="number"
                value={formData.default_quote_validity_days}
                onChange={(e) => setFormData({ ...formData, default_quote_validity_days: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_waste_percentage">Perda padrão (%)</Label>
              <Input
                id="default_waste_percentage"
                type="number"
                step="0.1"
                value={formData.default_waste_percentage}
                onChange={(e) => setFormData({ ...formData, default_waste_percentage: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_footer">Rodapé padrão para PDF</Label>
            <Textarea
              id="document_footer"
              value={formData.document_footer}
              onChange={(e) => setFormData({ ...formData, document_footer: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
