import { useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { RawMaterialEntry } from "@/types";
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
import { ArrowDownToLine, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

const today = () => new Date().toISOString().slice(0, 10);

type EntryForm = Omit<RawMaterialEntry, "id" | "kind" | "created_at" | "updated_at">;

const emptyForm: EntryForm = {
  date: today(),
  raw_product_id: "",
  rolls_in: 1,
  total_cost: 0,
  notes: "",
};

export default function StockRawMaterialEntry() {
  const { rawProducts, rawMaterialEntries, addRawMaterialEntry, updateRawMaterialEntry, deleteRawMaterialEntry, getRawStockById } = useApp();
  const [search, setSearch] = useState("");
  const [rawFilter, setRawFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RawMaterialEntry | null>(null);
  const [deletingItem, setDeletingItem] = useState<RawMaterialEntry | null>(null);
  const [formData, setFormData] = useState<EntryForm>(emptyForm);

  const rawOptions = useMemo(() => rawProducts.filter((rp) => rp.active), [rawProducts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rawMaterialEntries
      .filter((e) => (rawFilter === "all" ? true : e.raw_product_id === rawFilter))
      .filter((e) => {
        if (!q) return true;
        const raw = rawProducts.find((rp) => rp.id === e.raw_product_id);
        return (
          (raw?.code?.toLowerCase() || "").includes(q) ||
          (raw?.name?.toLowerCase() || "").includes(q) ||
          (e.notes?.toLowerCase() || "").includes(q)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
  }, [rawMaterialEntries, rawFilter, rawProducts, search]);

  const totals = useMemo(() => {
    const snapshots = rawProducts.map((rp) => getRawStockById(rp.id));
    const meters = snapshots.reduce((sum, s) => sum + (Number(s.meters) || 0), 0);
    const rolls = snapshots.reduce((sum, s) => sum + (Number(s.rolls) || 0), 0);
    const stockValue = snapshots.reduce((sum, s) => sum + (Number(s.stock_value) || 0), 0);
    const avgCostPerMeter = meters !== 0 ? stockValue / meters : 0;
    return { meters, rolls, stockValue, avgCostPerMeter };
  }, [getRawStockById, rawProducts]);

  const selectedTotals = useMemo(() => {
    if (rawFilter === "all") return totals;
    const s = getRawStockById(rawFilter);
    return { meters: s.meters, rolls: s.rolls, stockValue: s.stock_value, avgCostPerMeter: s.avg_cost_per_meter };
  }, [getRawStockById, rawFilter, totals]);

  const openDialog = (item?: RawMaterialEntry) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        date: item.date,
        raw_product_id: item.raw_product_id,
        rolls_in: item.rolls_in,
        total_cost: item.total_cost,
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
    if (!formData.raw_product_id) {
      toast.error("Selecione a bobina");
      return;
    }
    const rollsIn = Number(formData.rolls_in) || 0;
    if (rollsIn <= 0) {
      toast.error("Informe a quantidade de rolos");
      return;
    }
    const totalCost = Number(formData.total_cost) || 0;
    if (totalCost < 0) {
      toast.error("Valor total inválido");
      return;
    }

    try {
      if (editingItem) {
        await updateRawMaterialEntry(editingItem.id, {
          date: formData.date,
          raw_product_id: formData.raw_product_id,
          rolls_in: rollsIn,
          total_cost: totalCost,
          notes: formData.notes || "",
        });
        toast.success("Entrada atualizada");
      } else {
        await addRawMaterialEntry({
          date: formData.date,
          raw_product_id: formData.raw_product_id,
          rolls_in: rollsIn,
          total_cost: totalCost,
          notes: formData.notes || "",
        });
        toast.success("Entrada registrada");
      }
      setIsDialogOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao salvar entrada");
    }
  };

  const handleAskDelete = (item: RawMaterialEntry) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteRawMaterialEntry(deletingItem.id);
      toast.success("Entrada excluída");
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao excluir entrada");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ArrowDownToLine className="h-6 w-6" />
            Entrada de Matéria-Prima
          </h1>
          <p className="text-muted-foreground">
            Lançamentos de compra/entrada de bobinas (matéria-prima) para abastecer o estoque.
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Entrada
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Metragem em estoque</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatM(selectedTotals.meters, 2)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rolos em estoque</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatNumberBR(selectedTotals.rolls, 2)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Custo médio (R$/m)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatBRL(selectedTotals.avgCostPerMeter, 4)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por bobina ou observação..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={rawFilter} onValueChange={setRawFilter}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Filtrar bobina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as bobinas</SelectItem>
                  {rawOptions.map((rp) => (
                    <SelectItem key={rp.id} value={rp.id}>
                      {rp.code} - {rp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">{filtered.length} lançamento(s)</p>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Bobina</TableHead>
                <TableHead className="text-right">Rolos</TableHead>
                <TableHead className="text-right">Metros</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">R$/m</TableHead>
                <TableHead>Obs.</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum lançamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => {
                  const raw = rawProducts.find((rp) => rp.id === e.raw_product_id) ?? null;
                  const lengthM = Number(raw?.length_m) || 0;
                  const meters = (Number(e.rolls_in) || 0) * lengthM;
                  const unitCost = meters > 0 ? (Number(e.total_cost) || 0) / meters : 0;
                  return (
                    <TableRow key={e.id}>
                      <TableCell>{new Date(e.date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{raw ? `${raw.code} - ${raw.name}` : e.raw_product_id}</TableCell>
                      <TableCell className="text-right">{formatNumberBR(e.rolls_in, 2)}</TableCell>
                      <TableCell className="text-right">{formatM(meters, 2)}</TableCell>
                      <TableCell className="text-right">{formatBRL(e.total_cost)}</TableCell>
                      <TableCell className="text-right">{formatBRL(unitCost, 4)}</TableCell>
                      <TableCell className="max-w-[240px] truncate">{e.notes}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openDialog(e)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleAskDelete(e)}>
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
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Entrada" : "Nova Entrada"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Data</Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))} />
            </div>

            <div className="grid gap-2">
              <Label>Bobina</Label>
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
                <Label>Rolos</Label>
                <Input
                  type="number"
                  value={formData.rolls_in}
                  onChange={(e) => setFormData((p) => ({ ...p, rolls_in: Number(e.target.value) }))}
                  min={0}
                  step="0.01"
                />
              </div>
              <div className="grid gap-2">
                <Label>Valor total (R$)</Label>
                <Input
                  type="number"
                  value={formData.total_cost}
                  onChange={(e) => setFormData((p) => ({ ...p, total_cost: Number(e.target.value) }))}
                  min={0}
                  step="0.01"
                />
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
            <AlertDialogTitle>Excluir entrada?</AlertDialogTitle>
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
