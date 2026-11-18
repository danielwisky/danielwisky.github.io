---
layout: post
title: "Sealed classes e pattern matching no Java"
subtitle: "Como modelar o domínio com tipos fechados e deixar o compilador avisar quando um caso ficou de fora"
tags: [Java, Programação]
---

Todo sistema tem aquele método. Ele recebe um objeto genérico, testa o tipo com uma sequência de `instanceof`, faz um cast em cada ramo e termina com um `else` que lança `IllegalStateException("tipo desconhecido")`. Funciona até o dia em que alguém cria um tipo novo, esquece de atualizar esse método e descobre o problema em produção, quando a exceção estoura.

O Java levou algumas versões para entregar as peças que resolvem isso, e hoje elas estão todas estáveis: records (Java 16), sealed classes (Java 17), pattern matching no `switch` e record patterns (Java 21). Cada uma sozinha é uma melhoria pequena. Juntas, elas mudam o jeito de modelar o domínio. Eu já citei as sealed classes de passagem no [post sobre as versões do Java](/2026-09-24-o-que-mudou-em-cada-versao-do-java/), e aqui a ideia é mostrar como elas funcionam no dia a dia.

## O problema: hierarquias abertas

Pense no status de um pagamento. Ele pode estar aprovado, recusado ou pendente, e cada caso carrega dados diferentes: o aprovado tem código de autorização, o recusado tem motivo, o pendente tem prazo de expiração. O jeito clássico de modelar isso é uma interface e algumas implementações:

```java
public interface StatusPagamento {}

public class Aprovado implements StatusPagamento { ... }
public class Recusado implements StatusPagamento { ... }
public class Pendente implements StatusPagamento { ... }
```

E aí, em algum lugar, alguém precisa decidir o que mostrar para o cliente:

```java
String mensagem(StatusPagamento status) {
    if (status instanceof Aprovado) {
        Aprovado a = (Aprovado) status;
        return "Pagamento aprovado: " + a.getAutorizacao();
    } else if (status instanceof Recusado) {
        Recusado r = (Recusado) status;
        return "Pagamento recusado: " + r.getMotivo();
    } else if (status instanceof Pendente) {
        return "Aguardando confirmação";
    }
    throw new IllegalStateException("status desconhecido: " + status);
}
```

O problema não é a verbosidade. O problema é que a interface é aberta: qualquer classe, em qualquer lugar do código, pode implementar `StatusPagamento`. O compilador não tem como saber que só existem três casos, então não tem como avisar quando aparece um quarto. Aquele `throw` no final existe justamente porque você sabe que a hierarquia pode crescer sem ninguém perceber.

## Sealed: a hierarquia fechada

Uma interface ou classe `sealed` declara quem pode estendê-la:

```java
public sealed interface StatusPagamento
        permits Aprovado, Recusado, Pendente {}

public record Aprovado(String autorizacao, BigDecimal valor) implements StatusPagamento {}
public record Recusado(String motivo, boolean podeTentarDeNovo) implements StatusPagamento {}
public record Pendente(Instant expiraEm) implements StatusPagamento {}
```

Agora só essas três podem implementar `StatusPagamento`. Se alguém tentar criar uma quarta sem adicioná-la ao `permits`, o código não compila.

Algumas regras para não tropeçar:

- As subclasses permitidas precisam estar no mesmo módulo que a classe selada, ou no mesmo pacote se o projeto não usa módulos.
- Cada subclasse precisa dizer como continua a hierarquia: `final` (ninguém mais estende), `sealed` (fecha de novo, com o próprio `permits`) ou `non-sealed` (abre a partir dali). Records são implicitamente `final`, por isso o exemplo acima não precisa de nada.
- Se as subclasses estão no mesmo arquivo da interface, dá para omitir o `permits` e o compilador deduz a lista.

