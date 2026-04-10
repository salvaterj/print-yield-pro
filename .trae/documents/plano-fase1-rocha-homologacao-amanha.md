# Plano — Fase 1 Rocha para homologação amanhã

## Summary

Objetivo: preparar o sistema para a equipe da Rocha usar amanhã em regime de homologação, exibindo **somente** o escopo da fase 1 definido pelo usuário, com **persistência real já nesta etapa**, e ocultando tudo o que estiver fora desse escopo.

Escopo funcional confirmado para a fase 1:

- Cadastros estruturados
  - Cadastro completo da empresa
  - Cadastro de transportadoras
  - Cadastro de vendedores com regra de comissão
  - Integração entre empresa, vendedores e transportadoras
  - Cadastro de produto bruto (bobinas)
  - Cadastro de produto acabado
- Orçamento inteligente
  - Criação de orçamento por cliente
  - Seleção de produto + bobina
  - Cálculo automático de aproveitamento
  - Cálculo estimado de consumo de matéria-prima
  - Visualização estruturada do orçamento
  - Exportação em PDF
- Pedido / Ordem de Serviço
  - Conversão automática de orçamento em OS
  - Estrutura completa da OS conforme modelo operacional
  - Cálculo técnico integrado
  - Exportação de OS em PDF

Decisões fechadas com o usuário:

- Amanhã é **homologação**, não operação plena.
- Tudo fora da lista da fase 1 deve ser **ocultado** da interface.
- Cadastro de empresa e transportadoras é **obrigatório na demo**.
- Persistência real **entra amanhã**.
- Cenário é de **uma empresa só** nesta fase.
- Regra de transportadora é **por cliente**.
- Persistência real será viabilizada com ajuste para **Supabase** e posterior subida em **VPS da Hostinger**.

## Current State Analysis

### Rotas e módulos existentes

Arquivo: `src/App.tsx`

Rotas atuais implementadas:

- `/` dashboard
- `/clientes`
- `/vendedores`
- `/bobinas`
- `/produtos`
- `/orcamentos`
- `/orcamentos/:id`
- `/os`
- `/os/:id`
- `/kanban`
- `/fiscal`

Conclusão:

- Já existe base para **vendedores**, **bobinas**, **produtos**, **orçamentos**, **OS**, **PDF de orçamento** e **PDF de OS**.
- Existem módulos fora do escopo da fase 1 visível de amanhã:
  - `Dashboard`
  - `Kanban`
  - `Fiscal`

### Modelo de dados atual

Arquivo: `src/types/index.ts`

Tipos já existentes:

- `Client`
- `Seller`
- `RawMaterial`
- `FinishedProduct`
- `Quote`
- `QuoteItem`
- `YieldSnapshot`
- `ServiceOrder`

Lacunas relevantes:

- Não existe tipo para `Company`.
- Não existe tipo para `Carrier` / `Transportadora`.
- `Client` não possui vínculo com:
  - empresa
  - transportadora preferencial
- `Quote` não possui referência de empresa e transportadora.
- `ServiceOrder` não possui referência de empresa e transportadora.

### Estado e persistência atual

Arquivo: `src/contexts/AppContext.tsx`

Situação atual:

- Todo o estado é mantido com `useState`.
- Os dados vêm de `src/data/mockData.ts`.
- Não existe backend nem persistência real.
- O contexto expõe CRUD local para:
  - clientes
  - vendedores
  - bobinas
  - produtos
  - orçamentos
  - OS

Impacto:

- Hoje o sistema perde dados ao recarregar.
- Para amanhã, a troca de mock/local state para persistência real é obrigatória.

### Fluxo comercial existente

Arquivos:

- `src/pages/Quotes.tsx`
- `src/pages/QuoteView.tsx`
- `src/components/YieldCalculator.tsx`

Situação atual:

- Criação de orçamento já existe.
- Seleção de cliente já existe.
- Vendedor pode ser auto-selecionado via `getSellerByClientId`.
- Itens do orçamento já trabalham com:
  - produto acabado
  - bobina
  - cálculo de aproveitamento
  - custo estimado de matéria-prima
