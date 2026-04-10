# Planejamento — Checklist de dúvidas para reunião com o cliente

Objetivo: preparar um arquivo `.md` com perguntas (e por quê) para levantar detalhes operacionais do cliente e reduzir riscos/ambiguidades antes de entregar o projeto.

## Escopo do que será produzido (entregável)

- Um arquivo Markdown no repositório (ex.: `perguntas-reuniao-cliente.md`) contendo:
  - Perguntas organizadas por área (Operação, Usuários/Perfis, Cadastros, Fluxos, Integrações, Fiscal, Impressão/PDF, Relatórios, Segurança/Compliance, Infra/Deploy, Migração, Suporte).
  - Campos para preencher durante a reunião (respostas, decisões, pendências).
  - Lista de decisões que precisam ser “batidas” para fechar escopo.
  - Itens “nice-to-have” vs “must-have”.

## Premissas atuais (observadas no projeto)

- O projeto atual é um front-end Vite/React/TS com dados mock e sem backend/persistência.
- Existem módulos de: Clientes, Vendedores, Bobinas (matéria-prima), Produtos, Orçamentos, OS, Kanban (produção) e Fiscal (NF simulada), além de impressão via janela de impressão do navegador.

## Passos (execução após sua aprovação)

1) Levantar “pontos de decisão” do produto a partir do estado atual do sistema
   - Revisar (somente leitura) rotas/páginas principais e os modelos (types) para entender o fluxo e termos usados.
   - Listar o que hoje é simulação e precisará de definição real (ex.: persistência, autenticação, permissões).

2) Definir estrutura do Markdown de reunião
   - Criar seções e sub-seções com perguntas objetivas.
   - Em cada seção, incluir:
     - Pergunta
     - Motivação (qual risco/impacto ela reduz)
     - Opções comuns (quando aplicável)
     - Campo “Resposta/Decisão”

3) Elaborar o conjunto de perguntas (o núcleo do arquivo)
   - Operação e volume:
     - Quantidade de OS/dia, itens por OS, sazonalidade, SLAs/prazos.
   - Usuários e perfis:
     - Quantidade de usuários, perfis (Vendas/Produção/Fiscal/Impressão/Admin), permissões, trilha de auditoria.
   - Cadastros e regras:
     - Campos obrigatórios, validações, padrões (ex.: CNPJ, lotes, materiais).
   - Fluxo de Orçamento → OS → Produção:
     - Quem cria, aprova, altera, volta etapa, cancelamento, re-trabalho.
   - Estoque e rastreabilidade:
     - Baixa de bobina, reservas, perdas, inventário, histórico por lote.
   - Cálculo de aproveitamento:
     - Fórmulas aceitas, margens/perdas padrão, exceções, quem aprova.
   - Fiscal / NF:
     - Integração com ERP/SEFAZ, dados necessários, eventos, regras de emissão.
   - Impressão/PDF:
     - Modelos oficiais, campos, assinatura, QRCode, anexos, branding, idioma.
   - Integrações:
     - ERP, CRM, emissão NF, etiqueta/arte, importação/exportação.
   - Relatórios e dashboards:
     - Indicadores, filtros, exportações (CSV/PDF), permissões.
   - Infra/Deploy e acesso:
     - Cloud/on-prem, domínios, backups, ambientes, SSO.
   - Segurança/Compliance:
     - LGPD, retenção, logs, auditoria, segregação por filial/empresa.
   - Migração e dados:
     - Fonte dos dados atuais, limpeza, importação inicial, homologação.
   - Suporte e operação:
     - Treinamento, perfil de suporte, prioridades, canais.

4) Redigir e adicionar o arquivo `.md` final ao repositório
   - Criar `perguntas-reuniao-cliente.md` (nome pode ser ajustado).
   - Garantir texto direto, copiável e com checklists.

5) Revisão final
   - Revisar se todas as áreas críticas estão cobertas.
   - Ajustar linguagem para reunião (curto, objetivo, sem jargão técnico desnecessário).

## Critérios de pronto

- O `.md` tem seções claras e perguntas acionáveis.
- Inclui perguntas sobre quantidade de usuários, perfis, volume de operação, integrações e responsabilidades.
- Facilita tomada de decisão e fechamento de escopo (com campos de decisão/pendências).

