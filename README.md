# danielwisky.com.br

Blog pessoal em Jekyll: CSS próprio (sem framework), tema claro/escuro, busca
client-side e capas de post geradas por tag.

## Rodando

```bash
bundle install
npm install
npm run build          # minifica JS, gera capas e fotos
bundle exec jekyll serve
```

## Publicando um post

Crie `_posts/AAAA-MM-DD-slug.md`:

```yaml
---
layout: post
title: "Título do post"
subtitle: "Uma linha de resumo"
tags: [Java, SOLID]
---
```

A capa sai automática da **primeira tag** (ícone + gradiente). Pra usar foto
real, coloque o original em `_photos/<slug>.jpg` e rode `npm run build:photos`
(detalhes em [`_photos/README.md`](_photos/README.md)). Pra vídeo, embuta o
iframe do YouTube no corpo e rode `npm run build:videos`: ele acha o embed,
baixa a thumbnail e a capa vira link com botão de play.

## Scripts

Artefatos gerados são commitados, o deploy roda só o Jekyll. Rode
`npm run build` sempre que mexer em `assets/js/*.js`, tags ou fotos.

| Script | O que faz |
|---|---|
| `build:js` | Minifica `assets/js/*.js` |
| `build:covers` | Gera capas das tags e `_data/covers.yml` |
| `build:videos` | Baixa thumbnail do YouTube dos posts com vídeo |
| `build:photos` | Otimiza fotos novas de `_photos/` e `_data/photos.yml` |

Cada imagem gera 4 variantes: `cover` (topo do post), `card` (feed, via
`srcset`), `thumb` (sidebar/busca/navegação) e `og` (redes sociais, que não
aceitam SVG). Cor e ícone de cada tag ficam em `TAG_HUES`/`TAG_ICONS`, em
`scripts/build-covers.mjs`.

## Estrutura

```
_posts/      conteúdo
_photos/     fotos de capa, originais (não versionados)
_sass/       tokens, base, grid, components/, sections/
_includes/   header, hero, card de post, sidebar, busca, rodapé
_plugins/    cache-busting e page.image para o SEO
scripts/     geração de assets
```

## Formulário de contato

`/contato/` envia pro Formspree (`formspree_id`) com reCAPTCHA v3
(`recaptcha_site_key`), ambos em `_config.yml`. A validação do score roda no
Formspree, com a secret key configurada no painel deles. Sem JS o form ainda
funciona via POST direto, mas sem o reCAPTCHA.
