---
layout: post
title: Clean code - Manipulação de erros
subtitle: Muitas bases de código são completamente dominadas pelo tratamento de erros.
thumbnail-img: /assets/img/thumbs/post-thumb-manipulacao-de-erros.png
tags: [clean-code]
---

## Manipulação de erros

Muitas bases de código são completamente dominadas pelo tratamento de erros. Quando digo dominado, não quero dizer que o tratamento de erros é tudo o que eles fazem. Quero dizer que é quase impossível ver o que o código faz por causa de todo o tratamento de erros dispersos. O tratamento de erros é importante, mas se obscurecer a lógica, está errado.

### Use exceções em vez de códigos de retorno

No passado distante, havia muitos idiomas que não tinham exceções. Nessas línguas, as técnicas para lidar e relatar erros eram limitadas. Você define um sinalizador de erro ou retorna um código de erro que o chamador pode verificar

### Escreva sua declaração Try-Catch-Finally primeiro

De certa forma, os blocos try são como transações. Sua captura deve deixar seu programa em um estado consistente, não importa o que aconteça na tentativa. Por esse motivo, é uma boa prática começar com uma instrução try-catch-finally quando você estiver escrevendo um código que pode gerar exceções. Isso ajuda a definir o que o usuário desse código deve esperar, independentemente do que der errado com o código executado no try.

### Forneça contexto com exceções

Cada exceção lançada deve fornecer contexto suficiente para determinar a origem e o local de um erro.

Crie mensagens de erro informativas e passe-as junto com suas exceções. Mencione a operação que falhou e o tipo de falha. Se você estiver logando em seu aplicativo, passe informações suficientes para poder registrar o erro em seu catch.

### Não Retorne Nulo

Se você for tentado a retornar nulo de um método, considere lançar uma exceção ou retornar um objeto SPECIAL CASE. Se você estiver chamando um método de retorno nulo de uma API de terceiros, considere agrupar esse método com um método que lance uma exceção ou retorne um objeto de caso especial.

### Não Passe Nulo

Retornar nulo de métodos é ruim, mas passar nulo para métodos é pior. A menos que você esteja trabalhando com uma API que espera que você passe nulo, evite passar nulo em seu código sempre que possível.

Fonte:
<a href="https://github.com/JuanCrg90/Clean-Code-Notes" target="\_blank">Clean Code Notes</a>.

Um grande abraço e até o próximo post!
