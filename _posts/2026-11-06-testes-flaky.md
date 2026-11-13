---
layout: post
title: "Testes flaky: quando o teste passa ou falha no cara ou coroa"
subtitle: "De onde vem a intermitência, como encontrar a causa e por que \"roda de novo\" não é solução"
tags: [Java, Testes Automatizados]
---

O pipeline ficou vermelho. Você abre o log, vê que falhou um teste de uma parte do sistema que ninguém mexeu no seu PR, e faz o que todo mundo faz: clica em "re-run". Passa. Merge.

Esse teste é flaky: ele passa ou falha sem que o código tenha mudado. E o problema dele não é só os minutos perdidos esperando o pipeline rodar de novo. O problema é o que ele ensina ao time. Depois de algumas semanas convivendo com testes assim, ninguém mais lê falha de CI com atenção. Vermelho vira "provavelmente é aquele teste de novo", e um dia é um bug de verdade que passa junto.

Um teste que falha aleatoriamente é pior do que não ter teste, porque além de não proteger, ele treina as pessoas a ignorar o alarme.

## Flaky não existe por acaso

A primeira coisa a entender é que não existe teste "aleatório". O computador é determinístico; se o resultado muda entre execuções, é porque alguma entrada do teste mudou e você não está controlando ela. O trabalho de corrigir um teste flaky é descobrir qual é essa entrada escondida.

Na prática, quase todas caem em poucas categorias.

### Tempo

A mais comum. O teste depende do relógio de alguma forma: a hora atual, o dia da semana, a duração de uma operação.

```java
@Test
void pedidoCriadoHojeNaoEstaAtrasado() {
    var pedido = new Pedido(LocalDate.now());

    assertFalse(pedido.estaAtrasado());
}
```

Parece inofensivo. Mas se `estaAtrasado()` usa `LocalDate.now()` internamente, e o teste roda às 23:59:59.999, a criação do pedido acontece num dia e a verificação no outro. Raro? Muito, porque a janela entre as duas chamadas dura microssegundos. A variação que realmente aparece é outra: o teste monta a data no fuso de São Paulo e o código usa o fuso padrão da JVM, que no CI é UTC. Aí o teste falha todo dia entre 21h e meia-noite no horário de Brasília, justamente quando ninguém está olhando. Outras variações: testes que só falham no fim do mês, no dia 29 de fevereiro, ou no dia da mudança de horário de verão (assunto do [post sobre fusos horários](/2026-11-05-fusos-horarios-sao-uma-armadilha/)).

A correção é tirar o relógio do código e injetar um `Clock`:

```java
@Test
void pedidoCriadoHojeNaoEstaAtrasado() {
    var clock = Clock.fixed(Instant.parse("2026-11-06T23:59:59Z"), ZoneOffset.UTC);
    var pedido = new Pedido(LocalDate.now(clock), clock);

    assertFalse(pedido.estaAtrasado());
}
```

Agora o teste roda sempre no mesmo instante, e você pode inclusive escolher de propósito os instantes perigosos.

### Esperas com sleep

O outro lado do tempo é a espera. Algo acontece de forma assíncrona e o teste precisa aguardar o resultado:

```java
servico.processarEmBackground(pedido);
Thread.sleep(500);
assertEquals(Status.PROCESSADO, repositorio.buscar(pedido.id()).status());
```

Os 500 ms foram escolhidos porque funcionavam na máquina de quem escreveu. No CI, com dez jobs disputando a mesma CPU, às vezes o processamento leva 600 ms. Aumentar para 2 segundos "resolve", até o dia em que não resolve, e de quebra deixa a suíte inteira mais lenta.

O certo é esperar pela condição, não pelo tempo. A biblioteca Awaitility faz isso de forma legível:

```java
servico.processarEmBackground(pedido);

await().atMost(Duration.ofSeconds(5))
    .until(() -> repositorio.buscar(pedido.id()).status() == Status.PROCESSADO);
```

