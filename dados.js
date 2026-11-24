/*
 * ============================================================
 *  DADOS DO SITE — edite este arquivo para mudar os contatos
 * ============================================================
 *
 * Cada ponto tem:
 *   id        → identificador único, sem espaços nem acentos (usado no link)
 *   numero    → número do ponto (ex.: "12")
 *   regiao    → bairro/região do ponto (ex.: "Capivari"); os pontos são agrupados por região
 *   nome      → nome do ponto
 *   endereco  → (opcional) endereço ou referência
 *   telefone  → (opcional) telefone fixo do ponto
 *   mapa      → (opcional) link do ponto no Google Maps; ativa o botão "Como chegar"
 *   lat, lng  → (opcional) latitude e longitude do ponto, ex.: -22.7395 e -45.5913;
 *               ativam o botão "Perto de mim", que ordena os pontos pela distância
 *               (sem mapa, o "Como chegar" usa estas coordenadas ou o endereço)
 *   taxistas  → lista de taxistas do ponto
 *
 * Cada taxista tem:
 *   nome      → nome do taxista
 *   carro     → modelo do carro (ex.: "Chevrolet Spin Prata")
 *   telefone  → celular com DDD, ex.: "(12) 99999-0000"
 *   whatsapp  → (opcional) número do WhatsApp, se for diferente do telefone
 *   foto      → (opcional) caminho da foto, ex.: "fotos/joao.jpg"
 *               sem foto, o site mostra as iniciais do nome
 *
 * Na mensagem do WhatsApp, {nome} é trocado pelo primeiro nome do taxista
 * e {ponto} pelo nome do ponto.
 *
 * Cada apoiador (lista "apoiadores", no fim do arquivo) tem:
 *   nome      → nome da empresa ou pessoa
 *   logo      → (opcional) caminho do logo, ex.: "apoiadores/padaria.png"
 *               sem logo, o site mostra o nome escrito
 *   descricao → (opcional) uma frase curta, ex.: "Padaria e confeitaria"
 *   site      → (opcional) link do site ou Instagram, ex.: "https://instagram.com/padaria"
 *
 * Exemplo de apoiador:
 *   { nome: "Padaria Serrana", logo: "apoiadores/padaria.png",
 *     descricao: "Padaria e confeitaria no Capivari", site: "https://instagram.com/padariaserrana" }
 *
 */

