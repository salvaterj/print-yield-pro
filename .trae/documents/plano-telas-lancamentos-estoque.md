# Plano — Desenho das Telas de Lançamentos de Estoque (sem Supabase)

## Resumo
Desenhar e implementar as 4 telas de “Lançamentos de Estoque” com UI completa (lista + criação/edição + indicadores), **persistindo apenas no localStorage** (sem Supabase e sem mexer na lógica de conta/auth).

Telas:
1) Entrada de Matéria-Prima (bobinas)
2) Produção de Produtos (transformação bobina → produto acabado)
3) Entrada de Produtos Prontos (compra/venda direta)
4) Balanço de Estoque (visão geral + ajustes)

## Estado Atual (baseado no repositório)
- Rotas centralizadas em [src/App.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas/print-yield-pro/src/App.tsx).
- Menu/Sidebar centralizado em [src/components/layout/AppSidebar.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas/print-yield-pro/src/components/layout/AppSidebar.tsx).
- Páginas de estoque já existem como placeholders:
  - [src/pages/StockRawMaterialEntry.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas/print-yield-pro/src/pages/StockRawMaterialEntry.tsx)
  - [src/pages/StockProduction.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas/print-yield-pro/src/pages/StockProduction.tsx)
  - [src/pages/StockFinishedProductsEntry.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas/print-yield-pro/src/pages/StockFinishedProductsEntry.tsx)
  - [src/pages/StockBalance.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas/print-yield-pro/src/pages/StockBalance.tsx)
- Dados principais vêm do AppContext e são persistidos em localStorage via [src/lib/appStorage.ts](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas/print-yield-pro/src/lib/appStorage.ts).
- Não existe hoje um módulo de “movimentações/estoque” transacional (entradas/saídas/ajustes + saldo/custo médio) em types/context.

## Objetivo e Critérios de Sucesso
- Cada tela exibe uma lista de lançamentos (com busca/filtro básico) e permite criar/editar/excluir lançamentos.
- Entrada de Matéria-Prima mostra: quantidade (rolos), valor, custo médio no estoque e metragem no estoque (por bobina e/ou totais).
- Produção mostra: o que virou o que, data, unidades produzidas; consumo em metros calculado automaticamente.
- Entrada de Produtos Prontos mostra: entradas por produto, quantidade e custo.
- Balanço mostra: todo o estoque (bobinas e produtos) em listagem, com pesquisa e **ajuste manual com motivo**, permitindo saldo negativo.
- Persistência local (localStorage) funcionando mesmo sem Supabase.

## Decisões Confirmadas (com o usuário)
- Entrada de Matéria-Prima: “quantidade” em **rolos**.
- Custo médio: **média ponderada**.
- Produção: informar **só unidades**; consumo em metros é calculado via `units_per_meter` do produto.
- Balanço: ajuste **com motivo** e **permitir saldo negativo**.

## Modelo de Dados Proposto (local-only)
### Novos tipos em [src/types/index.ts](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas/print-yield-pro/src/types/index.ts)
Criar entidades de movimentação (todas com `id`, `date` ISO yyyy-mm-dd, `notes`, `created_at`, `updated_at`):

- `StockMovementKind`:
  - `raw_entry` (entrada de bobina)
  - `production` (produção: consome bobina e gera produto)
  - `finished_entry` (entrada de produto pronto comprado)
  - `adjustment` (ajuste manual)

- `RawMaterialEntry`:
  - `raw_product_id`
  - `rolls_in` (number)
  - `total_cost` (number) — valor total da compra/entrada
  - Campos derivados (não persistidos): `meters_in = rolls_in * raw.length_m`, `unit_cost_per_meter = total_cost / meters_in`

- `ProductionRecord`:
  - `raw_product_id`
  - `finished_product_id`
  - `units_produced` (number)
  - Derivado: `meters_consumed = units_produced / finished.units_per_meter`
  - Derivado: `total_cost = meters_consumed * raw_avg_cost_per_meter (na data)`

