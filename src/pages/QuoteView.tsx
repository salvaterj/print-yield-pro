import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { YieldCalculator } from '@/components/YieldCalculator';
import { generateQuotePDF } from '@/lib/pdfGenerator';
import { 
  ArrowLeft, 
  FileText, 
  Printer, 
  ArrowRight, 
  Pencil,
  Calendar,
  User,
  Building2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { QuoteStatus, YieldSnapshot } from '@/types';
import { toast } from 'sonner';

const statusColors: Record<QuoteStatus, string> = {
  rascunho: 'bg-muted text-muted-foreground',
  enviado: 'bg-status-info/20 text-status-info',
  aprovado: 'bg-status-success/20 text-status-success',
  perdido: 'bg-status-error/20 text-status-error',
};

const statusLabels: Record<QuoteStatus, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  perdido: 'Perdido',
};

export default function QuoteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quotes, clients, finishedProducts, rawMaterials, updateQuote, addServiceOrder } = useApp();

  const quote = quotes.find(q => q.id === id);
  const client = clients.find(c => c.id === quote?.cliente_id);

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Orçamento não encontrado</p>
        <Button variant="outline" onClick={() => navigate('/orcamentos')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  const handlePrint = () => {
    generateQuotePDF(quote, client);
  };

  const handleUpdateItemYield = (itemId: string, bobinaId: string, snapshot: YieldSnapshot) => {
    const updatedItens = quote.itens.map(item => 
      item.id === itemId 
        ? { ...item, bobina_id: bobinaId, yield_snapshot: snapshot }
        : item
    );
    updateQuote(quote.id, { itens: updatedItens });
  };

  const handleConvertToOS = () => {
    const firstItem = quote.itens[0];
    const product = finishedProducts.find(p => p.id === firstItem?.produto_acabado_id);
    const bobina = rawMaterials.find(b => b.id === firstItem?.bobina_id);

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
      material: product ? `${product.material_requerido} ${product.cor_base} ${product.acabamento}` : '',
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
      bobina_reservada_id: firstItem?.bobina_id,
      usar_caixa: '',
      yield_snapshot: firstItem?.yield_snapshot,
      observacoes_producao: `Convertido do orçamento ${quote.numero}`,
      status_producao: 'criado' as const,
      qualidade_ok: false,
      logs: [{ 
        id: `log-${Date.now()}`, 
        timestamp: new Date().toISOString(), 
        usuario: 'Sistema', 
        acao: 'OS Criada', 
        detalhes: `Convertida do orçamento ${quote.numero}` 
      }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addServiceOrder(newOS);
    updateQuote(quote.id, { status: 'aprovado' });
    toast.success('Orçamento convertido em OS!');
    navigate(`/os/${newOS.id}`);
  };

  const subtotal = quote.itens.reduce((sum, item) => sum + item.valor_total, 0);
  const descontoValor = subtotal * (quote.desconto / 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/orcamentos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6" />
                {quote.numero}
              </h1>
              <Badge className={statusColors[quote.status]}>
                {statusLabels[quote.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">{client?.nome_fantasia}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Gerar PDF
          </Button>
          {quote.status !== 'aprovado' && quote.status !== 'perdido' && (
            <Button onClick={handleConvertToOS}>
              Converter em OS
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{client?.nome_fantasia}</p>
                <p className="text-sm text-muted-foreground">{client?.cnpj}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Vendedor</p>
                <p className="font-medium">{quote.vendedor_nome}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Data / Prazo</p>
                <p className="font-medium">{format(parseISO(quote.data), 'dd/MM/yyyy')}</p>
                <p className="text-sm text-muted-foreground">{quote.prazo_entrega_dias} dias para entrega</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Orçamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {quote.itens.map((item, index) => {
            const product = finishedProducts.find(p => p.id === item.produto_acabado_id);
            return (
              <div key={item.id} className="space-y-4">
                {index > 0 && <Separator />}
                
                <div className="grid md:grid-cols-5 gap-4 items-end">
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Produto</p>
                    <p className="font-medium">{item.descricao}</p>
                    {product && (
                      <p className="text-xs text-muted-foreground">
                        {product.largura_mm}x{product.altura_mm}mm | {product.metragem_por_rolo_m}m/rolo
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantidade</p>
                    <p className="font-medium">{item.qtd_rolos} rolos</p>
                    <p className="text-xs text-muted-foreground">{item.metragem_total_m}m total</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Unitário</p>
                    <p className="font-medium">R$ {item.valor_unit.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Subtotal</p>
                    <p className="font-bold text-lg">R$ {item.valor_total.toFixed(2)}</p>
                  </div>
                </div>

                {/* Yield Calculator for this item */}
                <YieldCalculator
                  bobinas={rawMaterials}
                  produtos={finishedProducts}
                  selectedBobinaId={item.bobina_id}
                  selectedProdutoId={item.produto_acabado_id}
                  quantidadeRolos={item.qtd_rolos}
                  onBobinaChange={(bobinaId) => {
                    // Update bobina for this item - will trigger yield calculation
                    const updatedItens = quote.itens.map(i => 
                      i.id === item.id ? { ...i, bobina_id: bobinaId } : i
                    );
                    updateQuote(quote.id, { itens: updatedItens });
                  }}
                  onYieldCalculated={(snapshot) => handleUpdateItemYield(item.id, item.bobina_id || '', snapshot)}
                  existingSnapshot={item.yield_snapshot}
                  compact
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-end gap-2">
            <div className="flex justify-between w-64">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            {quote.desconto > 0 && (
              <div className="flex justify-between w-64 text-status-success">
                <span>Desconto ({quote.desconto}%):</span>
                <span>- R$ {descontoValor.toFixed(2)}</span>
              </div>
            )}
            <Separator className="w-64" />
            <div className="flex justify-between w-64">
              <span className="font-bold text-lg">Total:</span>
              <span className="font-bold text-lg text-primary">R$ {quote.valor_final.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observations */}
      {quote.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{quote.observacoes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
