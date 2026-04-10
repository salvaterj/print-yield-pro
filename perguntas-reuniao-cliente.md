# Reunião com o cliente — Checklist de dúvidas (Rocha Etiquetas)

Use este documento como roteiro da reunião para fechar escopo e reduzir riscos antes de implementar backend, usuários reais, integrações e regras de negócio.

## Como usar

- Marque os itens conforme forem respondidos.
- Preencha “Resposta/Decisão” com algo objetivo (sim/não, número, responsável, data).
- Ao final, copie a seção “Decisões de escopo” e confirme com o cliente.

---

## 1) Contexto e objetivo do sistema

- [ ] Qual é o objetivo principal do sistema (vendas, produção, fiscal, tudo integrado)?
  - Resposta/Decisão:
- [ ] Quais problemas atuais o sistema precisa resolver primeiro?
  - Resposta/Decisão:
- [ ] Há filiais/empresas diferentes ou é uma única operação?
  - Resposta/Decisão:
- [ ] Quais indicadores definem sucesso do projeto (ex.: reduzir atrasos, rastrear estoque, reduzir erros de NF)?
  - Resposta/Decisão:

---

## 2) Usuários, perfis e acesso

### 2.1 Quantidade e organização

- [ ] Quantos usuários totais (agora e em 6–12 meses)?
  - Resposta/Decisão:
- [ ] Quantos por área: Vendas / Produção / Fiscal / Impressão / Admin?
  - Resposta/Decisão:
- [ ] Existe hierarquia (gerente aprova, operador executa, etc.)?
  - Resposta/Decisão:
- [ ] Há necessidade de separar dados por filial/empresa (multi-tenant)?
  - Resposta/Decisão:

### 2.2 Autenticação

- [ ] Como será o login: e-mail/senha, Google/Microsoft, SSO (Azure AD), outro?
  - Resposta/Decisão:
- [ ] Há política de senha, MFA, expiração, bloqueio por tentativas?
  - Resposta/Decisão:

### 2.3 Permissões e auditoria

- [ ] Quais ações cada perfil pode fazer? (criar/editar/excluir; avançar etapa; emitir NF; imprimir; configurar)
  - Resposta/Decisão:
- [ ] Precisa de trilha de auditoria completa? (quem alterou o quê e quando)
  - Resposta/Decisão:
- [ ] Quais dados são sensíveis e devem ser restritos (valores, custos, comissões, NF)?
  - Resposta/Decisão:

---

## 3) Operação e volume (dimensionamento)

- [ ] Volume médio de Orçamentos/dia e OS/dia?
  - Resposta/Decisão:
- [ ] Quantos itens por orçamento (média e máximo)?
  - Resposta/Decisão:
- [ ] Quantos produtos/bobinas cadastrados hoje?
  - Resposta/Decisão:
- [ ] Picos sazonais (datas/meses) e exigências de performance?
  - Resposta/Decisão:
- [ ] SLA interno: prazos típicos, tempo máximo para gerar PDF, tempo de consulta, etc.
  - Resposta/Decisão:

---

## 4) Fluxo de trabalho (Orçamento → OS → Produção → Fiscal)

### 4.1 Orçamentos

- [ ] Quem cria o orçamento? Quem aprova/enviam para o cliente?
  - Resposta/Decisão:
- [ ] Estados do orçamento (rascunho/enviado/aprovado/perdido) são suficientes? Há outros?
  - Resposta/Decisão:
- [ ] Quando o orçamento vira OS? Manual, automático, depende de aprovação/pagamento?
  - Resposta/Decisão:
- [ ] Regras de preço: tabela fixa, por cliente, por vendedor, por produto, por matéria-prima?
  - Resposta/Decisão:
- [ ] Comissão: como calcula, quando “congela”, e como trata desconto/bonificação?
  - Resposta/Decisão:

### 4.2 OS (Ordem de Serviço)

- [ ] Quem cria a OS? Sempre vem do orçamento ou pode ser criada direto?
  - Resposta/Decisão:
- [ ] Campos obrigatórios na OS (cliente, faca, medida, material, pantones, anilox, quantidades, etc.)?
  - Resposta/Decisão:
- [ ] A OS pode ser editada depois de iniciar produção? Até qual etapa?
  - Resposta/Decisão:
- [ ] Como lidar com cancelamento, retrabalho, reimpressão, devolução?
  - Resposta/Decisão:

### 4.3 Produção (Kanban)

