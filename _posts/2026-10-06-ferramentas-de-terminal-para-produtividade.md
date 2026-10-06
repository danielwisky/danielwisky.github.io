---
layout: post
title: "Ferramentas de terminal que valem mais que meia dúzia de plugins de IDE"
subtitle: "CLIs modernas para navegar, buscar, usar git e monitorar sem abrir uma IDE pesada"
tags: [Terminal, Produtividade]
---

Tem uma categoria de ferramenta que some um pouco da conversa quando o assunto é produtividade de dev: as CLIs modernas que substituem comandos Unix antigos por versões mais rápidas, mais legíveis e com configuração sensata por padrão. Nenhuma delas é revolucionária isoladamente, mas juntas mudam o ritmo do trabalho no terminal, que acaba sendo onde boa parte do dia realmente acontece, independente de qual IDE está aberta ao lado.

## Navegação e busca de arquivos

`ls` e `find` fazem o trabalho, mas foram escritos décadas atrás pensando em saída para processamento por script, não para leitura humana. `eza` substitui o `ls` com cores por tipo de arquivo, ícones, status do git por arquivo e uma visão em árvore embutida:

```bash
eza --tree --level=2 --git
```

```bash
# macOS
brew install eza
# Linux (Debian/Ubuntu recentes)
sudo apt install eza
# Windows
winget install eza-community.eza
```

Pra busca de arquivos, `fd` troca a sintaxe do `find` por algo que não exige lembrar flags:

```bash
fd "\.test\.js$" src/
```

```bash
# macOS
brew install fd
# Linux (Debian/Ubuntu: o binário vira "fdfind")
sudo apt install fd-find
# Windows
winget install sharkdp.fd
```

Ignora `.git` e respeita `.gitignore` por padrão, o que já evita metade das dores de cabeça de um `find` mal configurado rodando dentro de `node_modules`.

## Busca de conteúdo

`grep` continua funcionando, mas `ripgrep` (o binário se chama `rg`) é mais rápido em repositórios grandes e também ignora `.gitignore` por padrão:

```bash
rg "TODO|FIXME" --type java
```

```bash
# macOS
brew install ripgrep
# Linux
sudo apt install ripgrep
# Windows
winget install BurntSushi.ripgrep.MSVC
```

O ganho de velocidade importa menos no dia a dia do que o padrão sensato: buscar numa base de código sem precisar excluir manualmente pastas de build, dependências e arquivos gerados toda vez.

## Git sem decorar flags

`git log` e `git diff` cru são legíveis, mas exigem acostumar o olho. `lazygit` dá uma interface de terminal pra operações comuns (stage, commit, rebase interativo, stash, resolução de conflito) sem sair do terminal nem abrir uma GUI separada:

```bash
lazygit
```

```bash
# macOS
brew install lazygit
# Linux (disponível via apt só nas distros mais recentes; nas demais, baixe o binário do GitHub Releases)
sudo apt install lazygit
# Windows
winget install JesseDuffield.lazygit
```

A vantagem sobre uma extensão de git na IDE é ficar disponível em qualquer sessão de terminal, inclusive numa máquina remota via SSH, onde a IDE não está rodando.

## Monitoramento de processos

`top` sempre esteve lá, mas `htop` e mais recentemente `btop` adicionam uma interface navegável com mouse, gráficos de uso de CPU e memória por núcleo, e busca por nome de processo:

```bash
btop
```

```bash
# macOS
brew install btop
# Linux
sudo apt install btop
# Windows (o btop original não roda nativamente; o fork btop4win cobre o mesmo caso de uso)
winget install aristocratos.btop4win
```

Útil pra identificar rápido qual processo está consumindo recursos sem precisar interpretar uma tabela de números.

## O shell em volta: oh-my-zsh e prompts customizados

As ferramentas acima substituem comandos pontuais, mas tem uma camada antes delas: o próprio shell. O macOS usa zsh como padrão desde 2019, e boa parte das distros Linux também tem o zsh disponível, mesmo quando o padrão de fábrica ainda é bash. Pra quem está no zsh, o `oh-my-zsh` é a forma mais comum de organizá-lo: um framework de configuração que adiciona temas, plugins de autocompletar e atalhos pra navegação sem precisar escrever tudo manualmente no `.zshrc`.

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

No Windows, o equivalente mais próximo é rodar zsh dentro do WSL (Windows Subsystem for Linux), já que o PowerShell não tem o mesmo ecossistema de plugins. Quem prefere ficar no PowerShell tem o `oh-my-posh`, que cobre a parte de prompt customizado, mas não o conjunto de plugins do oh-my-zsh.

Uma alternativa mais leve, que funciona igual nos três sistemas porque não depende do shell por baixo, é o `starship`: um prompt único, configurado por um arquivo `toml`, que mostra branch e status do git, versão de linguagem do diretório atual (Java, Node, etc.) e tempo do último comando, sem o peso de um framework inteiro de plugins.

```bash
# macOS
brew install starship
# Linux
curl -sS https://starship.rs/install.sh | sh
# Windows
winget install Starship.Starship
```

A diferença prática entre os dois: `oh-my-zsh` vale a pena pra quem já vive no zsh e quer plugins (autosugestão de comando, syntax highlighting, atalhos de navegação), enquanto `starship` é a escolha mais simples quando o objetivo é só um prompt informativo e rápido, independente de qual shell ou sistema operacional está por trás.

## Por que isso compensa o tempo de configurar

Nenhuma dessas ferramentas é obrigatória, no sentido de que o trabalho sai do mesmo jeito sem elas. O ganho é marginal por uso e cumulativo ao longo do tempo: menos atrito pra encontrar um arquivo, menos tempo decorando uma flag de `find`, menos troca de contexto pra abrir uma GUI só pra ver um diff. A curva de instalação é baixa (a maioria está disponível via `brew`, `apt` ou `cargo`), e como são apenas substitutos de comandos que já fazem parte do hábito, não exigem aprender um fluxo de trabalho novo, só uma saída melhor pro mesmo comando de sempre.
