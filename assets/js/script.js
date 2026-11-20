// SportsHub — Week Project Settimana VII

// === CLASSI (OOP) ===

class Squadra {
    constructor(dati) {
        this.id = dati.idTeam;
        this.nome = dati.strTeam;
        this.logo = dati.strBadge;
        this.lega = dati.strLeague;
        this.paese = dati.strCountry;
        this.sport = dati.strSport;
    }
}

class Evento {
    constructor(dati) {
        this.id = dati.idEvent;
        this.dataRaw = dati.dateEvent;
        this.casa = dati.strHomeTeam;
        this.trasferta = dati.strAwayTeam;
        this.punteggioCasa = dati.intHomeScore;
        this.punteggioTrasferta = dati.intAwayScore;
    }

    get dataFormattata() {
        if (!this.dataRaw) return "Data sconosciuta";
        const d = new Date(this.dataRaw);
        //Intl.DateTimeFormat è l'API nativa di JavaScript per formattare date e orari in base alla lingua e al paese.
        return new Intl.DateTimeFormat('it-IT', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).format(d);
    }

    get punteggio() {
        if (this.punteggioCasa !== null && this.punteggioTrasferta !== null) {
            return `${this.punteggioCasa} - ${this.punteggioTrasferta}`;
        }
        return "";
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // === COSTANTI E STATO ===
    const API_KEY = '123';
    const API_BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;
    const STORAGE_KEY = 'sportshub_preferiti';

    let squadreTrovate = [];
    let preferiti = caricaPreferiti();

    // === ELEMENTI DOM ===
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const spinner = document.getElementById('spinner');
    const erroreDiv = document.getElementById('errore');
    const risultatiLista = document.getElementById('risultati-lista');
    const preferitiLista = document.getElementById('preferiti-lista');


    // === FUNZIONI HELPER ===
    function mostraSpinner() {
        spinner.classList.remove('d-none');
        erroreDiv.setAttribute('hidden', '');
    }

    function nascondiSpinner() {
        spinner.classList.add('d-none');
    }

    function mostraErrore(msg) {
        erroreDiv.textContent = msg;
        erroreDiv.removeAttribute('hidden');
    }

    function caricaPreferiti() {
        const salvati = localStorage.getItem(STORAGE_KEY);
        if (!salvati) return [];
        return JSON.parse(salvati).map(dati => new Squadra(dati));
    }

    function salvaPreferiti() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferiti));
    }

    function aggiornaPreferitiUI() {
        preferitiLista.replaceChildren();

        if (preferiti.length === 0) {
            const p = document.createElement('p');
            p.className = 'testo-vuoto';
            p.textContent = 'Non hai ancora salvato nessuna squadra. Cercane una qui sopra e aggiungila ai preferiti.';
            preferitiLista.appendChild(p);
            return;
        }

        preferiti.forEach(squadra => {
            const li = creaSquadraElement(squadra, true);
            preferitiLista.appendChild(li);
        });
    }

    // Squadra
    function creaSquadraElement(squadra, isPreferito) {
        const li = document.createElement('li');
        li.dataset.id = squadra.id;
        li.className = 'squadra-card';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'squadra-info';

        if (squadra.logo) {
            const img = document.createElement('img');
            img.src = squadra.logo;
            img.alt = squadra.nome;
            img.className = 'squadra-logo';
            infoDiv.appendChild(img);
        }

        const dettagliDiv = document.createElement('div');
        const nomeSpan = document.createElement('span');
        nomeSpan.className = 'squadra-nome';
        nomeSpan.textContent = squadra.nome;

        const leagueSpan = document.createElement('span');
        leagueSpan.className = 'squadra-league';
        leagueSpan.textContent = `${squadra.lega || 'Campionato sconosciuto'} - ${squadra.paese || 'Paese sconosciuto'}`;

        dettagliDiv.appendChild(nomeSpan);
        dettagliDiv.appendChild(leagueSpan);
        infoDiv.appendChild(dettagliDiv);

        li.appendChild(infoDiv);

        const azioneDiv = document.createElement('div');
        azioneDiv.className = 'squadra-azioni';

        if (isPreferito) {
            const btnRimuovi = document.createElement('button');
            btnRimuovi.className = 'btn-rimuovi';
            btnRimuovi.textContent = 'Rimuovi';
            btnRimuovi.addEventListener('click', (e) => {
                e.stopPropagation();
                preferiti = preferiti.filter(s => s.id !== squadra.id);
                salvaPreferiti();
                aggiornaPreferitiUI();
            });
            azioneDiv.appendChild(btnRimuovi);
        } else {
            const btnAggiungi = document.createElement('button');
            btnAggiungi.className = 'btn-aggiungi';
            btnAggiungi.textContent = '⭐ Aggiungi';
            btnAggiungi.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!preferiti.some(s => s.id === squadra.id)) {
                    preferiti.push(squadra);
                    salvaPreferiti();
                    aggiornaPreferitiUI();
                }
                btnAggiungi.textContent = '✓ Aggiunto';
                btnAggiungi.disabled = true;
            });
            azioneDiv.appendChild(btnAggiungi);
        }

        li.appendChild(azioneDiv);

        // Gestione click dettagli sotto la card
        li.addEventListener('click', (e) => {
            // Evito che il click sul bottone Rimuovi/Aggiungi apra i dettagli
            if (e.target.tagName === 'BUTTON') return;

            // Cerco se ci sono già i dettagli aperti per questa card
            const dettagliEsistenti = li.nextElementSibling;
            if (dettagliEsistenti && dettagliEsistenti.classList.contains('dettagli-squadra')) {
                // Se ci sono, li rimuovo (chiudo)
                dettagliEsistenti.remove();
            } else {
                // Altrimenti, creo il contenitore dei dettagli
                const dettagliDiv = document.createElement('div');
                dettagliDiv.className = 'dettagli-squadra';

                // Placeholder caricamento
                const loading = document.createElement('p');
                loading.textContent = 'Caricamento eventi...';
                dettagliDiv.appendChild(loading);

                // Inserisco il div dei dettagli subito dopo la card <li>
                li.after(dettagliDiv);

                // Chiamo la funzione per popolare i dettagli
                popolaDettagli(squadra, dettagliDiv);
            }
        });

        return li;
    }

    // Funzione per i dettagli
    async function popolaDettagli(squadra, dettagliDiv) {
        try {
            const urlProssimi = new URL(`${API_BASE}/eventsnext.php`);
            urlProssimi.searchParams.set("id", squadra.id);

            const urlPassati = new URL(`${API_BASE}/eventslast.php`);
            urlPassati.searchParams.set("id", squadra.id);

            const [rProssimi, rPassati] = await Promise.all([
                fetch(urlProssimi),
                fetch(urlPassati)
            ]);

            if (!rProssimi.ok || !rPassati.ok) throw new Error('Errore nel caricamento degli eventi');

            const datiProssimi = await rProssimi.json();
            const datiPassati = await rPassati.json();

            // Svuoto il placeholder
            dettagliDiv.replaceChildren();

            // Creo la struttura HTML per i dettagli
            const row = document.createElement('div');
            row.className = 'row mt-3';

            // Colonna Prossimi Eventi
            const colProssimi = document.createElement('div');
            colProssimi.className = 'col-md-6';
            const hProssimi = document.createElement('h4');
            hProssimi.textContent = 'Prossimi eventi';
            const ulProssimi = document.createElement('ul');
            ulProssimi.className = 'lista-eventi';

            const prossimi = (datiProssimi.events || []).map(d => new Evento(d));
            if (prossimi.length === 0) {
                const li = document.createElement('li');
                li.textContent = 'Nessun evento in programma.';
                ulProssimi.appendChild(li);
            } else {
                prossimi.forEach(ev => {
                    const li = document.createElement('li');
                    li.textContent = `${ev.dataFormattata} - ${ev.casa} vs ${ev.trasferta}`;
                    ulProssimi.appendChild(li);
                });
            }

            colProssimi.appendChild(hProssimi);
            colProssimi.appendChild(ulProssimi);

            // Colonna Ultimi Risultati
            const colPassati = document.createElement('div');
            colPassati.className = 'col-md-6';
            const hPassati = document.createElement('h4');
            hPassati.textContent = 'Ultimi risultati';
            const ulPassati = document.createElement('ul');
            ulPassati.className = 'lista-eventi';

            const passati = (datiPassati.results || []).map(d => new Evento(d));
            if (passati.length === 0) {
                const li = document.createElement('li');
                li.textContent = 'Nessun risultato recente.';
                ulPassati.appendChild(li);
            } else {
                passati.forEach(ev => {
                    const li = document.createElement('li');
                    li.textContent = `${ev.dataFormattata} - ${ev.casa} ${ev.punteggio} ${ev.trasferta}`;
                    ulPassati.appendChild(li);
                });
            }

            colPassati.appendChild(hPassati);
            colPassati.appendChild(ulPassati);

            row.appendChild(colProssimi);
            row.appendChild(colPassati);
            dettagliDiv.appendChild(row);

        } catch (err) {
            dettagliDiv.replaceChildren();
            const p = document.createElement('p');
            p.textContent = `Errore: ${err.message}`;
            p.style.color = 'red';
            dettagliDiv.appendChild(p);
        }
    }

    // === FUNZIONE DI RICERCA ===
    async function cercaSquadre(query) {
        mostraSpinner();
        risultatiLista.replaceChildren();

        const url = new URL(`${API_BASE}/searchteams.php`);
        url.searchParams.set("t", query);

        try {
            const r = await fetch(url);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);

            const dati = await r.json();
            const teamsRaw = dati.teams || [];

            squadreTrovate = teamsRaw.map(datiSquadra => new Squadra(datiSquadra));

            if (squadreTrovate.length === 0) {
                const p = document.createElement('p');
                p.className = 'testo-vuoto';
                p.textContent = 'Nessuna squadra trovata. Riprova con un altro nome.';
                risultatiLista.appendChild(p);
                return;
            }

            squadreTrovate.forEach(squadra => {
                const li = creaSquadraElement(squadra, false);
                risultatiLista.appendChild(li);
            });

        } catch (err) {
            mostraErrore(err.message);
        } finally {
            nascondiSpinner();
        }
    }

    // === EVENTI ===
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query.length < 2) {
            alert('Inserisci almeno 2 caratteri.');
            return;
        }
        cercaSquadre(query);
    });

    // === INIZIALIZZAZIONE ===
    aggiornaPreferitiUI();

});