# danielwisky.com.br

Blog pessoal em Jekyll: CSS próprio (sem framework), tema claro/escuro, busca
client-side e capas de post com foto.

## Rodando

```bash
bundle install
npm install
npm run build:js     # JS minificado e lunr (não versionados)
bundle exec jekyll serve
```

## Publicando um post

Crie `_posts/AAAA-MM-DD-slug.md`:

```yaml
---
layout: post
title: "Título do post"
subtitle: "Uma linha de resumo"   # vira a meta description, se não houver description
tags: [Java, SOLID]
---
```

Pra capa, coloque a foto original em `_photos/<slug>.jpg` e rode
`npm run build:photos` (detalhes em [`_photos/README.md`](_photos/README.md)).
Sem foto, o post usa a capa padrão de `assets/img/covers/`. Ela, o
`assets/img/avatar.svg` e os ícones de `assets/img/app/` são estáticos: vieram do
`scripts/build-covers.mjs`, removido no PR #136 e ainda recuperável no histórico
do git. Pra vídeo, embuta o
iframe do YouTube no corpo e rode `npm run build:videos`: ele acha o embed,
baixa a thumbnail e a capa vira link com botão de play.

## Revisando um post

Ao atualizar um post antigo, adicione ao front matter:

```yaml
last_modified_at: 2026-10-27
revision_note: "O que mudou, em uma ou duas frases (aceita **markdown**)."
```

O `last_modified_at` mostra "Atualizado em" no cabeçalho e vira o
`dateModified` do SEO e o `lastmod` do sitemap. Com `revision_note`, o post
ganha também uma caixa de revisão antes do texto.

## Scripts

A saída do `build:js` não é versionada: o deploy e o CI rodam o script antes
do Jekyll (`.github/actions/build-assets`). Local, rode de novo depois de mexer
em `assets/js/*.js`. Fotos, thumbnails de vídeo e o sprite de ícones continuam
commitados, porque dependem de `_photos/` ou da rede: rode `npm run build:photos`,
`build:videos` ou `build:icons` e commite o resultado.

| Script | O que faz |
|---|---|
| `build:js` | Minifica `assets/js/*.js` e copia o lunr para `assets/js/vendor/` |
| `build:videos` | Baixa thumbnail do YouTube dos posts com vídeo |
| `build:photos` | Otimiza fotos novas de `_photos/` e `_data/photos.yml` |

Cada imagem gera 4 variantes, porque cada lugar do site a exibe num tamanho
diferente:

| Variante | Foto (`build:photos`) | Onde aparece |
|---|---|---|
| `cover` | 1200x800 WebP | Topo do post e card em telas retina |
| `card` | 560x420 WebP | Card do feed, via `srcset` |
| `thumb` | 180x135 WebP | Sidebar, busca e navegação |
| `og` | 1200x630 JPG | `og:image` (redes sociais não aceitam SVG nem sempre aceitam WebP) |

Se uma variante faltar, `_includes/post-cover.html` cai na `cover`, então o
site não quebra, mas o feed e a sidebar passam a baixar a imagem grande.

## Estrutura

```
_posts/      conteúdo
_photos/     fotos de capa, originais (não versionados)
_sass/       tokens, base, grid, components/, sections/
_includes/   header, hero, card de post, sidebar, busca, rodapé
_plugins/    cache-busting, page.image e description para o SEO
scripts/     geração de assets
```

## Links

O CI de pull request falha se algum link interno estiver quebrado. Os
externos são checados todo dia 1º do mês pelo `.github/workflows/links.yml`,
que abre uma issue com a label `broken-links` (ou comenta na que já estiver
aberta) e a fecha quando todos voltarem a responder. Exclusões ficam em
`lychee.toml`. Pra rodar local: `lychee --root-dir "$PWD/_site" _site`.

## Formulário de contato

`/contato/` envia pro Formspree (`formspree_id`) com reCAPTCHA v3
(`recaptcha_site_key`), ambos em `_config.yml`. A validação do score roda no
Formspree, com a secret key configurada no painel deles. Sem JS o form ainda
funciona via POST direto, mas sem o reCAPTCHA.