- Visualização detalhada do orçamento já existe.
- Exportação PDF do orçamento já existe.
- Conversão de orçamento em OS já existe.

Lacunas:

- Não há empresa no orçamento.
- Não há transportadora no orçamento.
- A regra “transportadora por cliente” ainda não existe.

### Fluxo de OS existente

Arquivos:

- `src/pages/ServiceOrders.tsx`
- `src/pages/ServiceOrderView.tsx`
- `src/lib/pdfGenerator.ts`

Situação atual:

- Listagem de OS já existe.
- Conversão automática de orçamento em OS já existe.
- Estrutura operacional detalhada da OS já existe.
- Cálculo técnico integrado via `YieldCalculator` já existe.
- Exportação de OS em PDF já existe.

Lacunas:

- OS não carrega empresa.
- OS não carrega transportadora.
- Parte da navegação da OS está misturada com escopo de produção/fiscal que deve ficar oculto nesta fase visível.

## Proposed Changes

### 1) Introduzir persistência real com Supabase

Arquivos novos/alterados esperados:

- `package.json`
- `src/lib/` (cliente do Supabase e helpers)
- `src/contexts/AppContext.tsx`
- `src/types/index.ts`
- possivelmente `src/data/mockData.ts` apenas para fallback/transição, se necessário
- arquivos `.env` ou equivalente de configuração (a depender da estratégia adotada no projeto)

O que fazer:

- Adicionar dependências do Supabase.
- Criar cliente de acesso ao Supabase em `src/lib`.
- Substituir o `AppContext` baseado em `useState + mockData` por carregamento/salvamento real.
- Preservar a mesma API consumida pelas páginas sempre que possível, para reduzir o refactor.

Como fazer:

- Criar camada mínima de acesso a dados por entidade:
  - empresa
  - transportadoras
  - clientes
  - vendedores
  - bobinas
  - produtos acabados
  - orçamentos
  - OS
- No `AppContext`, carregar os dados ao iniciar e adaptar os CRUDs existentes para `insert/update/delete/select`.
- Garantir que as páginas continuem funcionando com o mínimo de mudanças visuais.

Por que:

- O requisito explícito é persistência real já amanhã.
- A maior parte das páginas já está pronta no front; trocar a fonte de dados é a forma mais rápida de viabilizar homologação útil.

### 2) Adicionar cadastro de empresa (empresa única)

Arquivos novos/alterados esperados:

- `src/types/index.ts`
- `src/contexts/AppContext.tsx`
- `src/components/layout/AppSidebar.tsx`
- `src/App.tsx`
- nova página em `src/pages/` para empresa
- `src/data/mockData.ts` apenas se usado como bootstrap temporário

O que fazer:

- Criar tipo `Company`.
- Criar suporte no contexto para carregar/salvar a empresa principal.
- Criar uma tela de cadastro/edição de empresa única.
- Incluir esta tela na navegação da fase 1.

Campos mínimos recomendados para a fase 1:

- razão social
- nome fantasia
- CNPJ
- IE (se necessário)
- endereço
- telefone
- e-mail
- responsável
- observações
- logo (se necessário nesta fase, opcional)

Como fazer:

- Tela simples, estilo CRUD de entidade única.
- Se houver apenas uma empresa, a UI pode operar como “Configurações da empresa”.

Por que:

- É item obrigatório da fase 1.
- Também servirá como base de relacionamento com clientes, vendedores e transportadoras.

### 3) Adicionar cadastro de transportadoras

Arquivos novos/alterados esperados:

- `src/types/index.ts`
- `src/contexts/AppContext.tsx`
- nova página em `src/pages/`
- `src/App.tsx`
- `src/components/layout/AppSidebar.tsx`

O que fazer:

