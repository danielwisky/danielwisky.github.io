---
layout: post
title: "CQRS: separando leitura e escrita quando um modelo único não dá mais conta"
subtitle: "Nem todo sistema precisa, mas quando precisa, a diferença é enorme"
tags: [Arquitetura, Programação]
---

A maioria dos sistemas nasce com um único modelo cuidando de tudo: a mesma entidade que recebe uma escrita é a que aparece numa consulta, o mesmo repositório atende os dois lados, e por muito tempo isso funciona bem. O problema aparece quando as necessidades de leitura e escrita começam a divergir de verdade: a escrita precisa de validações rígidas e consistência forte, enquanto a leitura precisa de consultas rápidas, agregadas de várias fontes, otimizadas para telas específicas. Forçar as duas coisas a viverem no mesmo modelo é o que o CQRS propõe resolver.

## A ideia central

CQRS significa Command Query Responsibility Segregation, e o nome já carrega a proposta: separar o caminho que modifica estado (command) do caminho que só consulta estado (query), cada um com seu próprio modelo. Não é só uma separação de métodos dentro da mesma classe, é uma separação de responsabilidade que pode ir desde algo simples, como ter uma classe de leitura e uma de escrita no mesmo serviço, até algo mais radical, como bancos de dados completamente diferentes para cada lado.

```java
// Lado de escrita: foca em regras de negócio e consistência
public class CriarPedidoCommand {
    public void executar(NovoPedido pedido) {
        var entidade = Pedido.criar(pedido.clienteId(), pedido.itens());
        pedidoRepository.salvar(entidade);
        eventPublisher.publicar(new PedidoCriado(
            entidade.getId(),
            entidade.getDataCriacao(),
            entidade.getValorTotal()
        ));
    }
}

// Lado de leitura: foca em consulta rápida, já no formato que a tela precisa
public class PedidoQueryService {
    public PedidoResumoDTO buscarResumo(String pedidoId) {
        return pedidoReadRepository.buscarResumoPorId(pedidoId);
    }
}
```

O lado de escrita pensa em termos de agregados e invariantes de negócio. O lado de leitura pensa em termos de telas e relatórios, sem se preocupar em preservar a mesma estrutura do modelo de domínio.

## Por que isso importa na prática

Um sistema de e-commerce ilustra bem o problema. Criar um pedido exige validar estoque, aplicar regras de desconto, verificar limite de crédito: tudo isso pede um modelo rico, com invariantes bem definidas. Mas a tela de "meus pedidos" do cliente só precisa mostrar status, data e valor total, de um jeito rápido, muitas vezes combinando dados de vários agregados diferentes (pedido, pagamento, entrega) numa única consulta. Modelar essa tela a partir do mesmo agregado rico da escrita normalmente significa um objeto carregado de dados que a tela nem usa, ou pior, uma cascata de consultas a vários repositórios só para montar uma resposta simples.

Com CQRS, a tela de leitura consulta direto uma projeção já pronta para aquele formato, sem reconstruir o agregado de domínio inteiro:

```sql
SELECT pedido_id, status, data_criacao, valor_total
FROM pedido_resumo_view
WHERE cliente_id = ?
ORDER BY data_criacao DESC
```

Essa projeção pode viver na mesma base de dados, numa view ou numa tabela desnormalizada mantida à parte, ou até numa base completamente diferente, otimizada para leitura, como Elasticsearch para busca textual ou um banco colunar para relatórios.

## O que muda quando os bancos são diferentes

A versão mais avançada do padrão separa fisicamente os bancos de dados de escrita e leitura, e é aqui que o CQRS costuma aparecer ao lado de event sourcing ou de algum mecanismo de replicação assíncrona. O fluxo típico é: o comando grava no banco de escrita, publica um evento descrevendo o que aconteceu, e um consumidor assíncrono atualiza o modelo de leitura a partir desse evento.

```java
@EventListener
public void aoReceberPedidoCriado(PedidoCriado evento) {
    var resumo = new PedidoResumoView(
        evento.pedidoId(),
        "CRIADO",
        evento.dataCriacao(),
        evento.valorTotal()
    );
    pedidoReadRepository.salvar(resumo);
}
```

Essa separação traz uma consequência que precisa ser explícita para quem usa o sistema: consistência eventual. Entre o momento em que o comando é processado e o momento em que a projeção de leitura é atualizada, existe uma janela, geralmente de milissegundos, em que uma consulta pode não refletir a escrita mais recente. Para a tela de "meus pedidos", isso raramente importa. Para uma tela que confirma visualmente que a própria ação do usuário teve efeito, como a confirmação de um pagamento, isso pode gerar confusão real se o usuário atualizar a página rápido demais e não ver a mudança esperada.

## O preço que o padrão cobra

CQRS não é grátis, e a lista de custos é concreta: dois modelos para manter em vez de um, uma camada de sincronização entre escrita e leitura (seja ela um evento, uma trigger de banco ou um job), e lógica adicional para lidar com a janela de consistência eventual quando os bancos são separados. Um CRUD simples de cadastro, sem divergência real entre o que a escrita precisa e o que a leitura precisa, só ganha complexidade acidental com CQRS, sem ganhar nada em troca.

A régua prática para decidir é observar onde a dor já apareceu. Se o modelo de escrita está inchado de métodos de consulta que não têm nada a ver com as regras de negócio que ele deveria proteger, ou se a performance de leitura está sendo sacrificada para manter a estrutura rígida que a escrita exige, esses são sinais concretos de que separar os dois lados resolve um problema real, não hipotético. Fora desses sinais, um único modelo bem modelado ainda é a opção mais simples e mais fácil de manter.
