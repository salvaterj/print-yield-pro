import { useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { ProductionRecord } from "@/types";
import { formatBRL, formatM, formatNumberBR } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Factory, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

const today = () => new Date().toISOString().slice(0, 10);

type Form = Omit<ProductionRecord, "id" | "kind" | "created_at" | "updated_at">;

const emptyForm: Form = {
  date: today(),
  raw_product_id: "",
  finished_product_id: "",
  units_produced: 0,
  notes: "",
};

export default function StockProduction() {
  const {
    rawProducts,
    finishedProducts,
    rawMaterialEntries,
    productionRecords,
    finishedProductEntries,
    stockAdjustments,
    addProductionRecord,
    updateProductionRecord,
    deleteProductionRecord,
  } = useApp();

  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductionRecord | null>(null);
  const [deletingItem, setDeletingItem] = useState<ProductionRecord | null>(null);
  const [formData, setFormData] = useState<Form>(emptyForm);

  const productOptions = useMemo(() => finishedProducts.filter((p) => p.active), [finishedProducts]);
  const rawOptions = useMemo(() => rawProducts.filter((r) => r.active), [rawProducts]);

  const productionMeta = useMemo(() => {
    type RawState = { meters: number; stockValue: number; avgCostPerMeter: number };
    const rawLengthById = new Map(rawProducts.map((rp) => [rp.id, Number(rp.length_m) || 0]));
    const finishedUpmById = new Map(finishedProducts.map((fp) => [fp.id, Number(fp.units_per_meter) || 0]));
    const rawStateById = new Map<string, RawState>();
    const byId = new Map<string, { meters_consumed: number; total_cost: number }>();

    const getRawState = (rawId: string) => {
      const existing = rawStateById.get(rawId);
      if (existing) return existing;
      const created: RawState = { meters: 0, stockValue: 0, avgCostPerMeter: 0 };
      rawStateById.set(rawId, created);
      return created;
    };

    const applyRawIn = (rawId: string, metersIn: number, costIn: number | null) => {
      if (!Number.isFinite(metersIn) || metersIn === 0) return;
      const st = getRawState(rawId);
      const effectiveCostIn = costIn ?? metersIn * st.avgCostPerMeter;
      const nextMeters = st.meters + metersIn;
      const nextValue = st.stockValue + effectiveCostIn;
      if (nextMeters === 0) {
        st.meters = 0;
        st.stockValue = 0;
        st.avgCostPerMeter = 0;
        return;
      }
      st.meters = nextMeters;
      st.stockValue = nextValue;
      st.avgCostPerMeter = nextValue / nextMeters;
    };

    const applyRawOut = (rawId: string, metersOut: number) => {
      if (!Number.isFinite(metersOut) || metersOut === 0) return;
      const st = getRawState(rawId);
      const costOut = metersOut * st.avgCostPerMeter;
      const nextMeters = st.meters - metersOut;
      const nextValue = st.stockValue - costOut;
      if (nextMeters === 0) {
        st.meters = 0;
        st.stockValue = 0;
        st.avgCostPerMeter = 0;
        return;
      }
      st.meters = nextMeters;
      st.stockValue = nextValue;
      st.avgCostPerMeter = st.avgCostPerMeter;
    };

    const movements = [
      ...rawMaterialEntries.map((m) => ({ kind: m.kind, date: m.date, created_at: m.created_at, id: m.id, payload: m })),
      ...productionRecords.map((m) => ({ kind: m.kind, date: m.date, created_at: m.created_at, id: m.id, payload: m })),
      ...finishedProductEntries.map((m) => ({ kind: m.kind, date: m.date, created_at: m.created_at, id: m.id, payload: m })),
      ...stockAdjustments.map((m) => ({ kind: m.kind, date: m.date, created_at: m.created_at, id: m.id, payload: m })),
    ].sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));

    for (const move of movements) {
      if (move.kind === "raw_entry") {
        const m = move.payload as any;
        const lengthM = rawLengthById.get(m.raw_product_id) ?? 0;
        applyRawIn(m.raw_product_id, (Number(m.rolls_in) || 0) * lengthM, Number(m.total_cost) || 0);
        continue;
      }

      if (move.kind === "adjustment") {
        const m = move.payload as any;
        if (m.target === "raw" && m.raw_product_id) {
          const lengthM = rawLengthById.get(m.raw_product_id) ?? 0;
          const meters = (Number(m.quantity) || 0) * lengthM;
          if (m.direction === "in") applyRawIn(m.raw_product_id, meters, m.total_cost);
          else applyRawOut(m.raw_product_id, meters);
        }
        continue;
      }

      if (move.kind === "production") {
        const m = move.payload as ProductionRecord;
        const upm = finishedUpmById.get(m.finished_product_id) ?? 0;
        const units = Number(m.units_produced) || 0;
        const metersConsumed = upm > 0 ? units / upm : 0;
        const st = getRawState(m.raw_product_id);
        const totalCost = metersConsumed * st.avgCostPerMeter;
        byId.set(m.id, { meters_consumed: metersConsumed, total_cost: totalCost });
        applyRawOut(m.raw_product_id, metersConsumed);
      }
    }

    return byId;
  }, [finishedProductEntries, finishedProducts, productionRecords, rawMaterialEntries, rawProducts, stockAdjustments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return productionRecords
      .filter((e) => (productFilter === "all" ? true : e.finished_product_id === productFilter))
      .filter((e) => {
        if (!q) return true;
        const raw = rawProducts.find((rp) => rp.id === e.raw_product_id);
        const fp = finishedProducts.find((p) => p.id === e.finished_product_id);
        return (
          (raw?.code?.toLowerCase() || "").includes(q) ||
          (raw?.name?.toLowerCase() || "").includes(q) ||
          (fp?.code?.toLowerCase() || "").includes(q) ||
          (fp?.name?.toLowerCase() || "").includes(q) ||
          (e.notes?.toLowerCase() || "").includes(q)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
  }, [finishedProducts, productFilter, productionRecords, rawProducts, search]);

  const stats = useMemo(() => {
    const totalUnits = filtered.reduce((sum, r) => sum + (Number(r.units_produced) || 0), 0);
    const totalMeters = filtered.reduce((sum, r) => sum + (productionMeta.get(r.id)?.meters_consumed ?? 0), 0);
    return { totalUnits, totalMeters, count: filtered.length };
  }, [filtered, productionMeta]);

  const selectedFinished = useMemo(() => {
    if (!formData.finished_product_id) return null;
    return finishedProducts.find((p) => p.id === formData.finished_product_id) ?? null;
  }, [finishedProducts, formData.finished_product_id]);

  const metersPreview = useMemo(() => {
    const upm = Number(selectedFinished?.units_per_meter) || 0;
    const units = Number(formData.units_produced) || 0;
    return upm > 0 ? units / upm : 0;
  }, [formData.units_produced, selectedFinished?.units_per_meter]);

  const openDialog = (item?: ProductionRecord) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        date: item.date,
        raw_product_id: item.raw_product_id,
        finished_product_id: item.finished_product_id,
        units_produced: item.units_produced,
        notes: item.notes || "",
      });
    } else {
      setEditingItem(null);
      setFormData(emptyForm);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.date) {
      toast.error("Informe a data");
      return;
    }
    if (!formData.finished_product_id) {
      toast.error("Selecione o produto acabado");
      return;
    }
    if (!formData.raw_product_id) {
      toast.error("Selecione a bobina");
      return;
    }
    const units = Number(formData.units_produced) || 0;
    if (units <= 0) {
      toast.error("Informe as unidades produzidas");
      return;
    }
    const upm = Number(selectedFinished?.units_per_meter) || 0;
    if (upm <= 0) {
      toast.error("O produto precisa ter unidades por metro (units_per_meter) maior que zero");
      return;
    }

    try {
      if (editingItem) {
        await updateProductionRecord(editingItem.id, {
          date: formData.date,
          raw_product_id: formData.raw_product_id,
          finished_product_id: formData.finished_product_id,
          units_produced: units,
          notes: formData.notes || "",
        });
        toast.success("Produção atualizada");
      } else {
        await addProductionRecord({
          date: formData.date,
          raw_product_id: formData.raw_product_id,
          finished_product_id: formData.finished_product_id,
          units_produced: units,
          notes: formData.notes || "",
        });
        toast.success("Produção registrada");
      }
      setIsDialogOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao salvar produção");
    }
  };

  const handleAskDelete = (item: ProductionRecord) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteProductionRecord(deletingItem.id);
      toast.success("Produção excluída");
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao excluir produção");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Factory className="h-6 w-6" />
            Produção de Produtos
          </h1>
          <p className="text-muted-foreground">
            Transformação de bobinas em produtos acabados: baixa da bobina e entrada do produto produzido no estoque.
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Produção
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Produções</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.count}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Metros consumidos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatM(stats.totalMeters, 2)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unidades produzidas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatNumberBR(stats.totalUnits, 0)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por produto, bobina ou obs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Filtrar produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os produtos</SelectItem>
                  {productOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">{filtered.length} registro(s)</p>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Bobina</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Unidades</TableHead>
                <TableHead className="text-right">Metros</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead>Obs.</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhuma produção encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => {
                  const raw = rawProducts.find((rp) => rp.id === r.raw_product_id) ?? null;
                  const fp = finishedProducts.find((p) => p.id === r.finished_product_id) ?? null;
                  const meta = productionMeta.get(r.id);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{raw ? `${raw.code} - ${raw.name}` : r.raw_product_id}</TableCell>
                      <TableCell>{fp ? `${fp.code} - ${fp.name}` : r.finished_product_id}</TableCell>
                      <TableCell className="text-right">{formatNumberBR(r.units_produced, 0)}</TableCell>
                      <TableCell className="text-right">{formatM(meta?.meters_consumed ?? 0, 2)}</TableCell>
                      <TableCell className="text-right">{formatBRL(meta?.total_cost ?? 0)}</TableCell>
                      <TableCell className="max-w-[240px] truncate">{r.notes}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openDialog(r)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleAskDelete(r)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Produção" : "Registrar Produção"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Data</Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))} />
            </div>

            <div className="grid gap-2">
              <Label>Produto acabado</Label>
              <Select
                value={formData.finished_product_id}
                onValueChange={(v) => setFormData((p) => ({ ...p, finished_product_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {productOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Bobina (matéria-prima)</Label>
              <Select
                value={formData.raw_product_id}
                onValueChange={(v) => setFormData((p) => ({ ...p, raw_product_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma bobina" />
                </SelectTrigger>
                <SelectContent>
                  {rawOptions.map((rp) => (
                    <SelectItem key={rp.id} value={rp.id}>
                      {rp.code} - {rp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="grid gap-2">
                <Label>Unidades produzidas</Label>
                <Input
                  type="number"
                  value={formData.units_produced}
                  onChange={(e) => setFormData((p) => ({ ...p, units_produced: Number(e.target.value) }))}
                  min={0}
                  step="1"
                />
              </div>
              <div className="grid gap-2">
                <Label>Metros consumidos (calculado)</Label>
                <Input value={formatNumberBR(metersPreview, 2)} readOnly />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produção?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
