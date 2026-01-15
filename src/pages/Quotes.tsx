import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Quote, QuoteItem, QuoteStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Search, FileText, ArrowRight, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusColors: Record<QuoteStatus, string> = {
  rascunho: 'bg-muted text-muted-foreground',
  enviado: 'bg-status-info/20 text-status-info',
  aprovado: 'bg-status-success/20 text-status-success',
  perdido: 'bg-status-error/20 text-status-error',
};

export default function Quotes() {
  const navigate = useNavigate();
  const { quotes, clients, finishedProducts, addQuote, updateQuote, addServiceOrder } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [items, setItems] = useState<Partial<QuoteItem>[]>([]);
  const [prazo, setPrazo] = useState(7);
  const [desconto, setDesconto] = useState(0);

  const filteredQuotes = quotes.filter(q => {
    const client = clients.find(c => c.id === q.cliente_id);
    const matchesSearch = q.numero.toLowerCase().includes(search.toLowerCase()) ||
      client?.nome_fantasia.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddItem = () => {
    setItems([...items, { produto_acabado_id: '', qtd_rolos: 1, valor_unit: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'produto_acabado_id') {
      const product = finishedProducts.find(p => p.id === value);
      if (product) {
        newItems[index].valor_unit = product.preco_base || 0;
        newItems[index].descricao = product.nome;
      }
    }
    setItems(newItems);
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => {
      const product = finishedProducts.find(p => p.id === item.produto_acabado_id);
      const metragem = (product?.metragem_por_rolo_m || 0) * (item.qtd_rolos || 0);
      return sum + (item.valor_unit || 0) * (item.qtd_rolos || 0);
    }, 0);
    return subtotal * (1 - desconto / 100);
  };

  const handleSave = () => {
    if (!selectedClientId || items.length === 0) {
      toast.error('Selecione um cliente e adicione itens');
      return;
    }

    const newQuote: Quote = {
      id: `orc-${Date.now()}`,
      numero: `ORC-${new Date().getFullYear()}-${String(quotes.length + 1).padStart(3, '0')}`,
      data: format(new Date(), 'yyyy-MM-dd'),
      cliente_id: selectedClientId,
      vendedor_nome: 'Usuário Atual',
      itens: items.map((item, i) => {
        const product = finishedProducts.find(p => p.id === item.produto_acabado_id);
        return {
          id: `item-${Date.now()}-${i}`,
          produto_acabado_id: item.produto_acabado_id!,
          descricao: item.descricao || product?.nome || '',
          qtd_rolos: item.qtd_rolos || 0,
          metragem_total_m: (product?.metragem_por_rolo_m || 0) * (item.qtd_rolos || 0),
          valor_unit: item.valor_unit || 0,
          valor_total: (item.valor_unit || 0) * (item.qtd_rolos || 0),
        };
      }),
      prazo_entrega_dias: prazo,
      desconto,
      impostos: 0,
      valor_final: calculateTotal(),
      status: 'rascunho',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addQuote(newQuote);
    toast.success('Orçamento criado!');
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedClientId('');
    setItems([]);
    setPrazo(7);
    setDesconto(0);
  };

  const handleConvertToOS = (quote: Quote) => {
    const client = clients.find(c => c.id === quote.cliente_id);
    const firstItem = quote.itens[0];
    const product = finishedProducts.find(p => p.id === firstItem?.produto_acabado_id);

    const newOS = {
      id: `os-${Date.now()}`,
      numero_os: `OS-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      cliente_id: quote.cliente_id,
      vendedor_nome: quote.vendedor_nome,
      impressor_nome: '',
      data_entrada: format(new Date(), 'yyyy-MM-dd'),
      prazo_saida_ate: format(new Date(Date.now() + (quote.prazo_entrega_dias || 7) * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      nome_pedido: firstItem?.descricao || 'Pedido',
      faca_01: product?.faca_01 || 'reta',
      medida_material_mm: product ? `${product.largura_mm}x${product.altura_mm}` : '',
      material: product ? `${product.cor_base} ${product.acabamento}/${product.material_requerido}` : '',
      amostra: '',
      pantone_01: product?.pantone_1 || '',
      pantone_02: product?.pantone_2 || '',
      pantone_03: product?.pantone_3 || '',
      anilox_01: product?.anilox_1 || '',
      anilox_02: product?.anilox_2 || '',
      anilox_03: product?.anilox_3 || '',
      chapado: product?.chapado || false,
      impressao_m: firstItem?.metragem_total_m || 0,
      rebobinagem_m: firstItem?.metragem_total_m || 0,
      quantidade_rolos: firstItem?.qtd_rolos || 0,
      quantidade_caixa: Math.ceil((firstItem?.qtd_rolos || 0) / 10),
      usar_caixa: '',
      observacoes_producao: `Convertido do orçamento ${quote.numero}`,
      status_producao: 'criado' as const,
      qualidade_ok: false,
      logs: [{ id: `log-${Date.now()}`, timestamp: new Date().toISOString(), usuario: 'Sistema', acao: 'OS Criada', detalhes: `Convertida do orçamento ${quote.numero}` }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addServiceOrder(newOS);
    updateQuote(quote.id, { status: 'aprovado' });
    toast.success('Orçamento convertido em OS!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Orçamentos
          </h1>
          <p className="text-muted-foreground">Gerencie os orçamentos</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as QuoteStatus | 'all')}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => {
                const client = clients.find(c => c.id === quote.cliente_id);
                return (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.numero}</TableCell>
                    <TableCell>{client?.nome_fantasia}</TableCell>
                    <TableCell>{format(new Date(quote.data), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>R$ {quote.valor_final.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[quote.status]}>{quote.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/orcamentos/${quote.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {quote.status !== 'aprovado' && quote.status !== 'perdido' && (
                        <Button size="sm" onClick={() => handleConvertToOS(quote)}>
                          Converter em OS <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Orçamento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_fantasia}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Prazo (dias)</Label>
                  <Input type="number" value={prazo} onChange={(e) => setPrazo(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Desconto (%)</Label>
                  <Input type="number" value={desconto} onChange={(e) => setDesconto(Number(e.target.value))} />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">Itens</h4>
                <Button size="sm" variant="outline" onClick={handleAddItem}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
              </div>
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-end">
                  <div className="col-span-5">
                    <Select value={item.produto_acabado_id} onValueChange={(v) => handleItemChange(index, 'produto_acabado_id', v)}>
                      <SelectTrigger><SelectValue placeholder="Produto..." /></SelectTrigger>
                      <SelectContent>
                        {finishedProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input type="number" placeholder="Qtd" value={item.qtd_rolos || ''} onChange={(e) => handleItemChange(index, 'qtd_rolos', Number(e.target.value))} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" placeholder="Valor" value={item.valor_unit || ''} onChange={(e) => handleItemChange(index, 'valor_unit', Number(e.target.value))} />
                  </div>
                  <div className="col-span-2 text-right font-medium">
                    R$ {((item.valor_unit || 0) * (item.qtd_rolos || 0)).toFixed(2)}
                  </div>
                  <div className="col-span-1">
                    <Button size="icon" variant="ghost" onClick={() => handleRemoveItem(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
              <div className="text-right pt-3 border-t mt-3">
                <span className="text-lg font-bold">Total: R$ {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Criar Orçamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
