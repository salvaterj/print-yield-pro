import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Calculator, CheckCircle2, Package } from 'lucide-react';
import { RawMaterial, FinishedProduct, YieldSnapshot, YieldCalculatorOutput } from '@/types';

interface YieldCalculatorProps {
  bobinas: RawMaterial[];
  produtos: FinishedProduct[];
  selectedBobinaId?: string;
  selectedProdutoId?: string;
  quantidadeRolos: number;
  onBobinaChange?: (bobinaId: string) => void;
  onProdutoChange?: (produtoId: string) => void;
  onQuantidadeChange?: (qtd: number) => void;
  onYieldCalculated?: (snapshot: YieldSnapshot) => void;
  readOnly?: boolean;
  existingSnapshot?: YieldSnapshot;
  compact?: boolean;
}

export function calculateYield(
  bobina: RawMaterial | undefined,
  produto: FinishedProduct | undefined,
  quantidadeRolos: number,
  margemCorte: number = 2,
  perdasPercent: number = 3
): YieldCalculatorOutput {
  if (!bobina || !produto || quantidadeRolos <= 0) {
    return {
      pistas: 0,
      eficiencia_percent: 0,
      desperdicio_mm: 0,
      metragem_total_final_m: 0,
      metragem_bobina_teorica_m: 0,
      metragem_bobina_com_perdas_m: 0,
      custo_estimado: 0,
    };
  }

  const larguraBobina = bobina.largura_mm;
  const larguraProduto = produto.largura_mm;
  const metragemPorRolo = produto.metragem_por_rolo_m;
  const custoPorM = bobina.custo_por_m;

  // 1) Pistas = floor((largura_bobina - margem) / largura_produto)
  const pistas = Math.floor((larguraBobina - margemCorte) / larguraProduto);
  
  if (pistas < 1) {
    return {
      pistas: 0,
      eficiencia_percent: 0,
      desperdicio_mm: larguraBobina,
      metragem_total_final_m: 0,
      metragem_bobina_teorica_m: 0,
      metragem_bobina_com_perdas_m: 0,
      custo_estimado: 0,
      erro: 'Produto não cabe na largura da bobina',
    };
  }

  // 2) Eficiência % = (pistas * largura_produto / largura_bobina) * 100
  const eficiencia_percent = ((pistas * larguraProduto) / larguraBobina) * 100;

  // 3) Desperdício mm = largura_bobina - (pistas * largura_produto)
  const desperdicio_mm = larguraBobina - (pistas * larguraProduto);

  // 4) Metragem final total = metragem_por_rolo * quantidade_rolos
  const metragem_total_final_m = metragemPorRolo * quantidadeRolos;

  // 5) Metragem bobina teórica = metragem_final / pistas
  const metragem_bobina_teorica_m = metragem_total_final_m / pistas;

  // 6) Metragem com perdas = teórica * (1 + perdas/100)
  const metragem_bobina_com_perdas_m = metragem_bobina_teorica_m * (1 + perdasPercent / 100);

  // 7) Custo estimado = metragem_com_perdas * custo_por_m
  const custo_estimado = metragem_bobina_com_perdas_m * custoPorM;

  return {
    pistas,
    eficiencia_percent,
    desperdicio_mm,
    metragem_total_final_m,
    metragem_bobina_teorica_m,
    metragem_bobina_com_perdas_m,
    custo_estimado,
  };
}

