# Plano: Bobinas e Produtos — Cálculo por m² com IPI (bobina) e ICMS (produto)

## Resumo
Revisar o custeio usando a mesma lógica das duas planilhas reais:
- **Planilha do papel (matéria-prima/bobina)**: metragem, largura, m², preço, **IPI**, preço/m² com IPI e total.
- **Planilha de margem (produto final)**: custo do produto, % perda, % margem (Rocha), % **ICMS**, valor pré-ICMS, valor de venda, lucro por produto.

Objetivo: no sistema, a **bobina calcula custo por m² sem e com IPI**, e o **produto calcula preço de venda com ICMS separado**, exibindo um resumo de conferência com todos os passos.

## Estado Atual (baseado no codebase)
- **Bobinas** hoje usam `raw_products.cost_per_meter` e `raw_products.waste_percentage`, mas:
  - Não existe separação de **custo sem IPI / IPI% / custo com IPI**, nem custo por m² ([schema.sql](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/supabase/schema.sql#L94-L111)).
  - UI de bobinas ([RawMaterials.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/RawMaterials.tsx)) só edita `cost_per_meter` e não calcula custo por m².
- **Produtos acabados** (`finished_products`) hoje têm dimensões, `units_per_meter`, `base_price`, `default_raw_product_id`, mas não têm:
  - custo do produto (baseado em m²),
  - perda/margem,
  - separação de **ICMS** na formação do valor de venda,
  - nem “valor pré-ICMS” e “lucro por produto” ([schema.sql](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/supabase/schema.sql#L120-L137); [FinishedProducts.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/FinishedProducts.tsx#L430-L509)).
- O AppContext persiste entidades via `insert(row)` / `update({...updates})` e tende a funcionar automaticamente ao adicionar colunas, desde que os tipos e o form incluam os campos ([AppContext.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/contexts/AppContext.tsx#L350-L424)).

## Convenção de nomes (decisão)
O projeto usa nomes em inglês no schema/TS (`cost_per_meter`, `usable_width_mm` etc.). Para não quebrar compatibilidade e reduzir mudanças, o plano mantém a convenção existente e apenas **mapeia labels para PT-BR**:
- `code` = `codigo_interno`
- `material_type` = `tipo_material`
- `supplier_name` = `fornecedor`
- `notes` = `observacoes`
- `active` = `ativo`
- Novos campos (bobina):
  - `ipi_percentage` = `percentual_ipi`
  - `cost_total_no_ipi` = `custo_total_sem_ipi`
  - `cost_total_with_ipi` = `custo_total_com_ipi`
  - `cost_per_m2_no_ipi` = `custo_por_m2_sem_ipi`
  - `cost_per_m2_with_ipi` = `custo_por_m2_com_ipi`
- Novos campos (produto):
  - `icms_percentage` = `percentual_icms`
  - `price_pre_icms` = `valor_pre_icms`
  - `suggested_price` = `valor_de_venda`
  - `profit_per_unit` = `lucro_por_produto`

## Mudanças Propostas

### 1) Supabase — ajustes na tabela `raw_products` (bobinas)
**Requisito de segurança da migração**
- Migração deve ser **aditiva e idempotente** (`ADD COLUMN IF NOT EXISTS`) e **não remover campos existentes**.

**Adicionar colunas (custos com e sem IPI)**
- `ipi_percentage` (numeric) — percentual de IPI aplicado à compra (default 0).
- `cost_total_no_ipi` (numeric) — custo total da bobina sem IPI.
- `cost_total_with_ipi` (numeric) — custo total com IPI (derivado).
- `cost_per_m2_no_ipi` (numeric) — custo por m² sem IPI (derivado).
- `cost_per_m2_with_ipi` (numeric) — custo por m² com IPI (derivado).

**Compatibilidade com `cost_per_meter`**
- `cost_per_meter` passa a ser tratado como **custo por metro sem IPI** (input legado que continua disponível).
- A UI exibirá também o “custo por metro com IPI” (derivado) quando possível.

**Backfill de dados (migração)**
- Para registros existentes, quando possível:
  - Se `cost_total_no_ipi` estiver vazio/0 e `cost_per_meter > 0` e `length_m > 0`:
    - `cost_total_no_ipi = cost_per_meter * length_m`
  - Se `cost_per_m2_no_ipi` estiver vazio/0 e `usable_width_mm > 0` e `length_m > 0` e `cost_total_no_ipi > 0`:
    - `area_total_m2 = (usable_width_mm/1000) * length_m`
    - `cost_per_m2_no_ipi = cost_total_no_ipi / area_total_m2`
  - `ipi_percentage` default 0 quando ausente
  - `cost_total_with_ipi = cost_total_no_ipi * (1 + ipi_percentage/100)`
  - `cost_per_m2_with_ipi = cost_per_m2_no_ipi * (1 + ipi_percentage/100)`

### 2) UI Bobinas — `src/pages/RawMaterials.tsx`
**Objetivo da tela**
- Permitir que o usuário cadastre bobinas como na planilha do papel:
  - informar **custo sem IPI** (total ou por metro) + **% IPI**
  - o sistema calcula **custo por m² sem IPI**, **custo por m² com IPI** e **custo total com IPI**
  - e exibe custo por metro (sem e com IPI) quando possível

**Regras (implementação na UI)**
- Base geométrica:
  - `usable_width_m = usable_width_mm / 1000`
  - `area_total_m2 = usable_width_m * length_m`
- Regra crítica: **nunca** usar `width_mm` (largura total) em nenhum cálculo de custo/área; usar apenas `usable_width_mm`.
- Entradas principais:
  - `cost_total_no_ipi` (custo total sem IPI) **ou** `cost_per_meter` (custo/m sem IPI)
  - `ipi_percentage`
- Se usuário editar/preencher `cost_total_no_ipi`:
  - `cost_per_meter = cost_total_no_ipi / length_m` (se `length_m > 0`)
  - `cost_per_m2_no_ipi = cost_total_no_ipi / area_total_m2` (se `area_total_m2 > 0`)
- Se usuário editar/preencher `cost_per_meter`:
  - `cost_total_no_ipi = cost_per_meter * length_m` (se `length_m > 0`)
  - `cost_per_m2_no_ipi = cost_total_no_ipi / area_total_m2` (se `area_total_m2 > 0`)
- Aplicação do IPI (IPI pertence ao custo da bobina):
  - `cost_total_with_ipi = cost_total_no_ipi * (1 + ipi_percentage/100)`
  - `cost_per_m2_with_ipi = cost_per_m2_no_ipi * (1 + ipi_percentage/100)`
  - Exibir também `cost_per_meter_with_ipi = cost_per_meter * (1 + ipi_percentage/100)` quando possível
- Se ambos (`cost_total_no_ipi` e `cost_per_meter`) forem preenchidos e divergirem:
  - **priorizar o último campo editado** (controlar via `lastCostEdited: 'total'|'meter'` em state local do form).

**Mudanças visuais**
- Campos editáveis:
  - `Custo total sem IPI (R$)` e/ou `Custo por metro sem IPI (R$)`
  - `% IPI`
- Campos calculados (read-only):
  - `Custo por m² sem IPI (R$)`
  - `Custo por m² com IPI (R$)`
  - `Custo total com IPI (R$)`
  - (opcionalmente exibido) `Custo por metro com IPI (R$)`
- Ajustar tabela/listagem para exibir `Custo/m (s/ IPI)` e `Custo/m² (c/ IPI)` (ou ambos, conforme espaço).

### 3) Supabase — ajustes na tabela `finished_products` (produtos finais)
**Requisito de compatibilidade**
- Não remover nem sobrescrever `base_price` (continua como preço manual/comercial).

**Adicionar colunas (persistidas)**
- Geometria/custo de material (com separação de IPI):
  - `unit_area_m2` (numeric) — área unitária calculada.
  - `material_unit_cost_no_ipi` (numeric) — custo unitário do material sem IPI.
  - `material_unit_cost_with_ipi` (numeric) — custo unitário do material com IPI.
- Formação de preço (margem e ICMS separados):
  - `waste_percentage` (numeric) — perda percentual do produto (default 0).
  - `margin_percentage` (numeric) — margem Rocha (default 0).
  - `icms_percentage` (numeric) — ICMS do produto (default 0).
  - `price_pre_icms` (numeric) — valor pré-ICMS (derivado).
  - `suggested_price` (numeric) — valor de venda (derivado; inclui ICMS “por dentro”).
  - `profit_per_unit` (numeric) — lucro por produto (derivado).

**Compat**
- Manter `base_price` existente como preço “manual/base”.
- Registros existentes podem ficar com esses campos 0 até serem recalculados ao editar/salvar.

### 4) UI Produtos — `src/pages/FinishedProducts.tsx`
**Ao selecionar bobina padrão (`default_raw_product_id`)**
- Buscar no `rawProducts`:
  - `cost_per_m2_no_ipi` e `cost_per_m2_with_ipi`
  - `usable_width_mm`
  - `waste_percentage` (padrão da bobina)
- Preencher automaticamente no form do produto:
  - `waste_percentage` do produto (se ainda estiver 0 ou se estiver em modo “novo produto”)
  - Manter `requires_specific_raw_material` como está (a regra de “exige MP específica” continua).

**Cálculos do produto (em tempo real, via `useMemo`)**
- Área:
  - `unit_area_m2 = (width_mm * height_mm) / 1_000_000`
- Custo do produto (IPI pertence à matéria-prima/bobina):
  - Método A (prioritário) — **aproveitamento real por unidades_por_metro** (quando `units_per_meter > 0`):
    - `bobina_cost_per_meter_no_ipi = raw.cost_per_m2_no_ipi * (raw.usable_width_mm/1000)`
    - `bobina_cost_per_meter_with_ipi = raw.cost_per_m2_with_ipi * (raw.usable_width_mm/1000)`
    - `material_unit_cost_no_ipi = bobina_cost_per_meter_no_ipi / units_per_meter`
    - `material_unit_cost_with_ipi = bobina_cost_per_meter_with_ipi / units_per_meter`
    - `calculation_method = 'aproveitamento'`
  - Método B (fallback) — **por área** (quando `units_per_meter <= 0`):
    - `material_unit_cost_no_ipi = unit_area_m2 * raw.cost_per_m2_no_ipi`
    - `material_unit_cost_with_ipi = unit_area_m2 * raw.cost_per_m2_with_ipi`
    - `bobina_cost_per_meter_*` pode ser exibido mesmo assim (derivado), mas não é o método principal
    - `calculation_method = 'area'`
  - `product_cost = material_unit_cost_with_ipi` (custo unitário final do produto, base para perda/margem/ICMS)
  - `cost_with_waste = product_cost * (1 + waste_percentage/100)`
- Formação de preço (ICMS pertence ao produto, separado; por dentro via divisão):
  - `price_pre_icms = cost_with_waste / (1 - margin_percentage/100)`
  - `suggested_price (valor de venda) = price_pre_icms / (1 - icms_percentage/100)`
  - `profit_per_unit = price_pre_icms - cost_with_waste`
  - `icms_value = suggested_price - price_pre_icms` (para exibição no resumo)

**Validações/edge cases**
- Se `raw.cost_per_m2_with_ipi <= 0` ou dimensões <= 0, exibir valores calculados como 0 e mostrar aviso no bloco de conferência.
- Se `1 - margin_percentage/100 <= 0`, bloquear cálculo e exibir erro (margem 100%+).
- Se `1 - icms_percentage/100 <= 0`, bloquear cálculo e exibir erro (ICMS 100%+).

**Campos novos no formulário**
- `Perda (%)` (do produto)
- `Margem (%)`
- `ICMS (%)`
- Campos calculados (read-only / destaque):
  - `Área unitária (m²)`
  - `Custo material sem IPI`
  - `IPI aplicado` (valor e/ou %)
  - `Custo material com IPI`
  - `Custo com perda`
  - `Valor pré-ICMS`
  - `ICMS aplicado`
  - `Valor de venda`
  - `Lucro por produto`

**Bloco “Resumo do cálculo”**
- Mostrar:
  - Bobina selecionada (nome/código)
  - `Custo por m² sem IPI` da bobina
  - `IPI (%)` da bobina
  - `Custo por m² com IPI` da bobina
  - Área da etiqueta (m²)
  - Método de cálculo usado (por área / por aproveitamento)
  - Unidades por metro (quando aplicável)
  - Custo por metro da bobina (sem e com IPI; calculado sempre com `usable_width_mm`)
  - Custo material sem IPI
  - IPI aplicado
  - Custo material com IPI
  - Custo unitário final (custo do produto, antes de perda)
  - Perda aplicada
  - Custo com perda
  - Margem aplicada
  - ICMS aplicado
  - Valor pré-ICMS
  - Valor de venda
  - Lucro por produto

### 5) Tipos, mock e persistência
- Atualizar [types/index.ts](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/types/index.ts):
  - `RawProduct`: adicionar `ipi_percentage`, `cost_total_no_ipi`, `cost_total_with_ipi`, `cost_per_m2_no_ipi`, `cost_per_m2_with_ipi`
  - `FinishedProduct`: adicionar campos de custo/percentuais e derivados (`material_unit_cost_*`, `icms_percentage`, `price_pre_icms`, `suggested_price`, `profit_per_unit`)
- Atualizar [mockData.ts](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/data/mockData.ts) com defaults (0/null) para os novos campos.
- O AppContext já faz `insert(row)` e `update({...updates})`, então os novos campos serão persistidos automaticamente quando estiverem presentes no `formData`.

## Escopo / Fora de escopo
- Em **Orçamentos/OS**, hoje custo e preço dos itens são majoritariamente manuais. Este plano **não altera** o cálculo de custo/itens do orçamento/OS (apenas o cadastro e cálculo no produto e bobina).
- O componente [YieldCalculator.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/components/YieldCalculator.tsx) usa nomenclaturas divergentes (`custo_por_m`) e não está integrado ao cadastro atual; não será ajustado neste escopo.

## Assunções e decisões
- IPI:
  - Sempre tratado como componente do custo da bobina (multiplicativo: “por fora” do custo sem IPI).
- ICMS:
  - Sempre tratado na formação do preço do produto (divisão: “por dentro” do valor de venda).
- Percentuais (IPI na bobina; perda/margem/ICMS no produto) terão default 0 e serão editados manualmente.
- Persistiremos valores calculados para conferência (custo material s/ IPI e c/ IPI; valor pré-ICMS; valor de venda; lucro), mas o UI sempre recalcula “em tempo real” enquanto edita.
- Precisão:
  - custos por m² e custos unitários com 4–6 casas decimais (no DB e exibição), e preço sugerido com 2 casas.

## Padronização de formatação (PT-BR)
- Moeda: exibir em **R$** com **vírgula decimal** (ex.: `R$ 1.234,56`).
- Percentuais: exibir com vírgula e sufixo `%` (ex.: `6,5%`).
- Medidas: exibir sempre com unidade visível (`mm`, `m`, `m²`).
- Custos técnicos: 4 a 6 casas decimais (ex.: custo/m², custo unitário).
- Preço final: 2 casas decimais (ex.: valor de venda).

Implementação prevista:
- Criar helpers de formatação (ex.: `formatBRL`, `formatPercent`, `formatMM`, `formatM`, `formatM2`) e usá-los no bloco de resumo e nos campos read-only.

## Verificação (após implementação)
- Rodar `npx tsc --noEmit` e `npm run build`.
- Testes manuais:
  - Bobina: preencher `custo_total_sem_ipi` + `% IPI` → validar `custo_por_m2_sem_ipi`, `custo_por_m2_com_ipi`, `custo_total_com_ipi`.
  - Bobina: preencher `custo_por_metro_sem_ipi` + `% IPI` → validar derivação de `custo_total_sem_ipi` e os custos por m².
  - Produto: selecionar bobina → validar cálculo de custo material s/ IPI e c/ IPI e o puxar de `perda` padrão.
  - Produto (aproveitamento): com `units_per_meter > 0`, validar que o custo unitário usa o método “aproveitamento” e bate com:
    - `bobina_cost_per_meter_with_ipi = cost_per_m2_with_ipi * (usable_width_mm/1000)`
    - `custo_unitario = bobina_cost_per_meter_with_ipi / units_per_meter`
  - Produto (fallback): com `units_per_meter = 0`, validar método “área”.
  - Produto: validar cálculo de “valor pré-ICMS”, “valor de venda” e “lucro por produto” com percentuais por dentro para ICMS.
