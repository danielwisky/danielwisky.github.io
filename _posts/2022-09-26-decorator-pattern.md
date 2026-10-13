---
layout: post
title: "Decorator: adicionando comportamento sem herdar nada"
subtitle: "Como empilhar funcionalidades num objeto sem criar uma subclasse para cada combinação possível"
tags: [Design Pattern]
---

Um serviço de leitura de arquivos começa simples: lê o conteúdo e devolve uma `String`. Com o tempo, surge a necessidade de comprimir o conteúdo antes de salvar, depois criptografar, depois talvez adicionar um cache. A tentação mais comum é resolver isso com herança:

```java
public class LeitorArquivo { /* ... */ }
public class LeitorArquivoComCompressao extends LeitorArquivo { /* ... */ }
public class LeitorArquivoComCriptografia extends LeitorArquivo { /* ... */ }
public class LeitorArquivoComCompressaoECriptografia extends LeitorArquivoComCompressao { /* ... */ }
```

O problema fica óbvio na quarta classe: cada combinação nova de funcionalidades exige uma subclasse nova, e o número de combinações cresce de forma combinatória. Compressão, criptografia e cache juntos já seriam três classes a mais, e cada uma delas fixa a ordem em que as funcionalidades são aplicadas.

## Envolver em vez de herdar

O Decorator resolve isso trocando herança por composição. Em vez de estender a classe original, cria-se um "envoltório" que implementa a mesma interface e delega para o objeto original, adicionando seu próprio comportamento antes ou depois da chamada.

```java
public interface LeitorArquivo {
    String ler(String caminho);
}

public class LeitorArquivoSimples implements LeitorArquivo {
    @Override
    public String ler(String caminho) {
        // lê o arquivo do disco
        return Files.readString(Path.of(caminho));
    }
}
```

Cada funcionalidade extra vira um decorador, que recebe outro `LeitorArquivo` no construtor e delega para ele:

```java
public abstract class LeitorArquivoDecorator implements LeitorArquivo {

    protected final LeitorArquivo leitor;

    protected LeitorArquivoDecorator(LeitorArquivo leitor) {
        this.leitor = leitor;
    }
}

public class LeitorComDescompressao extends LeitorArquivoDecorator {

    public LeitorComDescompressao(LeitorArquivo leitor) {
        super(leitor);
    }

    @Override
    public String ler(String caminho) {
        String conteudo = leitor.ler(caminho);
        return descomprimir(conteudo);
    }
}

public class LeitorComDescriptografia extends LeitorArquivoDecorator {

    public LeitorComDescriptografia(LeitorArquivo leitor) {
        super(leitor);
    }

    @Override
    public String ler(String caminho) {
        String conteudo = leitor.ler(caminho);
        return descriptografar(conteudo);
    }
}
```

As funcionalidades se combinam empilhando decoradores em tempo de execução, não em tempo de compilação:

```java
LeitorArquivo leitor = new LeitorComDescriptografia(
    new LeitorComDescompressao(
        new LeitorArquivoSimples()
    )
);

String conteudo = leitor.ler("relatorio.dat");
```

Quem chama `leitor.ler(...)` não precisa saber quantas camadas existem por trás, só enxerga a interface `LeitorArquivo`. E a ordem das camadas pode mudar conforme a necessidade (descriptografar antes de descomprimir, ou o contrário) sem criar nenhuma classe nova, só reorganizando a montagem.

## Um exemplo que já existe na própria linguagem

Quem já usou `java.io` esbarrou no Decorator sem perceber:

```java
InputStream entrada = new BufferedInputStream(
    new GZIPInputStream(
        new FileInputStream("dados.gz")
    )
);
```

`FileInputStream` lê bytes do disco, `GZIPInputStream` descomprime o que vier do stream que ele envolve, e `BufferedInputStream` adiciona um buffer por cima de qualquer `InputStream`. Nenhuma dessas classes sabe da existência das outras, elas só conhecem a interface `InputStream` comum, exatamente o mesmo princípio do exemplo do leitor de arquivos.

## Quando vale a pena

O Decorator compensa quando funcionalidades precisam ser combinadas de formas variadas e a lista de combinações tende a crescer, porque é justamente aí que a herança simples explode em número de subclasses. Para um caso com uma ou duas variações fixas que nunca mudam, uma subclasse direta ou até um `if` simples já resolvem sem a indireção extra de empilhar objetos. Vale notar também que cada decorador faz o objeto ficar com um tipo concreto diferente, o que pode dificultar depuração se a pilha de decoradores crescer demais sem necessidade real.

Fonte:
<a href="https://refactoring.guru/pt-br/design-patterns/decorator" target="_blank">Refactoring Guru</a>.

Um grande abraço e até o próximo post!
