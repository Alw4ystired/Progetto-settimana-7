// SportsHub — Week Project Settimana VII
// Fedele alle indicazioni delle slide Epicode:
// - Giorno 1: OOP (class, constructor, getter, istanze e re-istanziazione)
// - Giorno 2: JSON & Storage (setItem, getItem ?? "[]", gestione preferiti)
// - Giorno 3: fetch, URL & searchParams, AbortController, Debounce 400ms, XSS safe DOM rendering
// - Giorno 4: async/await, try/catch/finally, helper getJSON e Promise.all in parallelo

// Classi

class Squadra {
    constructor(dati) {
        // Riconosce sia il formato grezzo API (idTeam, strTeam...) 
        // sia quello salvato in localStorage (id, nome...)
        this.id = dati.idTeam ?? dati.id;
        this.nome = dati.strTeam ?? dati.nome ?? "Squadra sconosciuta";
        this.logo = dati.strBadge ?? dati.logo ?? null;
        this.lega = dati.strLeague ?? dati.lega ?? "Campionato sconosciuto";
        this.paese = dati.strCountry ?? dati.paese ?? "Paese sconosciuto";
        this.sport = dati.strSport ?? dati.sport ?? "Sport sconosciuto";
    }
}

class Evento {
    constructor(dati) {
        this.id = dati.idEvent;
        this.dataRaw = dati.dateEvent ?? null;
        this.casa = dati.strHomeTeam ?? "Casa";
        this.trasferta = dati.strAwayTeam ?? "Trasferta";
        this.punteggioCasa = dati.intHomeScore ?? null;
        this.punteggioTrasferta = dati.intAwayScore ?? null;
    }

    // Calcolo al volo senza memorizzare con get
    get dataFormattata() {
        if (!this.dataRaw) return "Data non disponibile";
        const d = new Date(this.dataRaw);
        return new Intl.DateTimeFormat("it-IT", {
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(d);
    }

    // Calcolo punteggio o 'vs'
    get punteggio() {
        if (this.punteggioCasa !== null && this.punteggioTrasferta !== null) {
            return `${this.punteggioCasa} - ${this.punteggioTrasferta}`;
        }
        return "vs";
    }
}

// Costanti e localStorage

const API_KEY = "123"; 
const API_BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;
const STORAGE_KEY = "sportshub_preferiti";

// Pattern di persistenza
function salvaPreferiti(preferiti) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferiti));
}

function caricaPreferiti() {
    const dati = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    // Filtra via eventuali vecchie voci corrotte prive di id e reinstanzia
    return dati
        .filter((d) => (d.idTeam ?? d.id) && (d.strTeam ?? d.nome) !== "Squadra sconosciuta")
        .map((d) => new Squadra(d));
}

// === Funzioni principali ===

