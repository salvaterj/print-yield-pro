import { useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { FinishedProduct } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search, PackageSearch } from 'lucide-react';
import { toast } from 'sonner';

const productTypeOptions: Array<{ value: FinishedProduct['product_type']; label: string }> = [
  { value: 'label', label: 'Etiqueta' },
  { value: 'card', label: 'Cartão' },
  { value: 'tag', label: 'Tag' },
  { value: 'sticker', label: 'Adesivo' },
  { value: 'custom', label: 'Personalizado' },
];

const emptyFinishedProduct: Omit<FinishedProduct, 'id' | 'created_at' | 'updated_at'> = {
  code: '',
  name: '',
  product_type: 'label',
  width_mm: 0,
  height_mm: 0,
  units_per_row: 0,
  units_per_meter: 0,
  requires_specific_raw_material: false,
  default_raw_product_id: null,
  base_price: 0,
  minimum_quantity: 0,
  notes: '',
  active: true,
};

export default function FinishedProducts() {
  const { finishedProducts, rawProducts, addFinishedProduct, updateFinishedProduct, deleteFinishedProduct } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | FinishedProduct['product_type']>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinishedProduct | null>(null);
  const [deletingItem, setDeletingItem] = useState<FinishedProduct | null>(null);
  const [formData, setFormData] = useState(emptyFinishedProduct);

  const rawProductOptions = useMemo(() => rawProducts.filter((rp) => rp.active), [rawProducts]);

  const filtered = finishedProducts.filter((fp) => {
    const matchesSearch =
      (fp.code?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (fp.name?.toLowerCase() || '').includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || fp.product_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleOpenDialog = (item?: FinishedProduct) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        code: item.code || '',
        name: item.name || '',
        product_type: item.product_type,
        width_mm: item.width_mm || 0,
        height_mm: item.height_mm || 0,
        units_per_row: item.units_per_row || 0,
        units_per_meter: item.units_per_meter || 0,
        requires_specific_raw_material: item.requires_specific_raw_material ?? false,
        default_raw_product_id: item.default_raw_product_id ?? null,
        base_price: item.base_price || 0,
        minimum_quantity: item.minimum_quantity || 0,
        notes: item.notes || '',
        active: item.active ?? true,
      });
    } else {
      setEditingItem(null);
      setFormData(emptyFinishedProduct);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Preencha o nome do produto');
      return;
    }

    if (formData.requires_specific_raw_material && !formData.default_raw_product_id) {
      toast.error('Selecione a bobina padrão');
      return;
    }

    try {
      if (editingItem) {
        await updateFinishedProduct(editingItem.id, formData);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await addFinishedProduct(formData);
        toast.success('Produto cadastrado com sucesso!');
      }
      setIsDialogOpen(false);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao salvar produto');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteFinishedProduct(deletingItem.id);
      toast.success('Produto excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao excluir produto');
    }
  };

  const getRawProductLabel = (id: string) => {
    const rp = rawProducts.find((x) => x.id === id);
    if (!rp) return '';
    return rp.code ? `${rp.code} - ${rp.name}` : rp.name;
  };

  const getProductTypeLabel = (value: FinishedProduct['product_type']) => {
    const opt = productTypeOptions.find((o) => o.value === value);
    return opt?.label || value;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <PackageSearch className="h-6 w-6" />
            Produtos
          </h1>
          <p className="text-muted-foreground">Cadastro de produtos acabados</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-[220px]">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {productTypeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">{filtered.length} produto(s)</p>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Largura (mm)</TableHead>
                <TableHead className="text-right">Altura (mm)</TableHead>
                <TableHead className="text-right">Preço base</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((fp) => (
                  <TableRow key={fp.id}>
                    <TableCell>{fp.code}</TableCell>
                    <TableCell className="font-medium">{fp.name}</TableCell>
                    <TableCell>{getProductTypeLabel(fp.product_type)}</TableCell>
                    <TableCell className="text-right">{fp.width_mm}</TableCell>
                    <TableCell className="text-right">{fp.height_mm}</TableCell>
                    <TableCell className="text-right">R$ {fp.base_price.toFixed(2)}</TableCell>
                    <TableCell>{fp.active ? 'Ativo' : 'Inativo'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(fp)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingItem(fp);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código interno</Label>
                <Input id="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de produto</Label>
                <Select value={formData.product_type} onValueChange={(v) => setFormData({ ...formData, product_type: v as FinishedProduct['product_type'] })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-8">
                <Switch checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: checked })} />
                <Label>Ativo</Label>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width_mm">Largura (mm)</Label>
                <Input
                  id="width_mm"
                  type="number"
                  step="0.01"
                  value={formData.width_mm}
                  onChange={(e) => setFormData({ ...formData, width_mm: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height_mm">Altura (mm)</Label>
                <Input
                  id="height_mm"
                  type="number"
                  step="0.01"
                  value={formData.height_mm}
                  onChange={(e) => setFormData({ ...formData, height_mm: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="units_per_row">Unidades por carreira</Label>
                <Input
                  id="units_per_row"
                  type="number"
                  step="1"
                  value={formData.units_per_row}
                  onChange={(e) => setFormData({ ...formData, units_per_row: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="units_per_meter">Unidades por metro</Label>
                <Input
                  id="units_per_meter"
                  type="number"
                  step="0.01"
                  value={formData.units_per_meter}
                  onChange={(e) => setFormData({ ...formData, units_per_meter: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_price">Preço base</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimum_quantity">Quantidade mínima</Label>
                <Input
                  id="minimum_quantity"
                  type="number"
                  step="1"
                  value={formData.minimum_quantity}
                  onChange={(e) => setFormData({ ...formData, minimum_quantity: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <Switch
                  checked={formData.requires_specific_raw_material}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_specific_raw_material: checked })}
                />
                <Label>Exige matéria-prima específica</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bobina padrão</Label>
              <Select
                value={formData.default_raw_product_id || 'none'}
                onValueChange={(v) => setFormData({ ...formData, default_raw_product_id: v === 'none' ? null : v })}
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

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>{editingItem ? 'Salvar' : 'Cadastrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{deletingItem?.name}"?
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
