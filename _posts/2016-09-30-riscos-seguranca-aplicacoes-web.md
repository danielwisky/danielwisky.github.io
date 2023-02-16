---
layout: post
title: "Riscos de segurança em aplicações Web"
subtitle: "Os 10 riscos de segurança mais críticas em aplicações WEB"
cover-img: "/assets/img/post-bg-risco.jpg"
thumbnail-img: "/assets/img/thumbs/post-thumb-risco.png"
categories: [Segurança da Informação]
tags: [Segurança]
---

## Introdução

A Open Web Application Security Project (OWASP) é uma entidade sem fins lucrativos e de reconhecimento internacional, que contribui para a melhoria da segurança de softwares aplicativos reunindo informações importantes que permitem avaliar riscos de segurança e combater formas de ataques através da internet.

Os estudos e documentos da OWASP são disponibilizadas para toda a comunidade internacional, e adotados como referência por entidades como U.S. Defense Information Systems Agency (DISA), U.S. Federal Trade Commission, várias empresas e organizações mundiais das áreas de Tecnologia, Auditoria e Segurança, e também pelo PCI Council.

O trabalho mais conhecido da OWASP é sua lista "The Top 10 Most Critical Web Application Security Risks", que reúne os riscos de ataque mais críticos exploráveis a partir de vulnerabilidades nas aplicações web.

## OWASP Top 10 – 2013

- **A1 – Injeção**: As falhas de Injeção, tais como injeção de SQL, de SO (Sistema Operacional) e de LDAP, ocorrem quando dados não confiavéis são enviados para um interpretador como parte de um comando ou consulta. Os dados manipulados pelo atacante podem iludir o interpretador para que este execute comandos indesejados ou permita o acesso a dados não autorizados.

- **A2 – Quebra de Autenticação e Gerenciamento de Sessão**: As funções da aplicação relacionadas com autenticação e gerenciamento de sessão geralmente são implementadas de forma incorreta, permitindo que os atacantes comprometam senhas, chaves e tokens de sessão ou, ainda, explorem outra falha da implementação para assumir a identidade de outros usuários.

- **A3 – Cross-Site Scripting (XSS)**: Falhas XSS ocorrem sempre que uma aplicação recebe dados não confiáveis e os envia ao navegador sem validação ou filtro adequados. XSS permite aos atacantes executarem scripts no navegador da vítima que podem "sequestrar" sessões do usuário, desfigurar sites, ou redirecionar o usuário para sites maliciosos.

- **A4 – Referência Insegura e Direta a Objetos**: Uma referência insegura e direta a um objeto ocorre quando um programador expõe uma referência à implementação interna de um objeto, como um arquivo, diretório, ou registro da base de dados. Sem a verificação do controle de acesso ou outra proteção, os atacantes podem manipular estas referências para acessar dados não-autorizados.

- **A5 – Configuração Incorreta de Segurança**: Uma boa segurança exige a definição de uma configuração segura e implementada na aplicação, frameworks, servidor de aplicação, servidor web, banco de dados e plataforma. Todas essas configurações devem ser definidas, implementadas e mantidas, já que geralmente a configuração padrão é insegura. Adicionalmente, o software deve ser mantido atualizado.

- **A6 – Exposição de Dados Sensíveis**: Muitas aplicações web não protegem devidamente os dados sensíveis, tais como cartões de crédito, IDs fiscais e credenciais de autenticação. Os atacantes podem roubar ou modificar esses dados desprotegidos com o propósito de realizar fraudes de cartões de crédito, roubo de identidade, ou outros crimes. Os dados sensíveis merecem proteção extra como criptografia no armazenamento ou em trânsito, bem como precauções especiais quando trafegadas pelo navegador.

- **A7 – Falta de Função para Controle do Nível de Acesso**: A maioria das aplicações web verificam os direitos de acesso em nível de função antes de tornar essa funcionalidade visível na interface do usuário. No entanto, as aplicações precisam executar as mesmas verificações de controle de acesso no servidor quando cada função é invocada. Se estas requisições não forem verificadas, os atacantes serão capazes de forjar as requisições, com o propósito de acessar a funcionalidade sem autorização adequada.

- **A8 – Cross-Site Request Forgery (CSRF)**: Um ataque CSRF força a vítima que possui uma sessão ativa em um navegador a enviar uma requisição HTTP forjada, incluindo o cookie da sessão da vítima e qualquer outra informação de autenticação incluída na sessão, a uma aplicação web vulnerável. Esta falha permite ao atacante forçar o navegador da vítima a criar requisições que a aplicação vulnerável aceite como requisições legítimas realizadas pela vítima.

- **A9 – Utilização de Componentes Vulneráveis Conhecidos**: Componentes, tais como bibliotecas, frameworks, e outros módulos de software quase sempre são executados com privilégios elevados. Se um componente vulnerável é explorado, um ataque pode causar sérias perdas de dados ou o comprometimento do servidor. As aplicações que utilizam componentes com vulnerabilidades conhecidas podem minar as suas defesas e permitir uma gama de possíveis ataques e impactos.

- **A10 – Redirecionamentos e Encaminhamentos Inválidos**: Aplicações web frequentemente redirecionam e encaminham usuários para outras páginas e sites, e usam dados não confiáveis para determinar as páginas de destino. Sem uma validação adequada, os atacantes podem redirecionar as vítimas para sites de phishing ou malware, ou usar encaminhamentos para acessar páginas não autorizadas.

Fonte:
<a href="https://www.owasp.org/images/9/9c/OWASP_Top_10_2013_PT-BR.pdf" target="\_blank">OWASP Top 10 – 2013</a>.

Para saber mais:
<a href="https://www.owasp.org/index.php/Main_Page" target="\_blank">OWASP</a>,
<a href="https://www.owasp.org/index.php/OWASP_Guide_Project" target="\_blank">OWASP Developer Guide</a>.

Um grande abraço e até o próximo post!
