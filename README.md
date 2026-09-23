## danielwisky.com.br ##

Blog em Jekyll com tema próprio: CSS escrito do zero (sem framework), tema
claro/escuro, capas de post geradas por tag e busca client-side com lunr.

### Desenvolvimento

```bash
bundle install
npm install
npm run build          # minifica o JS e gera as capas SVG
bundle exec jekyll serve
```

### Build de assets

Os artefatos gerados são commitados — o workflow do GitHub Pages roda só o
Jekyll. Rode `npm run build` sempre que mexer em `assets/js/*.js` ou nas tags
dos posts.

| Script | O que faz |
|---|---|
| `npm run build:js` | Minifica `assets/js/*.js` com terser |
| `npm run build:covers` | Gera as capas e `_data/covers.yml` a partir da primeira tag de cada post |

As capas saem em três variantes, todas derivadas da primeira tag:

| Variante | Arquivo | Onde é usada |
|---|---|---|
| `cover` | `assets/img/covers/<tag>.svg` | cards do feed e topo do post |
| `thumb` | `assets/img/covers/thumbs/<tag>.svg` | sidebar, busca e navegação entre posts |
| `og` | `assets/img/covers/og/<tag>.jpg` | `og:image` (redes sociais não aceitam SVG) |

Cor e ícone de cada tag ficam nas tabelas `TAG_HUES` e `TAG_ICONS` em
`scripts/build-covers.mjs`. Ao criar uma tag nova, vale acrescentar as duas
entradas antes de rodar o script.

### Pendência

`formspree_id` no `_config.yml` está com um placeholder. Até ser preenchido com
o ID real, o formulário de `/contato/` não envia.

### Estrutura do CSS

`assets/css/style.scss` importa `_sass/`: `_tokens.scss` (custom properties de
tema claro e escuro), `_reset`, `_base`, `_grid` (flex 12 colunas),
`components/` e `sections/`.