Records e sealed combinam muito bem. O record cuida dos dados (construtor, `equals`, `hashCode`, `toString`, acessores), e o sealed cuida da forma: quais variantes existem. É o que outras linguagens chamam de *tipo soma*, ou *union type*: um status é um aprovado **ou** um recusado **ou** um pendente, e nada além disso.

## Switch com pattern matching

Com a hierarquia fechada, o `switch` consegue fazer o que a cadeia de `if` não conseguia:

```java
String mensagem(StatusPagamento status) {
    return switch (status) {
        case Aprovado a -> "Pagamento aprovado: " + a.autorizacao();
        case Recusado r -> "Pagamento recusado: " + r.motivo();
        case Pendente p -> "Aguardando confirmação até " + p.expiraEm();
    };
}
```

Não tem cast, porque cada `case` já declara a variável com o tipo certo. E, mais importante, não tem `default` nem `throw` no final. O compilador sabe que `StatusPagamento` só pode ser uma dessas três coisas e aceita o `switch` como exaustivo.

A parte boa aparece quando o domínio muda. Digamos que surge o status `Estornado`:

```java
public sealed interface StatusPagamento
        permits Aprovado, Recusado, Pendente, Estornado {}

public record Estornado(Instant quando) implements StatusPagamento {}
```

Todo `switch` sobre `StatusPagamento` sem um `case Estornado` para de compilar. O erro aparece no build, apontando cada lugar que precisa decidir o que fazer com o caso novo. É exatamente a lista que, no modelo antigo, você teria que montar procurando `instanceof` no código e torcendo para não esquecer nenhum.

Isso vale tanto para o `switch` como expressão (o que devolve valor, como no exemplo) quanto para o `switch` como comando quando ele usa padrões: a partir do Java 21, os dois precisam ser exaustivos.

## Record patterns: desestruturando direto no case

Quando a variante é um record, dá para ir além e extrair os campos no próprio `case`:

```java
String mensagem(StatusPagamento status) {
    return switch (status) {
        case Aprovado(var autorizacao, var valor) ->
            "Pagamento de " + valor + " aprovado: " + autorizacao;
        case Recusado(var motivo, var podeTentar) ->
            podeTentar ? "Recusado, tente de novo" : "Recusado: " + motivo;
        case Pendente(var expiraEm) ->
            "Aguardando confirmação até " + expiraEm;
    };
}
```

Os padrões também podem ser aninhados. Se `valor` fosse um record `Dinheiro(BigDecimal quantia, Moeda moeda)`, daria para escrever `case Aprovado(var autorizacao, Dinheiro(var quantia, var moeda))` e chegar direto nos campos de dentro.

Quando um campo não interessa, o Java 22 estabilizou o padrão sem nome, o `_`:

```java
case Pendente(_) -> "Aguardando confirmação";
```

Fica claro para quem lê que o campo foi ignorado de propósito, e não esquecido.

## Guards: condições dentro do case

Às vezes o tipo não basta para decidir. Um pagamento recusado que pode ser tentado de novo merece uma mensagem diferente de um que não pode. Para isso existe o `when`:

```java
return switch (status) {
    case Aprovado a -> "Aprovado";
    case Recusado r when r.podeTentarDeNovo() -> "Recusado, tente de novo";
    case Recusado r -> "Recusado: " + r.motivo();
    case Pendente p -> "Pendente";
};
```

A ordem importa. Os `case` são avaliados de cima para baixo, e o compilador reclama se um caso mais geral vem antes de um mais específico, porque o de baixo nunca seria alcançado. Se você inverter as duas linhas de `Recusado`, o código não compila. Um `case` com `when` não conta como cobertura completa do tipo, então o `case Recusado r` sem guarda continua sendo obrigatório para o `switch` ser exaustivo.

## Um uso que vale a pena: resultado em vez de exceção

Um padrão que fica bem mais natural com tudo isso é devolver o resultado de uma operação como um tipo fechado, em vez de lançar exceção para os casos de erro esperados:

