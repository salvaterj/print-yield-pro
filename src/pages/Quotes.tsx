import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Quote, QuoteItem, QuoteStatus } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, FileText, Eye } from 'lucide-react';
import { toast } from 'sonner';

const quoteStatusOptions: Array<{ value: QuoteStatus; label: string }> = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Rejeitado' },
  { value: 'canceled', label: 'Cancelado' },
];

const emptyQuote: Omit<Quote, 'id' | 'created_at' | 'updated_at'> = {
  quote_number: '',
  company_id: '',
  salesperson_id: '',
  carrier_id: null,
  status: 'draft',
  issue_date: new Date().toISOString().slice(0, 10),
  valid_until: new Date().toISOString().slice(0, 10),
  notes: '',
};

const emptyQuoteItem: Omit<QuoteItem, 'id' | 'created_at' | 'updated_at'> = {
  quote_id: '',
  finished_product_id: null,
  raw_product_id: null,
  description: '',
  quantity: 0,
  width_mm: 0,
  height_mm: 0,
  units_per_row: 0,
  units_per_meter: 0,
  material_used_meters: 0,
  waste_meters: 0,
  total_cost: 0,
  unit_cost: 0,
  sale_price: 0,
  total_price: 0,
  profit_margin: 0,
  technical_notes: '',
};

