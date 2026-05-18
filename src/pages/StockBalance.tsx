import { useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { StockAdjustment } from "@/types";
import { formatBRL, formatM, formatNumberBR } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Scale, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

const today = () => new Date().toISOString().slice(0, 10);

type StockRow =
  | {
      target: "raw";
      id: string;
      code: string;
      name: string;
      meters: number;
      rolls: number;
      avg_cost: number;
      stock_value: number;
      negative: boolean;
    }
  | {
      target: "finished";
      id: string;
      code: string;
      name: string;
      units: number;
      avg_cost: number;
      stock_value: number;
      negative: boolean;
    };

type AdjustmentForm = Omit<StockAdjustment, "id" | "kind" | "created_at" | "updated_at">;

export default function StockBalance() {
  const {
    rawProducts,
    finishedProducts,
    getRawStockById,
    getFinishedStockById,
    getStockTotals,
    addStockAdjustment,
  } = useApp();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "raw" | "finished">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<StockRow | null>(null);
  const [formData, setFormData] = useState<AdjustmentForm>({
    date: today(),
    target: "raw",
    raw_product_id: null,
    finished_product_id: null,
    direction: "in",
    quantity: 1,
    total_cost: null,
    reason: "",
    notes: "",
  });

  const totals = useMemo(() => getStockTotals(), [getStockTotals]);

  const rows = useMemo<StockRow[]>(() => {
    const rawRows: StockRow[] = rawProducts.map((rp) => {
      const s = getRawStockById(rp.id);
      return {
        target: "raw",
        id: rp.id,
        code: rp.code,
        name: rp.name,
        meters: Number(s.meters) || 0,
        rolls: Number(s.rolls) || 0,
        avg_cost: Number(s.avg_cost_per_meter) || 0,
        stock_value: Number(s.stock_value) || 0,
        negative: (Number(s.meters) || 0) < 0,
      };
    });

    const finishedRows: StockRow[] = finishedProducts.map((fp) => {
      const s = getFinishedStockById(fp.id);
      return {
        target: "finished",
        id: fp.id,
        code: fp.code,
        name: fp.name,
        units: Number(s.units) || 0,
        avg_cost: Number(s.avg_cost_per_unit) || 0,
        stock_value: Number(s.stock_value) || 0,
        negative: (Number(s.units) || 0) < 0,
      };
    });

    return [...rawRows, ...finishedRows];
  }, [finishedProducts, getFinishedStockById, getRawStockById, rawProducts]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => (typeFilter === "all" ? true : r.target === typeFilter))
      .filter((r) => {
        if (!q) return true;
        return (r.code?.toLowerCase() || "").includes(q) || (r.name?.toLowerCase() || "").includes(q);
      })
      .sort((a, b) => {
        if (a.negative !== b.negative) return a.negative ? -1 : 1;
        const an = `${a.code} ${a.name}`.toLowerCase();
        const bn = `${b.code} ${b.name}`.toLowerCase();
        return an.localeCompare(bn);
      });
  }, [rows, search, typeFilter]);

  const openAdjust = (row: StockRow) => {
    setCurrentRow(row);
    setFormData({
      date: today(),
      target: row.target,
      raw_product_id: row.target === "raw" ? row.id : null,
      finished_product_id: row.target === "finished" ? row.id : null,
      direction: "in",
      quantity: 1,
      total_cost: null,
      reason: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!currentRow) return;
    if (!formData.date) {
      toast.error("Informe a data");
      return;
    }
    const qty = Number(formData.quantity) || 0;
    if (qty <= 0) {
      toast.error("Informe a quantidade");
      return;
    }
    if (!formData.reason.trim()) {
      toast.error("Informe o motivo");
      return;
    }

    const totalCost =
      formData.direction === "in" && formData.total_cost !== null && `${formData.total_cost}` !== ""
        ? Number(formData.total_cost)
        : null;

    try {
      await addStockAdjustment({
        date: formData.date,
        target: currentRow.target,
        raw_product_id: currentRow.target === "raw" ? currentRow.id : null,
        finished_product_id: currentRow.target === "finished" ? currentRow.id : null,
        direction: formData.direction,
        quantity: qty,
        total_cost: formData.direction === "in" ? (Number.isFinite(totalCost as any) ? totalCost : null) : null,
        reason: formData.reason.trim(),
        notes: formData.notes || "",
      });
      toast.success("Ajuste lançado");
      setIsDialogOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao lançar ajuste");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Scale className="h-6 w-6" />
          Balanço de Estoque
        </h1>
        <p className="text-muted-foreground">Listagem de estoque de bobinas e produtos, com pesquisa e ajustes manuais.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor total em estoque</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatBRL(totals.total_value)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Itens com saldo negativo</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totals.negative_count}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por código ou nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger className="w-[210px]">
                  <SelectValue placeholder="Filtrar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="raw">Bobinas</SelectItem>
                  <SelectItem value="finished">Produtos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">{filteredRows.length} item(ns)</p>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right">Custo médio</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum item encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((r) => {
                  const negativeClass = r.negative ? "text-destructive font-medium" : "";
                  const saldo =
                    r.target === "raw"
                      ? `${formatNumberBR(r.rolls, 2)} rolos • ${formatM(r.meters, 2)}`
                      : `${formatNumberBR(r.units, 0)} un`;
                  const avg = r.target === "raw" ? formatBRL(r.avg_cost, 4) : formatBRL(r.avg_cost, 4);

                  return (
                    <TableRow key={`${r.target}:${r.id}`}>
                      <TableCell>{r.target === "raw" ? "Bobina" : "Produto"}</TableCell>
                      <TableCell>
                        <div className="leading-tight">
                          <div className="font-medium">
                            {r.code} - {r.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={`text-right ${negativeClass}`}>{saldo}</TableCell>
                      <TableCell className="text-right">{avg}</TableCell>
                      <TableCell className="text-right">{formatBRL(r.stock_value)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openAdjust(r)}>
                          <SlidersHorizontal className="h-4 w-4 mr-2" />
                          Ajustar
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
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Ajuste de Estoque</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Item</Label>
              <Input
                value={currentRow ? `${currentRow.code} - ${currentRow.name}` : ""}
                readOnly
              />
            </div>

            <div className="grid gap-2">
              <Label>Data</Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))} />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="grid gap-2">
                <Label>Direção</Label>
                <Select value={formData.direction} onValueChange={(v) => setFormData((p) => ({ ...p, direction: v as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Entrada</SelectItem>
                    <SelectItem value="out">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Quantidade ({currentRow?.target === "raw" ? "rolos" : "un"})</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData((p) => ({ ...p, quantity: Number(e.target.value) }))}
                  min={0}
                  step={currentRow?.target === "raw" ? "0.01" : "1"}
                />
              </div>
            </div>

            {formData.direction === "in" && (
              <div className="grid gap-2">
                <Label>Valor total (opcional)</Label>
                <Input
                  type="number"
                  value={formData.total_cost ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, total_cost: e.target.value === "" ? null : Number(e.target.value) }))}
                  min={0}
                  step="0.01"
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label>Motivo</Label>
              <Input value={formData.reason} onChange={(e) => setFormData((p) => ({ ...p, reason: e.target.value }))} />
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
    </div>
  );
}
