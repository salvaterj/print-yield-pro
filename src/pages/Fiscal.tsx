import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Receipt, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export default function Fiscal() {
  const { serviceOrders, clients, updateServiceOrder, currentProfile } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOS, setSelectedOS] = useState<string | null>(null);
  const [nfData, setNfData] = useState({ numero_nf: '', valor_nf: 0 });

  const readyForNF = serviceOrders.filter(os => os.status_producao === 'pronto_para_nf');
  const nfIssued = serviceOrders.filter(os => os.status_producao === 'nf_emitida');

  const handleOpenNF = (osId: string) => {
    setSelectedOS(osId);
    setNfData({ numero_nf: '', valor_nf: 0 });
    setIsDialogOpen(true);
  };

  const handleEmitNF = () => {
    if (!selectedOS || !nfData.numero_nf) {
      toast.error('Preencha o número da NF');
      return;
    }

    updateServiceOrder(selectedOS, {
      status_producao: 'nf_emitida',
      numero_nf: nfData.numero_nf,
      data_nf: format(new Date(), 'yyyy-MM-dd'),
      valor_nf: nfData.valor_nf,
      logs: [
        ...serviceOrders.find(os => os.id === selectedOS)!.logs,
        { id: `log-${Date.now()}`, timestamp: new Date().toISOString(), usuario: 'Fiscal', acao: 'NF Emitida', detalhes: `NF ${nfData.numero_nf}` }
      ]
    });
    
    toast.success('NF emitida com sucesso!');
    setIsDialogOpen(false);
  };

  if (currentProfile !== 'admin' && currentProfile !== 'fiscal') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso restrito ao perfil Fiscal</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="h-6 w-6" />
          Fiscal - Emissão de NF
        </h1>
        <p className="text-muted-foreground">Gerencie a emissão de notas fiscais</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Badge variant="outline" className="bg-status-success/20 text-status-success">
              {readyForNF.length}
            </Badge>
            Pronto para NF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº OS</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Rolos</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readyForNF.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma OS aguardando NF
                  </TableCell>
                </TableRow>
              ) : (
                readyForNF.map((os) => {
                  const client = clients.find(c => c.id === os.cliente_id);
                  return (
                    <TableRow key={os.id}>
                      <TableCell className="font-medium">{os.numero_os}</TableCell>
                      <TableCell>{client?.trade_name}</TableCell>
                      <TableCell>{os.nome_pedido}</TableCell>
                      <TableCell>{os.quantidade_rolos}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleOpenNF(os.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Emitir NF
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">NFs Emitidas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº NF</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nfIssued.map((os) => {
                const client = clients.find(c => c.id === os.cliente_id);
                return (
                  <TableRow key={os.id}>
                    <TableCell className="font-medium">{os.numero_nf}</TableCell>
                    <TableCell>{os.numero_os}</TableCell>
                    <TableCell>{client?.trade_name}</TableCell>
                    <TableCell>{os.data_nf ? format(parseISO(os.data_nf), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell>{os.valor_nf ? `R$ ${os.valor_nf.toFixed(2)}` : '-'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emitir Nota Fiscal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Número da NF *</Label>
              <Input 
                value={nfData.numero_nf} 
                onChange={(e) => setNfData({ ...nfData, numero_nf: e.target.value })}
                placeholder="Ex: 12345"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input 
                type="number" 
                value={nfData.valor_nf || ''} 
                onChange={(e) => setNfData({ ...nfData, valor_nf: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEmitNF}>Confirmar Emissão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