- Criar tipo `Carrier` / `Transportadora`.
- Criar CRUD completo de transportadoras.
- Adicionar listagem, busca e formulário, seguindo o padrão visual de `Clients.tsx` e `Sellers.tsx`.

Campos mínimos recomendados:

- nome
- CNPJ
- contato
- telefone
- e-mail
- observações
- ativa/inativa

Por que:

- É item obrigatório da fase 1.
- Viabiliza a regra de transportadora por cliente.

### 4) Integrar empresa, vendedores e transportadoras

Arquivos novos/alterados esperados:

- `src/types/index.ts`
- `src/contexts/AppContext.tsx`
- `src/pages/Clients.tsx`
- `src/pages/Sellers.tsx`
- páginas de orçamento e OS

O que fazer:

- Empresa:
  - tratar uma empresa principal como dona da operação nesta fase.
- Vendedores:
  - manter regra de comissão já existente.
  - validar vínculo com clientes.
- Transportadoras:
  - aplicar regra por cliente.

Decisão de modelagem para a fase 1:

- Cada cliente terá uma `transportadora_preferencial_id`.
- Como há uma única empresa nesta fase, o vínculo de empresa pode ser global ou por FK simples em cliente/orçamento/OS.

Como fazer:

- Estender `Client` com:
  - `transportadora_id`
  - eventualmente `company_id`
- Na tela de clientes, permitir escolher a transportadora preferencial.
- Em orçamento e OS, carregar automaticamente a transportadora do cliente, com possibilidade de exibição clara.

Por que:

- Essa é a regra operacional confirmada pelo usuário.

### 5) Restringir a navegação ao escopo da fase 1

Arquivos novos/alterados esperados:

- `src/App.tsx`
- `src/components/layout/AppSidebar.tsx`
- possivelmente `src/pages/Dashboard.tsx`

O que fazer:

- Ocultar da navegação e da apresentação tudo o que estiver fora do escopo visível de amanhã.

Itens a ocultar, salvo necessidade operacional interna:

- `Dashboard`
- `Kanban`
- `Fiscal`

Itens que devem permanecer:

- Empresa
- Clientes
- Transportadoras
- Vendedores
- Bobinas
- Produtos
- Orçamentos
- OS

Como fazer:

- Ajustar `menuItems` em `AppSidebar.tsx`.
- Rever rota inicial em `App.tsx`:
  - opção 1: manter `/` apontando para uma tela da fase 1
  - opção 2: redirecionar `/` para orçamentos ou empresa

Por que:

- O usuário definiu explicitamente que o que estiver fora da lista deve ser ocultado.

### 6) Completar o fluxo de orçamento com empresa + transportadora

Arquivos novos/alterados esperados:

- `src/types/index.ts`
- `src/pages/Quotes.tsx`
- `src/pages/QuoteView.tsx`
- `src/lib/pdfGenerator.ts`

O que fazer:

- Incluir dados de empresa e transportadora no orçamento.
- Garantir que o orçamento mostre:
  - cliente
  - vendedor
  - produto
  - bobina
  - aproveitamento
  - consumo estimado de matéria-prima
  - empresa
  - transportadora vinculada ao cliente

Como fazer:

- Ao selecionar cliente:
  - carregar vendedor padrão
  - carregar transportadora preferencial
- Salvar esses dados no orçamento.
- Exibir esses campos no detalhe do orçamento.
- Levar esses campos para o PDF do orçamento.

Por que:

- Fecha o escopo comercial esperado para homologação de amanhã.

### 7) Completar o fluxo de OS com empresa + transportadora

Arquivos novos/alterados esperados:

- `src/types/index.ts`
- `src/pages/Quotes.tsx`
- `src/pages/QuoteView.tsx`
- `src/pages/ServiceOrders.tsx`
- `src/pages/ServiceOrderView.tsx`
- `src/lib/pdfGenerator.ts`

O que fazer:

- Na conversão orçamento → OS, carregar:
  - empresa
  - transportadora
  - produto/bobina
  - cálculo técnico