- `FinishedProductEntry`:
  - `finished_product_id`
  - `units_in` (number)
  - `total_cost` (number)
  - Derivado: `unit_cost = total_cost / units_in`

- `StockAdjustment`:
  - `target` = `raw` | `finished`
  - `raw_product_id?` / `finished_product_id?`
  - `direction` = `in` | `out`
  - `quantity` (number) — rolls (raw) ou units (finished)
  - `reason` (string) obrigatório
  - `total_cost?` (number | null) — opcional quando `direction === 'in'` para atualizar custo médio; quando ausente, custo médio não muda

### Armazenamento em localStorage
Adicionar chaves em [src/lib/appStorage.ts](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas/print-yield-pro/src/lib/appStorage.ts):
- `rawMaterialEntries`
- `productionRecords`
- `finishedProductEntries`
- `stockAdjustments`

Adicionar mocks em [src/data/mockData.ts](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas/print-yield-pro/src/data/mockData.ts) com 1–2 lançamentos de exemplo para cada lista.

## Regras de Cálculo (saldo + custo médio)
### Bobinas (RawProduct)
- Unidade de saldo:
  - saldo em **rolos** e em **metros** (derivado: `rolls * length_m`).
- Custo médio por metro:
  - `avg_cost_per_meter` inicia em 0.
  - Entradas (`raw_entry`) atualizam custo médio por **média ponderada**:
    - `new_total_value = old_value + entry_total_cost`
    - `new_total_meters = old_meters + entry_meters`
    - `avg_cost_per_meter = new_total_value / new_total_meters`
  - Saídas (produção ou ajustes de saída) reduzem saldo em metros/rolos e reduzem o “valor de estoque” usando `avg_cost_per_meter` vigente; **não alteram** o `avg_cost_per_meter` (a menos que o saldo vá a 0, onde zeramos valor e custo médio).
- Ordem de processamento:
  - Processar movimentos ordenados por `date` crescente; desempate por `created_at`.

### Produtos Acabados (FinishedProduct)
- Unidade de saldo: **unidades**.
- Custo médio por unidade:
  - `avg_cost_per_unit` via média ponderada em entradas de compra (`finished_entry`) e entradas por produção (`production`).

### Produção
- Consumo:
  - `meters_consumed = units_produced / units_per_meter`.
  - Se `units_per_meter <= 0`, bloquear salvamento e pedir correção no cadastro do produto.
- Custo:
  - `total_cost = meters_consumed * avg_cost_per_meter` (da bobina no estado corrente ao processar a produção).
- Efeito:
  - Diminui saldo da bobina.
  - Aumenta saldo do produto acabado e atualiza custo médio por unidade (como uma entrada com `total_cost`).

### Ajustes
- Exigir `reason`.
- Permitir saldo negativo (raw ou finished) e destacar no balanço.
- Ajuste de entrada pode (opcionalmente) receber `total_cost` para recalcular custo médio; se omitido, só altera quantidade.

## UI/UX por Tela
Padrão visual: seguir as páginas existentes (Header + `Card` + `Table` + `Dialog` + `toast`).

### 1) Entrada de Matéria-Prima
Arquivo: [src/pages/StockRawMaterialEntry.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas/print-yield-pro/src/pages/StockRawMaterialEntry.tsx)
- Topo:
  - Título + descrição
  - Botão “Nova Entrada”
- Filtros:
  - Busca por bobina (código/nome) e/ou período (opcional, mínimo: busca texto)
- Indicadores:
  - Cards: “Metragem em estoque”, “Rolos em estoque”, “Custo médio (R$/m)” (com base na bobina selecionada ou agregado).
- Tabela de lançamentos:
  - Data, Bobina, Rolos, Metros (derivado), Valor total, Custo R$/m (derivado), Observações, Ações (editar/excluir)
- Dialog “Nova/Editar Entrada”:
  - Data, Bobina (select), Rolos, Valor total, Observações

### 2) Produção de Produtos
Arquivo: [src/pages/StockProduction.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas/print-yield-pro/src/pages/StockProduction.tsx)
- Topo:
  - Botão “Registrar Produção”
