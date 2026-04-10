## Resumo

Objetivo: alinhar o front-end (telas + formulários) ao modelo de dados definido (campos em inglês no schema/model e labels em português na UI), liberar todos os módulos do schema para o perfil **admin**, e preparar a estrutura final recomendada das tabelas no Supabase (SQL de criação + constraints + relacionamentos + RLS básico) para persistência real do MVP.

Escopo confirmado pelo usuário:
- Admin verá apenas os módulos do schema (não inclui Dashboard/Kanban/Fiscal como telas “principais”).
- OS deve persistir as **etapas detalhadas do Kanban** (além do status simples do modelo).
- Single-tenant (MVP).
- IDs UUID.

## Análise do Estado Atual (repo)

### Rotas e permissões (admin)
- As rotas atuais expõem: `/clientes`, `/transportadoras`, `/vendedores`, `/usuarios`, `/bobinas`, `/produtos`, `/orcamentos`, `/os` e detalhes. Ver [App.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/App.tsx#L63-L142).
- O menu lateral mostra: Clientes, Transportadoras, Vendedores, Usuários, Bobinas, Produtos, Orçamentos, Ordens de Serviço, filtrado por `role`. Ver [AppSidebar.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/components/layout/AppSidebar.tsx#L31-L40).
- Ponto de atenção: “admin liberado para tudo” requer que **todas** as rotas do escopo sempre incluam `admin` no `allow`. Hoje já inclui para os módulos listados.

### Divergência crítica: páginas PT-BR vs tipos EN
- O arquivo [types/index.ts](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/types/index.ts) já contém interfaces em inglês para `Company`, `Carrier`, `Salesperson`, `RawProduct`, `FinishedProduct`, `Quote`, `QuoteItem`, `WorkOrder`, `WorkOrderItem`, `SystemSettings`.
- Porém várias telas ainda usam um modelo antigo (PT-BR) com campos como `nome`, `lote`, `status_producao`, `numero_os`, etc. Ex.: [RawMaterials.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/RawMaterials.tsx), [FinishedProducts.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/FinishedProducts.tsx), [Quotes.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/Quotes.tsx), [QuoteView.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/QuoteView.tsx), [ServiceOrders.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/ServiceOrders.tsx), [ServiceOrderView.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/ServiceOrderView.tsx).
- Conclusão: para “validar o modelo de dados” e “gerar o schema do Supabase sem faltar coluna”, precisamos **migrar o front** para usar os campos do modelo definido pelo usuário (EN) e remover/encapsular o legado PT-BR.

### Levantamento: campos existentes vs faltantes (por módulo do schema)

#### 1) companies (Clientes/Empresas)
Tela: [Clients.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/Clients.tsx)
- Já existe no front (form): `trade_name`, `name`, `cnpj`, `state_registration`, `phone`, `email`, `address`, `notes`.
- Falta expor no formulário (campos do modelo): `code`, `whatsapp`, `zip_code`, `number`, `complement`, `neighborhood`, `city`, `state`, `salesperson_id` (select), `default_carrier_id` (select), `active` (switch).
- Relações necessárias: `salesperson_id -> salespeople.id`, `default_carrier_id -> carriers.id`.

#### 2) carriers (Transportadoras)
Tela: [Carriers.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/Carriers.tsx)
- Já existe no front (form): `name`, `cnpj`, `phone`, `email`, `delivery_time_days`, `notes`.
- Falta no formulário: `code`, `whatsapp`, `zip_code`, `address`, `number`, `complement`, `neighborhood`, `city`, `state`, `active`.
- Relações: nenhuma (no modelo atual).

#### 3) salespeople (Vendedores)
Tela: [Sellers.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/Sellers.tsx)
- Já existe no front (form): `name`, `email`, `phone`, `commission_value`, `active`, `notes`.
- Falta no formulário: `code`, `whatsapp`, `commission_type` (select: percentage/fixed).
- Relações: usada via `companies.salesperson_id`.

#### 4) raw_products (Produtos brutos / Bobinas)
Tela atual: [RawMaterials.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/RawMaterials.tsx)
- Situação: tela está em modelo antigo (PT-BR) e não corresponde ao schema `raw_products`.
- Para alinhar ao modelo, precisamos criar/ajustar formulário EN com estes campos:
  - `code`, `name`, `material_type`, `width_mm`, `length_m`, `thickness_microns`, `usable_width_mm`, `waste_percentage`, `cost_per_meter`, `cost_per_kg` (opcional), `supplier_name`, `notes`, `active`.
- Observação: a “transformação de bobinas” existe hoje como fluxo do legado; no modelo proposto o ideal é manter o cadastro do insumo em `raw_products` e, se necessário, criar tabelas de estoque/movimentação depois (fora do escopo do modelo fornecido).

#### 5) finished_products (Produtos acabados)
Tela atual: [FinishedProducts.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/FinishedProducts.tsx)
- Situação: tela está em modelo antigo (PT-BR) e não corresponde ao schema `finished_products`.
- Para alinhar ao modelo, formulário EN deve conter:
  - `code`, `name`, `product_type` (select), `width_mm`, `height_mm`, `units_per_row`, `units_per_meter`, `requires_specific_raw_material` (switch), `default_raw_product_id` (select), `base_price`, `minimum_quantity`, `notes`, `active`.
- Relações necessárias: `default_raw_product_id -> raw_products.id`.

#### 6) quotes (Orçamentos) + 7) quote_items (Itens)
Tela atual: [Quotes.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/Quotes.tsx) e visualização [QuoteView.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/QuoteView.tsx)
- Situação: a implementação atual usa outro modelo (PT-BR) e “itens simplificados”.
- Para alinhar ao modelo:
  - **quotes (cabeçalho)**: `quote_number`, `company_id` (select), `salesperson_id` (select), `carrier_id` (select), `status` (draft/approved/rejected/canceled), `issue_date`, `valid_until`, `notes`.
  - **quote_items (1+ por orçamento)**: todos os campos do modelo (inclusive calculados) devem existir e ser editáveis no MVP:
    - `finished_product_id` (select), `raw_product_id` (select), `description`, `quantity`, `width_mm`, `height_mm`, `units_per_row`, `units_per_meter`, `material_used_meters`, `waste_meters`, `total_cost`, `unit_cost`, `sale_price`, `total_price`, `profit_margin`, `technical_notes`.
- Relações necessárias:
  - `quotes.company_id -> companies.id`
  - `quotes.salesperson_id -> salespeople.id`
  - `quotes.carrier_id -> carriers.id`
  - `quote_items.quote_id -> quotes.id`
  - `quote_items.finished_product_id -> finished_products.id`
  - `quote_items.raw_product_id -> raw_products.id`

#### 8) work_orders (OS) + 9) work_order_items (Itens)
Telas atuais: [ServiceOrders.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/ServiceOrders.tsx) e [ServiceOrderView.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/ServiceOrderView.tsx)
- Situação: o fluxo atual é baseado em modelo PT-BR e usa `status_producao` com etapas do Kanban.
- Para alinhar ao modelo:
  - **work_orders (cabeçalho)**: `os_number`, `quote_id` (select), `company_id` (select), `salesperson_id` (select), `carrier_id` (select), `status` (pending/in_production/finished/canceled), `issue_date`, `deadline`, `production_notes`, `internal_notes`.
  - **work_order_items**: todos os campos do modelo, incluindo `setup_notes`, `technical_notes`.
- Persistência de etapas Kanban (decisão do usuário):
  - Proposta mínima (extensão do modelo): adicionar coluna `workflow_stage` em `work_orders` (text) com valores do Kanban e default `a_fazer`. O `status` continua simples (para relatórios), e podemos mapear `workflow_stage -> status` (ex.: `a_fazer` => pending, intermediárias => in_production, `entregue` => finished, cancelado => canceled).
- Relações necessárias:
  - `work_orders.quote_id -> quotes.id` (nullable)
  - `work_orders.company_id -> companies.id`
  - `work_orders.salesperson_id -> salespeople.id` (nullable)
  - `work_orders.carrier_id -> carriers.id` (nullable)
  - `work_order_items.work_order_id -> work_orders.id`
  - `work_order_items.finished_product_id -> finished_products.id`
  - `work_order_items.raw_product_id -> raw_products.id`

#### 10) system_settings (Configurações do sistema)
- Situação: existe o tipo e mock (`mockSystemSettings`), mas não existe tela CRUD dedicada.
- Necessário: criar tela “Configurações” (admin) com formulário para:
  - `company_name`, `document_footer`, `default_quote_validity_days`, `default_waste_percentage`.

## Proposta de Mudanças (implementação após aprovação)

### A) Padronizar o modelo EN (front + types)
Arquivos-alvo:
- [types/index.ts](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/types/index.ts)
- Páginas: [Clients.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/Clients.tsx), [Carriers.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/Carriers.tsx), [Sellers.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/Sellers.tsx), [RawMaterials.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/RawMaterials.tsx), [FinishedProducts.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/FinishedProducts.tsx), [Quotes.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/Quotes.tsx), [QuoteView.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/QuoteView.tsx), [ServiceOrders.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/ServiceOrders.tsx), [ServiceOrderView.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/pages/ServiceOrderView.tsx)

O que fazer:
- Ajustar cada formulário para conter **exatamente** os campos definidos no briefing.
- Manter labels PT-BR e valores EN no storage.
- Implementar selects de relations:
  - companies: `salesperson_id`, `default_carrier_id`
  - quotes/work_orders: `company_id`, `salesperson_id`, `carrier_id`
  - quote_items/work_order_items: `finished_product_id`, `raw_product_id`
- Ajustar listagens e filtros básicos conforme “Orientações Importantes”.

### B) Admin liberado para todo o escopo do schema
Arquivos-alvo:
- [App.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/App.tsx)
- [AppSidebar.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/components/layout/AppSidebar.tsx)

O que fazer:
- Garantir que todos os módulos do schema estejam no menu do admin.
- Garantir que todas as rotas do escopo incluam `admin` em `allow`.

### C) Criar tela de System Settings (admin)
Arquivos-alvo:
- Novo: `src/pages/SystemSettings.tsx`
- Ajustar: [App.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/App.tsx), [AppSidebar.tsx](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/src/components/layout/AppSidebar.tsx)

O que fazer:
- CRUD do registro de settings (single-tenant: um registro).

### D) Preparar persistência no Supabase (normalizada) e instruções SQL
Estratégia recomendada:
- Criar tabelas normalizadas por módulo (em vez do JSON `app_state`), mantendo o front alinhado ao schema.
- Manter RLS simples para MVP: permitir CRUD para usuários autenticados; “admin” segue restrição na UI.
- Tabelas sugeridas (com UUID PK): `companies`, `carriers`, `salespeople`, `raw_products`, `finished_products`, `quotes`, `quote_items`, `work_orders`, `work_order_items`, `system_settings`, além de `user_profiles` já existente.

## Estrutura Final Recomendada (Supabase)

### Convenções gerais
- PK: `id uuid primary key default gen_random_uuid()`
- Datas: `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`
- Trigger `set_updated_at` para atualizar `updated_at` em UPDATE
- Checks de enums via `check (...)` ou via `create type ... as enum` (preferência: CHECK para facilitar alterações no MVP)
- Índices para filtros:
  - `companies(trade_name)`, `companies(city)`
  - `carriers(name)`
  - `salespeople(name)`
  - `raw_products(name)`, `raw_products(code)`
  - `finished_products(name)`, `finished_products(code)`
  - `quotes(quote_number)`, `quotes(status)`, `quotes(company_id)`
  - `work_orders(os_number)`, `work_orders(status)`, `work_orders(company_id)`, `work_orders(workflow_stage)`

### SQL (modelo base + extensão Kanban)
Observação: este SQL é “executável” no Supabase SQL Editor (ajustando se você já tiver tabelas existentes).

1) Extensão UUID
- `create extension if not exists pgcrypto;`

2) Função/trigger updated_at
- `create or replace function set_updated_at() returns trigger ...`
- triggers por tabela.

