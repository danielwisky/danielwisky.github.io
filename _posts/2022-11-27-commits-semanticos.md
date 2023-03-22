---
layout: post
title: "Commits Semânticos"
subtitle: "O que é Commit e como usar Commits Semânticos?"
cover-img: "/assets/img/default-bg.jpg"
categories: [Desenvolvimento de Software]
tags: [Commits, Boas Práticas de Commits]
---

## Introdução

O <a href="https://git-scm.com">Git</a> é, com certeza, o sistema de controle de versão mais amplamente usado no mundo. Ele é um projeto de código aberto, distribuído e mantido ativamente, desenvolvido em 2005 por <a href="https://pt.wikipedia.org/wiki/Linus_Torvalds">Linus Torvalds</a>, o famoso criador do kernel do sistema operacional Linux.

Conheceu o Git há pouco tempo? Confira o <a href="https://git-scm.com/book/en/v1/Getting-Started">guia oficial do iniciante</a>.

## O que é uma mensagem de commit?

O comando **commit** é usado para salvar alterações em um repositório local após fazer o _staging_ no Git. No entanto, antes de poder salvar as alterações no Git, você precisa informar ao Git quais alterações você deseja salvar, pois é possível que você tenha feito milhares de edições. Uma ótima maneira de fazer isso é adicionar uma **mensagem de commit** para identificar suas alterações.

### Opções do comando commit:

`-m`: Esta opção define a mensagem de commit.

```
git add static/admin/config.yml
git commit -m "Setup multiple roles for netlify-cms git gateway"
```

`-a` ou `--all`: Esta opção faz automaticamente o commit de todos os arquivos (incluindo os novos) rastreados, modificados ou excluídos.

```
git commit -a -m "Add a new role for netlify-cms git gateway"
```

`--amend`: Esta opção reescreve o último commit com qualquer alteração que tenha passado por staging no momento ou com uma nova mensagem de commit, devendo ser realizado apenas em commits cujo push ainda não foi realizado em um repositório remoto.

```
git add .
git commit --amend -m "Update roles for netlify-cms git gateway"
```

## O que são commits semânticos?

**Commit semântico** ou **conventional commit**, em sua especificação formal, é uma das formas que se pode fazer padronização de commits dentro de um projeto de desenvolvimento de software.

Isso, utilizando regras simples e claras, que apesar de introduzirem uma pequena carga adicional de trabalho, irá contribuir para que seja reduzido o tempo gasto em compreender como e por que algo foi feito em um alteração ou correção posterior.

E o melhor de tudo: mesmo que por outro membro do time de desenvolvedores.

## A estrutura dos Commits Semânticos

A estrutura de um commit semântico é claro e de fácil identificação, pois utiliza um formato definido na sua sintaxe, possuído partes obrigatórias e outras opcionais.

Abaixo, descreve-se uma estrutura básica de um commit semântico, contendo as partes obrigatórias: tipo e descrição; e as partes opcionais: escopo, corpo e rodapé.

Quanto mais completo o formato do commit maior será o tempo em seu processamento.

Portanto, recomenda-se seu uso simplificado, não utilizando suas partes opcionais. Há casos específicos que necessitam um maior descritivo do processo executado.

```
<tipo>[escopo opcional]: <descrição>
<corpo opcional>
<rodapé opcional>
```

### Tipos

A primeira e principal descrição de um commit semântico, refere-se a seu tipo, os quais possuem a finalidade de comunicar a intenção de processamento que o utilizador teve em sua execução.

Abaixo será enumerado os principais types descritos na documentação do Angular Commit Message Guidelines:

