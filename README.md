# danielwisky.com.br

Blog pessoal em Jekyll, com tema próprio: CSS escrito do zero (sem framework),
tema claro/escuro, busca client-side e capas de post geradas por tag.

## Rodando

```bash
bundle install
npm install
npm run build          # minifica o JS e gera capas e fotos
bundle exec jekyll serve
```

## Publicando um post

Crie o arquivo em `_posts/AAAA-MM-DD-slug.md`:

```yaml
---
layout: post
title: "Título do post"
subtitle: "Uma linha de resumo"
tags: [Java, SOLID]
---
```

A capa sai automática a partir da **primeira tag**: um ícone e o nome da tag
sobre um gradiente de cor fixa. Nada mais é preciso.

Para usar uma foto no lugar dela, coloque o original em `_photos/<slug>.jpg`
(o slug é o nome do arquivo do post sem a data) e rode `npm run build:photos`.
Detalhes em [`_photos/README.md`](_photos/README.md).

## Scripts

Os artefatos gerados são commitados: o deploy roda só o Jekyll. Rode
`npm run build` sempre que mexer em `assets/js/*.js`, nas tags dos posts ou nas
fotos.

| Script | O que faz |
|---|---|
| `npm run build:js` | Minifica `assets/js/*.js` |
| `npm run build:covers` | Gera as capas das tags e `_data/covers.yml` |
| `npm run build:photos` | Otimiza as fotos novas de `_photos/` e `_data/photos.yml` |

Cada imagem sai em quatro variantes, para cada lugar do site receber o tamanho
que realmente exibe:

| Variante | Onde aparece |
|---|---|
| `cover` | topo do post, e retina dos cards |
| `card` | card do feed (via `srcset`) |
| `thumb` | sidebar, busca e navegação entre posts |
| `og` | `og:image`, já que redes sociais não aceitam SVG |

## Estrutura

```
_posts/      conteúdo
_photos/     fotos de capa, originais (não versionados)
_sass/       tokens, base, grid, components/, sections/
_includes/   header, hero, card de post, sidebar, busca, rodapé
_plugins/    cache-busting e page.image para o SEO
scripts/     geração de assets
```

Cor e ícone de cada tag ficam em `TAG_HUES` e `TAG_ICONS`, dentro de
`scripts/build-covers.mjs`.

## Pendência

`formspree_id` no `_config.yml` está com um placeholder. Até ser preenchido com
o ID real, o formulário de `/contato/` não envia.
