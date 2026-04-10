# Perfis de usuários — Fase 1 (Rocha)

Perfis contemplados nesta fase:

- Administrador
- Vendas
- Produção

## Regras gerais

- O perfil define:
  - quais módulos aparecem na navegação
  - quais ações ficam disponíveis nas telas
  - quais campos podem ser editados
- Produção não deve ver valores/comissões.
- Vendas não deve gerenciar cadastros técnicos (transportadoras, vendedores, bobinas e produtos) além do necessário.

## Permissões por módulo

Legenda: Ver / Criar / Editar / Excluir / PDF / Converter

### Empresa

- Administrador: Ver, Editar
- Vendas: Ver
- Produção: Ver (opcional)

### Transportadoras

- Administrador: Ver, Criar, Editar, Excluir
- Vendas: Ver (somente seleção em cliente)
- Produção: Ver (opcional)

### Clientes

- Administrador: Ver, Criar, Editar, Excluir (todos os campos)
- Vendas: Ver, Criar, Editar (somente campos comerciais)
- Produção: Ver

Campos comerciais (Vendas):

- nome fantasia
- contato (nome)
- telefone
- e-mail
- endereço
- observações
- transportadora preferencial (seleção)

Campos restritos (somente Administrador):

- razão social (não editar por Vendas quando cliente já existe)
- CNPJ (não editar por Vendas quando cliente já existe)

### Vendedores (comissão)

- Administrador: Ver, Criar, Editar, Excluir
- Vendas: Ver
- Produção: sem acesso

### Bobinas (produto bruto)

- Administrador: Ver, Criar, Editar, Excluir
- Vendas: Ver
- Produção: Ver

### Produtos acabados

- Administrador: Ver, Criar, Editar, Excluir
- Vendas: Ver
- Produção: Ver

### Orçamentos

- Administrador: Ver, Criar, Editar, Excluir, PDF, Converter em OS
- Vendas: Ver, Criar, Editar, PDF, Converter em OS
- Produção: Ver, PDF

### OS (Ordem de Serviço)

- Administrador: Ver, Editar, Excluir, PDF
- Vendas: Ver, PDF
- Produção: Ver, Editar (campos operacionais), PDF

Campos operacionais (Produção):

- bobina selecionada/reservada
- cálculo técnico (snapshot de aproveitamento/consumo) quando gerado na OS
- observações e logs operacionais

## Usuários (admin)

- Administrador cadastra usuários e define perfil.
- Login é por email e senha.
