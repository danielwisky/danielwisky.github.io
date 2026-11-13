---
layout: post
title: "Fusos horários são uma armadilha: datas e horas em sistemas reais"
subtitle: "Instant, LocalDateTime, ZonedDateTime e o horário de verão que o Brasil já teve e pode voltar a ter"
tags: [Java, Programação]
---

Datas parecem o tipo de problema que já está resolvido. Toda linguagem tem uma biblioteca para isso, todo banco tem um tipo para isso, e mesmo assim quase todo sistema que eu já vi tem pelo menos um bug de data escondido em algum canto. Um relatório que perde uma hora de pedidos uma vez por ano, um agendamento que dispara duas vezes, um cliente em Portugal que recebe a notificação de "seu boleto vence hoje" um dia depois do vencimento.

A raiz quase sempre é a mesma: tratar "um momento no tempo" e "o que o relógio na parede mostra" como se fossem a mesma coisa.

## Dois conceitos que parecem um só

Quando alguém diz "a reunião é às 10h do dia 5 de novembro", essa frase não identifica um momento único. 10h em São Paulo e 10h em Lisboa são momentos diferentes, separados por três horas em novembro (quatro durante o verão europeu). A frase só vira um momento de verdade quando você junta o horário de relógio com um lugar.

Por outro lado, "o pagamento foi confirmado em 2026-11-05T13:00:00Z" é um momento absoluto. Ele aconteceu uma vez só, no mundo inteiro ao mesmo tempo. Em São Paulo o relógio mostrava 10h, em Lisboa mostrava 13h, mas o evento é o mesmo.

O `java.time` modela essa diferença com tipos separados, e escolher o tipo certo resolve metade dos problemas:

- **`Instant`**: um ponto absoluto na linha do tempo, em UTC. Não sabe nada de fuso. É o que você usa para registrar quando algo aconteceu (e, por guardar os segundos em `long`, também está livre do [bug de 2038](/2026-11-04-bug-do-ano-2038/)).
- **`LocalDateTime`**: data e hora de relógio, sem fuso. "5 de novembro às 10h", sem dizer onde. Não representa um momento.
- **`ZonedDateTime`**: data e hora de relógio mais um fuso com regras (`America/Sao_Paulo`). Esse sim representa um momento e sabe calcular horário de verão.
- **`OffsetDateTime`**: data e hora mais um deslocamento fixo (`-03:00`). Representa um momento, mas não sabe as regras do lugar, só o offset naquele instante.
- **`LocalDate`**: só a data. Um aniversário, uma data de vencimento, um feriado.

```java
Instant pagamento = Instant.parse("2026-11-05T13:00:00Z");

pagamento.atZone(ZoneId.of("America/Sao_Paulo"));  // 2026-11-05T10:00-03:00[America/Sao_Paulo]
pagamento.atZone(ZoneId.of("Europe/Lisbon"));      // 2026-11-05T13:00Z[Europe/Lisbon]
```

O mesmo `Instant`, dois relógios diferentes. E repare que Lisboa aparece com `Z` porque em novembro ela está no horário de inverno, com offset zero. No verão europeu seria `+01:00`. Offset não é propriedade fixa de um lugar, e isso nos leva ao vilão da história.

## Horário de verão: o dia que não tem meia-noite

O Brasil teve horário de verão por décadas e aboliu em 2019. De tempos em tempos o assunto volta a ser discutido, e se voltar, todo sistema que foi escrito depois de 2019 assumindo que São Paulo é sempre `-03:00` vai ter uma surpresa. Mesmo hoje, qualquer sistema que reprocessa dados históricos ou atende clientes em países que ainda adotam a mudança precisa lidar com isso.

Em 2018, o horário de verão começou em 4 de novembro. À meia-noite, os relógios pularam direto para 01:00. Isso significa que, em São Paulo, o horário 00:30 de 4 de novembro de 2018 simplesmente não existiu. O que o Java faz se você pedir esse horário?

```java
var sp = ZoneId.of("America/Sao_Paulo");

ZonedDateTime.of(LocalDateTime.of(2018, 11, 4, 0, 30), sp);
// 2018-11-04T01:30-02:00[America/Sao_Paulo]
```

