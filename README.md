# 🚕 TaxiCampos

Site de contatos de táxi de Campos do Jordão. Mostra os **pontos de táxi** (nome e número). Dentro de cada ponto aparecem os **taxistas**, cada um com foto, nome, modelo do carro e telefone, e dois botões:

- **WhatsApp**: abre a conversa com a mensagem pronta *"Olá, {nome}! Peguei seu contato no TaxiCampos ({ponto}) e gostaria de solicitar uma corrida."*
- **Ligar**: liga direto para o taxista.

A página inicial tem uma busca por ponto, taxista ou carro.

## Como editar os contatos

Todos os dados ficam em **`dados.js`**. Para adicionar um ponto ou um taxista, copie um bloco que já existe e troque os valores. No topo do arquivo há a explicação de cada campo.

- **Telefone**: escreva como quiser, por exemplo `(12) 99999-0000`. O site tira a formatação e acrescenta o +55 sozinho. Se o número não tiver DDD, usa o DDD padrão (`12`).
- **Foto**: coloque a imagem na pasta `fotos/` e preencha `foto: "fotos/nome-do-arquivo.jpg"`. Sem foto, aparecem as iniciais do nome. Use fotos quadradas de uns 300×300 px.
- **Mensagem do WhatsApp**: mude o campo `mensagemWhatsapp`. `{nome}` vira o primeiro nome do taxista e `{ponto}` vira o nome do ponto.

> Os campos `carro` e `foto` ainda estão vazios. Preencha conforme for juntando as informações. Enquanto isso, o site mostra as iniciais no lugar da foto e esconde a linha do carro.

## Como ver no computador

Abra o arquivo `index.html` no navegador. Não precisa instalar nada.

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
| `fontes/`    | Fontes Big Shoulders Display e Schibsted Grotesk (licença OFL) |

## Créditos

- Fontes: [Big Shoulders Display](https://fonts.google.com/specimen/Big+Shoulders+Display) e [Schibsted Grotesk](https://fonts.google.com/specimen/Schibsted+Grotesk), licença SIL Open Font License.
- Fotos de fundo (Unsplash, carregadas direto de lá): placa de táxi por [Waldemar Brandt](https://unsplash.com/photos/kYbYIWdJRh0), Serra da Mantiqueira por [Regiany Almeida](https://unsplash.com/photos/TfpxVQhVzJU) e chalé em Campos do Jordão por [Gabriel Ramos](https://unsplash.com/photos/GXcy_NMBvIo).