document.addEventListener("DOMContentLoaded", () => {
    let preferiti = caricaPreferiti();
    let controller = null; // Per AbortController
    let timeoutId = null;  // Per Debounce

    // Riferimenti DOM
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("search-input");
    const spinner = document.getElementById("spinner");
    const erroreDiv = document.getElementById("errore");
    const risultatiLista = document.getElementById("risultati-lista");
    const preferitiLista = document.getElementById("preferiti-lista");

    // Helper UI
    function mostraSpinner() {
        spinner.classList.remove("d-none");
        erroreDiv.setAttribute("hidden", "");
    }

    function nascondiSpinner() {
        spinner.classList.add("d-none");
    }

    function mostraErrore(msg) {
        erroreDiv.textContent = msg;
        erroreDiv.removeAttribute("hidden");
    }

    function nascondiErrore() {
        erroreDiv.setAttribute("hidden", "");
        erroreDiv.textContent = "";
    }

    // Rendering DOM

    function creaCardSquadra(squadra, isPreferito) {
        const li = document.createElement("li");
        li.dataset.id = squadra.id;
        li.className = "squadra-card";

        // Info squadra (logo + testi)
        const infoDiv = document.createElement("div");
        infoDiv.className = "squadra-info";

        if (squadra.logo) {
            const img = document.createElement("img");
            img.src = squadra.logo;
            img.alt = squadra.nome;
            img.className = "squadra-logo";
            img.loading = "lazy";
            infoDiv.appendChild(img);
        }

        const testiDiv = document.createElement("div");
        testiDiv.className = "squadra-testi";

        const nomeSpan = document.createElement("span");
        nomeSpan.className = "squadra-nome";
        nomeSpan.textContent = squadra.nome;

        const leagueSpan = document.createElement("span");
        leagueSpan.className = "squadra-league";
        leagueSpan.textContent = `${squadra.lega} • ${squadra.paese}`;

        testiDiv.appendChild(nomeSpan);
        testiDiv.appendChild(leagueSpan);
        infoDiv.appendChild(testiDiv);
        li.appendChild(infoDiv);

        // Aggiungi ai preferiti o Rimuovi
        const azioniDiv = document.createElement("div");
        azioniDiv.className = "squadra-azioni";

        if (isPreferito) {
            const btnRimuovi = document.createElement("button");
            btnRimuovi.type = "button";
            btnRimuovi.className = "btn-rimuovi";
            btnRimuovi.textContent = "✕ Rimuovi";
            btnRimuovi.addEventListener("click", (e) => {
                e.stopPropagation(); // Evita l'apertura dei dettagli
                rimuoviSquadraPreferiti(squadra.id);
            });
            azioniDiv.appendChild(btnRimuovi);
        } else {
            const giaPreferita = preferiti.some((s) => s.id === squadra.id);
            const btnAggiungi = document.createElement("button");
            btnAggiungi.type = "button";
            btnAggiungi.className = "btn-aggiungi";
            btnAggiungi.textContent = giaPreferita ? "✓ Aggiunto" : "★ Aggiungi ai preferiti";
            btnAggiungi.disabled = giaPreferita;

            btnAggiungi.addEventListener("click", (e) => {
                e.stopPropagation(); // Evita l'apertura dei dettagli
                aggiungiSquadraPreferiti(squadra);
            });
            azioniDiv.appendChild(btnAggiungi);
        }

        li.appendChild(azioniDiv);

        // Click sulla card che mostra i dettagli subito sotto la squadra cliccata
        li.addEventListener("click", (e) => {
            // Evita che il click sui bottoni Rimuovi/Aggiungi apra o chiuda i dettagli
            if (e.target.closest("button")) return;

            const dettagliGiaPresenti = li.nextElementSibling?.classList.contains("dettagli-squadra")
                ? li.nextElementSibling
                : null;

            // Chiudi eventuali altri dettagli aperti
            document.querySelectorAll(".dettagli-squadra").forEach((el) => el.remove());
            document.querySelectorAll(".squadra-card.attiva").forEach((el) => el.classList.remove("attiva"));

            // Se erano già aperti su questa card, li chiude (toggle)
            if (dettagliGiaPresenti) {
                return;
            }

            // Altrimenti crea il box dettagli subito sotto la card
            li.classList.add("attiva");
            const dettagliLi = creaBoxDettagli(squadra, li);
            li.after(dettagliLi);

            // Carica eventi con getJSON e Promise.all
            popolaEventiDettagli(squadra, dettagliLi);
        });

        return li;
    }

    // Sincronizza lo stato dei bottoni nelle card di ricerca
    function syncPulsantiRicerca() {
        const cards = risultatiLista.querySelectorAll(".squadra-card");
        cards.forEach((card) => {
            const id = card.dataset.id;
            const btn = card.querySelector(".btn-aggiungi");
            if (btn) {
                const isPref = preferiti.some((s) => s.id === id);
                btn.textContent = isPref ? "✓ Aggiunto" : "★ Aggiungi ai preferiti";
                btn.disabled = isPref;
            }
        });
    }

    // Gestione aggiunta / rimozione preferiti
    function aggiungiSquadraPreferiti(squadra) {
        if (!preferiti.some((s) => s.id === squadra.id)) {
            preferiti.push(squadra);
            salvaPreferiti(preferiti);
            renderPreferiti();
            syncPulsantiRicerca();
        }
    }

    function rimuoviSquadraPreferiti(squadraId) {
        preferiti = preferiti.filter((s) => s.id !== squadraId);
        salvaPreferiti(preferiti);
        renderPreferiti();
        syncPulsantiRicerca();
    }

    // Render Sezione Preferiti
    function renderPreferiti() {
        if (preferiti.length === 0) {
            const p = document.createElement("p");
            p.className = "testo-vuoto";
            p.textContent = "Non hai ancora salvato nessuna squadra. Cercane una qui sopra e aggiungila ai preferiti.";
            preferitiLista.replaceChildren(p);
            return;
        }

        const elementi = preferiti.map((sq) => creaCardSquadra(sq, true));
        preferitiLista.replaceChildren(...elementi);
    }

    // Render Sezione Risultati Ricerca
    function renderRisultati(teamsRaw) {
        if (!teamsRaw || teamsRaw.length === 0) {
            const p = document.createElement("p");
            p.className = "testo-vuoto";
            p.textContent = "Nessuna squadra trovata.";
            risultatiLista.replaceChildren(p);
            return;
        }

        const squadre = teamsRaw.map((dati) => new Squadra(dati));
        const elementi = squadre.map((sq) => creaCardSquadra(sq, false));
        risultatiLista.replaceChildren(...elementi);
    }

    // ==========================================
    // Si bloccava continuamente l'API, ho cercato una soluzione online e ho trovato questa funzione asincrona, è relativamente inutile in questo codice e l'ho commentata, 
    // però sembrava utile e ho voluto comunque aggiungerla commentatata, serve per dare un errore specifico se c'è un errore CORS.
    // ==========================================

    // getJSON con fallback anti-CORS (se TheSportsDB blocca il browser con Failed to fetch)
    // async function getJSON(url, opzioni) {
    //     try {
    //         const r = await fetch(url, opzioni);
    //         if (!r.ok) throw new Error(`HTTP ${r.status}`);
    //         return await r.json();
    //     } catch (err) {
    //         // Se si verifica un blocco CORS del browser (Failed to fetch)
    //         if (err.message.includes("fetch") || err.name === "TypeError") {
    //             try {
    //                 const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url.toString())}`;
    //                 const rProxy = await fetch(proxyUrl, opzioni);
    //                 if (!rProxy.ok) throw new Error(`HTTP ${rProxy.status}`);
    //                 return await rProxy.json();
    //             } catch {
    //                 throw new Error("Errore CORS / rete: il server TheSportsDB non autorizza l'origine del browser.");
    //             }
    //         }
    //         throw err;
    //     }
    // }

    // Creazione elemento dettagli espanso subito sotto la card
    function creaBoxDettagli(squadra, cardLi) {
        const li = document.createElement("li");
        li.className = "dettagli-squadra";

        // Header del box dettagli
        const header = document.createElement("div");
        header.className = "dettagli-header";

        const titoloWrap = document.createElement("div");
        titoloWrap.className = "d-flex align-items-center gap-2";

        if (squadra.logo) {
            const img = document.createElement("img");
            img.src = squadra.logo;
            img.alt = squadra.nome;
            img.style.height = "32px";
            img.style.objectFit = "contain"; // Ridimensionamento immagine
            titoloWrap.appendChild(img);
        }

        const h3 = document.createElement("h3");
        h3.textContent = squadra.nome;
        titoloWrap.appendChild(h3);

        const btnChiudi = document.createElement("button");
        btnChiudi.type = "button";
        btnChiudi.className = "btn-chiudi-dettagli";
        btnChiudi.textContent = "✕ Chiudi";
        btnChiudi.addEventListener("click", () => {
            li.remove();
            cardLi.classList.remove("attiva");
        });

        header.appendChild(titoloWrap);
        header.appendChild(btnChiudi);
        li.appendChild(header);

        // Griglia a due colonne
        const row = document.createElement("div");
        row.className = "row mt-3";

        // Colonna Prossimi Eventi
        const colProssimi = document.createElement("div");
        colProssimi.className = "col-md-6 mb-3 mb-md-0";
        const hProssimi = document.createElement("h4");
        hProssimi.textContent = "Prossimi eventi";
        const ulProssimi = document.createElement("ul");
        ulProssimi.className = "lista-eventi";
        const loadProssimi = document.createElement("li");
        loadProssimi.className = "testo-vuoto";
        loadProssimi.textContent = "Caricamento eventi in programma...";
        ulProssimi.appendChild(loadProssimi);
        colProssimi.appendChild(hProssimi);
        colProssimi.appendChild(ulProssimi);

        // Colonna Ultimi Risultati
        const colPassati = document.createElement("div");
        colPassati.className = "col-md-6";
        const hPassati = document.createElement("h4");
        hPassati.textContent = "Ultimi risultati";
        const ulPassati = document.createElement("ul");
        ulPassati.className = "lista-eventi";
        const loadPassati = document.createElement("li");
        loadPassati.className = "testo-vuoto";
        loadPassati.textContent = "Caricamento risultati recenti...";
        ulPassati.appendChild(loadPassati);
        colPassati.appendChild(hPassati);
        colPassati.appendChild(ulPassati);

        row.appendChild(colProssimi);
        row.appendChild(colPassati);
        li.appendChild(row);

        return li;
    }

    async function popolaEventiDettagli(squadra, container) {
        const ulProssimi = container.querySelectorAll(".lista-eventi")[0];
        const ulPassati = container.querySelectorAll(".lista-eventi")[1];

        try {
            const urlProssimi = new URL(`${API_BASE}/eventsnext.php`);
            urlProssimi.searchParams.set("id", squadra.id);

            const urlPassati = new URL(`${API_BASE}/eventslast.php`);
            urlPassati.searchParams.set("id", squadra.id);

            // Chiamata parallela con Promise.all
            const [datiProssimi, datiPassati] = await Promise.all([
                getJSON(urlProssimi),
                getJSON(urlPassati),
            ]);

            // Render Prossimi Eventi
            const prossimiRaw = datiProssimi.events ?? [];
            if (prossimiRaw.length === 0) {
                const li = document.createElement("li");
                li.className = "testo-vuoto";
                li.textContent = "Nessun evento in programma.";
                ulProssimi.replaceChildren(li);
            } else {
                const elementiProssimi = prossimiRaw.map((d) => {
                    const ev = new Evento(d);
                    const li = document.createElement("li");
                    li.textContent = `📅 ${ev.dataFormattata} — ${ev.casa} vs ${ev.trasferta}`;
                    return li;
                });
                ulProssimi.replaceChildren(...elementiProssimi);
            }

            // Render Ultimi Risultati
            const passatiRaw = datiPassati.results ?? [];
            if (passatiRaw.length === 0) {
                const li = document.createElement("li");
                li.className = "testo-vuoto";
                li.textContent = "Nessun risultato recente.";
                ulPassati.replaceChildren(li);
            } else {
                const elementiPassati = passatiRaw.map((d) => {
                    const ev = new Evento(d);
                    const li = document.createElement("li");
                    li.textContent = `🏁 ${ev.dataFormattata} — ${ev.casa} ${ev.punteggio} ${ev.trasferta}`;
                    return li;
                });
                ulPassati.replaceChildren(...elementiPassati);
            }
        } catch (err) {
            const li = document.createElement("li");
            li.className = "testo-vuoto text-danger";
            li.textContent = `Errore nel caricamento: ${err.message}`;
            ulProssimi.replaceChildren(li);
            ulPassati.replaceChildren();
        }
    }

    // Fetch squadre (Con Abort)

    async function cerca(query) {
        // Annulla eventuale richiesta HTTP precedente ancora in corso
        controller?.abort();
        controller = new AbortController();

        mostraSpinner();
        nascondiErrore();

        const url = new URL(`${API_BASE}/searchteams.php`);
        url.searchParams.set("t", query);

        try {
            const r = await fetch(url, { signal: controller.signal });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const dati = await r.json();
            renderRisultati(dati.teams ?? []);
        } catch (err) {
            // Ignora AbortError causato da nuova digitazione
            if (err.name === "AbortError") return;
            mostraErrore(err.message);
        } finally {
            // Nasconde lo spinner solo se questa richiesta non è stata abortita
            if (!controller.signal.aborted) {
                nascondiSpinner();
            }
        }
    }

    // Debounce

    searchInput.addEventListener("input", (e) => {
        clearTimeout(timeoutId);
        const query = e.target.value.trim();

        if (query.length < 2) {
            controller?.abort();
            nascondiSpinner();
            nascondiErrore();
            renderRisultati([]);
            return;
        }

        timeoutId = setTimeout(() => {
            cerca(query);
        }, 400); // 400ms di pausa nella digitazione
    });

    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        clearTimeout(timeoutId);
        const query = searchInput.value.trim();
        if (query.length < 2) {
            mostraErrore("Inserisci almeno 2 caratteri.");
            return;
        }
        cerca(query);
    });

    // Inizializzazione schermata
    renderPreferiti();
});