Ele empurra para frente pelo tamanho do buraco. É um comportamento razoável, mas é uma decisão que o Java tomou por você, e o seu código pode não estar esperando 01:30.

Esse caso pegava muita gente no Brasil por um motivo específico: como a mudança acontecia à meia-noite, o primeiro dia do horário de verão não tinha meia-noite. Código que montava a meia-noite na mão, como `data.atTime(0, 0)`, e usava esse `LocalDateTime` sem fuso como "início do dia" estava trabalhando com um horário que não existiu. No `java.time`, ao converter com `atZone`, ele é empurrado para 01:00, mas outras bibliotecas não eram tão gentis: o `toDateTimeAtMidnight` do Joda-Time, por exemplo, lançava exceção nesses dias. O jeito explícito é pedir ao Java o início do dia, e deixar que ele consulte as regras do fuso:

```java
LocalDate.of(2018, 11, 4).atStartOfDay(sp);
// 2018-11-04T01:00-02:00[America/Sao_Paulo]
```

Naquele dia, o dia começou às 01:00. Literalmente.

## O dia que tem 23 horas (e o que tem 25)

Como consequência, nem todo dia tem 24 horas:

```java
Duration.between(
    LocalDate.of(2018, 11, 4).atStartOfDay(sp),
    LocalDate.of(2018, 11, 5).atStartOfDay(sp));
// PT23H
```

E no fim do horário de verão acontece o contrário. Em 17 de fevereiro de 2019, à meia-noite, os relógios voltaram para 23:00 do dia 16. A hora entre 23:00 e 00:00 do dia 16 aconteceu duas vezes. Se você pedir 23:30 desse dia, qual das duas?

```java
var ambiguo = ZonedDateTime.of(LocalDateTime.of(2019, 2, 16, 23, 30), sp);
// 2019-02-16T23:30-02:00[America/Sao_Paulo]

ambiguo.withLaterOffsetAtOverlap();
// 2019-02-16T23:30-03:00[America/Sao_Paulo]
```

Por padrão o Java escolhe a primeira ocorrência. Se o seu sistema guardou só o `LocalDateTime` de um evento que aconteceu nessa janela, a informação de qual das duas foi está perdida para sempre.

Isso também muda o significado de "somar um dia":

```java
var sabado = ZonedDateTime.of(LocalDateTime.of(2018, 11, 3, 12, 0), sp);

sabado.plusDays(1);                 // 2018-11-04T12:00-02:00, meio-dia de domingo
sabado.plus(Duration.ofHours(24));  // 2018-11-04T13:00-02:00, uma da tarde
```

`plusDays(1)` significa "mesmo horário de relógio, no dia seguinte". `plus(Duration.ofHours(24))` significa "24 horas de tempo real depois". Na maior parte do ano dão o mesmo resultado, e é exatamente por isso que o bug passa despercebido até o dia da transição. Para lembrete de "todo dia às 9h", você quer o primeiro. Para "o token expira em 24 horas", o segundo.

## Onde os bugs aparecem de verdade

Alguns padrões que eu já vi causarem problema:

**Guardar `LocalDateTime` para registrar quando algo aconteceu.** O servidor roda em `America/Sao_Paulo`, alguém grava `LocalDateTime.now()` no banco, e tudo funciona. Até a infraestrutura migrar para containers em UTC, e de repente os registros novos estão três horas "à frente" dos antigos, sem nenhuma informação na tabela para saber qual é qual.

**Depender do fuso padrão da JVM.** `LocalDate.now()`, `LocalDateTime.now()` e `new Date().toString()` usam o fuso padrão da máquina. O mesmo código dá resultados diferentes no seu notebook, no CI e em produção. Passar o fuso explicitamente (ou melhor, um `Clock` injetado) elimina essa variável.

**Guardar offset em vez de fuso para eventos futuros.** Se um usuário agenda algo para "10h de 5 de dezembro de 2027 em São Paulo" e você salva como `2027-12-05T10:00-03:00`, você congelou o offset de hoje. Se o horário de verão voltar e dezembro passar a ser `-02:00`, o evento dispara às 11h no relógio do usuário, uma hora atrasado. Para eventos futuros definidos por pessoas, guarde o horário local mais o `ZoneId`, e calcule o `Instant` perto da hora.

