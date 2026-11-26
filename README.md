# 🚕 TaxiCampos

Site de contatos de táxi de **Campos do Jordão**. Mostra os pontos de táxi, cada um com o seu bairro (Abernéssia, Jaguaribe, Capivari). Em cada ponto aparecem os taxistas, com botões de **WhatsApp** (mensagem pronta) e **Ligar**.

Versão em **PHP + MySQL**: pontos, taxistas, apoiadores e configurações ficam num banco de dados.

## O que o site faz

- **Página inicial:** lista dos pontos com o bairro escrito em cada um, busca por ponto, bairro, taxista ou carro, e o filtro **"Perto de mim"**, que ordena os pontos pela distância.
- **Ver no mapa:** botão na página inicial que troca a lista por um mapa (OpenStreetMap) com um alfinete por ponto. Alfinetes próximos viram uma bolinha "N pontos"; cada alfinete abre "Ver taxistas" e "Como chegar".
- **Página do ponto** (`#/ponto/<id>`): taxistas em ordem sorteada a cada visita, para ninguém ficar sempre no topo, e o botão **Como chegar** (Google Maps).
- **Apoiadores** (`#/apoiadores`): empresas que apoiam o site, sem ligação com os taxistas, e quadradinhos "Tenha sua empresa aqui" que abrem o WhatsApp.
- **Pagamentos por Pix** (páginas sem link no site):
  - `#/pagamento`: mensalidade dos taxistas (R$ 20,00).
  - `#/apoiador`: apoio anual das empresas (R$ 200,00).

  O QR Code e o "copia e cola" são gerados no navegador, no padrão do Banco Central. O site não guarda nenhum dado bancário.
- **App instalável e funcionamento sem internet:** `manifest.webmanifest` e `sw.js`. Isso não funciona em hospedagem grátis com bloqueio de robôs, como a InfinityFree.

## Estrutura

| Caminho | O que é |
|---|---|
| `index.php` | Página do site. Lê o banco e entrega os dados para o `app.js` |
| `app.js`, `estilo.css` | Telas, regras e visual |
| `inc/db.php` | Conexão com o banco (PDO) |
| `inc/dados.php` | Lê pontos, taxistas, apoiadores e configurações do banco |
| `inc/estrutura.sql` | Tabelas do banco |
| `inc/dados-iniciais.json` | Dados importados na instalação (9 pontos, 67 taxistas, 1 apoiador) |
| `inc/instalacao.php`, `instalar.php` | Instalador. Funciona pelo pacote (com código) ou direto do GitHub pelo Git da Hostinger: aí só aceita banco `localhost` com nome e usuário da própria conta (`u123456789_...`) |
| `inc/config.php` | **Senha do banco.** Criado pelo instalador e **fora do Git** |
| `ferramentas/empacotar.py` | Gera o pacote de instalação |
| `fontes/`, `icones/`, `vendor/` | Fontes (OFL), ícones, gerador de QR Code (MIT) e mapa: Leaflet (BSD-2) e Leaflet.markercluster (MIT), dados © colaboradores do OpenStreetMap |
| `fotos/`, `apoiadores/` | Fotos dos taxistas e logos dos apoiadores |

A pasta `inc/` é bloqueada pelo `.htaccess`: ninguém consegue abrir esses arquivos pelo navegador.

### Banco de dados

- `pontos`: slug (usado no link), número, nome, região, endereço, telefone, mapa, latitude e longitude, ordem e se está ativo.
- `taxistas`: ponto, nome, carro, telefone, WhatsApp, foto, ordem e se está ativo.
- `apoiadores`: nome, logo, descrição, site, ordem e se está ativo.
- `configuracoes`: cidade, DDD, bairros, mensagem do WhatsApp, Pix e contato dos apoiadores, guardados em JSON.
- `usuarios`: logins do painel `/admin`, com senha guardada só como hash.

## Instalar numa hospedagem PHP (InfinityFree, Hostinger…)

1. **Gerar o pacote** (no computador, com Python 3):
   ```
   python3 ferramentas/empacotar.py
   ```
   Saem dois arquivos em `dist/`: `taxicampos-site.zip` e `instalar.php`. O comando também mostra um **TOKEN**.
2. **Criar o banco** no painel da hospedagem, em *MySQL Databases*, e anotar servidor, nome do banco, usuário e senha.
3. **Enviar os 2 arquivos** de `dist/` para a pasta do site (`htdocs` na InfinityFree), pelo gerenciador de arquivos ou FTP. Apague o `index2.html` que a hospedagem cria.
4. **Abrir** `https://SEU-SITE/instalar.php?token=TOKEN`, preencher os dados do banco e clicar em **Instalar**.

O instalador descompacta o site, grava o `inc/config.php`, cria as tabelas, importa os dados e **se apaga sozinho**.

## Requisitos

PHP 8.0 ou mais novo, com PDO MySQL e ZipArchive, MySQL 5.7+ ou MariaDB 10.3+, e Apache com `.htaccess`.

## Créditos

- Fontes: [Big Shoulders Display](https://fonts.google.com/specimen/Big+Shoulders+Display) e [Schibsted Grotesk](https://fonts.google.com/specimen/Schibsted+Grotesk) (SIL Open Font License).
- Mapa: [Leaflet](https://leafletjs.com) (BSD-2), [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) (MIT) e dados do [OpenStreetMap](https://www.openstreetmap.org/copyright).
- QR Code: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), de Kazuhiko Arase (MIT).
- Fotos de fundo (Unsplash): [Waldemar Brandt](https://unsplash.com/photos/kYbYIWdJRh0), [Regiany Almeida](https://unsplash.com/photos/TfpxVQhVzJU) e [Gabriel Ramos](https://unsplash.com/photos/GXcy_NMBvIo).