O teste termina assim que a condição é verdadeira, então no caso normal é rápido, e o limite de 5 segundos só existe para não travar para sempre se algo quebrar. Melhor ainda, quando dá: deixar o código assíncrono receber um `Executor` e, no teste, passar um que executa na mesma thread. Aí não existe espera nenhuma.

### Ordem e estado compartilhado

Um teste passa sozinho e falha quando roda junto com os outros, ou o contrário. Quase sempre é estado que vaza de um teste para o outro: um campo `static`, um singleton com cache, uma linha que ficou no banco, uma variável de sistema alterada e não restaurada.

```java
class ConfiguracaoTest {
    @Test
    void usaMoedaPadrao() {
        assertEquals("BRL", Configuracao.moeda());
    }

    @Test
    void permiteTrocarMoeda() {
        Configuracao.definirMoeda("USD");
        assertEquals("USD", Configuracao.moeda());
    }
}
```

O JUnit não garante a ordem dos métodos. Se `permiteTrocarMoeda` rodar primeiro, `usaMoedaPadrao` quebra. E como a ordem padrão é determinística mas não óbvia, esse tipo de problema costuma aparecer quando alguém renomeia um teste ou adiciona um novo na mesma classe.

Uma forma boa de encontrar esse tipo de dependência antes que ela encontre você é mandar o JUnit embaralhar a ordem de propósito:

```properties
# src/test/resources/junit-platform.properties
junit.jupiter.testmethod.order.default=org.junit.jupiter.api.MethodOrderer$Random
```

Quando uma ordem específica quebrar algo, dá para fixar a semente com `junit.jupiter.execution.order.random.seed` e reproduzir exatamente aquela sequência. A correção em si é garantir que cada teste monte e desmonte o próprio estado, e desconfiar de qualquer coisa `static` mutável no código de produção.

### Concorrência

Testes de código concorrente são flaky por natureza quando não são bem pensados, porque o escalonamento das threads é exatamente o tipo de entrada que você não controla. Uma condição de corrida que acontece uma vez a cada mil execuções vai passar no seu notebook e falhar no CI na semana do lançamento.

Aqui vale uma distinção importante: às vezes o teste flaky está certo, e o código é que tem bug. Um teste que falha de vez em quando num cenário concorrente pode ser o único sinal que você tem de uma condição de corrida real em produção. Antes de "consertar" o teste, vale ter certeza de que não é ele que está te avisando de algo.

Para reproduzir, `@RepeatedTest` ajuda a transformar o raro em frequente:

```java
@RepeatedTest(500)
void contadorNaoPerdeIncrementos() throws Exception {
    var contador = new Contador();
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
        for (int i = 0; i < 1_000; i++) {
            executor.submit(contador::incrementar);
        }
    }
    assertEquals(1_000, contador.valor());
}
```

Com um `v++` sem sincronização, a falha aparece quase sempre, mesmo sem repetir. O `@RepeatedTest` faz diferença nas corridas mais sutis, que só aparecem uma vez a cada centenas de execuções: repetir aumenta muito a chance de a falha aparecer enquanto você está olhando, e não só no CI.

### Ambiente e dependências externas

Por fim, tudo que está fora do processo: uma API de terceiros chamada de verdade no teste, uma porta fixa que outro job já está usando, um banco compartilhado entre pipelines, a ordem dos arquivos devolvida pelo sistema operacional, a ordem de iteração de um `HashMap` ou `HashSet` que alguém assumiu como fixa, um número aleatório sem semente.

```java
var tags = Set.of("java", "testes", "ci");
assertEquals("java,testes,ci", String.join(",", tags)); // a ordem muda a cada execução da JVM
```

Com `HashSet` a ordem até costuma se repetir na mesma versão do JDK, o que é pior: o teste passa por anos e quebra no dia em que alguém atualiza o Java. Já `Set.of` e `Map.of` embaralham a ordem a cada execução da JVM, de propósito.

