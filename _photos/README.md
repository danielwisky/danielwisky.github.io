# Fotos de capa dos posts

Largue aqui a foto de um post, nomeada com o slug do post (o nome do arquivo
em `_posts/` sem a data):

    _posts/2023-01-16-clean-code-funcoes.md  ->  _photos/clean-code-funcoes.jpg

Depois rode `npm run build:photos`. O script gera as versões otimizadas em
`assets/img/photos/` e o mapa em `_data/photos.yml`; nenhum front matter
precisa mudar.

Esta pasta não é publicada (o Jekyll ignora diretórios com underscore), então
os originais ficam versionados aqui só como fonte de verdade.
