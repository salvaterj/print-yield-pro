# Plano: Produto Final e Orçamento — Foto + Pantone

## Objetivo
Adicionar campos visuais (foto) e técnicos (Pantone) aos produtos acabados, permitindo referência visual durante orçamentos e produção.

---

## Alterações por Etapa

### 1. Schema SQL (Supabase)

**Tabela `finished_products`** — adicionar colunas:

| Coluna | Tipo | Default | Descrição |
|--------|------|---------|-----------|
| `image_url` | `text` | `NULL` | URL pública da foto do produto |
| `requires_custom_image` | `boolean` | `false` | Flag indicando que foto será enviada depois (p/ produtos personalizados) |
| `pantone_1` | `text` | `NULL` | Código Pantone 1 |
| `pantone_2` | `text` | `NULL` | Código Pantone 2 |
| `pantone_3` | `text` | `NULL` | Código Pantone 3 (chapado) |

**Tabela `quote_items`** — adicionar colunas:

| Coluna | Tipo | Default | Descrição |
|--------|------|---------|-----------|
| `custom_image_url` | `text` | `NULL` | Foto customizada carregada no orçamento |
| `pantone_1` | `text` | `NULL` | Pantone 1 (copiado do produto ou personalizado) |
| `pantone_2` | `text` | `NULL` | Pantone 2 (copiado do produto ou personalizado) |
| `pantone_3` | `text` | `NULL` | Pantone 3 — chapado (copiado do produto ou personalizado) |

**Tabela `work_order_items`** — mesmo padrão de `quote_items`.

**Storage (Supabase)** — criar bucket `product-images` (público) para armazenar imagens de produtos via upload direto do frontend.

---

### 2. Tipos TypeScript (`src/types/index.ts`)

Na interface `FinishedProduct`:
```typescript
image_url: string | null;
requires_custom_image: boolean;
pantone_1: string | null;
pantone_2: string | null;
pantone_3: string | null;
```

Na interface `QuoteItem`:
```typescript
custom_image_url: string | null;
pantone_1: string | null;
pantone_2: string | null;
pantone_3: string | null;
```

Na interface `WorkOrderItem`:
```typescript
custom_image_url: string | null;
pantone_1: string | null;
pantone_2: string | null;
pantone_3: string | null;
```

---

### 3. Frontend — Cadastro de Produtos (`src/pages/FinishedProducts.tsx`)

**Campos novos no formulário:**

a) **Foto do produto**
- Input tipo `file` (accept="image/*") com preview thumbnail
- Ao selecionar, fazer upload para o bucket `product-images` do Supabase Storage
- Após upload, salvar a `publicUrl` no campo `image_url`
- Mostrar thumbnail da imagem se já existir

b) **Flag "Exige foto personalizada"** (aparece quando tipo = `'custom'`)
- Switchlabel: "Exige foto personalizada durante orçamento/produção"
- Quando `true`, a foto do produto fica opcional (o cliente vai enviar depois)
- Quando `false` (padrão para outros tipos), usa a foto do cadastro

c) **Campos Pantone** (aparece sempre, mas destacado quando tipo = `'custom'`)
- `Pantone 1` — Input texto
- `Pantone 2` — Input texto
- `Pantone 3 (Chapado)` — Input texto

d) **Na tabela/listagem**
- Opcional: coluna thumbnail pequena (40x40px) ao lado do código

---

### 4. Frontend — Item do Orçamento (`src/pages/Quotes.tsx`)

a) **Ao adicionar produto ao orçamento**
- Copiar `image_url`, `pantone_1`, `pantone_2`, `pantone_3` do produto selecionado para o item
- Se `requires_custom_image = true`, não copiar imagem (campo fica vazio)

b) **Upload de foto customizada** (quando `requires_custom_image = true` no produto)
- Mostrar área de drop/picker na linha do item
- Ao enviar, fazer upload para bucket `product-images` (pasta `custom/`)
- Salvar `custom_image_url` no item
- Mostrar preview se já tiver imagem

c) **Campos Pantone editáveis no item**
- Exibir campos Pantone 1, 2 e 3 (pré-preenchidos, mas editáveis)
- Podem ser alterados por vendedor antes de gerar a OS

d) **Na view/visualização do orçamento**
- Mostrar thumbnail do produto (se houver)
- Mostrar thumbnail customizada (se houver)
- Mostrar código Pantone com badge colorido como referência visual

---

### 5. Frontend — Item da OS (`src/pages/ServiceOrders.tsx`)

- Mesma lógica de `QuoteView.tsx` (referenciar)
- Pantones e foto customizada visíveis mas opcionalmente editáveis

---

### 6. Mock Data (`src/data/mockData.ts`)

Atualizar `mockFinishedProducts` com novos campos (vazios/null para compatibilidade).

---

### 7. AppContext (`src/contexts/AppContext.tsx`)

- `addFinishedProduct`, `updateFinishedProduct`: novos campos já inclusos via `...input`
- Não requer novos helpers — funciona via spread

---

## Ordem de Implementação Sugerida

| # | Etapa | Prioridade |
|---|-------|-----------|
| 1 | SQL — colunas + storage | Alta |
| 2 | Tipos TypeScript | Alta |
| 3 | FinishedProducts — formulário | Alta |
| 4 | FinishedProducts — upload de imagem | Alta |
| 5 | FinishedProducts — Pantones no form | Média |
| 6 | Quotes — copiar Pantone/foto ao adicionar produto | Alta |
| 7 | Quotes — upload foto customizada no item | Alta |
| 8 | ServiceOrders — mesma lógica de QuoteItems | Média |
| 9 | Visualização — thumbnails + badges Pantone | Média |

---

## Dependências Externas

- **Supabase Storage**: bucket `product-images` (público)
- Upload via `supabase.storage.from('product-images').upload()` —无需 Edge Function

## Tempo Estimado

- 2 a 3 sessões de implementação

---

## Observações

- A lógica de "flag para subir foto depois" é para **produtos personalizados**: o cliente ainda não tem arte finalizada, então a foto do produto no cadastro fica opcional
- Quando `requires_custom_image = true`, o sistema exibe um aviso no item do orçamento pedindo upload de arte antes de confirmar a OS
- Pantones são **referência de cor** — o sistema não valida se o código é válido, apenas persiste o texto