As correções são variações do mesmo tema: isolar. Testcontainers para subir um banco descartável por execução, porta zero para o sistema escolher uma livre, mocks ou servidores fake (como WireMock) para APIs externas, coleções ordenadas quando a ordem importa, `Random` com semente fixa.

## Como caçar um teste flaky

Saber as categorias ajuda, mas na hora do problema você tem um teste que falhou uma vez e passou na seguinte. O caminho que funciona é o mesmo do [debug com método científico](/2026-10-29-debugando-com-o-metodo-cientifico/): primeiro tornar o problema reproduzível, depois formular hipóteses.

Para reproduzir, a ideia é aumentar a pressão até a falha virar frequente:

- Rode o teste isolado centenas de vezes. Se nunca falha sozinho, o problema provavelmente é ordem ou estado compartilhado.
- Rode a classe inteira, e depois a suíte inteira, com ordem aleatória.
- Rode com a máquina sob carga, ou limitando CPU num container, para expor problemas de timing.
- Mude o fuso e o locale da JVM (`-Duser.timezone=Pacific/Kiritimati`, `-Duser.language=tr`) para expor dependências de ambiente.
- Compare os logs de uma execução que falhou com uma que passou. A diferença entre as duas costuma apontar direto para a entrada escondida.

E guarde o histórico. Se o seu CI registra os resultados de cada teste ao longo do tempo, dá para ver quando um teste começou a falhar, com que frequência, e se isso coincide com alguma mudança. Muitas ferramentas de CI já oferecem isso, e mesmo um relatório simples dos testes que mais falharam no último mês já mostra onde atacar primeiro.

## Retry automático: remédio ou anestesia?

O Maven Surefire tem `rerunFailingTestsCount`, o Gradle tem o plugin `test-retry`. Configurar o build para repetir testes que falham e só considerar falha se falhar todas as vezes é tentador, e tem seu lugar.

O problema é quando o retry vira a solução. Ele esconde o sintoma sem tratar a causa, e os testes flaky continuam se acumulando silenciosamente, até que o pipeline fica lento porque dezenas de testes rodam duas ou três vezes em todo build. Pior: se a intermitência for uma condição de corrida real no código, o retry está escondendo um bug de produção.

Um jeito mais saudável de usar retry é como ferramenta de detecção: um teste que só passou na segunda tentativa não quebra o build, mas é marcado como flaky e vira uma tarefa para alguém investigar. O pipeline continua confiável e a dívida fica visível.

## Quarentena com prazo

Quando um teste flaky é encontrado e não dá para corrigir na hora, a opção honesta é tirá-lo da suíte principal de forma explícita, com dono e prazo, em vez de deixar ele falhando de vez em quando:

```java
@Tag("quarentena") // flaky desde 2026-11-06, investigação em andamento
@Test
void sincronizaEstoqueComFornecedor() { ... }
```

O pipeline principal exclui a tag, e um job separado continua rodando os testes em quarentena para acompanhar. O cuidado aqui é o prazo: quarentena sem dono vira cemitério, e um teste desativado não protege nada. Se ninguém vai corrigir, talvez a decisão certa seja apagar o teste e escrever um melhor.

## Na prática

Um resumo do que evita a maioria dos testes flaky:

- Injete `Clock` em vez de chamar `now()` direto no código.
- Espere por condições, nunca por tempo fixo com `Thread.sleep`.
- Cada teste monta e limpa o próprio estado. Desconfie de `static` mutável.
- Rode a suíte com ordem aleatória de vez em quando, ou sempre.
- Isole dependências externas: Testcontainers, portas dinâmicas, fakes para APIs.
- Não assuma ordem de `HashMap`, `HashSet` ou do sistema de arquivos.
- Trate retry como detector, não como cura.
- Teste flaky em quarentena tem dono e prazo.

No fim, a confiança na suíte de testes é o que faz ela valer a pena. Um pipeline vermelho precisa significar "tem algo errado no código" todas as vezes, sem exceção. Cada teste flaky que o time tolera tira um pouco dessa confiança, e ela é bem mais difícil de recuperar do que de perder.
