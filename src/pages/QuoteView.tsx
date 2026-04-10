import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, ArrowLeft, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

export default function QuoteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    companies,
    carriers,
    salespeople,
    quotes,
    quoteItems,
    finishedProducts,
    rawProducts,
    addWorkOrder,
    addWorkOrderItem,
  } = useApp();

  const quote = useMemo(() => quotes.find((q) => q.id === id), [quotes, id]);
  const items = useMemo(() => quoteItems.filter((qi) => qi.quote_id === id), [quoteItems, id]);

  const company = useMemo(() => companies.find((c) => c.id === quote?.company_id), [companies, quote?.company_id]);
  const carrier = useMemo(() => carriers.find((c) => c.id === quote?.carrier_id), [carriers, quote?.carrier_id]);
  const salesperson = useMemo(() => salespeople.find((s) => s.id === quote?.salesperson_id), [salespeople, quote?.salesperson_id]);

  const total = useMemo(() => items.reduce((sum, it) => sum + (it.total_price || 0), 0), [items]);

  const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    canceled: 'Cancelado',
  };

  const handleConvertToWorkOrder = async () => {
    if (!quote) return;
    try {
      const created = await addWorkOrder({
        os_number: `OS-${Date.now()}`,
        quote_id: quote.id,
        company_id: quote.company_id,
        salesperson_id: quote.salesperson_id,
        carrier_id: quote.carrier_id,
        status: 'pending',
        workflow_stage: 'a_fazer',
        issue_date: quote.issue_date,
        deadline: quote.valid_until,
        production_notes: '',
        internal_notes: '',
      });

      for (const it of items) {
        await addWorkOrderItem({
          work_order_id: created.id,
          finished_product_id: it.finished_product_id,
          raw_product_id: it.raw_product_id,
          description: it.description,
          quantity: it.quantity,
          width_mm: it.width_mm,
          height_mm: it.height_mm,
          units_per_row: it.units_per_row,
          units_per_meter: it.units_per_meter,
          material_used_meters: it.material_used_meters,
          waste_meters: it.waste_meters,
          setup_notes: '',
          technical_notes: it.technical_notes,
        });
      }

      toast.success('OS criada a partir do orçamento');
      navigate(`/os/${created.id}`);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao converter em OS');
    }
  };

  const getFinishedProductLabel = (id: string | null) => {
    if (!id) return '-';
    const fp = finishedProducts.find((x) => x.id === id);
    return fp ? (fp.code ? `${fp.code} - ${fp.name}` : fp.name) : '-';
  };

  const getRawProductLabel = (id: string | null) => {
    if (!id) return '-';
    const rp = rawProducts.find((x) => x.id === id);
    return rp ? (rp.code ? `${rp.code} - ${rp.name}` : rp.name) : '-';
  };

  if (!quote) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline">
          <Link to="/orcamentos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Orçamento não encontrado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link to="/orcamentos">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              {quote.quote_number}
            </h1>
            <p className="text-sm text-muted-foreground">Cliente: {company?.trade_name}</p>
          </div>
          <Badge variant="outline">{statusLabels[quote.status] || quote.status}</Badge>
        </div>

        <Button onClick={handleConvertToWorkOrder}>
          <ClipboardList className="h-4 w-4 mr-2" />
          Converter em OS
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6 space-y-2">
            <p className="text-sm text-muted-foreground">Empresa</p>
            <p className="font-medium">{company?.name}</p>
            <p className="text-sm text-muted-foreground">CNPJ</p>
            <p className="font-medium">{company?.cnpj || '-'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-2">
            <p className="text-sm text-muted-foreground">Emissão</p>
            <p className="font-medium">{quote.issue_date}</p>
            <p className="text-sm text-muted-foreground">Validade</p>
            <p className="font-medium">{quote.valid_until}</p>
            <p className="text-sm text-muted-foreground">Vendedor</p>
            <p className="font-medium">{salesperson?.name || '-'}</p>
            <p className="text-sm text-muted-foreground">Transportadora</p>
            <p className="font-medium">{carrier?.name || '-'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">Itens</p>
              <p className="text-sm text-muted-foreground">{items.length} item(ns)</p>
            </div>
            <p className="font-medium">Total: R$ {total.toFixed(2)}</p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Bobina</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum item no orçamento
                  </TableCell>
                </TableRow>
              ) : (
                items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium">{getFinishedProductLabel(it.finished_product_id)}</TableCell>
                    <TableCell>{getRawProductLabel(it.raw_product_id)}</TableCell>
                    <TableCell className="text-right">{it.quantity}</TableCell>
                    <TableCell className="text-right">R$ {it.sale_price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">R$ {it.total_price.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {quote.notes ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Observações</p>
            <p className="font-medium whitespace-pre-line">{quote.notes}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
