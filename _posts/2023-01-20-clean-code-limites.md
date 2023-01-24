---
layout: post
title: "Clean code: Limites"
subtitle: Raramente controlamos todo o software em nossos sistemas.
thumbnail-img: /assets/img/thumbs/post-thumb-limites.png
tags: [clean-code]
---

## Limites

Raramente controlamos todo o software em nossos sistemas. Às vezes, compramos pacotes de terceiros ou usamos código aberto. Outras vezes, dependemos de equipes de nossa própria empresa para produzir componentes ou subsistemas para nós. De alguma forma, devemos integrar claramente esse código estrangeiro ao nosso.

### Usando código de terceiros

Existe uma tensão natural entre o provedor de uma interface e o usuário de uma interface. Os provedores de pacotes e estruturas de terceiros buscam uma ampla aplicabilidade para que possam trabalhar em muitos ambientes e atrair um público amplo. Os usuários, por outro lado, desejam uma interface focada em suas necessidades específicas. Essa tensão pode causar problemas nos limites de nossos sistemas. Exemplo:

```java
Map sensors = new HashMap();
Sensor s = (Sensor)sensors.get(sensorId);
```

VS

```java
public class Sensors {
  private Map sensors = new HashMap();

  public Sensor getById(String id) {
    return (Sensor) sensors.get(id);
  }
  //snip
}
```

O primeiro código expõe o casting no Map, enquanto o segundo é capaz de evoluir com muito pouco impacto no resto da aplicação. O casting e o gerenciamento de tipos são feitos dentro da classe Sensors.

A interface também é personalizada e restrita para atender às necessidades do aplicativo. Isso resulta em um código mais fácil de entender e mais difícil de usar indevidamente. A classe Sensors pode impor regras de design e negócios.

### Explorando e aprendendo limites

O código de terceiros nos ajuda a obter mais funcionalidades em menos tempo. Por onde começamos quando queremos utilizar algum pacote de terceiros? Não é nosso trabalho testar o código de terceiros, mas pode ser do nosso interesse escrever testes para o código de terceiros que usamos.

É uma boa ideia escrever algum teste para aprender e entender como usar um código de terceiros. Newkirk chama esses testes de testes de aprendizagem.

### Testes de aprendizado são melhores que gratuitos

Os testes de aprendizado acabam não custando nada. Tínhamos que aprender a API de qualquer maneira, e escrever esses testes foi uma maneira fácil e isolada de obter esse conhecimento. Os testes de aprendizado eram experimentos precisos que ajudavam a aumentar nossa compreensão.

Os testes de aprendizado não são apenas gratuitos, mas também têm um retorno positivo do investimento. Quando há novos lançamentos do pacote de terceiros, fazemos os testes de aprendizado para ver se há diferenças de comportamento.

### Usando código que ainda não existe

Algumas vezes é necessário trabalhar em um módulo que será conectado a outro módulo em desenvolvimento, e não temos ideia de como enviar as informações, pois a API ainda não foi desenhada. Nestes casos é recomendável criar uma interface para encapsular a comunicação com o módulo pendente. Desta forma, mantemos o controle sobre nosso módulo e podemos testar, embora o segundo módulo ainda não esteja disponível.

### Limites Limpos

Coisas interessantes acontecem nos limites. A mudança é uma dessas coisas. Bons projetos de software acomodam mudanças sem grandes investimentos e retrabalho. Quando usamos código que está fora de nosso controle, cuidados especiais devem ser tomados para proteger nosso investimento e garantir que alterações futuras não sejam muito caras.

Fonte:
<a href="https://github.com/JuanCrg90/Clean-Code-Notes" target="\_blank">Clean Code Notes</a>.

Um grande abraço e até o próximo post!
