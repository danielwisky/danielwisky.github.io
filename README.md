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
| `npm run build:photos` | Otimiza as fotos de `_photos/` e gera `_data/photos.yml` |

As capas saem em três variantes, todas derivadas da primeira tag:

| Variante | Arquivo | Onde é usada |
|---|---|---|
| `cover` | `assets/img/covers/<tag>.svg` | cards do feed e topo do post |
| `thumb` | `assets/img/covers/thumbs/<tag>.svg` | sidebar, busca e navegação entre posts |
| `og` | `assets/img/covers/og/<tag>.jpg` | `og:image` (redes sociais não aceitam SVG) |

Cor e ícone de cada tag ficam nas tabelas `TAG_HUES` e `TAG_ICONS` em
`scripts/build-covers.mjs`. Ao criar uma tag nova, vale acrescentar as duas
entradas antes de rodar o script.

### Foto própria num post

Para um post específico usar uma foto no lugar da capa gerada, largue o
original em `_photos/` com o nome do slug do post:

    _posts/2023-01-16-clean-code-funcoes.md  ->  _photos/clean-code-funcoes.jpg

E rode `npm run build:photos`. O script recorta as três variantes (WebP 4:3,
WebP para miniatura e JPEG 1200x630 para `og:image`) e escreve o mapa em
`_data/photos.yml`. Nenhum front matter precisa mudar: o card, o topo do post,
a sidebar, a busca e as redes sociais passam a usar a foto.

Remover o arquivo de `_photos/` e rodar o script de novo devolve a capa gerada.

Quando a foto vier de um banco de imagens, registre a autoria em
`_data/photo_credits.yml` (arquivo mantido à mão) e ela aparece como legenda
discreta abaixo da capa:

```yaml
"conceito-pilha-lifo":
  author: "Marta Branco"
  author_url: "https://www.pexels.com/@martabranco"
  source: "Pexels"
  source_url: "https://www.pexels.com/photo/..."
```

`avatar` é um nome reservado: `_photos/avatar.jpg` vira a foto do hero
(`assets/img/avatar.webp`, 264px para telas retina) em vez de capa de post.
Grave a fonte já recortada em quadrado. Sem ela, o hero cai no monograma
gerado por `build-covers.mjs`.

Se precisar apontar uma imagem que não siga esse fluxo (uma URL externa, por
exemplo), o `cover-img` no front matter continua tendo precedência sobre tudo.

`_photos/` não é publicada — o Jekyll ignora diretórios com underscore. Só as
versões otimizadas em `assets/img/photos/` vão para o site.

**Atenção à licença.** Foto de banco de imagens só pode entrar aqui se a
licença permitir (Unsplash, Pexels e Pixabay permitem; resultado de busca
genérica, não). Algumas fontes exigem atribuição visível.

### Pendência

`formspree_id` no `_config.yml` está com um placeholder. Até ser preenchido com
o ID real, o formulário de `/contato/` não envia.

### Estrutura do CSS

`assets/css/style.scss` importa `_sass/`: `_tokens.scss` (custom properties de
tema claro e escuro), `_reset`, `_base`, `_grid` (flex 12 colunas),
`components/` e `sections/`.
