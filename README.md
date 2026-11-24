# 🚕 TaxiCampos

Site de contatos de táxi de Campos do Jordão. Mostra os **pontos de táxi** (nome e número). Dentro de cada ponto aparecem os **taxistas**, cada um com foto, nome, modelo do carro e telefone, e dois botões:

- **WhatsApp**: abre a conversa com a mensagem pronta *"Olá, {nome}! Peguei seu contato no TaxiCampos ({ponto}) e gostaria de solicitar uma corrida."*
- **Ligar**: liga direto para o taxista.

A página inicial tem uma busca por ponto, taxista ou carro.

## Painel administrativo (`/admin`)

O jeito mais fácil de editar é pelo painel, em `https://henrique-inf.github.io/TaxiCampos/admin/`. Ele não tem link no site: só entra quem digita o endereço.

- **Login:** usuário `admin`, senha `admin`. Para trocar, edite `usuario` e `senha` no topo de `admin/admin.js`.
- **O que dá para fazer:** criar, editar, excluir e reordenar pontos e taxistas; mudar um taxista de ponto; enviar foto (ela é cortada em quadrado e reduzida sozinha); mudar a cidade, o DDD padrão e a mensagem do WhatsApp.
- **Publicar:** clique em **Salvar e publicar**. As alterações vão direto para este repositório, num único commit, e o site é atualizado em 1 a 2 minutos. Às vezes o navegador ainda mostra a versão antiga por alguns minutos por causa do cache.

### Token do GitHub (uma vez por navegador)

Como o site é estático, não tem servidor. O painel publica pela API do GitHub e, para isso, precisa de um token. Na primeira vez que você publicar, o painel pede o token e mostra o passo a passo:

1. Abra <https://github.com/settings/personal-access-tokens/new>.
2. Em *Repository access*, escolha *Only select repositories* e marque **TaxiCampos**.
3. Em *Permissions → Repository permissions → Contents*, escolha **Read and write**.
4. Gere o token e cole no painel.

O token fica salvo só naquele navegador. Para remover, use o botão **GitHub → Desconectar** do painel.

> **Sobre a segurança:** o login `admin`/`admin` só esconde o painel. Ele fica visível no código-fonte, como tudo num site estático. Quem protege os dados de verdade é o token: sem ele ninguém consegue publicar nada, mesmo entrando no painel.

## Editar à mão (sem o painel)

Todos os dados ficam em **`dados.js`**. Para adicionar um ponto ou um taxista, copie um bloco que já existe e troque os valores. No topo do arquivo há a explicação de cada campo.

- **Telefone**: escreva como quiser, por exemplo `(12) 99999-0000`. O site tira a formatação e acrescenta o +55 sozinho. Se o número não tiver DDD, usa o DDD padrão (`12`).
- **Foto**: coloque a imagem na pasta `fotos/` e preencha `foto: "fotos/nome-do-arquivo.jpg"`. Sem foto, aparecem as iniciais do nome. Use fotos quadradas de uns 400×400 px.
- **Mensagem do WhatsApp**: mude o campo `mensagemWhatsapp`. `{nome}` vira o primeiro nome do taxista e `{ponto}` vira o nome do ponto.

> Os campos `carro` e `foto` ainda estão vazios. Preencha conforme for juntando as informações. Enquanto isso, o site mostra as iniciais no lugar da foto e esconde a linha do carro.

## Como ver no computador

Abra o arquivo `index.html` no navegador. Não precisa instalar nada. O painel também abre assim (`admin/index.html`), mas só publica com o token do GitHub.

## Como publicar (GitHub Pages, grátis)

1. No GitHub, abra **Settings → Pages**.
2. Em *Source*, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`, e clique em **Save**.
3. Em um ou dois minutos o site fica no ar em `https://henrique-inf.github.io/TaxiCampos/`.

## Arquivos

| Arquivo      | O que é                                   |
|--------------|-------------------------------------------|
| `index.html` | Estrutura da página                       |
| `estilo.css` | Visual (cores, layout, botões)            |
| `app.js`     | Lógica: lista, busca, links de WhatsApp e ligação |
| `dados.js`   | **Pontos e taxistas**: é aqui que se edita |
| `fotos/`     | Fotos dos taxistas                        |
| `admin/`     | Painel administrativo                     |
