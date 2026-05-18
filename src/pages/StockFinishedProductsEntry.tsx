import { useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { FinishedProductEntry } from "@/types";
import { formatBRL, formatNumberBR } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PackagePlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

const today = () => new Date().toISOString().slice(0, 10);

type EntryForm = Omit<FinishedProductEntry, "id" | "kind" | "created_at" | "updated_at">;

const emptyForm: EntryForm = {
  date: today(),
  finished_product_id: "",
  units_in: 0,
  total_cost: 0,
  notes: "",
};

export default function StockFinishedProductsEntry() {
  const {
    finishedProducts,
    finishedProductEntries,
    addFinishedProductEntry,
    updateFinishedProductEntry,
    deleteFinishedProductEntry,
    getFinishedStockById,
  } = useApp();

  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinishedProductEntry | null>(null);
  const [deletingItem, setDeletingItem] = useState<FinishedProductEntry | null>(null);
  const [formData, setFormData] = useState<EntryForm>(emptyForm);

  const productOptions = useMemo(() => finishedProducts.filter((p) => p.active), [finishedProducts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return finishedProductEntries
      .filter((e) => (productFilter === "all" ? true : e.finished_product_id === productFilter))
      .filter((e) => {
        if (!q) return true;
        const fp = finishedProducts.find((p) => p.id === e.finished_product_id);
        return (
          (fp?.code?.toLowerCase() || "").includes(q) ||
          (fp?.name?.toLowerCase() || "").includes(q) ||
          (e.notes?.toLowerCase() || "").includes(q)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
  }, [finishedProductEntries, finishedProducts, productFilter, search]);

  const totals = useMemo(() => {
    const snapshots = finishedProducts.map((fp) => getFinishedStockById(fp.id));
    const units = snapshots.reduce((sum, s) => sum + (Number(s.units) || 0), 0);
    const stockValue = snapshots.reduce((sum, s) => sum + (Number(s.stock_value) || 0), 0);
    const avgCostPerUnit = units !== 0 ? stockValue / units : 0;
    return { units, stockValue, avgCostPerUnit };
  }, [finishedProducts, getFinishedStockById]);

  const selectedTotals = useMemo(() => {
    if (productFilter === "all") return totals;
    const s = getFinishedStockById(productFilter);
    return { units: s.units, stockValue: s.stock_value, avgCostPerUnit: s.avg_cost_per_unit };
  }, [getFinishedStockById, productFilter, totals]);

  const openDialog = (item?: FinishedProductEntry) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        date: item.date,
        finished_product_id: item.finished_product_id,
        units_in: item.units_in,
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
    if (!formData.finished_product_id) {
      toast.error("Selecione o produto");
      return;
    }
    const unitsIn = Number(formData.units_in) || 0;
    if (unitsIn <= 0) {
      toast.error("Informe a quantidade");
      return;
    }
    const totalCost = Number(formData.total_cost) || 0;
    if (totalCost < 0) {
      toast.error("Valor total inválido");
      return;
    }

    try {
      if (editingItem) {
        await updateFinishedProductEntry(editingItem.id, {
          date: formData.date,
          finished_product_id: formData.finished_product_id,
          units_in: unitsIn,
          total_cost: totalCost,
          notes: formData.notes || "",
        });
        toast.success("Entrada atualizada");
      } else {
        await addFinishedProductEntry({
          date: formData.date,
          finished_product_id: formData.finished_product_id,
          units_in: unitsIn,
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

  const handleAskDelete = (item: FinishedProductEntry) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteFinishedProductEntry(deletingItem.id);
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
            <PackagePlus className="h-6 w-6" />
            Entrada de Produtos Prontos
          </h1>
          <p className="text-muted-foreground">
            Lançamentos de entrada de produtos prontos de compra e venda direta (fora da produção).
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
            <CardTitle className="text-sm font-medium">Unidades em estoque</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatNumberBR(selectedTotals.units, 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Custo médio (R$/un)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatBRL(selectedTotals.avgCostPerUnit, 4)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor em estoque</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatBRL(selectedTotals.stockValue)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por produto ou observação..."
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
            <p className="text-sm text-muted-foreground">{filtered.length} lançamento(s)</p>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Unidades</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">R$/un</TableHead>
                <TableHead>Obs.</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum lançamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => {
                  const fp = finishedProducts.find((p) => p.id === e.finished_product_id) ?? null;
                  const unitCost = (Number(e.units_in) || 0) > 0 ? (Number(e.total_cost) || 0) / (Number(e.units_in) || 0) : 0;
                  return (
                    <TableRow key={e.id}>
                      <TableCell>{new Date(e.date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{fp ? `${fp.code} - ${fp.name}` : e.finished_product_id}</TableCell>
                      <TableCell className="text-right">{formatNumberBR(e.units_in, 0)}</TableCell>
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
              <Label>Produto</Label>
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

            <div className="grid gap-4 grid-cols-2">
              <div className="grid gap-2">
                <Label>Unidades</Label>
                <Input
                  type="number"
                  value={formData.units_in}
                  onChange={(e) => setFormData((p) => ({ ...p, units_in: Number(e.target.value) }))}
                  min={0}
                  step="1"
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
