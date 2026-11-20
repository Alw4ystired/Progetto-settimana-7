// SportsHub — Week Project Settimana VII
// Modulo ES: Chiamate API 

import { Evento, Squadra } from "./models.js";

export const API_KEY = "123";
export const API_BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;



// Esegue la fetch, verifica r.ok e restituisce il JSON parsato.
// Include una protezione trasparente in caso di blocco CORS di TheSportsDB.

export async function getJSON(url, opzioni = {}) {
  try {
    const r = await fetch(url, opzioni);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (err) {
    // Se la richiesta è stata annullata volontariamente dall'AbortController, rilancia subito l'errore
    if (err.name === "AbortError") throw err;

    // Se si verifica un blocco CORS/rete del browser ("Failed to fetch"), aggiunta 
    if (err.message.includes("fetch") || err.name === "TypeError") {
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url.toString())}`;
        const rProxy = await fetch(proxyUrl, opzioni);
        if (!rProxy.ok) throw new Error(`HTTP ${rProxy.status}`);
        return await rProxy.json();
      } catch {
        throw new Error("Impossibile contattare il server dell'API.");
      }
    }
    throw err;
  }
}


// Cerca le squadre tramite endpoint searchteams.php con supporto ad AbortController
export async function cercaSquadreAPI(query, signal) {
  const url = new URL(`${API_BASE}/searchteams.php`);
  url.searchParams.set("t", query);
  const dati = await getJSON(url, { signal });
  const teamsRaw = dati.teams ?? [];
  return teamsRaw.map((d) => new Squadra(d));
}


// Recupera i prossimi eventi di una squadra
export async function caricaProssimiEventiAPI(teamId) {
  const url = new URL(`${API_BASE}/eventsnext.php`);
  url.searchParams.set("id", teamId);
  const dati = await getJSON(url);
  const eventsRaw = dati.events ?? [];
  return eventsRaw.map((d) => new Evento(d));
}


//Recupera gli ultimi risultati di una squadra
export async function caricaUltimiEventiAPI(teamId) {
  const url = new URL(`${API_BASE}/eventslast.php`);
  url.searchParams.set("id", teamId);
  const dati = await getJSON(url);
  const resultsRaw = dati.results ?? [];
  return resultsRaw.map((d) => new Evento(d));
}


//Caricamento parallelo di prossimi e ultimi eventi con Promise.all

export async function caricaDettagliSquadraAPI(teamId) {
  const [prossimi, passati] = await Promise.all([
    caricaProssimiEventiAPI(teamId),
    caricaUltimiEventiAPI(teamId),
  ]);
  return { prossimi, passati };
}

// Caricamento parallelo preferite con Promise.allSettled. All'avvio carica i dettagli di tutte le preferite in parallelo, se una squadra fallisce non blocca le altre
export async function caricaProssimiEventiTuttiPreferiti(squadrePreferite) {
  if (!squadrePreferite || squadrePreferite.length === 0) return [];

  // Mappa ogni squadra in una Promise indipendente
  const promesse = squadrePreferite.map(async (sq) => {
    const eventi = await caricaProssimiEventiAPI(sq.id);
    // Assegna il nome della squadra di riferimento all'evento
    return eventi.map((ev) => {
      ev.squadraRiferimento = sq.nome;
      return ev;
    });
  });

  // Aspetta tutte con Promise.allSettled (tollerante ai fallimenti parziali)
  const risultati = await Promise.allSettled(promesse);

  const tuttiEventi = [];
  risultati.forEach((res) => {
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      tuttiEventi.push(...res.value);
    }
  });

  // Ordina tutti gli eventi per data crescente
  tuttiEventi.sort((a, b) => {
    if (!a.dataRaw) return 1;
    if (!b.dataRaw) return -1;
    return new Date(a.dataRaw) - new Date(b.dataRaw);
  });

  return tuttiEventi;
}