window.TAXI_DADOS = {
  cidade: "Campos do Jordão",
  dddPadrao: "12",
  // Ordem em que as regiões aparecem no site (regiões fora desta lista vêm depois)
  regioes: ["Abernéssia", "Jaguaribe", "Capivari"],

  mensagemWhatsapp:
    "Olá, {nome}! Peguei seu contato no TaxiCampos ({ponto}) e gostaria de solicitar uma corrida.",

  pontos: [
    {
      "id": "avenida",
      "numero": "01",
      "regiao": "Abernéssia",
      "nome": "Ponto Avenida",
      "endereco": "Av. Dr. Januário Miraglia, 1240 - Abernéssia",
      "telefone": "",
      "mapa": "",
      "lat": "-22.7389428",
      "lng": "-45.5925293",
      "taxistas": [
        {
          "nome": "Elias Santos",
          "carro": "",
          "telefone": "(12) 99679-4264",
          "foto": ""
        },
        {
          "nome": "Felipe",
          "carro": "",
          "telefone": "(12) 99706-8188",
          "foto": ""
        },
        {
          "nome": "Ismael Táxi",
          "carro": "",
          "telefone": "(12) 99613-0732",
          "foto": ""
        },
        {
          "nome": "Luís Gustavo",
          "carro": "",
          "telefone": "(12) 99764-6748",
          "foto": ""
        },
        {
          "nome": "Manoel",
          "carro": "",
          "telefone": "(12) 98200-9814",
          "foto": ""
        },
        {
          "nome": "Ricardo",
          "carro": "",
          "telefone": "(12) 99674-6899",
          "foto": ""
        },
        {
          "nome": "Zenildo Táxi",
          "carro": "",
          "telefone": "(12) 99743-2078",
          "foto": ""
        }
      ]
    },
    {
      "id": "elite",
      "numero": "02",
      "regiao": "Abernéssia",
      "nome": "Ponto Elite",
      "endereco": "Av. Emílio Ribas - Abernéssia",
      "telefone": "",
      "mapa": "",
      "lat": "-22.7383152",
      "lng": "-45.5919612",
      "taxistas": [
        {
          "nome": "Carlinhos 🚖",
          "carro": "",
          "telefone": "(12) 99772-4620",
          "foto": ""
        },
        {
          "nome": "Ivan (Brad Pitt)",
          "carro": "",
          "telefone": "(12) 98193-1593",
          "foto": ""
        },
        {
          "nome": "Régis Cruz",
          "carro": "",
          "telefone": "(12) 99722-3121",
          "foto": ""
        }
      ]
    },
    {
      "id": "novo",
      "numero": "03",
      "regiao": "Abernéssia",
      "nome": "Ponto Novo",
      "endereco": "Av. Dr. Januário Miraglia, 1201 - Abernéssia",
      "telefone": "",
      "mapa": "",
      "lat": "-22.7369959",
      "lng": "-45.5906476",
      "taxistas": [
        {
          "nome": "Alison Mello",
          "carro": "",
          "telefone": "(12) 99774-3563",
          "foto": ""
        },
        {
          "nome": "André Mello",
          "carro": "",
          "telefone": "(12) 99728-5903",
          "foto": ""
        },
        {
          "nome": "Enira",
          "carro": "",
          "telefone": "(12) 99736-6861",
          "foto": ""
        },
        {
          "nome": "Manoel",
          "carro": "",
          "telefone": "(12) 99727-8262",
          "foto": ""
        },
        {
          "nome": "Romualdo",
          "carro": "",
          "telefone": "(12) 99634-7736",
          "foto": ""
        },
        {
          "nome": "Zezinho",
          "carro": "",
          "telefone": "(12) 99769-1597",
          "foto": ""
        }
      ]
    },
    {
      "id": "pao-de-acucar",
      "numero": "04",
      "regiao": "Abernéssia",
      "nome": "Ponto Pão de Açúcar",
      "endereco": "Av. Dr. Januário Miraglia, 1772 (supermercado Pão de Açúcar) - Abernéssia",
      "telefone": "",
      "mapa": "",
      "lat": "-22.7361998",
      "lng": "-45.5885032",
      "taxistas": [
        {
          "nome": "Bruno Dias",
          "carro": "",
          "telefone": "(12) 99682-4231",
          "foto": ""
        },
        {
          "nome": "Luiz Paulo",
          "carro": "",
          "telefone": "(12) 98231-9471",
          "foto": ""
        },
        {
          "nome": "Marcelo",
          "carro": "",
          "telefone": "(12) 99703-6527",
          "foto": ""
        }
      ]
    },
    {
      "id": "piratininga",
      "numero": "05",
      "regiao": "Abernéssia",
      "nome": "Ponto Piratininga",
      "endereco": "Av. Dr. Januário Miraglia, 608 (supermercado Piratininga) - Abernéssia",
      "telefone": "",
      "mapa": "",
      "lat": "-22.7434970",
      "lng": "-45.5964445",
      "taxistas": [
        {
          "nome": "Fábio Dias",
          "carro": "",
          "telefone": "(12) 99769-9744",
          "foto": ""
        },
        {
          "nome": "Flávio",
          "carro": "",
          "telefone": "(12) 99708-6543",
          "foto": ""
        },
        {
          "nome": "Thiago",
          "carro": "",
          "telefone": "(12) 98104-0585",
          "foto": ""
        },
        {
          "nome": "Guilherme (aux)",
          "carro": "",
          "telefone": "(12) 99624-6696",
          "foto": ""
        }
      ]
    },
    {
      "id": "jordanense",
      "numero": "06",
      "regiao": "Abernéssia",
      "nome": "Ponto Jordanense",
      "endereco": "Av. Dr. Januário Miraglia, 836 - Abernéssia",
      "telefone": "",
      "mapa": "",
      "lat": "-22.7416045",
      "lng": "-45.5948344",
      "taxistas": [
        {
          "nome": "Ademir",
          "carro": "",
          "telefone": "(12) 99773-4045",
          "foto": ""
        },
        {
          "nome": "Alessandra",
          "carro": "",
          "telefone": "(12) 99118-2817",
          "foto": ""
        },
        {
          "nome": "Andre Negrini",
          "carro": "",
          "telefone": "(12) 99771-9496",
          "foto": ""
        },
        {
          "nome": "Leandro",
          "carro": "",
          "telefone": "(12) 99797-4663",
          "foto": ""
        },
        {
          "nome": "Lucas",
          "carro": "",
          "telefone": "(12) 99778-8378",
          "foto": ""
        },
        {
          "nome": "Eduardo",
          "carro": "",
          "telefone": "(12) 99708-1923",
          "foto": ""
        },
        {
          "nome": "Priscila",
          "carro": "",
          "telefone": "(12) 99742-2175",
          "foto": ""
        },
        {
          "nome": "Roque Martini",
          "carro": "",
          "telefone": "(12) 99739-5972",
          "foto": ""
        }
      ]
    },
    {
      "id": "jaguaribe",
      "numero": "07",
      "regiao": "Jaguaribe",
      "nome": "Ponto Jaguaribe",
      "endereco": "Av. Dr. Januário Miraglia, 2765 - Jaguaribe",
      "telefone": "",
      "mapa": "",
      "lat": "-22.7293694",
      "lng": "-45.5823852",
      "taxistas": [
        {
          "nome": "Caio Lúcio",
          "carro": "",
          "telefone": "(12) 99766-7846",
          "foto": ""
        },
        {
          "nome": "Danilo Quintanilha",
          "carro": "",
          "telefone": "(12) 99623-8237",
          "foto": ""
        },
        {
          "nome": "Eleno Martini",
          "carro": "",
          "telefone": "(12) 99774-4510",
          "foto": ""
        },
        {
          "nome": "Matheus Martini",
          "carro": "",
          "telefone": "(12) 99662-9193",
          "foto": ""
        },
        {
          "nome": "Valdeci Donizeti",
          "carro": "",
          "telefone": "(12) 99717-7103",
          "foto": ""
        },
        {
          "nome": "Délcio",
          "carro": "",
          "telefone": "(12) 99770-3803",
          "foto": ""
        }
      ]
    },
    {
      "id": "rodoviaria",
      "numero": "08",
      "regiao": "Jaguaribe",
      "nome": "Ponto Rodoviária",
      "endereco": "Terminal Rodoviário de Campos do Jordão",
      "telefone": "",
      "mapa": "",
      "lat": "-22.7247746",
      "lng": "-45.5801103",
      "taxistas": [
        {
          "nome": "Augusto",
          "carro": "",
          "telefone": "(12) 99158-5159",
          "foto": ""
        },
        {
          "nome": "Cleber",
          "carro": "",
          "telefone": "(12) 99733-9243",
          "foto": ""
        },
        {
          "nome": "Eliezer",
          "carro": "",
          "telefone": "(12) 99646-4291",
          "foto": ""
        },
        {
          "nome": "Geraldo",
          "carro": "",
          "telefone": "(12) 99773-3279",
          "foto": ""
        },
        {
          "nome": "Hélcio",
          "carro": "",
          "telefone": "(12) 99657-3047",
          "foto": ""
        },
        {
          "nome": "Luiz Fernando",
          "carro": "",
          "telefone": "(12) 99610-7594",
          "foto": ""
        }
      ]
    },
    {
      "id": "capivari",
      "numero": "09",
      "regiao": "Capivari",
      "nome": "Ponto Capivari",
      "endereco": "R. Eng. Diogo José de Carvalho - Capivari",
      "telefone": "",
      "mapa": "",
      "lat": "-22.7183652",
      "lng": "-45.5668894",
      "taxistas": [
        {
          "nome": "Alexandre Táxi",
          "carro": "",
          "telefone": "(12) 99616-1277",
          "foto": ""
        },
        {
          "nome": "Andre Ferreira",
          "carro": "",
          "telefone": "(12) 99762-0230",
          "foto": ""
        },
        {
          "nome": "Andre Rodrigues",
          "carro": "",
          "telefone": "(12) 99666-2625",
          "foto": ""
        },
        {
          "nome": "André Alves",
          "carro": "",
          "telefone": "(12) 99793-2313",
          "foto": ""
        },
        {
          "nome": "Carina",
          "carro": "",
          "telefone": "(12) 99607-6414",
          "foto": ""
        },
        {
          "nome": "Carlinhos Táxi",
          "carro": "",
          "telefone": "(12) 99773-9400",
          "foto": ""
        },
        {
          "nome": "Demétrio",
          "carro": "",
          "telefone": "(12) 99782-8539",
          "foto": ""
        },
        {
          "nome": "Fernando",
          "carro": "",
          "telefone": "(12) 98172-9310",
          "foto": ""
        },
        {
          "nome": "Flávio Muniz",
          "carro": "",
          "telefone": "(12) 99617-4778",
          "foto": ""
        },
        {
          "nome": "Gustavo Pego Costa",
          "carro": "",
          "telefone": "(12) 99645-3406",
          "foto": ""
        },
        {
          "nome": "Jeferson Rodrigues",
          "carro": "",
          "telefone": "(12) 99716-3393",
          "foto": ""
        },
        {
          "nome": "João",
          "carro": "",
          "telefone": "(12) 99774-3434",
          "foto": ""
        },
        {
          "nome": "Jocil Tavares",
          "carro": "",
          "telefone": "(12) 99746-1137",
          "foto": ""
        },
        {
          "nome": "Marcelo",
          "carro": "",
          "telefone": "(12) 99785-3044",
          "foto": ""
        },
        {
          "nome": "Messias Pego",
          "carro": "",
          "telefone": "(12) 99774-3044",
          "foto": ""
        },
        {
          "nome": "Osmar",
          "carro": "",
          "telefone": "(12) 99785-8917",
          "foto": ""
        },
        {
          "nome": "Rafael Bálsamo",
          "carro": "",
          "telefone": "(12) 99797-2164",
          "foto": ""
        },
        {
          "nome": "Rafael Willian",
          "carro": "",
          "telefone": "(12) 99637-7423",
          "foto": ""
        },
        {
          "nome": "Renaldo Pego Costa",
          "carro": "",
          "telefone": "(12) 99783-1098",
          "foto": ""
        },
        {
          "nome": "Rodolfo Aquino",
          "carro": "",
          "telefone": "(12) 99147-9955",
          "foto": ""
        },
        {
          "nome": "Silvio",
          "carro": "",
          "telefone": "(12) 97405-7400",
          "foto": ""
        },
        {
          "nome": "Thamys (aux)",
          "carro": "",
          "telefone": "(12) 99677-0453",
          "foto": ""
        },
        {
          "nome": "Guilherme (aux)",
          "carro": "",
          "telefone": "(12) 99720-9159",
          "foto": ""
        },
        {
          "nome": "Zeca",
          "carro": "",
          "telefone": "(12) 99747-4015",
          "foto": ""
        }
      ]
    }
  ],

  // Apoiadores: aparecem na página "Apoiadores" e no rodapé do site.
  apoiadores: [
    {
      nome: "GWG Telecom",
      logo: "apoiadores/gwg-telecom.png",
      descricao: "Provedor de internet em Campos do Jordão",
      site: "https://gwgtelecom.com.br/"
    }
  ]
};
