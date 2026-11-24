---
layout: post
title: "Voyager 1: o código que sobrevive há 49 anos"
subtitle: "Como é o software de uma sonda que acabou de chegar a um dia-luz da Terra, e o que dá para aprender com quem dá manutenção nele"
tags: [Programação, Sistemas Embarcados]
---

Ontem, 18 de novembro de 2026, a Voyager 1 passou a estar a um dia-luz da Terra. Isso quer dizer que um sinal de rádio, viajando na velocidade da luz, leva 24 horas para ir daqui até ela. Mais 24 para a resposta voltar. São uns 26 bilhões de quilômetros, e nenhum outro objeto feito por humanos chegou tão longe.

A parte astronômica é impressionante, mas o que sempre me pegou nessa história é outra coisa: a sonda foi lançada em setembro de 1977 e continua rodando o software que foi escrito para ela naquela época, com remendos e até reprogramações inteiras feitas em pleno voo ao longo de quase cinco décadas. Existe um time na NASA que, hoje, dá manutenção em código de 1977 rodando num hardware que ninguém pode tocar. Para quem trabalha com software, é difícil pensar num sistema legado mais extremo.

## O hardware: menos memória que um ícone

A Voyager tem três computadores, e cada um deles existe em dobro, por redundância:

- **CCS** (Computer Command Subsystem): o "cérebro". Recebe comandos da Terra, executa as sequências programadas e cuida da proteção contra falhas.
- **AACS** (Attitude and Articulation Control Subsystem): mantém a sonda orientada, com a antena apontada para a Terra, e controla os propulsores.
- **FDS** (Flight Data Subsystem): coleta os dados dos instrumentos e da própria nave e empacota tudo para transmissão.

O CCS e o AACS são máquinas de 18 bits com 4096 palavras de memória cada, em memória de fio plaqueado (plated wire), que não perde o conteúdo sem energia. O FDS é de 16 bits, com cerca de 8 mil palavras. Somando os seis computadores, dá algo na faixa de 69 KB. Um screenshot qualquer no seu desktop provavelmente é maior que toda a memória da sonda.

Os dados científicos eram gravados num gravador de fita de oito trilhas, e hoje a Voyager 1 manda informação para casa a cerca de 160 bits por segundo. Quando o sinal chega aqui, a potência é algo da ordem de attowatts, e só as antenas gigantes da Deep Space Network conseguem ouvir.

## Em que linguagem isso foi escrito?

Muita gente repete que a Voyager foi programada em Fortran. Não foi. O software de bordo é assembly, específico para cada tipo de processador: o CCS e o AACS compartilham uma arquitetura (herdada dos orbitadores Viking), e o FDS usa outra, completamente diferente. O CCS ainda tem um detalhe curioso: além do assembly, ele usa um pseudocódigo próprio da missão, executado por um interpretador.

O Fortran da história era o software de solo, que rodava em mainframes Univac e depois foi portado para Fortran 77. Em algum momento as duas coisas se misturaram, e a versão errada pegou.

O código-fonte de bordo não é público, então não dá para mostrar um trecho real. Mas dá para entender o formato: no CCS, cada instrução tem 18 bits, sendo 6 de opcode e 12 de endereço. Doze bits de endereço dão exatamente 4096 posições, que é o tamanho da memória. Não tem sobra. O design inteiro foi feito para caber na medida.

Outro número que diz muito sobre as prioridades da equipe: segundo a NASA, os algoritmos de proteção contra falhas ocupam cerca de 10% da memória do CCS (e esse número variou ao longo da missão: um relatório de 1981 chegou a contar mais de um quarto da memória só com as rotinas de falha). Em 4096 palavras, alguém decidiu que uma em cada dez seria gasta só para a sonda saber se defender sozinha quando algo der errado. E é justamente isso que a mantém viva até hoje, porque com dois dias de ida e volta, ninguém na Terra consegue reagir a tempo de nada.

## O bug de 2023: debugar a 24 bilhões de quilômetros

Em novembro de 2023, a Voyager 1 começou a mandar lixo. O sinal chegava, a sonda estava viva, mas os dados não faziam sentido. Nada de ciência, nada de telemetria de engenharia.

Pense em como você debugaria isso. Não tem log, não tem SSH, não tem como reiniciar e ver o que acontece. Cada tentativa leva quase dois dias para dar resultado, e um comando errado pode deixar a sonda em um estado do qual ela não volta.

Em março de 2024, a equipe do JPL mandou um comando (que eles chamaram de "poke") e recebeu de volta uma leitura da memória inteira do FDS, um dump de memória à moda antiga. Comparando esse dump com outro recebido antes do problema começar, encontraram a causa: cerca de 3% da memória do FDS estava corrompida, e a suspeita era de um único chip de memória que tinha parado de funcionar, por desgaste ou por uma partícula energética vinda do espaço. Nesse pedaço estava parte do código que empacota os dados.

O chip não tinha conserto. A saída foi mover o código para outro lugar. Só que não existia nenhum bloco livre do tamanho necessário, então o código teve de ser quebrado em pedaços menores e espalhado por lacunas livres da memória. E cada referência a esse código, em qualquer outro ponto do programa, teve de ser atualizada para os endereços novos.