export default function Quotes() {
  const {
    systemSettings,
    companies,
    carriers,
    salespeople,
    finishedProducts,
    rawProducts,
    quotes,
    quoteItems,
    addQuote,
    updateQuote,
    deleteQuote,
    addQuoteItem,
    updateQuoteItem,
    deleteQuoteItem,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QuoteStatus>('all');
  const [companyFilter, setCompanyFilter] = useState<'all' | string>('all');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<Quote | null>(null);
  const [formData, setFormData] = useState(emptyQuote);

  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null);
  const [itemFormData, setItemFormData] = useState(emptyQuoteItem);

  const companyOptions = useMemo(() => companies.filter((c) => c.active), [companies]);
  const carrierOptions = useMemo(() => carriers.filter((c) => c.active), [carriers]);
  const salespersonOptions = useMemo(() => salespeople.filter((s) => s.active), [salespeople]);
  const finishedProductOptions = useMemo(() => finishedProducts.filter((fp) => fp.active), [finishedProducts]);
  const rawProductOptions = useMemo(() => rawProducts.filter((rp) => rp.active), [rawProducts]);

  const getCompanyLabel = (id: string) => {
    const c = companies.find((x) => x.id === id);
    if (!c) return '';
    return c.code ? `${c.code} - ${c.trade_name}` : c.trade_name;
  };

  const getSalespersonLabel = (id: string) => {
    if (!id) return '-';
    const s = salespeople.find((x) => x.id === id);
    if (!s) return '-';
    return s.code ? `${s.code} - ${s.name}` : s.name;
  };

  const getCarrierLabel = (id: string | null) => {
    if (!id) return '-';
    const c = carriers.find((x) => x.id === id);
    if (!c) return '-';
    return c.code ? `${c.code} - ${c.name}` : c.name;
  };

  const getFinishedProductLabel = (id: string | null) => {
    if (!id) return '-';
    const fp = finishedProducts.find((x) => x.id === id);
    if (!fp) return '-';
    return fp.code ? `${fp.code} - ${fp.name}` : fp.name;
  };

  const getRawProductLabel = (id: string | null) => {
    if (!id) return '-';
    const rp = rawProducts.find((x) => x.id === id);
    if (!rp) return '-';
    return rp.code ? `${rp.code} - ${rp.name}` : rp.name;
  };

  const getStatusLabel = (status: QuoteStatus) => quoteStatusOptions.find((o) => o.value === status)?.label || status;

  const quoteTotal = (quoteId: string) =>
    quoteItems
      .filter((qi) => qi.quote_id === quoteId)
      .reduce((sum, qi) => sum + (qi.total_price || 0), 0);

  const filteredQuotes = quotes.filter((q) => {
    const company = companies.find((c) => c.id === q.company_id);
    const matchesSearch =
      (q.quote_number?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (company?.trade_name?.toLowerCase() || '').includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    const matchesCompany = companyFilter === 'all' || q.company_id === companyFilter;
    return matchesSearch && matchesStatus && matchesCompany;
  });

  const handleOpenDialog = (quote?: Quote) => {
    if (quote) {
      setEditingQuote(quote);
      setFormData({
        quote_number: quote.quote_number,
        company_id: quote.company_id,
        salesperson_id: quote.salesperson_id || '',
        carrier_id: quote.carrier_id,
        status: quote.status,
        issue_date: quote.issue_date,
        valid_until: quote.valid_until,
        notes: quote.notes,
      });
    } else {
      const issue = new Date().toISOString().slice(0, 10);
      const validDays = systemSettings.default_quote_validity_days || 0;
      const validUntil = validDays
        ? new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        : issue;
      setEditingQuote(null);
      setFormData({ ...emptyQuote, issue_date: issue, valid_until: validUntil });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.company_id) {
      toast.error('Selecione o cliente');
      return;
    }

    if (!formData.salesperson_id) {
      toast.error('Selecione o vendedor');
      return;
    }

    try {
      if (editingQuote) {
        await updateQuote(editingQuote.id, formData);
        toast.success('Orçamento atualizado!');
        setIsDialogOpen(false);
        return;
      }

      const quoteNumber = formData.quote_number?.trim() || `Q-${Date.now()}`;
      const created = await addQuote({ ...formData, quote_number: quoteNumber });
      setEditingQuote(created);
      toast.success('Orçamento criado! Agora adicione os itens.');
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao salvar orçamento');
    }
  };

  const handleDelete = async () => {
    if (!deletingQuote) return;
    try {
      await deleteQuote(deletingQuote.id);
      toast.success('Orçamento excluído!');
      setIsDeleteDialogOpen(false);
      setDeletingQuote(null);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao excluir orçamento');
    }
  };

  const quoteItemsForEditing = editingQuote ? quoteItems.filter((qi) => qi.quote_id === editingQuote.id) : [];

  const handleOpenItemDialog = (item?: QuoteItem) => {
    if (!editingQuote) {
      toast.error('Salve o orçamento antes de adicionar itens');
      return;
    }

    if (item) {
      setEditingItem(item);
      setItemFormData({
        quote_id: item.quote_id,
        finished_product_id: item.finished_product_id,
        raw_product_id: item.raw_product_id,
        description: item.description || '',
        quantity: item.quantity || 0,
        width_mm: item.width_mm || 0,
        height_mm: item.height_mm || 0,
        units_per_row: item.units_per_row || 0,
        units_per_meter: item.units_per_meter || 0,
        material_used_meters: item.material_used_meters || 0,
        waste_meters: item.waste_meters || 0,
        total_cost: item.total_cost || 0,
        unit_cost: item.unit_cost || 0,
        sale_price: item.sale_price || 0,
        total_price: item.total_price || 0,
        profit_margin: item.profit_margin || 0,
        technical_notes: item.technical_notes || '',
      });
    } else {
      setEditingItem(null);
      setItemFormData({ ...emptyQuoteItem, quote_id: editingQuote.id });
    }
    setIsItemDialogOpen(true);
  };

  const syncTotalPrice = (next: typeof itemFormData) => {
    const total = (next.quantity || 0) * (next.sale_price || 0);
    return { ...next, total_price: Number.isFinite(total) ? total : 0 };
  };

  const handleSaveItem = async () => {
    if (!editingQuote) return;

    try {
      if (editingItem) {
        await updateQuoteItem(editingItem.id, itemFormData);
        toast.success('Item atualizado!');
      } else {
        await addQuoteItem(itemFormData);
        toast.success('Item adicionado!');
      }
      setIsItemDialogOpen(false);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao salvar item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteQuoteItem(id);
      toast.success('Item removido!');
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao remover item');
    }
  };

  const badgeVariant = (status: QuoteStatus) => {
    if (status === 'approved') return 'default';
    if (status === 'rejected') return 'destructive';
    if (status === 'canceled') return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Orçamentos
          </h1>
          <p className="text-muted-foreground">Crie e gerencie orçamentos</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-[220px]">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {quoteStatusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[260px]">
              <Select value={companyFilter} onValueChange={(v) => setCompanyFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {companyOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {getCompanyLabel(c.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">{filteredQuotes.length} orçamento(s)</p>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum orçamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((q) => {
                  const company = companies.find((c) => c.id === q.company_id);
                  return (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium">{q.quote_number}</TableCell>
                      <TableCell>{company?.trade_name}</TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant(q.status)}>{getStatusLabel(q.status)}</Badge>
                      </TableCell>
                      <TableCell>{q.issue_date || '-'}</TableCell>
                      <TableCell>{q.valid_until || '-'}</TableCell>
                      <TableCell className="text-right">R$ {quoteTotal(q.id).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon">
                          <Link to={`/orcamentos/${q.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(q)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingQuote(q);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuote ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quote_number">Número do orçamento</Label>
                <Input
                  id="quote_number"
                  value={formData.quote_number}
                  onChange={(e) => setFormData({ ...formData, quote_number: e.target.value })}
                  placeholder="Ex: ORC-0001"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as QuoteStatus })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {quoteStatusOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={formData.company_id || 'none'} onValueChange={(v) => {
                  const companyId = v === 'none' ? '' : v;
                  const company = companies.find(c => c.id === companyId);
                  setFormData({ 
                    ...formData, 
                    company_id: companyId,
                    salesperson_id: company?.salesperson_id || formData.salesperson_id
                  });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione...</SelectItem>
                    {companyOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {getCompanyLabel(c.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Vendedor *</Label>
                <Select
                  value={formData.salesperson_id || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, salesperson_id: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione...</SelectItem>
                    {salespersonOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {getSalespersonLabel(s.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transportadora</Label>
                <Select value={formData.carrier_id || 'none'} onValueChange={(v) => setFormData({ ...formData, carrier_id: v === 'none' ? null : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {carrierOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {getCarrierLabel(c.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue_date">Data de emissão</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_until">Validade</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
            </div>

            {editingQuote && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Itens do orçamento</p>
                    <p className="text-sm text-muted-foreground">Campos calculados também são preenchidos manualmente nesta fase.</p>
                  </div>
                  <Button onClick={() => handleOpenItemDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar item
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Bobina</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quoteItemsForEditing.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          Nenhum item adicionado
                        </TableCell>
                      </TableRow>
                    ) : (
                      quoteItemsForEditing.map((qi) => (
                        <TableRow key={qi.id}>
                          <TableCell>{getFinishedProductLabel(qi.finished_product_id)}</TableCell>
                          <TableCell>{getRawProductLabel(qi.raw_product_id)}</TableCell>
                          <TableCell className="text-right">{qi.quantity}</TableCell>
                          <TableCell className="text-right">R$ {qi.sale_price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">R$ {qi.total_price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenItemDialog(qi)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(qi.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>{editingQuote ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar item' : 'Novo item'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Produto acabado</Label>
                <Select
                  value={itemFormData.finished_product_id || 'none'}
                  onValueChange={(v) => setItemFormData(syncTotalPrice({ ...itemFormData, finished_product_id: v === 'none' ? null : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {finishedProductOptions.map((fp) => (
                      <SelectItem key={fp.id} value={fp.id}>
                        {getFinishedProductLabel(fp.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bobina / matéria-prima</Label>
                <Select
                  value={itemFormData.raw_product_id || 'none'}
                  onValueChange={(v) => setItemFormData(syncTotalPrice({ ...itemFormData, raw_product_id: v === 'none' ? null : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {rawProductOptions.map((rp) => (
                      <SelectItem key={rp.id} value={rp.id}>
                        {getRawProductLabel(rp.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={itemFormData.description}
                onChange={(e) => setItemFormData(syncTotalPrice({ ...itemFormData, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="1"
                  value={itemFormData.quantity}
                  onChange={(e) => setItemFormData(syncTotalPrice({ ...itemFormData, quantity: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale_price">Preço de venda</Label>
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  value={itemFormData.sale_price}
                  onChange={(e) => setItemFormData(syncTotalPrice({ ...itemFormData, sale_price: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_price">Total (salvo)</Label>
                <Input
                  id="total_price"
                  type="number"
                  step="0.01"
                  value={itemFormData.total_price}
                  onChange={(e) => setItemFormData({ ...itemFormData, total_price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profit_margin">Margem</Label>
                <Input
                  id="profit_margin"
                  type="number"
                  step="0.01"
                  value={itemFormData.profit_margin}
                  onChange={(e) => setItemFormData({ ...itemFormData, profit_margin: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width_mm">Largura (mm)</Label>
                <Input
                  id="width_mm"
                  type="number"
                  step="0.01"
                  value={itemFormData.width_mm}
                  onChange={(e) => setItemFormData({ ...itemFormData, width_mm: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height_mm">Altura (mm)</Label>
                <Input
                  id="height_mm"
                  type="number"
                  step="0.01"
                  value={itemFormData.height_mm}
                  onChange={(e) => setItemFormData({ ...itemFormData, height_mm: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="units_per_row">Qtd por carreira</Label>
                <Input
                  id="units_per_row"
                  type="number"
                  step="1"
                  value={itemFormData.units_per_row}
                  onChange={(e) => setItemFormData({ ...itemFormData, units_per_row: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="units_per_meter">Qtd por metro</Label>
                <Input
                  id="units_per_meter"
                  type="number"
                  step="0.01"
                  value={itemFormData.units_per_meter}
                  onChange={(e) => setItemFormData({ ...itemFormData, units_per_meter: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material_used_meters">Consumo (m)</Label>
                <Input
                  id="material_used_meters"
                  type="number"
                  step="0.01"
                  value={itemFormData.material_used_meters}
                  onChange={(e) => setItemFormData({ ...itemFormData, material_used_meters: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waste_meters">Perda (m)</Label>
                <Input
                  id="waste_meters"
                  type="number"
                  step="0.01"
                  value={itemFormData.waste_meters}
                  onChange={(e) => setItemFormData({ ...itemFormData, waste_meters: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_cost">Custo total</Label>
                <Input
                  id="total_cost"
                  type="number"
                  step="0.01"
                  value={itemFormData.total_cost}
                  onChange={(e) => setItemFormData({ ...itemFormData, total_cost: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_cost">Custo unitário</Label>
                <Input
                  id="unit_cost"
                  type="number"
                  step="0.01"
                  value={itemFormData.unit_cost}
                  onChange={(e) => setItemFormData({ ...itemFormData, unit_cost: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="technical_notes">Observações técnicas</Label>
              <Textarea
                id="technical_notes"
                value={itemFormData.technical_notes}
                onChange={(e) => setItemFormData({ ...itemFormData, technical_notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveItem}>{editingItem ? 'Salvar' : 'Adicionar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o orçamento "{deletingQuote?.quote_number}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
