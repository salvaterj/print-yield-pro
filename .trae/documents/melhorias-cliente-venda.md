# Plano de Melhorias - Sistema de Clientes e Vendas

## Resumo das Alterações

Este plano implementa 5 melhorias no sistema:

1. **Código de cliente gerado automaticamente**
2. **Inscrição estadual isentos**
3. **CEP com função de endereço automático (ViaCEP)**
4. **Vendedor obrigatório em toda venda/orçamento**
5. **Remover prazo de entrega padrão da transportadora**

---

## 1. Código de Cliente Gerado Automaticamente

### Objetivo
Gerar automaticamente códigos sequenciais para novos clientes no formato `CLI-XXXX`.

### Arquivos a modificar:
- `src/types/index.ts` - Interface Company (sem alteração)
- `src/pages/Clients.tsx` - Adicionar lógica de geração automática

### Implementação:
1. No `emptyClient`, não definir o campo `code` inicialmente
2. Criar função `generateClientCode(clients: Company[])` que:
   - Encontra o maior código numérico existente (extraindo números)
   - Retorna próximo código no formato `CLI-0001`
3. Aplicar código automaticamente ao abrir diálogo de novo cliente
4. Manter código editável para，允许 ajustes manuais

---

## 2. Inscrição Estadual Isentos

### Objetivo
Permitir marcar clientes como isentos de inscrição estadual.

### Arquivos a modificar:
- `src/types/index.ts` - Adicionar campo `state_registration_exempt: boolean` na interface `Company`
- `src/pages/Clients.tsx` - Adicionar checkbox no formulário

### Implementação:
1. Adicionar campo `state_registration_exempt: boolean` na interface `Company`
2. Atualizar `emptyClient` com `state_registration_exempt: false`
3. No formulário do cliente:
   - Adicionar Switch/Checkbox "Isento de inscrição estadual"
   - Quando ativado, desabilitar/cancelar o campo de inscrição estadual
4. Atualizar `handleOpenDialog` para carregar o novo campo

---

## 3. CEP com Função de Endereço Automático (ViaCEP)

### Objetivo
Buscar automaticamente endereço, bairro, cidade e UF ao digitar o CEP.

### Arquivos a modificar:
- `src/pages/Clients.tsx` - Adicionar função de consulta ViaCEP
- `src/pages/Carriers.tsx` - Adicionar função de consulta ViaCEP

### Implementação:
1. Criar função assíncrona `fetchAddressByCEP(cep: string)`:
   ```typescript
   async function fetchAddressByCEP(cep: string) {
     const cleanCEP = cep.replace(/\D/g, '');
     if (cleanCEP.length !== 8) return null;

     try {
       const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
       const data = await response.json();
       if (data.erro) return null;
       return {
         address: data.logradouro,
         neighborhood: data.bairro,
         city: data.localidade,
         state: data.uf
       };
     } catch {
       return null;
     }
   }
   ```

2. Adicionar estado `isLoadingAddress` para feedback visual
3. No `onChange` do campo CEP, após formatar:
   - Se CEP completo (8 dígitos), chamar ViaCEP
   - Se encontrar, preencher automaticamente address, neighborhood, city, state
   - Se não encontrar, manter campos editáveis para preenchimento manual

4. Mostrar indicador de carregamento enquanto consulta

---

## 4. Vendedor Obrigatório em Toda Venda/Orçamento

### Objetivo
Tornar o campo vendedor obrigatório na criação de orçamentos e OS.

### Arquivos a modificar:
- `src/pages/Quotes.tsx` - Tornar vendedor obrigatório
- `src/pages/ServiceOrders.tsx` - Tornar vendedor obrigatório
- `src/types/index.ts` - Atualizar tipo se necessário

### Implementação:
1. Em **Quotes.tsx**:
   - Alterar Select de vendedor para não ter opção "Nenhum"
   - Pré-selecionar primeiro vendedor ativo se disponível
   - Validar antes de salvar: `if (!formData.salesperson_id) { toast.error('Selecione um vendedor'); return; }`
   - Remover valor padrão `null` do `emptyQuote`

2. Em **ServiceOrders.tsx**:
   - Mesma lógica do Quotes.tsx
   - Pré-selecionar vendedor do orçamento origem se existir

3. Verificar se há vendedor padrão configurado no sistema para pré-seleção

---

## 5. Remover Prazo de Entrega Padrão da Transportadora

### Objetivo
Remover o campo `delivery_time_days` do cadastro de transportadoras.

### Arquivos a modificar:
- `src/types/index.ts` - Remover campo `delivery_time_days` da interface `Carrier`
- `src/pages/Carriers.tsx` - Remover campo do formulário
- `src/data/mockData.ts` - Remover campo dos mocks

### Implementação:
1. Remover `delivery_time_days: number` da interface `Carrier`
2. Remover dos lugares em `emptyCarrier`
3. Remover do `handleOpenDialog` (inicialização)
4. Remover do formulário UI:
   - Remover `<div className="space-y-2">` com Label e Input de `delivery_time_days`
5. Remover dos mocks em `mockData.ts`
6. Verificar se há uso em PDFs (pdfGenerator.ts) e ajustar se necessário

---

## Arquivos a Modificar

| Arquivo | Mudanças |
|---------|---------|
| `src/types/index.ts` | Adicionar `state_registration_exempt` em Company; Remover `delivery_time_days` de Carrier |
| `src/pages/Clients.tsx` | Gerar código automático; Adicionar campo isento IE; Adicionar consulta ViaCEP |
| `src/pages/Carriers.tsx` | Adicionar consulta ViaCEP; Remover campo prazo de entrega |
| `src/pages/Quotes.tsx` | Vendedor obrigatório |
| `src/pages/ServiceOrders.tsx` | Vendedor obrigatório |
| `src/data/mockData.ts` | Remover `delivery_time_days` |

---

## Validação e Testes

1. **Testar geração automática de código**:
   - Criar novo cliente e verificar se código é gerado (CLI-0001, CLI-0002, etc.)

2. **Testar inscrição estadual isento**:
   - Criar cliente com "Isento" marcado e verificar que campo IE fica disabled

3. **Testar consulta ViaCEP**:
   - Digitar CEP válido (ex: 01310-100) e verificar preenchimento automático
   - Digitar CEP inválido e verificar que campos permanecem editáveis

4. **Testar vendedor obrigatório**:
   - Tentar criar orçamento/OS sem vendedor e verificar mensagem de erro
   - Verificar pré-seleção de vendedor

5. **Testar remoção de prazo transportadora**:
   - Verificar que campo não aparece mais no formulário de transportadora
   - Verificar que transportadoras existentes continuam funcionando

---

## Observações Adicionais

- O erro 400 mencionado pelo usuário pode estar relacionado à configuração do Supabase ou à consulta ViaCEP (que faz chamada externa). Garantir que erros sejam tratados adequadamente.
- Manter compatibilidade com dados existentes no banco Supabase.
