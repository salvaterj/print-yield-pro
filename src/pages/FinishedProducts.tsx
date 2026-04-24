import { useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { FinishedProduct } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { formatBRL, formatM2, formatMM, formatNumberBR, formatPercentBR } from '@/lib/utils';
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
  unit_area_m2: 0,
  material_unit_cost_no_ipi: 0,
  material_unit_cost_with_ipi: 0,
  waste_percentage: 0,
  margin_percentage: 0,
  icms_percentage: 0,
  price_pre_icms: 0,
  suggested_price: 0,
  profit_per_unit: 0,
  image_url: null,
  requires_custom_image: false,
  pantone_1: null,
  pantone_2: null,
  pantone_3: null,
  pantone_1_hex: null,
  pantone_2_hex: null,
  pantone_3_hex: null,
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [wasteTouched, setWasteTouched] = useState(false);

  const rawProductOptions = useMemo(() => rawProducts.filter((rp) => rp.active), [rawProducts]);
  const selectedRaw = useMemo(() => {
    if (!formData.default_raw_product_id) return null;
    return rawProducts.find((rp) => rp.id === formData.default_raw_product_id) ?? null;
  }, [rawProducts, formData.default_raw_product_id]);

  const calc = useMemo(() => {
    const widthMm = Number(formData.width_mm) || 0;
    const heightMm = Number(formData.height_mm) || 0;
    const unitsPerMeter = Number(formData.units_per_meter) || 0;

    const usableWidthMm = Number(selectedRaw?.usable_width_mm) || 0;
    const usableWidthM = usableWidthMm / 1000;

    const costPerM2NoIpi = Number(selectedRaw?.cost_per_m2_no_ipi) || 0;
    const costPerM2WithIpi = Number(selectedRaw?.cost_per_m2_with_ipi) || 0;

    const bobinaCostPerMeterNoIpi = costPerM2NoIpi * usableWidthM;
    const bobinaCostPerMeterWithIpi = costPerM2WithIpi * usableWidthM;

    const unitAreaM2 = (widthMm > 0 && heightMm > 0) ? (widthMm * heightMm) / 1000000 : 0;

    const useYield = unitsPerMeter > 0 && bobinaCostPerMeterWithIpi > 0;
    const method = useYield ? 'aproveitamento' : 'area';

    const materialUnitNoIpi = useYield
      ? bobinaCostPerMeterNoIpi / unitsPerMeter
      : unitAreaM2 * costPerM2NoIpi;
    const materialUnitWithIpi = useYield
      ? bobinaCostPerMeterWithIpi / unitsPerMeter
      : unitAreaM2 * costPerM2WithIpi;

    const ipiApplied = materialUnitWithIpi - materialUnitNoIpi;

    const wastePct = Number(formData.waste_percentage) || 0;
    const marginPct = Number(formData.margin_percentage) || 0;
    const icmsPct = Number(formData.icms_percentage) || 0;

    const costWithWaste = materialUnitWithIpi * (1 + wastePct / 100);
    const denomMargin = 1 - marginPct / 100;
    const pricePreIcms = denomMargin > 0 ? costWithWaste / denomMargin : 0;
    const denomIcms = 1 - icmsPct / 100;
    const salePrice = denomIcms > 0 ? pricePreIcms / denomIcms : 0;
    const profitPerUnit = pricePreIcms - costWithWaste;
    const icmsValue = salePrice - pricePreIcms;
    const marginValue = pricePreIcms - costWithWaste;

    return {
      method,
      unitAreaM2,
      usableWidthMm,
      bobinaCostPerMeterNoIpi,
      bobinaCostPerMeterWithIpi,
      materialUnitNoIpi,
      materialUnitWithIpi,
      ipiApplied,
      costWithWaste,
      pricePreIcms,
      salePrice,
      profitPerUnit,
      icmsValue,
      marginValue,
      invalidMargin: denomMargin <= 0,
      invalidIcms: denomIcms <= 0,
    };
  }, [
    formData.width_mm,
    formData.height_mm,
    formData.units_per_meter,
    formData.waste_percentage,
    formData.margin_percentage,
    formData.icms_percentage,
    selectedRaw,
  ]);

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
      setWasteTouched(true);
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
        unit_area_m2: item.unit_area_m2 || 0,
        material_unit_cost_no_ipi: item.material_unit_cost_no_ipi || 0,
        material_unit_cost_with_ipi: item.material_unit_cost_with_ipi || 0,
        waste_percentage: item.waste_percentage || 0,
        margin_percentage: item.margin_percentage || 0,
        icms_percentage: item.icms_percentage || 0,
        price_pre_icms: item.price_pre_icms || 0,
        suggested_price: item.suggested_price || 0,
        profit_per_unit: item.profit_per_unit || 0,
        image_url: item.image_url ?? null,
        requires_custom_image: item.requires_custom_image ?? false,
        pantone_1: item.pantone_1 ?? null,
        pantone_2: item.pantone_2 ?? null,
        pantone_3: item.pantone_3 ?? null,
        pantone_1_hex: item.pantone_1_hex ?? null,
        pantone_2_hex: item.pantone_2_hex ?? null,
        pantone_3_hex: item.pantone_3_hex ?? null,
        notes: item.notes || '',
        active: item.active ?? true,
      });
    } else {
      setEditingItem(null);
      setWasteTouched(false);
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

    const payload: typeof formData = {
      ...formData,
      unit_area_m2: calc.unitAreaM2,
      material_unit_cost_no_ipi: calc.materialUnitNoIpi,
      material_unit_cost_with_ipi: calc.materialUnitWithIpi,
      price_pre_icms: calc.pricePreIcms,
      suggested_price: calc.salePrice,
      profit_per_unit: calc.profitPerUnit,
    };

    try {
      if (editingItem) {
        await updateFinishedProduct(editingItem.id, payload);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await addFinishedProduct(payload);
        toast.success('Produto cadastrado com sucesso!');
      }
      setIsDialogOpen(false);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao salvar produto');
    }
  };

  const handleUploadImage = async (file: File) => {
    if (!supabase) {
      toast.error('Supabase não está configurado');
      return;
    }

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `products/${globalThis.crypto?.randomUUID?.() || Date.now()}.${ext}`;

    setUploadingImage(true);
    try {
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      setFormData((prev) => ({ ...prev, image_url: data.publicUrl }));
      toast.success('Imagem enviada!');
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao enviar imagem');
    } finally {
      setUploadingImage(false);
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
                    <TableCell className="text-right">{formatBRL(fp.base_price, 2)}</TableCell>
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

            {formData.product_type === 'custom' && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.requires_custom_image}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_custom_image: checked })}
                />
                <Label>Exige foto personalizada durante orçamento/produção</Label>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Foto do produto</Label>
                <Input
                  type="file"
                  accept="image/*"
                  disabled={uploadingImage}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleUploadImage(f);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="h-24 w-24 rounded border bg-muted flex items-center justify-center overflow-hidden">
                  {formData.image_url ? (
                    <img src={formData.image_url} alt="Produto" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Sem imagem</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pantone_1">Pantone 1</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pantone_1"
                    value={formData.pantone_1 || ''}
                    onChange={(e) => setFormData({ ...formData, pantone_1: e.target.value || null })}
                  />
                  <Input
                    type="color"
                    value={formData.pantone_1_hex || '#000000'}
                    onChange={(e) => setFormData({ ...formData, pantone_1_hex: e.target.value || null })}
                    className="h-10 w-12 p-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pantone_2">Pantone 2</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pantone_2"
                    value={formData.pantone_2 || ''}
                    onChange={(e) => setFormData({ ...formData, pantone_2: e.target.value || null })}
                  />
                  <Input
                    type="color"
                    value={formData.pantone_2_hex || '#000000'}
                    onChange={(e) => setFormData({ ...formData, pantone_2_hex: e.target.value || null })}
                    className="h-10 w-12 p-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pantone_3">Pantone 3 (Chapado)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pantone_3"
                    value={formData.pantone_3 || ''}
                    onChange={(e) => setFormData({ ...formData, pantone_3: e.target.value || null })}
                  />
                  <Input
                    type="color"
                    value={formData.pantone_3_hex || '#000000'}
                    onChange={(e) => setFormData({ ...formData, pantone_3_hex: e.target.value || null })}
                    className="h-10 w-12 p-1"
                  />
                </div>
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
                onValueChange={(v) => {
                  const id = v === 'none' ? null : v;
                  const rp = rawProducts.find((x) => x.id === id) ?? null;
                  setFormData((prev) => ({
                    ...prev,
                    default_raw_product_id: id,
                    waste_percentage: wasteTouched ? prev.waste_percentage : (rp?.waste_percentage || 0),
                  }));
                }}
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fp_waste_percentage">Perda (%)</Label>
                <Input
                  id="fp_waste_percentage"
                  type="number"
                  step="0.01"
                  value={formData.waste_percentage}
                  onChange={(e) => {
                    setWasteTouched(true);
                    setFormData({ ...formData, waste_percentage: Number(e.target.value) });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fp_margin_percentage">Margem (%)</Label>
                <Input
                  id="fp_margin_percentage"
                  type="number"
                  step="0.01"
                  value={formData.margin_percentage}
                  onChange={(e) => setFormData({ ...formData, margin_percentage: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fp_icms_percentage">ICMS (%)</Label>
                <Input
                  id="fp_icms_percentage"
                  type="number"
                  step="0.01"
                  value={formData.icms_percentage}
                  onChange={(e) => setFormData({ ...formData, icms_percentage: Number(e.target.value) })}
                />
              </div>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="font-medium">Resumo do cálculo</div>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Bobina</div>
                  <div>{selectedRaw ? getRawProductLabel(selectedRaw.id) : '-'}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Largura útil</div>
                  <div>{selectedRaw ? formatMM(calc.usableWidthMm, 0) : '-'}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Custo por m² sem IPI</div>
                  <div>{selectedRaw ? formatBRL(selectedRaw.cost_per_m2_no_ipi || 0, 4) : '-'}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">IPI</div>
                  <div>{selectedRaw ? formatPercentBR(selectedRaw.ipi_percentage || 0, 2) : '-'}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Custo por m² com IPI</div>
                  <div>{selectedRaw ? formatBRL(selectedRaw.cost_per_m2_with_ipi || 0, 4) : '-'}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Área da etiqueta</div>
                  <div>{formatM2(calc.unitAreaM2, 8)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Método</div>
                  <div>{calc.method === 'aproveitamento' ? 'Aproveitamento (unidades/metro)' : 'Área (m²)'}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Unidades por metro</div>
                  <div>{Number(formData.units_per_meter) > 0 ? formatNumberBR(formData.units_per_meter, 0) : '-'}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Custo por metro da bobina (s/ IPI)</div>
                  <div>{formatBRL(calc.bobinaCostPerMeterNoIpi, 6)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Custo por metro da bobina (c/ IPI)</div>
                  <div>{formatBRL(calc.bobinaCostPerMeterWithIpi, 6)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Custo material sem IPI</div>
                  <div>{formatBRL(calc.materialUnitNoIpi, 6)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">IPI aplicado</div>
                  <div>{formatBRL(calc.ipiApplied, 6)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Custo material com IPI</div>
                  <div>{formatBRL(calc.materialUnitWithIpi, 6)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Custo unitário final</div>
                  <div>{formatBRL(calc.materialUnitWithIpi, 6)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Perda aplicada</div>
                  <div>{formatPercentBR(formData.waste_percentage, 2)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Custo com perda</div>
                  <div>{formatBRL(calc.costWithWaste, 6)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Margem</div>
                  <div>{formatPercentBR(formData.margin_percentage, 2)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Valor pré-ICMS</div>
                  <div>{formatBRL(calc.pricePreIcms, 2)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">ICMS</div>
                  <div>{formatPercentBR(formData.icms_percentage, 2)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">ICMS aplicado</div>
                  <div>{formatBRL(calc.icmsValue, 2)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Valor de venda</div>
                  <div>{formatBRL(calc.salePrice, 2)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Lucro por produto</div>
                  <div>{formatBRL(calc.profitPerUnit, 2)}</div>
                </div>

                {(calc.invalidMargin || calc.invalidIcms) && (
                  <div className="text-destructive">
                    {calc.invalidMargin ? 'Margem inválida (>= 100%)' : 'ICMS inválido (>= 100%)'}
                  </div>
                )}
              </CardContent>
            </Card>

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