- [ ] As etapas atuais servem? (A Fazer → Preparação → Impressão → Rebobinagem/Corte → Acabamento → Qualidade → Pronto p/ NF → NF Emitida → Entregue)
  - Resposta/Decisão:
- [ ] Precisa permitir “voltar etapa”? Em quais casos e com que registro?
  - Resposta/Decisão:
- [ ] “Qualidade OK” é obrigatório antes do Fiscal? Há outros checkpoints?
  - Resposta/Decisão:
- [ ] Observações: precisam de anexos (arte, foto, arquivo) ou só texto?
  - Resposta/Decisão:
- [ ] Responsável por etapa: precisa registrar quem executou e o tempo em cada etapa?
  - Resposta/Decisão:

---

## 5) Cadastros e regras de dados

### 5.1 Clientes

- [ ] Campos obrigatórios (CNPJ, IE, endereço, contato, e-mail, etc.) e validações?
  - Resposta/Decisão:
- [ ] Existe tabela de preço por cliente? Condição de pagamento? Prazo?
  - Resposta/Decisão:

### 5.2 Vendedores

- [ ] Vendedor vincula clientes? Pode ter mais de um vendedor por cliente?
  - Resposta/Decisão:
- [ ] Comissão padrão e exceções (por produto/cliente)?
  - Resposta/Decisão:

### 5.3 Produtos acabados

- [ ] Como o produto é identificado: nome + medidas + faca + material? Existe SKU/código interno?
  - Resposta/Decisão:
- [ ] Precisa versionamento de arte (mudança de layout) por OS?
  - Resposta/Decisão:
- [ ] Controle de estoque de produto acabado é obrigatório? (entrada/saída, inventário)
  - Resposta/Decisão:

### 5.4 Bobinas (matéria-prima)

- [ ] Como é a identificação: lote, fornecedor, largura, metragem, gramatura, acabamento, cor base?
  - Resposta/Decisão:
- [ ] Precisamos rastrear “onde foi consumida” (por OS, por data, por operador)?
  - Resposta/Decisão:
- [ ] Reserva de bobina: quando reserva, quando libera, quando dá baixa?
  - Resposta/Decisão:

---

## 6) Estoque e movimentações

- [ ] O estoque é controlado em metros, rolos, caixas, ou ambos?
  - Resposta/Decisão:
- [ ] Há inventário periódico? Precisamos de tela de ajuste de saldo com justificativa?
  - Resposta/Decisão:
- [ ] Como tratar perdas: percentual fixo, por máquina, por etapa, por operador?
  - Resposta/Decisão:
- [ ] Necessidade de alertas de estoque mínimo (bobina/produto) por e-mail/WhatsApp/sistema?
  - Resposta/Decisão:

---

## 7) Cálculo de aproveitamento (Yield)

- [ ] A fórmula atual está correta para a operação? (pistas por largura, margem de corte, perdas)
  - Resposta/Decisão:
- [ ] Quais parâmetros padrão: margem de corte (mm), perdas (%), outros (setup/margem segurança)?
  - Resposta/Decisão:
- [ ] O cálculo deve ser apenas estimativa ou “travado” para consumo real do estoque?
  - Resposta/Decisão:
- [ ] Quem aprova/edita o snapshot de aproveitamento na OS?
  - Resposta/Decisão:

---

## 8) Fiscal / NF (Nota Fiscal)

- [ ] Emissão de NF será feita dentro do sistema ou via ERP/contador?
  - Resposta/Decisão:
- [ ] Integração obrigatória: qual sistema (ERP), como é o acesso (API, arquivo, manual)?
  - Resposta/Decisão:
- [ ] Campos necessários: CFOP, NCM, CST, impostos, transportadora, observações fiscais?
  - Resposta/Decisão:
- [ ] Eventos: cancelamento de NF, carta de correção, inutilização, devolução?
  - Resposta/Decisão:
- [ ] Quem pode emitir NF? Precisa duplo controle/aprovação?
  - Resposta/Decisão:

---

## 9) Impressão / PDF

- [ ] Quais documentos precisam ser emitidos/impresso: OS, orçamento, romaneio, etiqueta interna, etc.?
  - Resposta/Decisão:
- [ ] O layout atual atende? Precisamos de modelo oficial do cliente (logo, campos fixos, assinatura)?
  - Resposta/Decisão:
- [ ] Precisa de numeração oficial (sequencial) para OS/orçamento/NF?
  - Resposta/Decisão:
- [ ] Campos com QRCode/Barcode?
  - Resposta/Decisão:

---

## 10) Integrações e automações

