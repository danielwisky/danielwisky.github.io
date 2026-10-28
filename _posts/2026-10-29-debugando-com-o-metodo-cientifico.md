---
layout: post
title: "Debugando com o método científico"
subtitle: "Hipótese, experimento e descarte: um jeito de parar de chutar quando o bug é teimoso"
tags: [Programação, Carreira]
---

Todo mundo já passou por isso. O bug aparece, você olha o código, tem um palpite, muda uma linha, roda de novo. Não resolveu. Muda outra coisa. Também não. Duas horas depois você tem cinco alterações espalhadas pelo código, não lembra mais qual delas fez o comportamento mudar e, pior, não sabe se o bug sumiu ou só ficou mais raro.

Debugar no chute funciona bem para bug fácil, e a maioria dos bugs é fácil. O problema é que a gente usa a mesma estratégia para o bug difícil, aquele intermitente, que só acontece em produção, que some quando você adiciona um log. Para esse tipo, existe uma ferramenta bem mais velha que a computação: o método científico.

## O ciclo

A versão que interessa aqui é simples e cabe em cinco passos:

1. **Observar** o que está acontecendo, com o máximo de precisão.
2. **Formular uma hipótese** que explique a observação.
3. **Prever** o que deveria acontecer se a hipótese for verdadeira.
4. **Experimentar** para ver se a previsão se confirma.
5. **Concluir**: a hipótese sobrevive ou é descartada, e o ciclo recomeça.

Parece óbvio escrito assim. A diferença está na disciplina de seguir os passos de verdade, principalmente o terceiro, que é o que quase todo mundo pula. Para não ficar no abstrato, vou contar um bug que segue o post inteiro.

## O bug do relatório

O relatório diário de vendas era gerado de madrugada e conferido pelo financeiro contra o extrato do gateway de pagamento. Na maioria dos dias batia. Em alguns, faltava dinheiro: o relatório mostrava menos vendas do que o gateway tinha processado. Não era todo dia, não era sempre o mesmo valor, e ninguém conseguia reproduzir em ambiente de teste.

A primeira reação do time foi a de sempre: "deve ser o Kafka perdendo mensagem". Era uma explicação plausível, já tinha acontecido antes, e todo mundo aceitou sem discutir. Esse é o primeiro erro clássico: tratar o primeiro palpite como conclusão.

## Observe antes de teorizar

Antes de qualquer hipótese, vale gastar tempo descrevendo o problema com precisão. "O relatório está errado às vezes" não é uma observação útil. Perguntas melhores:

- Em quais dias exatamente aconteceu?
- Quais pedidos estão faltando? Dá para listar?
- Os pedidos que faltam existem no banco ou sumiram de vez?
- O que eles têm em comum?

Essa fase costuma resolver metade dos bugs sozinha, porque descrever bem o problema já aponta para onde olhar. Também é o momento de tentar **reproduzir**. Um bug que você consegue disparar quando quer é um bug quase resolvido; um bug que você não reproduz exige que cada experimento seja feito com dados de produção, o que é bem mais lento.

No caso do relatório, a gente pegou três dias com divergência e cruzou os ids do gateway com os do relatório. Saiu uma lista com algumas dezenas de pedidos faltando.

## Hipóteses que podem dar errado

Uma boa hipótese é aquela que pode ser derrubada por um experimento. "Tem alguma coisa estranha no consumidor" não serve, porque nenhum resultado contradiz isso. "O consumidor está descartando mensagens quando o rebalanceamento acontece" serve, porque gera uma previsão concreta: os pedidos faltantes não deveriam estar no banco, e os horários deles deveriam coincidir com rebalanceamentos.

A hipótese do Kafka foi a primeira a ser testada, e a previsão era clara: se as mensagens estão se perdendo, os pedidos não existem na tabela. O experimento foi uma query. Todos os pedidos da lista estavam lá, com status de pago. Hipótese descartada em dez minutos, depois de dias sendo tratada como certa.

A segunda hipótese foi que a query do relatório filtrava por algum status que esses pedidos não tinham, tipo um pagamento confirmado depois do fechamento. Previsão: os pedidos faltantes teriam a confirmação de pagamento depois da hora do job. Também não: alguns tinham sido pagos horas antes.

Descartar hipótese não é tempo perdido. Cada uma que cai reduz o espaço onde o bug pode estar, e é exatamente por isso que vale escrever a previsão antes de rodar o experimento. Sem previsão, qualquer resultado parece "meio que confirmar" o que você já achava.

## Volte para os dados

Com as duas explicações óbvias fora da mesa, a gente voltou para a observação, agora olhando a lista com mais calma. E aí apareceu o padrão: todos os pedidos faltantes tinham sido criados depois das 21h.

Isso gerou uma hipótese nova, bem específica: o relatório estava calculando "ontem" em UTC, e não no horário de Brasília. Como estamos três horas atrás de UTC, um pedido feito às 21h30 do dia 10 fica registrado como 00h30 do dia 11 em UTC, e cai fora do relatório do dia 10.

A previsão dessa hipótese era forte e fácil de checar: nenhum pedido faltante teria sido criado antes das 21h, os pedidos das 21h às 23h59 de um dia deveriam aparecer no relatório do dia seguinte, e os dias com mais divergência seriam os de mais venda à noite. As três coisas se confirmaram. A terceira explicava até a intermitência: em dias de pouca venda noturna a diferença era pequena e passava despercebida na conferência.

