<?php
/*
 * Opções do site que mudam pelo GitHub, sem mexer no banco.
 *
 * TAXI_MOSTRAR_TAXISTAS
 *   false → o site mostra só os pontos. Nome e telefone dos taxistas nem
 *           saem do servidor (não aparecem nem no código da página).
 *           Os taxistas continuam guardados no banco.
 *   true  → mostra os taxistas de novo.
 *
 * Escondidos enquanto não chegam as autorizações dos taxistas (LGPD).
 */

declare(strict_types=1);

const TAXI_MOSTRAR_TAXISTAS = false;