- Filtros:
  - Busca por produto/bobina e data (mínimo: busca texto)
- Indicadores:
  - Cards: “Produções no período”, “Metros consumidos”, “Unidades produzidas” (derivados)
- Tabela:
  - Data, Bobina (consumida), Produto (gerado), Unidades, Metros consumidos (derivado), Custo total (derivado), Ações
- Dialog:
  - Data, Produto acabado (select), Bobina (select), Unidades produzidas, Observações
  - Campo somente leitura: “Metros consumidos”
  - Validação: `units_per_meter > 0`

### 3) Entrada de Produtos Prontos (Compra)
Arquivo: [src/pages/StockFinishedProductsEntry.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas/print-yield-pro/src/pages/StockFinishedProductsEntry.tsx)
- Topo:
  - Botão “Nova Entrada”
- Filtros:
  - Busca por produto e data (mínimo: busca texto)
- Indicadores:
  - Cards: “Unidades em estoque”, “Custo médio (R$/un)”, “Valor em estoque”
- Tabela:
  - Data, Produto, Unidades, Valor total, Custo R$/un (derivado), Observações, Ações
- Dialog:
  - Data, Produto (select), Unidades, Valor total, Observações

### 4) Balanço de Estoque
Arquivo: [src/pages/StockBalance.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas/print-yield-pro/src/pages/StockBalance.tsx)
- Topo:
  - Busca global (nome/código)
  - Filtro tipo: Todos | Bobinas | Produtos
- Cards:
  - “Valor total em estoque” (raw + finished)
  - “Itens com saldo negativo” (contador)
- Tabela:
  - Tipo, Item, Saldo (rolos+metros ou unidades), Custo médio (R$/m ou R$/un), Valor em estoque, Ação “Ajustar”
- Dialog “Ajuste”:
  - Tipo (raw/finished pré-selecionado pela linha)
  - Direção (entrada/saída)
  - Quantidade (rolos ou unidades)
  - Motivo (obrigatório)
  - Data
  - (Opcional) Valor total (apenas para entradas) para atualizar custo médio
- Destaque visual:
  - Saldo negativo com estilo de erro (texto/badge).

## Mudanças por Arquivo (execução após aprovação)
- src/types/index.ts
  - Adicionar os novos tipos de lançamentos/ajustes.
- src/lib/appStorage.ts
  - Adicionar `storageKeys.*` para novas listas.
- src/data/mockData.ts
  - Adicionar mocks para lançamentos/ajustes.
- src/contexts/AppContext.tsx
  - Adicionar estados e CRUD local-only:
    - `rawMaterialEntries`, `productionRecords`, `finishedProductEntries`, `stockAdjustments`
    - `add/update/delete` para cada um
  - Adicionar seletores/derivadores:
    - `computeRawStockById`, `computeFinishedStockById`, e agregações para balanço
  - Persistir no localStorage no mesmo efeito já existente.
  - Importante: manter essas entidades **fora** do fluxo Supabase (não buscar/salvar no Supabase).
- src/pages/StockRawMaterialEntry.tsx
  - Implementar UI completa (lista + dialog + métricas) usando `useApp()`.
- src/pages/StockProduction.tsx
  - Implementar UI e cálculo de consumo por `units_per_meter`.
- src/pages/StockFinishedProductsEntry.tsx
  - Implementar UI completa (lista + dialog + métricas).
- src/pages/StockBalance.tsx
  - Implementar visão agregada e dialog de ajuste.

## Verificação
- Conferir TypeScript sem erros (diagnósticos do editor).
- Navegar no preview pelas 4 telas:
  - Criar/editar/excluir um lançamento em cada tela.
  - Validar persistência recarregando a página (localStorage).
  - Validar custo médio (média ponderada) e impacto da produção:
    - entrada bobina → custo médio > 0
    - produção (unidades) → reduz saldo da bobina em metros e aumenta saldo do produto em unidades
  - Validar ajuste com motivo e saldo negativo aparecendo destacado no balanço.