Em termos que a gente conhece: é fazer à mão o trabalho de um linker, em assembly, num programa que você não escreveu, consultando documentos de décadas atrás escritos por engenheiros que não previram esse tipo de problema. O primeiro pedaço, o que empacota os dados de engenharia, foi enviado em 18 de abril de 2024. Dois dias depois, a Voyager 1 voltou a mandar dados legíveis. Nas semanas seguintes o resto do código foi realocado do mesmo jeito, e em junho todos os instrumentos ativos estavam transmitindo ciência de novo.

## Os propulsores que estavam mortos há 21 anos

Em 2004, os propulsores principais de rolagem da Voyager 1 pararam de funcionar porque dois pequenos aquecedores internos perderam energia. A equipe concluiu que não tinha como consertar, passou a usar os propulsores reserva e seguiu a vida. Havia um backup perfeitamente bom, afinal.

Vinte anos depois, os tubos de combustível dos propulsores reserva estavam acumulando resíduo e corriam o risco de entupir. Sem eles, a sonda perde a capacidade de se manter apontada para a Terra, e aí acabou. A equipe então revisitou o problema de 2004 e levantou a hipótese de que os aquecedores nem estavam quebrados: uma perturbação no circuito de alimentação teria virado um interruptor para a posição errada. Se fosse isso, colocar o interruptor de volta na posição original poderia religar tudo.

O detalhe tenso: se os aquecedores não ligassem e os propulsores disparassem frios, podia acontecer uma pequena explosão. E havia prazo, porque a única antena capaz de mandar comandos para a Voyager 1 ia ficar fora do ar para manutenção por meses. Em 20 de março de 2025 a sonda executou os comandos e, quando o sinal chegou à Terra, mais de 23 horas depois, a equipe viu a temperatura dos aquecedores subir. Os propulsores considerados mortos desde 2004 voltaram a funcionar.

Eu gosto dessa história porque ela desmonta uma ideia que a gente tem sobre sistemas legados: a de que uma decisão antiga é definitiva. O diagnóstico de 2004 fazia sentido com o que se sabia em 2004. Vinte anos depois, com outro contexto e outra pressão, valeu a pena reabrir.

## Desligando o sistema aos poucos

A Voyager é alimentada por geradores termoelétricos de radioisótopos, que convertem o calor do decaimento de plutônio em eletricidade. Eles não acabam de repente, mas perdem uns 4 watts por ano. E cada watt a menos precisa sair de algum lugar.

Por isso, há anos a equipe vem desligando coisas: aquecedores, instrumentos, tudo que não é essencial. As câmeras foram desligadas em 1990, logo depois de a Voyager 1 tirar a foto do Pálido Ponto Azul. O instrumento de raios cósmicos foi desligado em fevereiro de 2025. Em abril de 2026 foi a vez do LECP, o experimento de partículas carregadas de baixa energia, que funcionava quase sem interrupção desde o lançamento. Hoje restam dois instrumentos científicos ligados na Voyager 1.

É uma aula de degradação graciosa. Em vez de deixar tudo ligado até o sistema morrer de uma vez, você escolhe conscientemente o que perder primeiro, mantendo o que é essencial (comunicação, orientação, temperatura mínima para o combustível não congelar) e cortando o resto. Quem já escreveu um [kill switch com feature flag](/2026-10-03-feature-flags-na-pratica/) para desligar uma funcionalidade cara durante um pico de carga está, numa escala bem menor, fazendo a mesma escolha.

## O que fica para quem escreve software

Não vou fingir que meu sistema em produção tem algo a ver com uma sonda interestelar. Mas algumas ideias da Voyager valem para qualquer código que precisa durar:

- **Redundância onde dói.** Tudo que é crítico existe em dobro. Não porque é bonito, mas porque não tem como mandar um técnico.
- **O sistema precisa se proteger sozinho.** Com latência de dois dias, a proteção contra falhas tem que funcionar sem ninguém olhando. Em escala menor, é o mesmo raciocínio de timeouts, circuit breakers e retries bem pensados: o sistema reage antes de um humano conseguir.
- **Observabilidade é o que salva.** O bug de 2023 só foi resolvido porque existia um jeito de pedir para a sonda mostrar a própria memória. Se você não consegue ver o estado interno do seu sistema, [bons logs](/2026-10-05-logs-que-ajudam-a-debugar/) são o mínimo.
- **Documentação sobrevive às pessoas.** Boa parte dos engenheiros que construíram a sonda já não está no projeto. Quem mantém a Voyager hoje depende de documentos originais de décadas atrás, alguns guardados em caixas fora do JPL. Código sem contexto escrito vira um mistério em poucos anos, imagine em cinquenta.
- **Mudança pequena, verificada, uma de cada vez.** O patch de 2024 não foi enviado de uma vez. Primeiro um pedaço, confirmação, depois o próximo. É o mesmo princípio de um deploy incremental, só que com quase dois dias de espera entre cada etapa.

A Voyager 1 não está indo para nenhuma estrela específica, mas a próxima que ela vai passar relativamente perto é a Gliese 445: a cerca de 1,7 ano-luz de distância, daqui a uns 40 mil anos, muito depois de o último instrumento ser desligado. A estimativa é que ela continue operando até o começo da década de 2030, se a energia for bem administrada. Depois disso, vai seguir viajando em silêncio, carregando o Disco de Ouro e algumas milhares de palavras de assembly que funcionaram por mais tempo do que a maioria dos sistemas que eu já vi em produção.
