

## Plano de Implementacao: Novas Funcionalidades LabelFlow

### Resumo das Mudancas

O usuario solicitou 5 novas funcionalidades para o sistema:

1. **Cadastro de Vendedor** - Entidade separada com comissao padrao, linkado a clientes por CNPJ
2. **Calculo de Comissao** - Exibir comissao calculada nas vendas/orcamentos
3. **Estoque de Produtos Acabados** - Adicionar saldo/estoque aos produtos acabados
4. **Transformacao Bobina -> Produto** - Converter materia-prima em produto acabado

---

### 1. Novas Estruturas de Dados

**Arquivo:** `src/types/index.ts`

Adicionar nova interface Seller (Vendedor):

```typescript
export interface Seller {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  comissao_padrao_percent: number; // Ex: 5 = 5%
  clientes_ids: string[];          // Lista de clientes vinculados
  ativo: boolean;
  observacoes: string;
  created_at: string;
  updated_at: string;
}
```

Modificar FinishedProduct para incluir estoque:

```typescript
export interface FinishedProduct {
  // ... campos existentes
  estoque_rolos: number;        // Quantidade de rolos em estoque
  estoque_minimo_rolos: number; // Alerta de estoque baixo
}
```

Modificar Quote para incluir vendedor_id e comissao:

```typescript
export interface Quote {
  // ... campos existentes
  vendedor_id?: string;          // Referencia ao vendedor
  vendedor?: Seller;             // Objeto vendedor populado
  comissao_percent: number;      // Comissao aplicada neste orcamento
  comissao_valor: number;        // Valor calculado da comissao
}
```

Modificar ServiceOrder para incluir vendedor_id:

```typescript
export interface ServiceOrder {
  // ... campos existentes
  vendedor_id?: string;
  vendedor?: Seller;
}
```

---

### 2. Novo Modulo: Cadastro de Vendedores

**Novo arquivo:** `src/pages/Sellers.tsx`
**Rota:** `/vendedores`

**Funcionalidades:**
- CRUD completo de vendedores
- Campos: Nome, Email, Telefone, Comissao Padrao (%), Observacoes, Ativo
- Vinculacao de clientes (multiselect por CNPJ)
- Listagem com busca e filtros
- Indicador de clientes vinculados

**UI da Pagina:**
- Tabela com colunas: Nome, Email, Comissao %, Clientes Vinculados, Status, Acoes
- Dialog de criacao/edicao
- Na edicao: secao para vincular/desvincular clientes

---

### 3. Atualizacoes no Contexto

**Arquivo:** `src/contexts/AppContext.tsx`

Adicionar:
- Estado `sellers` com dados mock
- Funcoes CRUD: `addSeller`, `updateSeller`, `deleteSeller`
- Funcao helper: `getSellerByClientId(clientId)` - retorna vendedor vinculado ao cliente

---

### 4. Atualizacoes nos Dados Mock

**Arquivo:** `src/data/mockData.ts`

Adicionar:

```typescript
export const mockSellersData: Seller[] = [
  {
    id: 'seller-001',
    nome: 'Mariana Silva',
    email: 'mariana@labelflow.com',
    telefone: '(11) 99999-0001',
    comissao_padrao_percent: 5,
    clientes_ids: ['cli-001', 'cli-004'], // Bom Preco e J.E Makes
    ativo: true,
    observacoes: 'Vendedora senior',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'seller-002',
    nome: 'Andre Vendas',
    email: 'andre@labelflow.com',
    telefone: '(11) 99999-0002',
    comissao_padrao_percent: 4,
    clientes_ids: ['cli-002', 'cli-003'], // Farmacia e Metalfix
    ativo: true,
    observacoes: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];
```

Atualizar mockFinishedProducts adicionando estoque:

```typescript
{
  // ... campos existentes
  estoque_rolos: 50,
  estoque_minimo_rolos: 10,
}
```

---

### 5. Calculo de Comissao nos Orcamentos

**Arquivo:** `src/pages/Quotes.tsx` e `src/pages/QuoteView.tsx`

**Logica:**
1. Ao selecionar cliente, buscar vendedor vinculado automaticamente
2. Preencher comissao_percent com a comissao_padrao do vendedor
3. Permitir ajustar comissao manualmente
4. Calcular: `comissao_valor = valor_final * (comissao_percent / 100)`

