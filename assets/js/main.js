// SportsHub — Week Project Settimana VII
// Modulo ES: Javascript Principale (main.js)

import { Squadra } from "./models.js";
import {
  cercaSquadreAPI,
  caricaDettagliSquadraAPI,
  caricaProssimiEventiTuttiPreferiti,
} from "./api.js";
import {
  mostraSpinner,
  nascondiSpinner,
  mostraErrore,
  nascondiErrore,
  apriModalSquadra,
  creaElementoEvento,
  creaVuoto,
  renderPreferiti,
  renderRisultati,
  renderProssimiAppuntamenti,
  apriModalEvento,
} from "./ui.js";

// === Persistenza localStorage ===
const STORAGE_KEY = "sportshub_preferiti";

function salvaPreferiti(preferiti) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferiti));
}

function caricaPreferiti() {
  const dati = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  return dati
    .filter((d) => (d.idTeam ?? d.id) && (d.strTeam ?? d.nome) !== "Squadra sconosciuta")
    .map((d) => new Squadra(d));
}

let preferiti = caricaPreferiti();
let squadreTrovate = [];
let filtroSportAttivo = "Tutti"; // "Tutti", "Soccer", "Basketball", "American Football"
let controller = null;
let timeoutId = null;

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const filtriSportBottoni = document.querySelectorAll(".btn-filtro-sport");

// === Viste ===

// Il filtro sport vale solo per le preferite
function preferiteFiltrate() {
  if (filtroSportAttivo === "Tutti") return preferiti;
  return preferiti.filter((sq) => sq.sport?.toLowerCase() === filtroSportAttivo.toLowerCase());
}

function aggiornaVistaPreferiti() {
  const msgVuoto =
    preferiti.length === 0
      ? "Non hai ancora salvato nessuna squadra. Cercane una qui sopra e aggiungila ai preferiti."
      : "Nessuna squadra preferita per lo sport selezionato.";
  renderPreferiti(preferiteFiltrate(), getHandlers(), msgVuoto);
}

// I risultati di ricerca NON sono filtrati
function aggiornaVistaRisultati() {
  renderRisultati(squadreTrovate, getHandlers());
}

// === Card ===

function riempiEventi(ul, eventi, isPassato, msgVuoto) {
  if (eventi.length === 0) {
    ul.replaceChildren(creaVuoto(msgVuoto, "list-group-item text-body-secondary fst-italic"));
    return;
  }
  ul.replaceChildren(...eventi.map((ev) => creaElementoEvento(ev, isPassato, apriModalEvento)));
}

function getHandlers() {
  return {
    isGiaPreferita: (id) => preferiti.some((s) => s.id === id),
    onAggiungi: (squadra) => {
      if (preferiti.some((s) => s.id === squadra.id)) return;
      preferiti.push(squadra);
      salvaPreferiti(preferiti);
      aggiornaVistaPreferiti();
      aggiornaVistaRisultati();
      caricaAppuntamentiPreferite();
    },
    onRimuovi: (squadraId) => {
      preferiti = preferiti.filter((s) => s.id !== squadraId);
      salvaPreferiti(preferiti);
      aggiornaVistaPreferiti();
      aggiornaVistaRisultati();
      caricaAppuntamentiPreferite();
    },
    onCardClick: async (squadra) => {
      const { ulProssimi, ulPassati } = apriModalSquadra(squadra);

      try {
        // Chiamata parallela con Promise.all
        const { prossimi, passati } = await caricaDettagliSquadraAPI(squadra.id);
        riempiEventi(ulProssimi, prossimi, false, "Nessun evento in programma.");
        riempiEventi(ulPassati, passati, true, "Nessun risultato recente.");
      } catch (err) {
        ulProssimi.replaceChildren(
          creaVuoto(`Errore nel caricamento: ${err.message}`, "list-group-item text-danger")
        );
        ulPassati.replaceChildren();
      }
    },
  };
}

// === Ricerca con AbortController ===
async function eseguiRicerca(query) {
  controller?.abort();
  controller = new AbortController();

  mostraSpinner();
  nascondiErrore();

  try {
    squadreTrovate = await cercaSquadreAPI(query, controller.signal);
    aggiornaVistaRisultati();
  } catch (err) {
    if (err.name === "AbortError") return;
    mostraErrore(err.message);
  } finally {
    if (!controller.signal.aborted) nascondiSpinner();
  }
}

// === Appuntamenti delle preferite (Promise.allSettled) ===
async function caricaAppuntamentiPreferite() {
  if (preferiti.length === 0) {
    renderProssimiAppuntamenti([], apriModalEvento);
    return;
  }
  try {
    const eventiOrdinati = await caricaProssimiEventiTuttiPreferiti(preferiti);
    renderProssimiAppuntamenti(eventiOrdinati, apriModalEvento);
  } catch (e) {
    console.warn("Errore durante il caricamento degli appuntamenti preferiti:", e);
  }
}

// === Event Listeners ===

// Debounce 400ms sull'input
searchInput?.addEventListener("input", (e) => {
  clearTimeout(timeoutId);
  const query = e.target.value.trim();

  if (query.length < 2) {
    controller?.abort();
    nascondiSpinner();
    nascondiErrore();
    squadreTrovate = [];
    aggiornaVistaRisultati();
    return;
  }
  timeoutId = setTimeout(() => eseguiRicerca(query), 400);
});

searchForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  clearTimeout(timeoutId);
  const query = searchInput.value.trim();
  if (query.length < 2) {
    mostraErrore("Inserisci almeno 2 caratteri.");
    return;
  }
  eseguiRicerca(query);
});

// Filtro sport
filtriSportBottoni.forEach((btn) => {
  btn.addEventListener("click", () => {
    filtriSportBottoni.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filtroSportAttivo = btn.dataset.sport;
    aggiornaVistaPreferiti();
  });
});

aggiornaVistaPreferiti();
caricaAppuntamentiPreferite();