export function YieldCalculator({
  bobinas,
  produtos,
  selectedBobinaId,
  selectedProdutoId,
  quantidadeRolos,
  onBobinaChange,
  onProdutoChange,
  onQuantidadeChange,
  onYieldCalculated,
  readOnly = false,
  existingSnapshot,
  compact = false,
}: YieldCalculatorProps) {
  const [margemCorte, setMargemCorte] = useState(2);
  const [perdasPercent, setPerdasPercent] = useState(3);

  const bobina = bobinas.find(b => b.id === selectedBobinaId);
  const produto = produtos.find(p => p.id === selectedProdutoId);

  const result = useMemo(() => {
    return calculateYield(bobina, produto, quantidadeRolos, margemCorte, perdasPercent);
  }, [bobina, produto, quantidadeRolos, margemCorte, perdasPercent]);

  useEffect(() => {
    if (result.pistas > 0 && bobina && produto && onYieldCalculated) {
      const snapshot: YieldSnapshot = {
        largura_bobina_mm: bobina.largura_mm,
        largura_produto_mm: produto.largura_mm,
        metragem_por_rolo_m: produto.metragem_por_rolo_m,
        quantidade_rolos: quantidadeRolos,
        margem_corte_mm: margemCorte,
        perdas_percent: perdasPercent,
        pistas: result.pistas,
        eficiencia_percent: result.eficiencia_percent,
        desperdicio_mm: result.desperdicio_mm,
        metragem_total_final_m: result.metragem_total_final_m,
        metragem_bobina_consumida_m: result.metragem_bobina_teorica_m,
        metragem_bobina_teorica_m: result.metragem_bobina_teorica_m,
        metragem_bobina_com_perdas_m: result.metragem_bobina_com_perdas_m,
        custo_estimado: result.custo_estimado,
        bobina_id: bobina.id,
        bobina_nome: bobina.nome,
        data_calculo: new Date().toISOString(),
        usuario: 'Usuário',
      };
      onYieldCalculated(snapshot);
    }
  }, [result, bobina, produto, quantidadeRolos, margemCorte, perdasPercent, onYieldCalculated]);

  // Use existing snapshot for display if in readOnly mode
  const displayData = readOnly && existingSnapshot ? {
    pistas: existingSnapshot.pistas,
    eficiencia_percent: existingSnapshot.eficiencia_percent,
    desperdicio_mm: existingSnapshot.desperdicio_mm,
    metragem_total_final_m: existingSnapshot.metragem_total_final_m,
    metragem_bobina_teorica_m: existingSnapshot.metragem_bobina_teorica_m,
    metragem_bobina_com_perdas_m: existingSnapshot.metragem_bobina_com_perdas_m,
    custo_estimado: existingSnapshot.custo_estimado,
  } : result;

  const hasData = displayData.pistas > 0 || existingSnapshot;
  const hasError = result.erro;

  if (compact) {
    return (
      <div className="border rounded-lg p-3 bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Aproveitamento & MP</span>
          {hasData && !hasError && (
            <Badge variant="outline" className="ml-auto bg-status-success/20 text-status-success">
              {displayData.pistas} pistas
            </Badge>
          )}
          {hasError && (
            <Badge variant="destructive" className="ml-auto">Erro</Badge>
          )}
        </div>
        
        {!readOnly && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Select value={selectedBobinaId || ''} onValueChange={onBobinaChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Bobina..." />
              </SelectTrigger>
              <SelectContent>
                {bobinas.filter(b => b.estoque_status !== 'consumida').map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.nome} ({b.saldo_m}m)</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={quantidadeRolos || ''}
              onChange={(e) => onQuantidadeChange?.(Number(e.target.value))}
              placeholder="Qtd rolos"
              className="h-8 text-xs"
            />
          </div>
        )}

        {hasError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {result.erro}
          </div>
        )}

        {hasData && !hasError && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Eficiência</span>
              <p className="font-medium">{displayData.eficiencia_percent.toFixed(1)}%</p>
            </div>
            <div>
              <span className="text-muted-foreground">MP Consumida</span>
              <p className="font-medium">{displayData.metragem_bobina_com_perdas_m.toFixed(1)}m</p>
            </div>
            <div>
              <span className="text-muted-foreground">Custo MP</span>
              <p className="font-bold text-primary">R$ {displayData.custo_estimado.toFixed(2)}</p>
            </div>
          </div>
        )}

        {readOnly && existingSnapshot && (
          <p className="text-xs text-muted-foreground mt-2">
            Calculado em: {new Date(existingSnapshot.data_calculo).toLocaleString('pt-BR')}
          </p>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Aproveitamento & Matéria-Prima
          {hasData && !hasError && (
            <CheckCircle2 className="h-4 w-4 text-status-success ml-auto" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!readOnly && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bobina</Label>
                <Select value={selectedBobinaId || ''} onValueChange={onBobinaChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar bobina..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bobinas.filter(b => b.estoque_status !== 'consumida').map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nome} ({b.largura_mm}mm / {b.saldo_m}m disponíveis)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select value={selectedProdutoId || ''} onValueChange={onProdutoChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar produto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome} ({p.largura_mm}mm)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Quantidade de Rolos</Label>
                <Input
                  type="number"
                  value={quantidadeRolos || ''}
                  onChange={(e) => onQuantidadeChange?.(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Margem Corte (mm)</Label>
                <Input
                  type="number"
                  value={margemCorte}
                  onChange={(e) => setMargemCorte(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Perdas (%)</Label>
                <Input
                  type="number"
                  value={perdasPercent}
                  onChange={(e) => setPerdasPercent(Number(e.target.value))}
                />
              </div>
            </div>
          </>
        )}

        {hasError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">{result.erro}</span>
          </div>
        )}

        {hasData && !hasError && (
          <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Pistas</span>
                <p className="text-2xl font-bold text-primary">{displayData.pistas}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Eficiência</span>
                <p className="text-2xl font-bold">{displayData.eficiencia_percent.toFixed(1)}%</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Sobra (mm)</span>
                <p className="text-2xl font-bold text-status-warning">{displayData.desperdicio_mm.toFixed(1)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Metragem Final</span>
                <p className="text-2xl font-bold">{displayData.metragem_total_final_m.toFixed(0)}m</p>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">MP Teórica</span>
                  <p className="font-medium">{displayData.metragem_bobina_teorica_m.toFixed(1)}m</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">MP c/ Perdas</span>
                  <p className="font-medium">{displayData.metragem_bobina_com_perdas_m.toFixed(1)}m</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Custo MP Estimado</span>
                  <p className="text-xl font-bold text-primary">R$ {displayData.custo_estimado.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {readOnly && existingSnapshot && (
              <div className="border-t pt-3 text-sm text-muted-foreground">
                Calculado em: {new Date(existingSnapshot.data_calculo).toLocaleString('pt-BR')} por {existingSnapshot.usuario}
              </div>
            )}
          </div>
        )}

        {!hasData && !hasError && !readOnly && (
          <div className="text-center py-6 text-muted-foreground">
            <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Selecione bobina, produto e quantidade para calcular o aproveitamento</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