O código culpado era desse tipo:

```java
LocalDate ontem = LocalDate.now().minusDays(1);
Instant inicio = ontem.atStartOfDay(ZoneOffset.UTC).toInstant();
Instant fim = ontem.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
```

O servidor rodava em UTC, então tanto o `LocalDate.now()` quanto os limites do intervalo eram calculados no fuso errado. A correção foi usar o fuso do negócio de forma explícita, e de preferência com um `Clock` injetado para dar para testar:

```java
ZoneId fusoNegocio = ZoneId.of("America/Sao_Paulo");
LocalDate ontem = LocalDate.now(clock.withZone(fusoNegocio)).minusDays(1);
Instant inicio = ontem.atStartOfDay(fusoNegocio).toInstant();
Instant fim = ontem.plusDays(1).atStartOfDay(fusoNegocio).toInstant();
```

Antes de corrigir, ainda teve um último experimento: um [teste unitário](/2023-01-22-java-testes-unitarios/) com o relógio fixado num horário noturno e um pedido criado às 21h30. O teste falhou com o código antigo e passou com o novo. Isso é importante: se você não viu o teste falhar pelo motivo certo, não tem como saber se ele está testando alguma coisa.

## Um experimento por vez

Uma regra que parece burocrática mas economiza muito tempo: mude uma coisa de cada vez. Se você atualiza a biblioteca, muda a configuração do pool e adiciona um retry tudo junto, e o problema some, você não aprendeu nada. Pior, pode ter mascarado o bug em vez de corrigir.

O mesmo vale para desfazer. Se um experimento não confirmou a hipótese, reverta a mudança antes de tentar a próxima. Código de debug esquecido no meio do caminho é uma fonte clássica de bug novo.

## Escreva tudo

Para bug que leva mais de uma hora, mantenha um arquivo de texto aberto com um diário simples:

```
14:05  Hipótese: Kafka perdendo mensagem no rebalance
       Previsão: pedidos faltantes não existem no banco
       Resultado: todos existem, status PAGO -> descartada

14:20  Hipótese: filtro de status exclui pagamento tardio
       Previsão: confirmação depois das 02h
       Resultado: vários pagos antes das 20h -> descartada

14:50  Observação: todos os faltantes criados depois das 21h
```

Parece exagero até o dia em que você para para almoçar, volta e não lembra o que já testou. Ou até o dia em que precisa passar o bug para outra pessoa. O diário também vira matéria-prima pronta para o postmortem, e evita a cena de três pessoas testando a mesma hipótese sem saber.

## Busca binária também é experimento

Quando você não tem nenhuma hipótese boa, mas sabe que o bug não existia em algum momento, dá para deixar a hipótese de lado e procurar mecanicamente. O `git bisect` faz uma [busca binária](/2022-07-08-entendendo-busca-binaria/) no histórico: você marca um commit bom e um ruim, ele vai te levando para o meio e você diz se ali o bug existe ou não.

```bash
git bisect start
git bisect bad HEAD
git bisect good v2.3.0
# teste e responda com git bisect good ou git bisect bad até ele achar o commit
git bisect reset
```

Se dá para escrever um script que retorna sucesso ou falha, o `git bisect run ./teste.sh` faz tudo sozinho. Com algumas centenas de commits entre o bom e o ruim, em poucas rodadas você chega no commit culpado. A mesma ideia funciona fora do Git: comentar metade de uma configuração, reduzir pela metade um arquivo de entrada que quebra o parser, desligar metade dos serviços num ambiente local.

## Cuidado com o que você acha que sabe

O maior inimigo do método é a certeza. No caso do relatório, "o Kafka perde mensagem" passou dias sem ser questionado porque já tinha sido verdade uma vez. As frases perigosas são as que descartam uma possibilidade sem experimento: "isso não pode ser o banco", "essa parte do código ninguém mexe há anos", "em teste funciona, então o código está certo".

Toda vez que você se pegar dizendo uma dessas, transforme em hipótese e teste. Na maioria das vezes você estava certo e perde cinco minutos. Na vez em que estava errado, economiza um dia.

## Quando o chute está liberado

Nada disso significa abrir um diário para cada `NullPointerException`. Se o stack trace aponta a linha e a causa é óbvia, corrija e siga em frente. O método vale a partir do momento em que o primeiro ou o segundo chute não resolveu, ou quando o bug tem alguma dessas características: intermitente, só em produção, envolve concorrência, tempo ou fuso, ou ninguém consegue reproduzir.

Uma regra prática que uso: se em meia hora eu ainda estou mudando coisas para ver se resolve, paro, abro o arquivo de texto e escrevo o que eu sei e o que eu acho. Quase sempre, só o ato de escrever já mostra que eu estava testando a mesma ideia de três jeitos diferentes, ou que tinha uma observação óbvia que eu ainda não tinha feito.

Debugar bem não depende de intuição genial. É mais parecido com trabalho de laboratório: observar com cuidado, apostar numa explicação que pode dar errado e deixar o experimento decidir. Com [bons logs](/2026-10-05-logs-que-ajudam-a-debugar/) e um [trace](/2026-10-28-tracing-distribuido/) na mão, a fase de observação fica muito mais rápida, mas são o raciocínio e a disciplina que fazem o bug aparecer.
