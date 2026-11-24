/*
 * ============================================================
 *  DADOS DO SITE — edite este arquivo para mudar os contatos
 * ============================================================
 *
 * Cada ponto tem:
 *   id        → identificador único, sem espaços nem acentos (usado no link)
 *   numero    → número do ponto (ex.: "12")
 *   nome      → nome do ponto
 *   endereco  → (opcional) endereço ou referência
 *   telefone  → (opcional) telefone fixo do ponto
 *   taxistas  → lista de taxistas do ponto
 *
 * Cada taxista tem:
 *   nome      → nome do taxista
 *   carro     → modelo do carro (ex.: "Chevrolet Spin Prata")
 *   telefone  → celular com DDD, ex.: "(22) 99999-0000"
 *   whatsapp  → (opcional) número do WhatsApp, se for diferente do telefone
 *   foto      → (opcional) caminho da foto, ex.: "fotos/joao.jpg"
 *               sem foto, o site mostra as iniciais do nome
 *
 * Na mensagem do WhatsApp, {nome} é trocado pelo primeiro nome do taxista
 * e {ponto} pelo nome do ponto.
 *
 * ATENÇÃO: os dados abaixo são EXEMPLOS. Troque pelos contatos reais.
 */

window.TAXI_DADOS = {
  cidade: "Campos dos Goytacazes",
  dddPadrao: "22",
  mensagemWhatsapp:
    "Olá, {nome}! Peguei seu contato no TaxiCampos ({ponto}) e gostaria de solicitar uma corrida.",

  pontos: [
    {
      id: "rodoviaria",
      numero: "01",
      nome: "Ponto da Rodoviária",
      endereco: "Rodoviária Roberto Silveira",
      telefone: "(22) 2700-0001",
      taxistas: [
        {
          nome: "João da Silva",
          carro: "Chevrolet Spin Prata",
          telefone: "(22) 99999-0001",
          foto: ""
        },
        {
          nome: "Maria Oliveira",
          carro: "Toyota Corolla Branco",
          telefone: "(22) 99999-0002",
          foto: ""
        },
        {
          nome: "Carlos Souza",
          carro: "Fiat Cronos Preto",
          telefone: "(22) 99999-0003",
          foto: ""
        }
      ]
    },
    {
      id: "centro",
      numero: "02",
      nome: "Ponto do Centro",
      endereco: "Praça São Salvador",
      telefone: "",
      taxistas: [
        {
          nome: "Antônio Pereira",
          carro: "Renault Logan Prata",
          telefone: "(22) 99999-0004",
          foto: ""
        },
        {
          nome: "Fernanda Lima",
          carro: "Volkswagen Virtus Cinza",
          telefone: "(22) 99999-0005",
          foto: ""
        }
      ]
    },
    {
      id: "hospital",
      numero: "03",
      nome: "Ponto do Hospital",
      endereco: "",
      telefone: "",
      taxistas: [
        {
          nome: "Roberto Alves",
          carro: "Hyundai HB20S Branco",
          telefone: "(22) 99999-0006",
          foto: ""
        }
      ]
    }
  ]
};
