# LabelFlow (print-yield-pro)

Aplicação web (front-end) para simular um sistema interno de uma gráfica de etiquetas: cadastro de clientes e vendedores, controle de bobinas (matéria‑prima), catálogo de produtos acabados, orçamentos e fluxo de produção por OS (Ordem de Serviço) com Kanban, incluindo cálculo de aproveitamento da bobina e emissão de NF (simulada).

## Status atual (importante)

- Backend: Supabase (Auth + tabelas do domínio).
- Os dados são carregados/salvos nas tabelas do Supabase (é necessário estar logado).
- “Exportar PDF” abre uma janela de impressão do navegador com um layout em HTML (você pode “Salvar como PDF” no print).

## Como rodar (preview)

Pré-requisitos: Node.js + npm.

Crie um arquivo `.env` (não comitar) baseado em [.env.example](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/.env.example) e configure:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

```bash
npm install
npm run dev
```

Acesse: http://localhost:5173

## Produção (Docker / EasyPanel)

Este projeto possui [Dockerfile](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/Dockerfile) para build do Vite e servir como SPA via Nginx (fallback de rotas) em [nginx.conf](file:///Users/julianosalvater/Documents/Projetos%20Trae/Rocha%20Etiquetas%20System/print-yield-pro/nginx.conf).

No EasyPanel:
- Fonte: GitHub (build via Dockerfile)
- Porta do container: `80`
- Build args (importante, Vite embute no bundle): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Opcional local:
```bash
docker build -t print-yield-pro \
  --build-arg VITE_SUPABASE_URL="https://xxxx.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="xxxxx" \
  .
docker run --rm -p 8080:80 print-yield-pro
```

### Scripts úteis

```bash
npm run build
npm run preview
npm run lint
npm run test
```

## Tecnologias

- Vite + React + TypeScript
- React Router (rotas)
- Tailwind CSS + shadcn-ui (UI)
- date-fns (datas)
- vitest + testing-library (testes)

## Arquitetura (alto nível)

- Rotas e páginas: `src/App.tsx` + `src/pages/*`
- Layout principal (sidebar + header): `src/components/layout/*`
- Estado e “banco” em memória: `src/contexts/AppContext.tsx`
- Dados iniciais (mock): `src/data/mockData.ts`
- Tipos (domínio): `src/types/index.ts`
- Impressão (“PDF”): `src/lib/pdfGenerator.ts`
- Cálculo de aproveitamento: `src/components/YieldCalculator.tsx`

## Como funciona (fluxo do produto)

### 1) Perfis (simulação)

No topo, existe um seletor de perfil (Admin, Vendas, Produção, Fiscal, Impressão). Ele afeta:

- Quais itens aparecem no menu lateral.
- Restrições em ações específicas (ex.: emissão de NF).

### 2) Cadastros e estoques

- **Clientes** (`/clientes`): CRUD simples e busca local.
- **Vendedores** (`/vendedores`): CRUD e vínculo de clientes por vendedor (comissão padrão).
- **Bobinas** (`/bobinas`): CRUD com filtros por status e ação de transformação.
  - A transformação “bobina → produto” consome metragem da bobina e aumenta o estoque de rolos do produto.
- **Produtos** (`/produtos`): CRUD, preço base e controle de estoque mínimo (alerta de baixo estoque).

### 3) Orçamentos → Ordem de Serviço

- **Orçamentos** (`/orcamentos`):
  - Cria orçamento com itens (produto, qtd de rolos, valor unitário).
  - Vendedor pode ser selecionado automaticamente a partir do cliente (se houver vínculo).
  - Ações: visualizar detalhes e imprimir.
  - Conversão: um orçamento pode ser convertido em **OS**, iniciando o fluxo de produção.

### 4) Produção (OS e Kanban)

- **OS (lista)** (`/os`): lista de ordens, com destaque para atraso por prazo.
- **OS (detalhe)** (`/os/:id`):
  - Avanço de etapa (conforme colunas do Kanban).
  - Controle de “Qualidade OK” (necessário para avançar para “Pronto p/ NF”).
  - Cálculo e salvamento de “snapshot” de aproveitamento (ver abaixo).
  - Impressão da OS.
- **Kanban** (`/kanban`):
  - Colunas: A Fazer → Preparação → Impressão → Rebobinagem/Corte → Acabamento → Qualidade → Pronto p/ NF → NF Emitida → Entregue.
  - Ações rápidas no card: avançar etapa, imprimir, adicionar observações e marcar qualidade.

### 5) Fiscal (emissão de NF simulada)

- **Fiscal** (`/fiscal`):
  - Acesso apenas para perfil Fiscal/Admin.
  - Emite NF para OS em “Pronto p/ NF”, registrando número/data/valor e mudando status para “NF Emitida”.

## Cálculo de Aproveitamento (Yield)

O cálculo serve para estimar quantas “pistas” cabem na bobina e quanto de matéria‑prima será consumida para produzir uma quantidade de rolos.

Resumo:

- Pistas = floor((largura_bobina - margem) / largura_produto)
- Eficiência % = (pistas * largura_produto / largura_bobina) * 100
- MP teórica = metragem_final_total / pistas
- MP com perdas = MP teórica * (1 + perdas%)
- Custo estimado = MP com perdas * custo_por_m

Os valores padrão usados na UI são:

- Margem de corte: 2mm
- Perdas: 3%

## Limitações conhecidas

- Sem persistência, autenticação ou permissões reais (é uma simulação via estado local).
- “Busca global” no header existe, mas ainda não está conectada às telas.
