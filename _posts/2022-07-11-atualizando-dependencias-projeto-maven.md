---
layout: post
title: Atualizando as dependências do seu projeto maven
subtitle: Atualizando as dependências do seu projeto maven como um verdadeiro bibliotecário
tags: [maven]
---

O plugin [Versions Maven Plugin](https://www.mojohaus.org/versions-maven-plugin/index.html) é usado quando desejamos gerenciar as versões de artefatos no POM de um projeto.

## Mãos ao teclado:

Nesta mãos ao teclado, vamos atualizar todas as dependências do nosso projeto de exemplo.

Começando pelas versões que estão dentro do `<parent>`.

Arquivo `pom.xml` antes da nossa atualização:

```
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.6.8</version>
    <relativePath/> <!-- lookup parent from repository -->
</parent>
```

Vamos rodar o seguinte comando:

```
mvn versions:update-parent
```

Saída do console:

```
[INFO]
[INFO] ---------------------< br.com.danielwisky:teste >---------------------
[INFO] Building teste 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO]
[INFO] --- versions-maven-plugin:2.8.1:update-parent (default-cli) @ teste ---
[INFO] Updating parent from 2.6.8 to 2.7.1
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  4.420 s
[INFO] Finished at: 2022-07-11T15:26:15-03:00
[INFO] ------------------------------------------------------------------------

Process finished with exit code 0
```

Após a execução do comando `mvn versions:update-parent`, podemos notar que as seguintes versões foram atualizadas:
* `spring-boot-starter-parent` foi atualizada da versão `2.6.8` para `2.7.1`

Arquivo `pom.xml` após a nossa atualização:

```
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.7.1</version>
    <relativePath/> <!-- lookup parent from repository -->
</parent>
```

Agora as versões que estão dentro de `<properties>`.

Arquivo `pom.xml` antes da nossa atualização:

```
<properties>
    <java.version>18</java.version>
    <springdoc.version>1.6.1</springdoc.version>
    <commons-collections4.version>4.4</commons-collections4.version>
    <testcontainers.version>1.17.2</testcontainers.version>
    <pitest-plugin.version>1.9.0</pitest-plugin.version>
    <jacoco-plugin.version>0.8.8</jacoco-plugin.version>
    <sonar-plugin.version>3.7.0.1746</sonar-plugin.version>
</properties>
```

Vamos rodar o seguinte comando:

```
versions:update-properties
```

Saída do console:

```
[INFO] Scanning for projects...
[INFO]
[INFO] ---------------------< br.com.danielwisky:teste >---------------------
[INFO] Building teste 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO]
[INFO] --- versions-maven-plugin:2.10.0:update-properties (default-cli) @ teste ---
[INFO] Major version changes allowed
[INFO] Updated ${pitest-plugin.version} from 1.9.0 to 1.9.2
[INFO] Major version changes allowed
[INFO] Updated ${springdoc.version} from 1.6.1 to 1.6.9
[INFO] Major version changes allowed
[INFO] Updated ${testcontainers.version} from 1.17.2 to 1.17.3
[INFO] Major version changes allowed
[INFO] Updated ${sonar-plugin.version} from 3.7.0.1746 to 3.9.1.2184
[INFO] Major version changes allowed
[INFO] Property ${commons-collections4.version}: Leaving unchanged as 4.4
[INFO] Major version changes allowed
[INFO] Property ${jacoco-plugin.version}: Leaving unchanged as 0.8.8
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  1.518 s
[INFO] Finished at: 2022-07-11T16:57:42-03:00
[INFO] ------------------------------------------------------------------------

Process finished with exit code 0
```

Após a execução do comando `versions:update-properties`, podemos notar que as seguintes versões foram atualizadas:
* `pitest-pluginpitest-maven` foi atualizada da versão `1.9.0` para `1.9.2`
* `springdoc-openapi-ui` foi atualizada da versão `1.6.1` para `1.6.9`
* `testcontainers foi` atualizada da versão `1.17.2` para `1.17.3`
* `sonar-maven-plugin` foi atualizada da versão `3.7.0.1746` para `3.9.1.2184`

Arquivo `pom.xml` após a nossa atualização:

```
<properties>
    <java.version>18</java.version>
    <springdoc.version>1.6.9</springdoc.version>
    <commons-collections4.version>4.4</commons-collections4.version>
    <testcontainers.version>1.17.3</testcontainers.version>
    <pitest-plugin.version>1.9.2</pitest-plugin.version>
    <jacoco-plugin.version>0.8.8</jacoco-plugin.version>
    <sonar-plugin.version>3.9.1.2184</sonar-plugin.version>
</properties>
```

Caso não estejamos utilizando as `<properties>` para controlar as versões dos plugins do nosso projeto, podemos executar o seguinte comando:

```
versions:use-latest-releases
```

Arquivo `pom.xml` antes da nossa atualização:

```
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-ui</artifactId>
    <version>1.6.8</version>
</dependency>
```

Após a execução do comando `versions:use-latest-releases`, podemos notar que as seguintes versões foram atualizadas:
* `springdoc-openapi-ui` foi atualizada da versão `1.6.8` para `1.6.9`

Arquivo `pom.xml` após a nossa atualização:

```
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-ui</artifactId>
    <version>1.6.9</version>
</dependency>
```

Podemos notar também que foi criado um arquivo chamado `pom.xml.versionsBackup`, através desse arquivo podemos reverter as atualizações com o seguinte comando:

```
mvn versions:revert
```

Ou simplesmente, podemos confirmar as atualizações, rodando o seguinte comando:

```
mvn versions:commit
```

Fonte:
<a href="https://www.mojohaus.org/versions-maven-plugin/index.html" target="\_blank">Versions Maven Plugin</a>.

Um grande abraço e até o próximo post!