---
layout: post
title: "Feature flags: como liberar código sem liberar funcionalidade"
subtitle: "Separar o deploy do release é o que torna possível entregar com calma"
tags: [Programação, Arquitetura]
---

Fazer deploy e lançar uma funcionalidade costumavam ser a mesma coisa. O código subia pra produção e, no mesmo instante, todo usuário passava a ver a mudança. Esse acoplamento é a origem de boa parte do medo que times sentem antes de um deploy: se algo der errado, a única saída é reverter o deploy inteiro, mesmo que o problema esteja numa funcionalidade pequena no meio de um conjunto grande de mudanças. Feature flags resolvem isso separando as duas decisões: quando o código vai pra produção é uma coisa, quando ele fica visível pro usuário é outra, completamente independente.

## O mecanismo é simples

Na forma mais básica, uma feature flag é só um condicional controlado por uma configuração externa, não por uma variável fixa no código:

```java
if (featureFlags.isEnabled("novo-checkout", usuario)) {
    return novoCheckoutService.processar(pedido);
}
return checkoutService.processar(pedido);
```

A diferença entre isso e um `if` qualquer é de onde vem a decisão. Um `if` comum exige recompilar e reimplantar o serviço para mudar de comportamento. Uma feature flag lê o valor de um sistema de configuração, que pode ser alterado em tempo real, sem deploy, sem reiniciar o processo.

## Os tipos de flag mais comuns

Nem toda flag serve pro mesmo propósito, e misturar os tipos é uma fonte comum de confusão:

- **Release flags**: escondem uma funcionalidade em desenvolvimento até que esteja pronta, permitindo mesclar o código na branch principal continuamente em vez de manter uma branch de feature vivendo separada por semanas.
- **Experiment flags**: direcionam uma fração dos usuários para uma variante, geralmente ligadas a um teste A/B, medindo o efeito antes de decidir se a mudança vale a pena para todo mundo.
- **Ops flags**: dão um botão de emergência para desligar uma funcionalidade sob carga ou instabilidade, sem precisar reverter o deploy.
- **Permission flags**: controlam acesso por plano de assinatura ou por tipo de usuário, como uma funcionalidade exclusiva de um tier pago.

Uma release flag deveria ser temporária por natureza: depois que a funcionalidade está estável para todo mundo, o código do `if` e o caminho antigo deveriam ser removidos. Uma permission flag, ao contrário, é permanente, porque a distinção entre planos é parte do próprio produto.

## O rollout gradual

A vantagem mais prática de uma feature flag é poder liberar aos poucos, em vez de tudo de uma vez:

```java
public boolean isEnabled(String flag, Usuario usuario) {
    var config = flagStore.buscar(flag);
    if (!config.ativo()) return false;
    return hash(usuario.getId()) % 100 < config.percentualRollout();
}
```

Começar em 1% dos usuários, observar métricas de erro e latência por algumas horas, subir para 10%, depois 50%, depois 100%, dá ao time uma janela pra perceber um problema com um raio de impacto pequeno, em vez de descobrir o mesmo problema afetando toda a base de usuários de uma vez. Se alguma métrica piorar no meio do caminho, o rollout volta para 0% num ajuste de configuração, sem precisar de um novo deploy nem de um revert do código.

## O custo que ninguém fala

Feature flags não são de graça. Cada flag ativa é um branch a mais no código, e dois branches ativos ao mesmo tempo significam dois caminhos de código para testar, revisar e entender. Um serviço com dezenas de flags acumuladas ao longo do tempo, muitas delas já decididas e nunca removidas, vira um emaranhado de condicionais que ninguém tem certeza se ainda importam. A disciplina que evita isso é simples de enunciar e difícil de manter: toda release flag nasce com um plano de remoção, e revisar flags antigas deveria fazer parte da rotina do time, não ficar pra trás como débito técnico permanente.

Vale notar também o lugar onde a decisão é avaliada. Fazer essa checagem espalhada em vários pontos do código, cada um lendo a flag separadamente, abre espaço para um usuário ver um comportamento inconsistente dentro da mesma requisição, se a configuração mudar bem no meio do processamento. O mais seguro é avaliar a flag uma vez no início da requisição e propagar a decisão já resolvida pelo resto do fluxo.

## Quando vale introduzir

Para um time pequeno fazendo poucos deploys por semana, feature flags podem ser um exagero de engenharia. Elas começam a valer a pena quando o deploy é frequente, quando mudanças arriscadas precisam de um plano de reversão mais rápido que um novo deploy, ou quando faz sentido testar uma funcionalidade com uma fração dos usuários antes de um lançamento completo. A pergunta prática é se o time já sentiu a dor de um deploy grande demais pra reverter com segurança. Se já sentiu, feature flags são uma das formas mais diretas de nunca mais passar por isso.
