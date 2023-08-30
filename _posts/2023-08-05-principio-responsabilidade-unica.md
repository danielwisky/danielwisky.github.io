---
layout: post
title: "SOLID: Princípio da Responsabilidade Única"
subtitle: "Princípio da Responsabilidade Única e exemplos de implementação em Java"
cover-img: "/assets/img/default-bg.jpg"
categories: [Desenvolvimento de Software]
tags: [Java, SOLID]
---

O Princípio da Responsabilidade Única (Single Responsibility Principle - SRP) é um dos princípios do SOLID, um conjunto de princípios de design de software que visam aprimorar a qualidade, a manutenibilidade e a extensibilidade do código. O SRP estabelece que uma classe deve ter apenas uma razão para mudar, ou seja, deve ter uma única responsabilidade.

O SRP propõe dividir as responsabilidades em classes distintas, a fim de manter o código mais coeso, compreensível e fácil de manter. Neste artigo, vamos explorar o SRP em detalhes e fornecer exemplos de implementação em Java.

## O que é o Princípio da Responsabilidade Única (SRP)?

O Princípio da Responsabilidade Única declara que uma classe deve ter apenas uma responsabilidade e, portanto, deve ter apenas um motivo para mudar. Cada classe deve ser responsável por fazer uma única tarefa e fazer bem. Isso ajuda a evitar acoplamento excessivo entre classes e torna o código mais modular e testável.

## Vantagens do SRP:

- **Coesão:** Uma classe com uma única responsabilidade é mais coesa, pois não está tentando realizar várias tarefas diferentes. Isso ajuda a manter o código mais organizado e fácil de entender.
- **Testabilidade:** Classes com uma única responsabilidade são mais fáceis de testar, pois seus comportamentos podem ser testados de forma isolada, sem a interferência de outras responsabilidades.
- **Manutenibilidade:** Quando uma mudança ocorre em uma determinada responsabilidade, apenas a classe afetada precisa ser modificada. Isso reduz o risco de introduzir efeitos colaterais em outras partes do sistema.
- **Reutilização:** Classes coesas e com uma única responsabilidade são mais propensas a serem reutilizadas em diferentes partes do sistema.

## Exemplos:

1. Exemplo de classes com múltiplas responsabilidades (violação do SRP):

    ```java
    class User {
        public void register() {
            // Lógica para criar um novo usuário no banco de dados
        }
    
        public void sendEmail() {
            // Lógica para enviar um e-mail de boas-vindas
        }
    
        public void generateReport() {
            // Lógica para gerar um relatório do usuário
        }
    }
    ```

   Neste exemplo, a classe `User` possui três métodos que desempenham diferentes responsabilidades: registrar um usuário, enviar e-mail e gerar um relatório. Essas responsabilidades podem mudar por diferentes motivos, violando o princípio da responsabilidade única.<br><br>

2. Exemplo de classes com responsabilidades separadas (aplicação do SRP):

    ```java
    class UserManager {
        public void registerUser() {
            // Lógica para criar um novo usuário no banco de dados
        }
    }
    
    class EmailSender {
        public void sendWelcomeEmail() {
            // Lógica para enviar um e-mail de boas-vindas
        }
    }
    
    class ReportGenerator {
        public void generateUserReport() {
            // Lógica para gerar um relatório do usuário
        }
    }
    ```

   Neste exemplo, as responsabilidades foram divididas em classes distintas. A classe `UserManager` é responsável apenas por registrar um usuário, a classe `EmailSender` é responsável por enviar e-mails e a classe `ReportGenerator` é responsável por gerar relatórios. Cada classe tem apenas uma razão para mudar e uma única responsabilidade, aderindo ao SRP.<br><br>

## Conclusão

A aplicação do Princípio da Responsabilidade Única (SRP) é fundamental para criar um código bem estruturado, coeso e de fácil manutenção. Ao garantir que uma classe tenha apenas uma responsabilidade, podemos melhorar a legibilidade, a testabilidade e a extensibilidade do código. Os exemplos de implementação em Java ilustram como dividir as responsabilidades em classes distintas, priorizando a coesão e o baixo acoplamento entre elas.

Lembre-se de que o SRP é apenas um dos princípios do SOLID e deve ser aplicado em conjunto com os outros princípios para obter um design de software robusto e escalável.

Um grande abraço e até o próximo post!