- [ ] Integra com ERP/CRM/Financeiro? Quais e para quê (clientes, produtos, preços, NF, estoque)?
  - Resposta/Decisão:
- [ ] Integra com ferramenta de arte/produção (aprovação de layout)?
  - Resposta/Decisão:
- [ ] Importação/exportação: CSV/Excel? Quais entidades (clientes, produtos, bobinas, OS)?
  - Resposta/Decisão:
- [ ] Notificações: e-mail/WhatsApp/SMS quando OS muda de etapa ou atrasa?
  - Resposta/Decisão:

---

## 11) Relatórios e dashboards

- [ ] Relatórios essenciais (primeira entrega):
  - [ ] OS por etapa / atrasadas
  - [ ] Consumo de bobina por período / por OS
  - [ ] Vendas por vendedor/cliente/produto
  - [ ] Comissão por vendedor
  - [ ] NFs emitidas e valores
  - Resposta/Decisão:
- [ ] Exportação (CSV/PDF) é necessária? Quais filtros?
  - Resposta/Decisão:

---

## 12) Infraestrutura, deploy e ambiente

- [ ] Onde será hospedado: cloud (qual?) ou servidor local (on-prem)?
  - Resposta/Decisão:
- [ ] Precisam de ambientes separados (dev/homolog/prod)?
  - Resposta/Decisão:
- [ ] Backup: frequência, retenção, quem é responsável?
  - Resposta/Decisão:
- [ ] Domínio e SSL: quem fornece, existe TI interna?
  - Resposta/Decisão:
- [ ] Acesso externo: VPN, IP fixo, restrição geográfica?
  - Resposta/Decisão:

---

## 13) Segurança, LGPD e compliance

- [ ] Quais dados pessoais serão armazenados (contatos, e-mails, telefones)?
  - Resposta/Decisão:
- [ ] Retenção: por quanto tempo manter OS/orçamentos/logs?
  - Resposta/Decisão:
- [ ] Necessidade de criptografia em repouso, logs de acesso, trilha de auditoria formal?
  - Resposta/Decisão:
- [ ] Perfis precisam de segregação forte (ex.: Fiscal não vê custos, Vendas não vê estoque completo)?
  - Resposta/Decisão:

---

## 14) Migração e dados iniciais

- [ ] Dados atuais estão onde (Excel, ERP, outro sistema)?
  - Resposta/Decisão:
- [ ] O que precisa migrar no “go-live” (clientes, produtos, estoque, históricos)?
  - Resposta/Decisão:
- [ ] Quem valida a base migrada e qual critério de aceite?
  - Resposta/Decisão:

---

## 15) Suporte, treinamento e operação

- [ ] Quem será o “dono do produto” do lado do cliente (responsável por decisões)?
  - Resposta/Decisão:
- [ ] Treinamento: quantas turmas, duração, material (vídeo, manual)?
  - Resposta/Decisão:
- [ ] Suporte: canal (WhatsApp, e-mail), horário, SLA, prioridade (P0/P1/P2)?
  - Resposta/Decisão:

---

## 16) Decisões de escopo (para sair da reunião com “fechado”)

Preencher com decisões finais:

- [ ] Tipo de autenticação (e-mail/senha, SSO, etc.)
- [ ] Quantidade de usuários e perfis + permissões mínimas da v1
- [ ] Fonte de verdade de dados (backend próprio vs integração ERP)
- [ ] Fluxo “orçamento → OS” (quando vira OS e quem aprova)
- [ ] Modelo de estoque (metros/rolos/caixas) e momento de baixa
- [ ] Como será a emissão de NF (dentro do sistema vs ERP)
- [ ] Integrações obrigatórias para a primeira entrega
- [ ] Relatórios obrigatórios para a primeira entrega
- [ ] Ambiente de deploy e requisitos de segurança (LGPD/auditoria)

---

## 17) Itens “must-have” vs “nice-to-have”

### Must-have (v1)

- [ ] Login + perfis e permissões mínimas
- [ ] Persistência real (backend + banco)
- [ ] Fluxo completo Orçamento → OS → Produção → Fiscal (com regras definidas)
- [ ] Impressão de OS/Orçamento no layout final do cliente
- [ ] Controle de estoque conforme regra definida

### Nice-to-have (v2+)

- [ ] Notificações automáticas (WhatsApp/e-mail)
- [ ] KPI avançado (OEE/tempo por etapa)
- [ ] Integrações complexas (ERP completo, SEFAZ, etc.)
- [ ] Upload de anexos (arte, fotos, PDFs)
- [ ] Multi-empresa/filial com segregação total