1. `build`: Alterações que afetam o sistema de construção ou dependências externas (escopos de exemplo: gulp, broccoli, npm),
2. `ci`: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs);
3. `docs`: referem-se a inclusão ou alteração somente de arquivos de documentação;
4. `feat`: Tratam adições de novas funcionalidades ou de quaisquer outras novas implantações ao código;
5. `fix`: Essencialmente definem o tratamento de correções de bugs;
6. `perf`: Uma alteração de código que melhora o desempenho;
7. `refactor`: Tipo utilizado em quaisquer mudanças que sejam executados no código, porém não alterem a funcionalidade final da tarefa impactada;
8. `style`: Alterações referentes a formatações na apresentação do código que não afetam o significado do código, como por exemplo: espaço em branco, formatação, ponto e vírgula ausente etc.);
9. `test`: Adicionando testes ausentes ou corrigindo testes existentes nos processos de testes automatizados (TDD);
10. `chore`: Atualização de tarefas que não ocasionam alteração no código de produção, mas mudanças de ferramentas, mudanças de configuração e bibliotecas que realmente não entram em produção;
11. `env`: basicamente utilizado na descrição de modificações ou adições em arquivos de configuração em processos e métodos de integração contínua (CI), como parâmetros em arquivos de configuração de containers.
    Também, o Guidelines, recomenda o tipo improvement para commits que melhoram uma implementação atual sem adicionar um novo recurso ou consertar um bug.

Observe que esses tipos não são obrigatórios pela especificação do Conventional Commits.

Reforço que estes são os principais tipos utilizados, mas existem outros diversos que podem ser empregados e também serem adequados a necessidade de sua equipe de desenvolvimento.

### Escopos

Um escopo pode ser adicionado ao tipo do commit, sendo um parâmetro opcional, para fornecer informações contextuais adicionais e está contido entre parênteses, por exemplo feat(parser): adiciona capacidade de interpretar arrays.

Normalmente, a utilização do escopo acontece em commits específicos e pontuais, os quais necessitam especificar o contexto imediato da mudança executada pelo commit, como em um módulo de login, middleware ou profile.

Por exemplo, um processo de refactor nas configurações de rotas do módulo de login de seu projeto. Poderíamos descrever, utilizando o escopo, da seguinte forma o nosso commit semântico:

```
feat(login/routes): change in route settings for the login
```

### Descrições

As descrições se trata de um dos parâmetros obrigatórios da sintaxe, e devem ser preferencialmente apresentadas com letras minúsculas, e obrigatoriamente iniciando com letra minúscula, suportando letras maiúsculas em descrição de arquivos ou classes específicas.

Também devem ser suficientemente claras, utilizando seu espaço até o máximo permitido da linha.

```
test: ensure DbLoadSurveys throws if LoadSurveysRepository throws
```

### Corpo

O corpo, por sua vez, caracteriza-se por ser opcional e raramente recomendado sua utilização.

Resumindo-se em casos que necessitem de uma apresentação mais completa do conteúdo implantado no commit, o qual a descrição anterior não foi o suficiente para elucidar e esclarecer.

Podendo conter descrições mais precisas do que está contido no commit, apresentando impactos e os motivos pelos quais foram empregadas as alterações no código, como também instruções essenciais para intervenções futuras.

O corpo DEVE iniciar com uma linha em branco após a descrição. Um corpo de confirmação é de forma livre e pode consistir em qualquer número de parágrafos separados por nova linha.

```
feat: ensure LoadSurveysController returns 204 if there is no content
- Returns code 204 if the search load method does not return content
```

### Rodapé

Por fim o rodapé também não possui uso obrigatório. Restringindo-se às alterações de estado via smart commit, como resoluções de problemas (issues), através de chamados de atendimentos, ou sprints de projetos de implantação os quais podem ser descritos no rodapé.

Pode ser fornecido um ou mais rodapés, o primeiro sempre iniciando uma linha em branco após o corpo. Cada rodapé deve consistir em um token de palavra, seguido pelo símbolo ":" (dois pontos) e posteriormente um espaço em branco e o símbolo "#" (sustenido) como separador da string descritiva do rodapé (conceito inspirado na convenção do Git Trailer).

O token de um rodapé DEVE usar o símbolo "-" (hífen) no lugar de caracteres de espaço em branco, por exemplo, Reviewed-by, permitindo uma diferenciação de um rodapé em relação a um corpo com vários parágrafos.

```
fix: correct minor typos in code
see the issue for details
on typos fixed.
Reviewed-by: Elisandro Mello
Refs #133
```

Pronto, agora você já sabe o que precisa sobre commits!

Vale ressaltar que, de forma gradativa, pode-se introduzir e adequar a padronização à cultura de seu time de desenvolvimento, ou mesmo ao seu uso pessoal.

Fonte:
<a href="https://blog.geekhunter.com.br/o-que-e-commit-e-como-usar-commits-semanticos" target="\_blank">Blog GeekHunter</a>.

Um grande abraço e até o próximo post!
