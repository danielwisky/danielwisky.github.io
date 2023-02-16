---
layout: post
title: "Introdução ao DynamoDB"
subtitle: "Implementando um exemplo simples de aplicação com DynamoDB, Spring Boot e Java"
cover-img: "/assets/img/default-bg.jpg"
categories: [Banco de Dados]
tags: [DynamoDB, noSQL, Spring Boot, Java]
---

Amazon DynamoDB é um banco de dados NoSQL gerenciado e escalável fornecido pela Amazon Web Services (AWS). Ele oferece um armazenamento de chave-valor flexível e confiável com escalabilidade automática e alta disponibilidade. O DynamoDB é usado em muitas aplicações que exigem um armazenamento de dados flexível e escalável, como jogos, mídia, comércio eletrônico, publicidade e muito mais.

O DynamoDB foi projetado para ser escalável e altamente disponível, permitindo que ele lide com volumes crescentes de dados e tráfego de usuários. Ele é um banco de dados sem esquema, o que significa que as tabelas do DynamoDB não têm um esquema rígido definido. Em vez disso, as tabelas do DynamoDB são compostas por itens, que são basicamente conjuntos de pares de chave-valor. Isso permite uma grande flexibilidade na modelagem de dados, tornando o DynamoDB uma boa escolha para aplicativos com requisitos de dados complexos e em evolução.

O DynamoDB tem uma API rica que permite operações como criar, ler, atualizar e excluir itens de tabela, além de consultar itens com base em suas chaves e índices secundários. O DynamoDB também possui recursos como transações, streams e triggers que permitem que os aplicativos respondam a eventos de mudança de dados em tempo real.

## Exemplo de implementação usando Spring Boot e Java

Vamos criar um exemplo simples de implementação do DynamoDB usando o Spring Boot e o Java. Nesse exemplo, vamos criar uma tabela simples de usuários e realizar operações básicas de CRUD (criação, leitura, atualização e exclusão) na tabela.

Para começar, precisamos configurar o ambiente de desenvolvimento com o Spring Boot e as bibliotecas necessárias para trabalhar com o DynamoDB. Vamos usar o Spring Initializr para criar um novo projeto do Spring Boot com as dependências necessárias. Podemos criar um novo projeto com as seguintes opções:

1. `Tipo de projeto`: Maven
2. `Linguagem`: Java
3. `Versão do Spring Boot`: 2.5.6
4. `Group`: com.example
5. `Artifact`: spring-boot-dynamodb-example
6. `Dependencies`: DynamoDB, Spring Web, Spring Data JPA

Depois de criar o projeto, podemos adicionar uma nova classe chamada User, que representará um item em nossa tabela do DynamoDB. A classe User deve ter as seguintes propriedades:

```java
@DynamoDBTable(tableName = "users")
public class User {

    @DynamoDBHashKey(attributeName = "userId")
    private String userId;

    @DynamoDBAttribute(attributeName = "firstName")
    private String firstName;

    @DynamoDBAttribute(attributeName = "lastName")
    private String lastName;

    // getters and setters
}
```

Observe que estamos usando as anotações `@DynamoDBTable`, `@DynamoDBHashKey` e `@DynamoDBAttribute` para mapear nossa classe para uma tabela do DynamoDB. A anotação `@DynamoDBTable` é usada para especificar o nome da tabela, enquanto a anotação `@DynamoDBHashKey` é usada para especificar a chave primária da tabela. As outras propriedades da classe são mapeadas como atributos da tabela usando a anotação `@DynamoDBAttribute`.

Agora podemos criar um repositório para realizar operações CRUD na tabela do DynamoDB. Vamos criar uma nova interface chamada UserRepository com os métodos necessários para realizar operações na tabela. A interface deve estender a interface CrudRepository do Spring Data JPA.

```java
public interface UserRepository extends CrudRepository<User, String> {

  @Override
  Optional<User> findById(String id);

  @Override
  void deleteById(String id);

}
```

Observe que estamos usando o tipo String para representar a chave primária da tabela do DynamoDB, que é a propriedade userId em nossa classe User.

Agora podemos criar um controlador REST para expor nossos endpoints e realizar operações CRUD na tabela. Vamos criar uma nova classe chamada UserController com os seguintes métodos:

```java
@RestController
@RequestMapping("/users")
public class UserController {

  @Autowired
  private UserRepository userRepository;

  @PostMapping
  public User createUser(@RequestBody User user) {
    return userRepository.save(user);
  }

  @GetMapping("/{userId}")
  public User getUserById(@PathVariable String userId) {
    return userRepository.findById(userId).orElse(null);
  }

  @PutMapping("/{userId}")
  public User updateUser(@PathVariable String userId, @RequestBody User user) {
    user.setUserId(userId);
    return userRepository.save(user);
  }

  @DeleteMapping("/{userId}")
  public void deleteUser(@PathVariable String userId) {
    userRepository.deleteById(userId);
  }
}
```

Observe que estamos usando as anotações do Spring MVC para mapear os endpoints REST para os métodos correspondentes do controlador. Estamos injetando o UserRepository no controlador usando a anotação `@Autowired`.

Agora podemos executar nossa aplicação e testar os endpoints REST usando um cliente HTTP. Podemos criar um novo usuário com uma solicitação POST para http://localhost:8080/users com o seguinte corpo:

```
{
    "userId": "1",
    "firstName": "John",
    "lastName": "Doe"
}
```

Podemos recuperar o usuário recém-criado com uma solicitação GET para http://localhost:8080/users/1. Podemos atualizar o usuário com uma solicitação PUT para http://localhost:8080/users/1 com o seguinte corpo:

```
{
    "firstName": "Jane",
    "lastName": "Doe"
}
```

Finalmente, podemos excluir o usuário com uma solicitação DELETE para http://localhost:8080/users/1.

## Conclusão

O DynamoDB é um banco de dados NoSQL altamente escalável e gerenciado fornecido pela AWS. Ele oferece um armazenamento de chave-valor flexível e confiável com escalabilidade automática e alta disponibilidade. Neste artigo, criamos um exemplo simples de implementação do DynamoDB usando o Spring Boot e o Java. Criamos uma tabela de usuários e realizamos operações básicas de CRUD na tabela usando um controlador REST e um repositório Spring Data JPA. Com o DynamoDB e o Spring Boot, podemos criar aplicativos altamente escaláveis e flexíveis com facilidade.

Fonte:
<a href="https://openai.com/blog/chatgpt/" target="\_blank">ChatGPT</a>.

Um grande abraço e até o próximo post!