**Agendamentos em horários de transição.** Um job agendado para 00:30 no fuso de São Paulo cai num horário que não existiu no dia da mudança, e um agendado para 23:30 cai num horário que aconteceu duas vezes. Cada agendador trata isso de um jeito (pular, rodar fora de hora, rodar duas vezes), e poucos times sabem qual é o comportamento do seu. Muita gente agenda jobs em UTC justamente para fugir disso, ou evita a faixa entre meia-noite e 1h.

**"Hoje" depende de onde você está.** Às 22h de 5 de novembro em São Paulo já é dia 6 em UTC. Um vencimento calculado com `LocalDate.now(ZoneOffset.UTC)` vai considerar o boleto vencido três horas antes do que o cliente espera. "Hoje" sempre precisa de um fuso, e normalmente é o fuso do cliente, não o do servidor.

## "Salve tudo em UTC" resolve?

Resolve uma parte importante: para registrar quando algo aconteceu (criação de pedido, confirmação de pagamento, log), guardar um `Instant` em UTC é a escolha certa. Não tem ambiguidade, não tem horário de verão, e você converte para o fuso de quem está olhando só na hora de exibir.

Mas não resolve tudo, porque nem toda data é um momento:

- **Datas de calendário** (nascimento, vencimento, feriado) são `LocalDate`. Converter um aniversário para `Instant` em UTC é como ele acaba aparecendo um dia antes para alguém no Brasil.
- **Eventos futuros marcados por pessoas** precisam do horário local e do fuso, pelo motivo do item anterior: as regras podem mudar antes do evento acontecer.
- **Regras recorrentes** ("todo dia às 9h", "dia 10 de cada mês") são definidas em termos de relógio local, não de instantes.

A pergunta certa para cada campo é: isso é *quando algo aconteceu* ou *o que alguém combinou no relógio dele*? A primeira vira `Instant`. A segunda vira tipo local mais `ZoneId`.

## As regras mudam, e o Java precisa saber

As regras de cada fuso vêm da tz database (também chamada de IANA ou Olson), que é atualizada várias vezes por ano porque governos mudam horário de verão e offsets com frequência, às vezes com pouca antecedência. A JVM carrega uma cópia dessa base embutida.

Se o Brasil decidir voltar com o horário de verão, a JVM de produção só vai saber disso depois de atualizada, seja por uma versão nova do JDK, seja pela ferramenta TZUpdater da Oracle. O mesmo vale para o sistema operacional, o banco de dados e o celular do usuário, cada um com a sua cópia. Um serviço que usa `ZoneId.of("America/Sao_Paulo")` com uma base desatualizada vai calcular o offset antigo com toda a confiança do mundo.

## Na prática

Algumas regras que evitam a maioria das dores:

- Use `Instant` para registrar eventos, e `TIMESTAMP WITH TIME ZONE` (ou equivalente) no banco. Nunca `LocalDateTime` para isso.
- Nunca dependa do fuso padrão da JVM. Passe `ZoneId` explicitamente ou injete um `Clock`.
- Use `ZoneId` de região (`America/Sao_Paulo`), não offset fixo (`-03:00`), quando o assunto é horário de pessoas.
- Use `atStartOfDay(zone)` para o início do dia, em vez de montar a meia-noite com `atTime(0, 0)`.
- Decida conscientemente entre `plusDays` e `plus(Duration)`.
- Tenha testes com datas de transição. Com `Clock.fixed` e uma data como 4 de novembro de 2018 em São Paulo, você testa o dia sem meia-noite sem precisar esperar o governo mudar de ideia.

```java
@Test
void inicioDoDiaNoComecoDoHorarioDeVerao() {
    var sp = ZoneId.of("America/Sao_Paulo");
    Clock clock = Clock.fixed(Instant.parse("2018-11-04T15:00:00Z"), sp);

    var inicio = LocalDate.now(clock).atStartOfDay(sp);

    assertEquals(LocalTime.of(1, 0), inicio.toLocalTime());
}
```

Datas não são difíceis porque as APIs são ruins. O `java.time` é uma das bibliotecas de datas mais bem pensadas que existem. Elas são difíceis porque o tempo de relógio é uma convenção política, que muda por decreto, e o código precisa ser honesto sobre qual das duas coisas está guardando: o momento ou o relógio.
