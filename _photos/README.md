# Fotos de capa dos posts

Largue aqui a foto de um post, nomeada com o slug do post (o nome do arquivo
em `_posts/` sem a data):

    _posts/2023-01-16-clean-code-funcoes.md  ->  _photos/clean-code-funcoes.jpg

Depois rode `npm run build:photos`. O script gera as versões otimizadas em
`assets/img/photos/` e o mapa em `_data/photos.yml`; nenhum front matter
precisa mudar.

`avatar` é um nome reservado: `_photos/avatar.jpg` vira a foto do hero, e deve
ser gravada já recortada em quadrado.

## Os originais NÃO são versionados

O `.gitignore` ignora tudo aqui menos este README. Só as versões otimizadas em
`assets/img/photos/` vão para o repositório, porque os originais somam vários
megabytes e são sempre recuperáveis na origem.

Por isso:

- Num clone novo esta pasta vem vazia, e `npm run build:photos` não mexe em
  nada. Ele nunca apaga uma versão otimizada só porque o original não está por
  perto.
- Para trocar a foto de um post antigo, baixe o original de novo, coloque aqui
  e rode o script.
- `--prune` (que remove versões otimizadas sem original) é ignorado quando esta
  pasta está vazia, justamente para não apagar o site inteiro.

Anote a autoria de qualquer foto de banco de imagens em
`_data/photo_credits.yml`.
