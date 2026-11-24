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

## Regiões (bairros)

Cada ponto pode ter uma `regiao` no `dados.js`, por exemplo `"regiao": "Capivari"`. Quando pelo menos um ponto tem região, a página inicial agrupa os pontos por bairro e mostra botões para filtrar ("Todas", "Abernéssia", "Jaguaribe", "Capivari"…). Pontos sem região aparecem em "Outros pontos". A ordem dos bairros vem da lista `regioes`, no começo do `dados.js`.

## Como chegar e "Perto de mim"

Cada ponto aceita três campos opcionais no `dados.js`:

- `mapa`: link do ponto no Google Maps. Ativa o botão **Como chegar** na página do ponto. Sem link, o botão usa as coordenadas ou o `endereco`.
- `lat` e `lng`: latitude e longitude, por exemplo `"-22.7395"` e `"-45.5913"`. Com pelo menos um ponto preenchido, aparece o botão **Perto de mim** na página inicial, que pede a localização do celular e ordena os pontos pela distância.

Para pegar as coordenadas no Google Maps: segure o dedo no local do ponto e os números aparecem no topo.

## Ordem dos taxistas

A lista de taxistas de cada ponto é embaralhada uma vez por dia (horário de Brasília), para ninguém ficar sempre no topo. No mesmo dia, todo mundo vê a mesma ordem. No `dados.js` a ordem não importa.

## App no celular e sem internet

O site pode ser instalado na tela inicial do celular, como um app. No Android aparece um aviso "Instale o TaxiCampos". No iPhone, o aviso explica como fazer pelo botão Compartilhar do Safari. Depois da primeira visita, o site abre mesmo sem internet, com os contatos da última vez que carregou. Isso é feito pelos arquivos `manifest.webmanifest`, `sw.js` e pelos ícones da pasta `icones/`.

## Prévia ao compartilhar o link

Ao mandar o link no WhatsApp ou nas redes, aparece a imagem `icones/compartilhar.png` com título e descrição. As tags ficam no `<head>` do `index.html`. Quando o site tiver domínio próprio, troque o endereço da `og:image` pelo do domínio.

## Apoiadores

Os apoiadores aparecem na página **Apoiadores** (link no topo do site) e no rodapé de todas as páginas. Eles ficam no fim do `dados.js`, na lista `apoiadores`:

```js
apoiadores: [
  {
    nome: "Padaria Serrana",
    logo: "apoiadores/padaria.png",          // opcional: sem logo, aparece o nome
    descricao: "Padaria e confeitaria",       // opcional
    site: "https://instagram.com/padaria"     // opcional: link do site ou Instagram
  }
]
```

Coloque os logos na pasta `apoiadores/`. Funcionam melhor em PNG com fundo transparente. Enquanto a lista estiver vazia, o site mostra espaços "Seu logo aqui".

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
| `apoiadores/`| Logos dos apoiadores                      |
| `icones/`    | Ícones do app e imagem de prévia          |
| `sw.js`, `manifest.webmanifest` | App instalável e funcionamento sem internet |
| `fontes/`    | Fontes Big Shoulders Display e Schibsted Grotesk (licença OFL) |

## Créditos

- Fontes: [Big Shoulders Display](https://fonts.google.com/specimen/Big+Shoulders+Display) e [Schibsted Grotesk](https://fonts.google.com/specimen/Schibsted+Grotesk), licença SIL Open Font License.
- Fotos de fundo (Unsplash, carregadas direto de lá): placa de táxi por [Waldemar Brandt](https://unsplash.com/photos/kYbYIWdJRh0), Serra da Mantiqueira por [Regiany Almeida](https://unsplash.com/photos/TfpxVQhVzJU) e chalé em Campos do Jordão por [Gabriel Ramos](https://unsplash.com/photos/GXcy_NMBvIo).
