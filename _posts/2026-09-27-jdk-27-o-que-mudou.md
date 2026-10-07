---
layout: post
title: "JDK 27 chegou: o que muda na prática"
subtitle: "G1 como padrão em todo lugar, headers menores e um marco de licenciamento no mesmo mês"
tags: [Java, Versões do Java]
---

O JDK 27 teve disponibilidade geral em 15 de setembro de 2026, seguindo o calendário de seis meses que a OpenJDK mantém desde 2017. Não é uma versão LTS, então boa parte das empresas vai continuar no 17, no 21 ou no 25 por mais tempo. Ainda assim, vale entender o que mudou, porque parte disso é o tipo de coisa que chega discretamente numa versão de curta duração e só é notada quando vira padrão numa LTS futura.

## Compact object headers, agora ligado por padrão

O JEP 534 reduz o tamanho do cabeçalho de cada objeto na JVM de 96 para 64 bits. Isso não muda uma linha de código da aplicação, mas reduz o uso de heap em algo entre 10% e 20%, dependendo do perfil de alocação, e junto com isso vem ganho de throughput. Esse recurso, parte do Project Lilliput, já estava disponível como opção de produção desde o Java 25 (JEP 519); no 27 ele passa a vir ativado por padrão, sem flag nenhuma.

Pra quem administra cluster com muitos objetos pequenos, como aplicações que fazem parsing intenso ou mantêm coleções grandes em memória, esse tipo de mudança de baixo nível costuma se traduzir direto em menos pressão de garbage collector e menos instâncias precisando de mais memória alocada.

## G1 vira o coletor padrão em qualquer máquina

O G1 (Garbage-First) é um coletor de lixo disponível desde o Java 7, que já era o padrão geral desde o Java 9. Em vez de tratar o heap como poucas áreas grandes e contínuas, como fazem coletores mais simples, ele divide o heap em várias regiões de tamanho fixo e prioriza limpar primeiro as que têm mais objetos mortos, daí o nome. Isso permite pausas mais curtas e previsíveis, com a possibilidade de configurar um teto de pausa (por exemplo, 200ms) que a JVM tenta respeitar.

Até o JDK 26, porém, havia uma exceção: quando a JVM detectava uma máquina pequena, com poucos núcleos ou pouca memória, ela caía de volta pro Serial GC, um coletor mais simples, de thread única, pensado justamente pra ambientes com poucos recursos. O JEP 523 elimina essa exceção: agora o G1 é o padrão em qualquer máquina, grande ou pequena. Na prática, isso simplifica a expectativa de comportamento entre ambientes: o mesmo coletor roda tanto num container enxuto quanto num servidor grande, o que facilita comparar métricas de GC entre ambientes diferentes sem precisar levar em conta qual coletor está ativo em cada um.

## Post-quantum key exchange chegando no TLS

O JEP 527 adiciona troca de chaves híbrida pós-quântica pro TLS 1.3, construindo em cima do mecanismo de encapsulamento de chave baseado em reticulados modulares que já tinha chegado no JDK 24. É um passo de future-proofing: a ideia é que conexões seguras hoje continuem seguras mesmo se um computador quântico capaz de quebrar criptografia assimétrica clássica aparecer no futuro. Pra maioria das aplicações isso ainda é transparente, mas é o tipo de coisa que vai importar bastante pra quem trabalha com dados sensíveis de longo prazo, como o setor financeiro e de saúde.

## Um mês carregado pra quem usa Oracle JDK

Setembro de 2026 também marca o fim do suporte Premier da Oracle pro Java 17, junto com o Java 26 saindo do suporte Premier e o Java 27 chegando. Isso empurra ainda mais empresas a revisar sua estratégia de licenciamento: boa parte dos times que ainda dependem do Oracle JDK está migrando, ou já migrou parte do parque, pra distribuições OpenJDK gratuitas como Eclipse Temurin, Amazon Corretto ou Azul Zulu. Se sua empresa ainda não tem essa conversa agendada, esse é um bom motivo pra levantar o assunto: passar a maior parte de um estimador de suporte pago sem revisar se ainda faz sentido é fácil de deixar passar despercebido até a fatura de renovação chegar.

## Vale migrar pro 27?

Pra quem está numa LTS estável, como 17, 21 ou 25, não há motivo forte pra correr pro 27: ele não é LTS, o suporte dele é curto, e as próximas atualizações de segurança vão parar de vir rápido. O caminho mais comum é aguardar essas melhorias amadurecerem e chegarem consolidadas na próxima LTS. Quem gosta de acompanhar de perto o que está vindo, porém, ganha com o 27 uma prévia concreta de para onde a JVM está indo: menos memória por objeto, comportamento de GC mais uniforme entre ambientes, e segurança já pensando num mundo pós-computação quântica.
