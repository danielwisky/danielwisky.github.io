---
layout: post
title: "G-code: a linguagem por trás de toda impressora 3D"
subtitle: "Como um arquivo de texto simples vira movimento físico, camada por camada"
tags: [Impressão 3D, Programação]
---

Quem programa e nunca chegou perto de uma impressora 3D costuma pensar que o processo é uma caixa preta: manda o modelo pro slicer, aperta imprimir, e a peça sai pronta. Só que entre o modelo 3D e o objeto físico existe um passo bem concreto de programação: o G-code, uma linguagem de instruções que a impressora executa linha por linha, quase como um programa sequencial rodando numa CPU bem peculiar, feita de motores de passo e um bico quente.

## O que é G-code, na prática

G-code é um formato de texto plano onde cada linha é um comando. A letra inicial indica o tipo de comando (G para movimento e preparação, M para funções da máquina), seguida de parâmetros. Um trecho típico de início de impressão parece com isto:

```gcode
G28           ; home em todos os eixos
M104 S210     ; aquece o bico até 210°C, sem esperar
M140 S60      ; aquece a mesa até 60°C, sem esperar
M109 S210     ; espera o bico chegar em 210°C
G1 Z0.2 F300  ; move o eixo Z pra 0.2mm, a 300mm/min
G1 X10 Y10 E5 F1500 ; move em X e Y enquanto extrude 5mm de filamento
```

Cada linha é imperativa e sequencial: a impressora lê, executa, e só passa pra próxima quando termina (ou, em alguns casos, quando o buffer de movimento permite enfileirar o próximo comando). Não tem laço nem condicional nativo no G-code padrão. Se você já programou em assembly ou mexeu com controle de hardware embarcado, a sensação é familiar: pouca abstração, efeito direto sobre o mundo físico.

## De onde vem esse arquivo

Ninguém escreve G-code à mão pra imprimir uma peça inteira (embora seja perfeitamente possível pra testes pontuais). O caminho normal é:

1. Modelar a peça num software de CAD ou baixar um modelo pronto, geralmente em formato STL ou 3MF.
2. Passar esse modelo por um *slicer*, como Cura, PrusaSlicer ou OrcaSlicer.
3. O slicer fatia o modelo 3D em centenas ou milhares de camadas horizontais e gera o G-code que descreve o caminho do bico em cada uma delas.

Esse fatiamento é o núcleo do problema computacional: pra cada camada, o slicer precisa calcular o contorno externo, o preenchimento interno (com uma densidade configurável, tipo 20%), possíveis suportes pra partes que ficariam flutuando no ar, e a ordem de impressão que minimiza deslocamentos desnecessários do bico. É um problema de geometria computacional com bastante espaço pra otimização, e é por isso que projetos como o OrcaSlicer, com seu algoritmos próprios de suporte em árvore e calibração automática, geram economia real de tempo e material em relação a um fatiamento ingênuo.

## Escrevendo um parser simples de G-code

Pra quem gosta de entender construindo, dá pra escrever um parser bem direto que lê um arquivo `.gcode` e extrai informação útil, como o tempo estimado ou o total de filamento usado. Em Java, algo assim já cobre os comandos mais comuns:

```java
record Comando(String codigo, Map<Character, Double> parametros) {}

Comando parseLinha(String linha) {
    String semComentario = linha.split(";", 2)[0].trim();
    if (semComentario.isEmpty()) return null;

    String[] partes = semComentario.split("\\s+");
    Map<Character, Double> parametros = new HashMap<>();
    for (int i = 1; i < partes.length; i++) {
        char letra = partes[i].charAt(0);
        double valor = Double.parseDouble(partes[i].substring(1));
        parametros.put(letra, valor);
    }
    return new Comando(partes[0], parametros);
}
```

Com esse parser, dá pra somar todo valor de `E` (extrusão) do arquivo e estimar o filamento total, ou acumular a distância percorrida em X e Y ponderada pelo `F` (velocidade) de cada linha pra estimar o tempo de impressão, que é basicamente o que os slicers fazem, só que de um jeito bem mais sofisticado, considerando aceleração e desaceleração dos motores.

## Onde a engenharia de software entra de verdade

O que torna esse ecossistema interessante pra quem programa não é só o G-code em si, mas tudo o que existe ao redor dele hoje:

- **Firmwares** como Marlin e Klipper interpretam o G-code e o traduzem em pulsos elétricos pros motores de passo, cuidando de aceleração, prevenção de colisão e correção de vibração em tempo real.
- **Visualizadores de G-code** rodando no navegador, com WebGL, permitem inspecionar o caminho do bico antes de mandar qualquer coisa pra máquina, útil pra pegar erro de configuração sem gastar filamento.
- **APIs de monitoramento**, como a do OctoPrint e a do Moonraker (o servidor web que roda ao lado do Klipper), expõem o estado da impressão (progresso, temperatura, câmera) pra automações e dashboards externos, o tipo de integração que qualquer pessoa acostumada a trabalhar com sistemas distribuídos reconhece na hora.

Impressão 3D parece um hobby de hardware à primeira vista, mas na prática é um pipeline de software: geometria computacional no slicer, controle em tempo real no firmware, e integração via API pra tudo que vem depois. Pra quem programa e tem uma impressora em casa, entender o G-code que sai do slicer é o tipo de curiosidade que rende, no mínimo, um debug bem mais rápido quando alguma peça sai errada.