- Ajustar a visualização da OS para refletir o modelo operacional da fase 1.
- Incluir empresa e transportadora no PDF da OS.

Como fazer:

- Estender `ServiceOrder` com os novos campos.
- Ajustar a função de conversão existente em:
  - `src/pages/Quotes.tsx`
  - `src/pages/QuoteView.tsx`
- Exibir os campos na listagem e no detalhe da OS onde fizer sentido.

Por que:

- É continuidade direta do fluxo da fase 1.

### 8) Manter e validar o cálculo técnico já existente

Arquivos relevantes:

- `src/components/YieldCalculator.tsx`
- `src/pages/QuoteView.tsx`
- `src/pages/ServiceOrderView.tsx`

O que fazer:

- Reaproveitar o cálculo existente.
- Garantir que a persistência real salve corretamente:
  - bobina selecionada
  - snapshot do aproveitamento
  - estimativa de consumo de matéria-prima

Como fazer:

- Validar serialização do `YieldSnapshot`.
- Confirmar que o quote item e a OS persistem esses dados no banco.

Por que:

- Essa parte já existe e deve ser protegida, não redesenhada.

### 9) Ajustar PDFs para a fase 1

Arquivos relevantes:

- `src/lib/pdfGenerator.ts`

O que fazer:

- Preservar o branding já ajustado.
- Incluir empresa e transportadora nos PDFs quando os campos existirem.
- Garantir que o layout do orçamento e da OS reflita os dados que o time verá amanhã.

Por que:

- PDF é explicitamente parte do escopo da fase 1.

## Assumptions & Decisions

### Assumptions

- A equipe da Rocha vai usar amanhã em homologação assistida.
- O usuário quer limitar a interface ao escopo comunicado na apresentação.
- O banco e as credenciais do Supabase estarão disponíveis em tempo hábil para configuração.
- O deploy em VPS da Hostinger pode acontecer em seguida, mas o foco imediato é a preparação do sistema com persistência real.

### Decisions

- Empresa única nesta fase.
- Transportadora por cliente.
- Kanban/Fiscal/Dashboard fora da apresentação visível de amanhã.
- O fluxo central da homologação será:
  - empresa
  - clientes
  - transportadoras
  - vendedores
  - bobinas
  - produtos
  - orçamentos
  - OS
- Não reimplementar cálculo técnico; apenas persisti-lo corretamente.

## Verification Steps

### Funcional

1. Empresa
   - Criar/editar a empresa principal e confirmar persistência após reload.

2. Transportadoras
   - Criar/editar/excluir transportadoras.
   - Confirmar listagem e persistência.

3. Clientes
   - Vincular transportadora preferencial ao cliente.
   - Confirmar persistência.

4. Vendedores
   - Criar vendedor com comissão.
   - Vincular clientes e validar auto-seleção no orçamento.

5. Bobinas e produtos
   - Criar/editar cadastros.
   - Confirmar persistência.

6. Orçamento
   - Criar orçamento por cliente.
   - Selecionar produto + bobina.
   - Validar cálculo de aproveitamento e consumo estimado.
   - Confirmar visualização estruturada.
   - Gerar PDF.

7. Conversão em OS
   - Converter orçamento em OS.
   - Confirmar que empresa, transportadora, produto, bobina e snapshot técnico foram carregados.
   - Gerar PDF da OS.

8. Ocultação de escopo
   - Confirmar que Dashboard, Kanban e Fiscal não aparecem para a apresentação da fase 1.

### Técnica

1. Executar lint.
2. Executar testes.
3. Executar build.
4. Validar reload completo com persistência real.
5. Validar variáveis de ambiente do Supabase.

### Aceite para amanhã

- O time consegue cadastrar empresa, transportadoras, vendedores, bobinas e produtos.
- O time consegue gerar orçamento com cálculo técnico e PDF.
- O time consegue converter orçamento em OS e gerar PDF.
- Os dados continuam salvos após recarregar.
- A navegação visível está limpa e focada apenas na fase 1.