3) Tabelas
- `companies` com FKs `salesperson_id -> salespeople(id)` e `default_carrier_id -> carriers(id)`
- `carriers`
- `salespeople` com `commission_type` check in ('percentage','fixed')
- `raw_products`
- `finished_products` com `product_type` check in ('label','card','tag','sticker','custom') e FK `default_raw_product_id -> raw_products(id)`
- `quotes` com status check in ('draft','approved','rejected','canceled') e FKs
- `quote_items` com FKs e todos os campos monetários/medidas como `numeric`
- `work_orders` com status check in ('pending','in_production','finished','canceled') + **coluna extra** `workflow_stage text not null default 'a_fazer'` com check nos ids do Kanban
- `work_order_items` com FKs e campos do modelo
- `system_settings`

4) RLS (MVP single-tenant)
- `alter table ... enable row level security;`
- Policies: `to authenticated` permitir select/insert/update/delete.

## Decisões e Premissas
- IDs: UUID.
- Tenancy: single-tenant.
- OS: manter `status` simples do modelo + persistir etapa Kanban via coluna extra `workflow_stage` (extensão necessária ao pedido).
- Campos monetários/medidas: `numeric` no banco e inputs decimais no front.

## Verificação (após implementação)
- Navegação (admin): menu exibe todos os módulos do schema e todas as rotas abrem sem redirecionar para /acesso.
- CRUD: criar/editar/excluir em cada módulo (companies, carriers, salespeople, raw_products, finished_products, quotes+itens, work_orders+itens, system_settings).
- Relations: selects populados e salvamento com FK válido.
- Filtros: listagens com filtros básicos por módulo (conforme briefing).
- Persistência: salvar e recarregar sem perda (primeiro via storage atual; depois via Supabase tabelas).
- SQL: rodar no Supabase SQL Editor sem erros; constraints/fks funcionando; RLS validada com usuário autenticado.

