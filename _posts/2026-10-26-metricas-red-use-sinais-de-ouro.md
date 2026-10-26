---
layout: post
title: "Métricas que importam: RED, USE e os quatro sinais de ouro"
subtitle: "Três jeitos de decidir o que medir antes de encher o dashboard de gráfico"
tags: [Arquitetura, Observabilidade]
---

Abrir um dashboard com quarenta gráficos durante um incidente e não saber para qual olhar primeiro é uma experiência bem comum. As ferramentas de métricas ficaram tão fáceis de usar que o problema deixou de ser coletar dados e passou a ser escolher quais deles merecem atenção. Exportar tudo que a biblioteca oferece por padrão parece prudente, mas na hora do aperto vira ruído. É justamente para isso que existem alguns métodos bem conhecidos: RED, USE e os quatro sinais de ouro. Nenhum deles é novidade, e talvez por isso mesmo continuem úteis.

## O problema do dashboard que mostra tudo

Métrica sem pergunta associada é só um número que sobe e desce. Uso de heap, número de threads, contagem de conexões abertas, quantidade de GCs por minuto: tudo isso pode ser importante, mas nenhuma dessas linhas responde diretamente a pergunta que interessa quando alguém reclama que "o sistema está lento". O usuário não sente heap, sente latência e erro.

Os três métodos a seguir têm em comum a ideia de começar pela pergunta e só depois escolher a métrica. A diferença entre eles está no ponto de vista: um olha para o serviço, outro para os recursos, e o terceiro tenta juntar os dois.

## RED: o ponto de vista de quem chama o serviço

O método RED foi popularizado por Tom Wilkie e é pensado para serviços que atendem requisições, como APIs e microsserviços. Para cada serviço, ou para cada endpoint relevante, ele sugere acompanhar três coisas:

- **Rate**: quantas requisições por segundo o serviço está recebendo.
- **Errors**: quantas dessas requisições estão falhando.
- **Duration**: quanto tempo elas levam, de preferência como distribuição (percentis) e não como média.

A graça do RED é que ele descreve o serviço do jeito que o cliente o enxerga. Se a taxa caiu de repente, alguém parou de chamar, ou não está conseguindo chegar. Se os erros subiram, algo quebrou. Se a duração no p99 disparou, uma parte dos usuários está esperando muito, mesmo que a média pareça tranquila.

Com Micrometer no Spring Boot, boa parte disso vem de graça. O `http.server.requests` já é um timer que carrega contagem, tempo e tags de status, e para operações que não são HTTP dá para instrumentar manualmente:

```java
private final Timer timer;

public ProcessadorDePagamento(MeterRegistry registry) {
    this.timer = Timer.builder("pagamentos.processamento")
        .publishPercentiles(0.5, 0.95, 0.99)
        .register(registry);
}

public void processar(Pagamento pagamento) {
    timer.record(() -> gateway.cobrar(pagamento));
}
```

Um timer só já entrega rate (a contagem ao longo do tempo) e duration. Os erros podem vir de uma tag de resultado ou de um contador separado.

## USE: o ponto de vista dos recursos

O método USE, proposto por Brendan Gregg, olha para o outro lado: não para as requisições, mas para os recursos que elas consomem. Para cada recurso (CPU, memória, disco, rede, mas também pool de conexões, fila, pool de threads) a pergunta é:

- **Utilization**: quanto do tempo, ou da capacidade, o recurso está ocupado.
- **Saturation**: quanto trabalho está esperando porque o recurso não dá conta.
- **Errors**: quantas operações nesse recurso falharam.

Saturação é a métrica que mais costuma faltar, e é a que mais ajuda. Um pool de conexões com 100% de utilização pode estar funcionando bem, no limite. O que diz se ele virou gargalo é ter requisições esperando na fila para pegar uma conexão. No HikariCP, por exemplo, isso aparece como `hikaricp.connections.pending`, e esse número acima de zero por muito tempo é um sinal bem mais claro do que qualquer gráfico de CPU.

O USE brilha quando o RED já mostrou que algo está errado e a pergunta passa a ser "por quê". A latência subiu? Vale olhar quais recursos estão saturados naquele mesmo momento.

## Os quatro sinais de ouro

O livro de SRE do Google propõe quatro sinais para monitorar qualquer sistema voltado ao usuário: **latência**, **tráfego**, **erros** e **saturação**. Os três primeiros são basicamente o RED com outros nomes. O quarto traz para dentro a ideia central do USE: o quão perto do limite o sistema está.

Um detalhe que o livro destaca e que vale repetir: a latência de requisições com erro deve ser separada da latência das que deram certo. Um erro que falha rápido, como um 500 devolvido em 2 milissegundos, puxa a média para baixo e faz o serviço parecer mais rápido justamente quando está pior. Separar por status evita essa armadilha.

## Média esconde, percentil revela

Vale um parêntese sobre duração, porque é onde mais se erra. A média de latência quase nunca é a métrica certa. Se 98 requisições levam 50 ms e duas levam 5 segundos, a média fica em torno de 150 ms, um número que não descreve a experiência de ninguém. O p99 mostra que existe gente esperando segundos.

Outro cuidado: percentis calculados em cada instância não podem ser somados ou tirada a média entre instâncias. Para ter um p99 correto do serviço inteiro, o caminho é exportar histogramas e calcular o percentil na ferramenta de consulta, como o `histogram_quantile` do Prometheus. No Micrometer isso é o `publishPercentileHistogram()`, em vez de `publishPercentiles`.

## Qual usar

Na prática, não é uma escolha exclusiva. Uma divisão que funciona bem é usar RED (ou os sinais de ouro) para o dashboard principal de cada serviço e para os alertas, porque são as métricas que refletem o impacto no usuário. Já o USE fica para os recursos internos, consultado quando é preciso investigar a causa.

Alerta em CPU alta, por exemplo, costuma acordar gente à toa: CPU a 90% com latência normal não é problema. Alerta em erro e latência fora do esperado é sobre algo que alguém está sentindo. Começar por poucas métricas, cada uma respondendo a uma pergunta clara, rende muito mais do que um painel completo que ninguém sabe ler às três da manhã.