**Exibicao:**
- No form de criacao: mostrar vendedor auto-selecionado + campo comissao editavel
- Na visualizacao: card "Comissao do Vendedor" com nome, %, valor calculado
- Na listagem: nova coluna "Comissao" (opcional)

---

### 6. Estoque de Produtos Acabados

**Arquivo:** `src/pages/FinishedProducts.tsx`

**Mudancas:**
- Adicionar colunas na tabela: "Estoque" e indicador visual de estoque baixo
- No form: campos "Estoque Atual (rolos)" e "Estoque Minimo"
- Badge de alerta quando estoque < minimo

**Arquivo:** `src/pages/Dashboard.tsx`

- Adicionar card "Produtos Estoque Baixo" similar ao de bobinas

---

### 7. Transformacao Bobina -> Produto

**Nova funcao no contexto:** `transformBobinaToProduct(bobinaId, productConfig)`

**Novo dialog em:** `src/pages/RawMaterials.tsx` (ou botao na tabela)

**Fluxo:**
1. Usuario seleciona bobina disponivel
2. Abre dialog "Produzir Produto Acabado"
3. Seleciona produto acabado destino (ou cria novo)
4. Informa quantidade de rolos a produzir
5. Sistema calcula:
   - Metragem de bobina necessaria (usando calculo de aproveitamento)
   - Verifica se ha saldo suficiente
6. Ao confirmar:
   - Debita saldo_m da bobina
   - Credita estoque_rolos do produto acabado
   - Registra log/historico

**UI do Dialog:**
- Seletor de produto destino
- Input quantidade rolos
- Exibicao do calculo de aproveitamento (pistas, metragem necessaria)
- Alerta se bobina nao tem saldo suficiente
- Botao "Confirmar Producao"

---

### 8. Atualizacoes na Sidebar

**Arquivo:** `src/components/layout/AppSidebar.tsx`

Adicionar menu:
```typescript
{ title: 'Vendedores', url: '/vendedores', icon: UserCog, profiles: ['admin', 'vendas'] },
```

---

### 9. Atualizacoes nas Rotas

**Arquivo:** `src/App.tsx`

Adicionar:
```tsx
<Route path="/vendedores" element={<Sellers />} />
```

---

### Resumo de Arquivos

| Acao | Arquivo |
|------|---------|
| Criar | `src/pages/Sellers.tsx` |
| Modificar | `src/types/index.ts` |
| Modificar | `src/data/mockData.ts` |
| Modificar | `src/contexts/AppContext.tsx` |
| Modificar | `src/pages/FinishedProducts.tsx` |
| Modificar | `src/pages/RawMaterials.tsx` |
| Modificar | `src/pages/Quotes.tsx` |
| Modificar | `src/pages/QuoteView.tsx` |
| Modificar | `src/pages/Dashboard.tsx` |
| Modificar | `src/components/layout/AppSidebar.tsx` |
| Modificar | `src/App.tsx` |

---

### Detalhamento Tecnico

**Calculo de Comissao (automatico):**
```typescript
// Ao selecionar cliente no orcamento
const seller = sellers.find(s => s.clientes_ids.includes(clientId));
if (seller) {
  setVendedorId(seller.id);
  setComissaoPercent(seller.comissao_padrao_percent);
}

// Calculo do valor
const comissaoValor = valorFinal * (comissaoPercent / 100);
```

**Transformacao Bobina -> Produto:**
```typescript
// Inputs
const quantidadeRolos = 100;
const metragemPorRolo = 30; // do produto

// Calculos
const pistas = Math.floor((bobina.largura_mm - 2) / produto.largura_mm);
const metragemTotalProduto = quantidadeRolos * metragemPorRolo;
const metragemBobinaNecessaria = metragemTotalProduto / pistas;
const metragemComPerdas = metragemBobinaNecessaria * 1.03; // 3% perdas

// Validacao
if (metragemComPerdas > bobina.saldo_m) {
  throw new Error('Saldo insuficiente');
}

// Atualizacoes
bobina.saldo_m -= metragemComPerdas;
produto.estoque_rolos += quantidadeRolos;
```