```java
public sealed interface ResultadoCadastro {
    record Criado(Usuario usuario) implements ResultadoCadastro {}
    record EmailJaExiste(String email) implements ResultadoCadastro {}
    record DadosInvalidos(List<String> erros) implements ResultadoCadastro {}
}
```

Quem chama não tem como ignorar o erro sem querer. O `switch` obriga a tratar cada caso, e o tipo de retorno documenta tudo o que pode acontecer, coisa que uma assinatura com `throws` (ou, pior, com exceções não checadas) não faz. Exceção continua sendo a ferramenta certa para o que é de fato excepcional, como banco fora do ar. Para "o e-mail já existe", que faz parte do fluxo normal, um valor de retorno conta a história de forma mais honesta.

Repare que aqui os records estão declarados dentro da interface, o que dispensa o `permits` e deixa todo o modelo num lugar só.

## Cuidados

**Não coloque `default`.** Parece inofensivo, mas um `default` num `switch` sobre tipo selado desliga justamente a checagem que você queria. Quando o `Estornado` aparecer, ele cai no `default` silenciosamente e o compilador fica quieto. Se cada caso tem tratamento próprio, liste todos.

**`null` continua estourando.** Um `switch` recebendo `null` lança `NullPointerException`, como sempre fez. Se `null` for um valor possível ali, dá para tratar com `case null ->`, mas na maioria das vezes o melhor é não deixar o `null` chegar até ali.

**Compilação separada.** Se uma biblioteca adiciona uma subclasse nova e o seu código não é recompilado, o `switch` antigo pode receber em tempo de execução um tipo que não conhecia. Nesse caso o Java lança `MatchException`. Dentro de um mesmo projeto compilado junto, o build pega o caso faltante antes disso. Vale lembrar se a hierarquia selada fizer parte da API pública de uma lib.

**Serialização.** Para desserializar um JSON, a biblioteca precisa saber qual record instanciar. No Jackson 2.x, você anota a interface com `@JsonTypeInfo` e lista as subclasses em `@JsonSubTypes`, uma lista que precisa andar junto com o `permits` e é fácil de esquecer quando surge um caso novo. O Jackson 3 já lê as subclasses permitidas direto do tipo selado, e aí basta o `@JsonTypeInfo`.

## Isso substitui polimorfismo?

Não, e vale entender o porquê. Na orientação a objetos clássica, o comportamento fica dentro de cada classe: `status.mensagem()`, com cada implementação respondendo do seu jeito. Adicionar um tipo novo é fácil (cria a classe e implementa os métodos). Adicionar uma operação nova é trabalhoso, porque você mexe em todas as classes.

Com sealed e pattern matching é o contrário. Adicionar uma operação nova é fácil: escreve mais um `switch`, em qualquer lugar, sem tocar nos records. Adicionar um tipo novo exige atualizar todos os `switch`, mas o compilador mostra onde estão.

Então a pergunta é qual dos dois eixos muda mais no seu domínio. Status de pagamento, eventos, comandos e resultados de operação costumam ter um conjunto estável de variantes e muitas operações espalhadas pelo sistema (mensagem para o cliente, métrica, log, regra de notificação). Aí o modelo selado brilha. Já uma família de estratégias plugáveis, em que novas implementações aparecem com frequência e cada uma carrega comportamento próprio, continua pedindo interface aberta e polimorfismo, como no [Strategy Pattern](/2022-08-16-strategy-pattern/).

## Conclusão

O ganho real das sealed classes não é escrever menos código, embora isso aconteça. É transformar uma suposição que vivia na cabeça de quem escreveu o código ("só existem esses três casos") em algo que o compilador conhece e confere. Aquele `throw new IllegalStateException` no final do método era um bug esperando o dia de acontecer. Com o modelo fechado, o dia em que surge um caso novo vira um erro de compilação, apontando cada lugar que precisa mudar.

Se o seu projeto já está no Java 21 ou mais novo, vale procurar uma cadeia de `instanceof` no código e tentar reescrever. Normalmente fica mais curto, e o compilador passa a avisar quando surgir um caso novo.
