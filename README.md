# ⚽ SportsHub
 
Web app per cercare squadre sportive, salvarle tra i preferiti e consultare prossimi eventi e ultimi risultati.
Progetto del corso Epicode Full Stack — Week Project, Settimana VII.
 
I dati arrivano dall'API pubblica [TheSportsDB](https://www.thesportsdb.com/).
 
## ✨ Funzionalità
 
- **Ricerca squadre** con debounce di 400 ms mentre si digita (minimo 2 caratteri). Una nuova ricerca annulla la precedente con `AbortController`.
- **Squadre preferite** salvate nel `localStorage` (chiave `sportshub_preferiti`): restano anche dopo aver chiuso il browser.
- **Filtro per sport** (Tutti, Calcio, Basket, Football) che agisce solo sulle squadre preferite. I risultati della ricerca non vengono filtrati.
- **Prossimi appuntamenti** di tutte le preferite, ordinati per data. Le chiamate partono in parallelo con `Promise.allSettled`, quindi se una squadra fallisce le altre vengono mostrate comunque.
- **Modale squadra** con due blocchi, "Prossimi eventi" e "Ultimi risultati", caricati in parallelo con `Promise.all`.
- **Modale evento** con locandina, sport, lega, data, partita, luogo e stato. Aprendo un evento dalla modale della squadra, questa si chiude e si riapre quando si chiude l'evento.
- **Spinner e messaggi di errore** durante il caricamento.
- **Fallback CORS**: se il browser blocca la richiesta, `getJSON` riprova passando da un proxy pubblico (`allorigins.win`).
## 🛠️ Tecnologie
 
- HTML5, CSS3, JavaScript (moduli ES, `async/await`)
- [Bootstrap 5.3.3](https://getbootstrap.com/) via CDN: griglia, card, modali, list-group, bottoni
- `fetch`, `AbortController`, `Promise.all`, `Promise.allSettled`
- Classi JavaScript con getter (`Squadra`, `Evento`)
- `localStorage` con `JSON.stringify` / `JSON.parse`
## 📁 Struttura del progetto
 
```
sportshub/
├── index.html
├── README.md
└── assets/
    ├── css/
    │   └── style.css     ← base del sito + classi custom del brand
    └── js/
        ├── main.js       ← orchestratore: stato, eventi, localStorage
        ├── api.js        ← chiamate all'API (getJSON, ricerca, eventi)
        ├── models.js     ← classi Squadra ed Evento
        └── ui.js         ← creazione e aggiornamento del DOM
```
 
Ogni file ha una sola responsabilità: `api.js` non tocca il DOM, `ui.js` non fa chiamate di rete, `models.js` non dipende dagli altri. Solo `main.js` li collega.
 
## 🚀 Avvio
 
I moduli ES non funzionano aprendo `index.html` con doppio clic (`file://`): serve un piccolo server locale. Alcune opzioni:
 
- **VS Code**: estensione *Live Server*, poi "Go Live".
- **Python**: `python3 -m http.server 8000` nella cartella del progetto, poi apri `http://localhost:8000`.
Serve una connessione internet, sia per Bootstrap (CDN) sia per l'API.
 
## 🎨 Stile
 
Bootstrap viene usato per tutto ciò che offre di suo. `style.css` contiene solo il resto:
 
- gli stili di base (`body`, `.container`, `.site-header`);
- il colore del brand `#1A3366`, in classi dedicate: `.bg-brand`, `.text-brand`, `.btn-brand`, `.btn-outline-brand`;
- le micro-animazioni (card che si solleva, evento che scorre a destra);
- `prefers-reduced-motion`, che disattiva le transizioni per chi le ha disabilitate nel sistema.
## 🌐 API
 
Endpoint di TheSportsDB usati (chiave di test gratuita `123`, definita in `api.js`):
 
| Endpoint | Uso |
| --- | --- |
| `searchteams.php?t=` | ricerca squadre per nome |
| `eventsnext.php?id=` | prossimi eventi di una squadra |
| `eventslast.php?id=` | ultimi risultati di una squadra |
 
La chiave gratuita ha dei limiti: non tutte le squadre hanno eventi disponibili, e in quel caso la modale mostra "Nessun evento in programma" o "Nessun risultato recente".
 
## 🔒 Note di sicurezza
 
I testi che arrivano dall'API vengono inseriti nel DOM con `textContent` e `createElement`, mai con `innerHTML`, per evitare iniezioni di HTML o script (XSS).
 
## 👨‍💻 Autore
 
Sviluppato da Alessandro Lainà durante il corso Epicode come progetto settimanale numero 7
 