---
name: "brainstorming"
description: "Facilitates brainstorming sessions to explore ideas, generate solutions, and plan improvements. Invoke when user asks to brainstorm, plan improvements, or generate ideas for a feature/issue."
---

# Brainstorming Skill

Esta skill facilita sessões de brainstorming para explorar ideias, gerar soluções e planejar melhorias no código.

## Quando Usar

- Quando o usuário pede para "brainstorm" ou "planejar"
- Para explorar múltiplas abordagens para um problema
- Para gerar ideias de melhorias ou novas funcionalidades
- Para validar requisitos com o usuário antes de implementar

## Processo de Brainstorming

### 1. Entender o Problema
- Identificar o objetivo final
- Listar requisitos explícitos e implícitos
- Perguntar clarifying questions se necessário

### 2. Explorar Alternativas
- Considerar múltiplas abordagens
- Avaliar prós e contras de cada opção
- Pensar em casos de borda e edge cases

### 3. Selecionar a Melhor Abordagem
- Priorizar simplicidade
- Considerar manutenibilidade
- Avaliar impacto no código existente

### 4. Documentar a Solução
- Criar plano de implementação detalhado
- Listar arquivos a modificar
- Definir passos de teste

## Exemplo de Uso

```
User: "Brainstorm: como melhorar o sistema de login?"
Assistant: [Invoca skill de brainstorming]
1. Identifica requisitos: autenticação, segurança, UX
2. Explora alternativas: OAuth, JWT, sessions, 2FA
3. Avalia trade-offs de cada abordagem