// SportsHub — Week Project Settimana VII
// Modulo ES: Interfaccia Utente (UI)

const spinner = document.getElementById("spinner");
const erroreDiv = document.getElementById("errore");
const risultatiLista = document.getElementById("risultati-lista");
const preferitiLista = document.getElementById("preferiti-lista");
const sezioneAppuntamenti = document.getElementById("sezione-appuntamenti");
const appuntamentiLista = document.getElementById("appuntamenti-lista");
const modalElement = document.getElementById("modal-evento");
const modalSquadraElement = document.getElementById("modal-squadra");

// Helper: crea un elemento con classi e testo
function el(tag, cls = "", text = "") {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
}

export function creaVuoto(msg, cls = "col-12 text-body-secondary fst-italic") {
    return el("li", cls, msg);
}

// === Spinner ed errori ===
export function mostraSpinner() {
    spinner?.classList.remove("d-none");
    erroreDiv?.setAttribute("hidden", "");
}

export function nascondiSpinner() {
    spinner?.classList.add("d-none");
}

export function mostraErrore(msg) {
    if (!erroreDiv) return;
    erroreDiv.textContent = msg;
    erroreDiv.removeAttribute("hidden");
}

export function nascondiErrore() {
    if (!erroreDiv) return;
    erroreDiv.setAttribute("hidden", "");
    erroreDiv.textContent = "";
}

// === Modale dettagli evento ===
export function apriModalEvento(evento) {
    if (!modalElement) return;

    document.getElementById("modal-evento-titolo").textContent = evento.nomeEvento;
    const corpo = document.getElementById("modal-evento-corpo");
    corpo.replaceChildren();

    if (evento.locandina) {
        const img = el("img", "img-fluid rounded mb-3 w-100 object-fit-cover");
        img.src = evento.locandina;
        img.alt = evento.nomeEvento;
        img.style.maxHeight = "200px";
        corpo.appendChild(img);
    }

    const righe = [
        ["Sport", evento.sport],
        ["Lega", evento.lega],
        ["Data", `${evento.dataFormattata}${evento.ora ? ` alle ${evento.ora}` : ""}`],
        ["Partita", `${evento.casa} ${evento.punteggio} ${evento.trasferta}`],
    ];
    if (evento.stadio || evento.paese) {
        righe.push(["Luogo", `${evento.stadio ?? ""} ${evento.paese ? `(${evento.paese})` : ""}`.trim()]);
    }
    if (evento.stato) righe.push(["Stato", evento.stato]);

    const lista = el("ul", "list-group list-group-flush");
    righe.forEach(([label, valore]) => {
        const li = el("li", "list-group-item px-0 d-flex gap-2");
        li.append(el("strong", "", `${label}:`), el("span", "", valore));
        lista.appendChild(li);
    });
    corpo.appendChild(lista);

    const modalEvento = bootstrap.Modal.getOrCreateInstance(modalElement);

    // Bootstrap non gestisce bene due modali sovrapposte: se è aperta quella della
    // squadra la chiudo, mostro l'evento e, alla chiusura, riapro la squadra.
    if (modalSquadraElement?.classList.contains("show")) {
        const modalSquadra = bootstrap.Modal.getOrCreateInstance(modalSquadraElement);
        modalSquadraElement.addEventListener(
            "hidden.bs.modal",
            () => {
                modalElement.addEventListener("hidden.bs.modal", () => modalSquadra.show(), { once: true });
                modalEvento.show();
            },
            { once: true }
        );
        modalSquadra.hide();
    } else {
        modalEvento.show();
    }
}

// === Evento cliccabile (list-group) ===
export function creaElementoEvento(evento, isPassato, onEventoClick) {
    const icona = isPassato ? "🏁" : "📅";
    const separatore = isPassato ? evento.punteggio : "vs";
    const li = el(
        "li",
        "list-group-item list-group-item-action",
        `${icona} ${evento.dataFormattata} — ${evento.casa} ${separatore} ${evento.trasferta}`
    );
    li.setAttribute("role", "button");
    li.addEventListener("click", () => onEventoClick?.(evento));
    return li;
}

// === Card squadra ===
export function creaCardSquadra(squadra, isPreferito, handlers) {
    const { onAggiungi, onRimuovi, onCardClick, isGiaPreferita } = handlers;

    const li = el("li", "col squadra-card");
    li.dataset.id = squadra.id;

    const card = el("div", "card h-100 shadow-sm");
    card.setAttribute("role", "button");

    const body = el("div", "card-body d-flex align-items-center gap-3");
    if (squadra.logo) {
        const img = el("img", "object-fit-contain flex-shrink-0");
        img.src = squadra.logo;
        img.alt = squadra.nome;
        img.width = 44;
        img.height = 44;
        img.loading = "lazy";
        body.appendChild(img);
    }
    const testi = el("div", "overflow-hidden");
    testi.append(
        el("div", "fw-bold text-truncate", squadra.nome),
        el("div", "small text-body-secondary text-truncate", `${squadra.lega} • ${squadra.sport}`)
    );
    body.appendChild(testi);

    const footer = el("div", "card-footer bg-transparent");
    const btn = el("button", "btn btn-sm w-100");
    btn.type = "button";

    if (isPreferito) {
        btn.classList.add("btn-outline-danger");
        btn.textContent = "✕ Rimuovi";
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            onRimuovi?.(squadra.id);
        });
    } else {
        const gia = isGiaPreferita?.(squadra.id) ?? false;
        btn.classList.add(gia ? "btn-secondary" : "btn-brand");
        btn.textContent = gia ? "✓ Aggiunto" : "★ Aggiungi ai preferiti";
        btn.disabled = gia;
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            onAggiungi?.(squadra);
        });
    }
    footer.appendChild(btn);

    card.append(body, footer);
    card.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        onCardClick?.(squadra);
    });
    li.appendChild(card);
    return li;
}

// === Modale squadra: prossimi eventi + ultimi risultati ===
function creaColonna(titolo, msgCaricamento) {
    const col = el("div", "col-md-6");
    const ul = el("ul", "list-group");
    ul.appendChild(creaVuoto(msgCaricamento, "list-group-item text-body-secondary fst-italic"));
    col.append(el("h4", "h6 fw-bold", titolo), ul);
    return col;
}

// Prepara la modale con i segnaposto di caricamento e restituisce le due liste da riempire
export function apriModalSquadra(squadra) {
    const titolo = document.getElementById("modal-squadra-titolo");
    const corpo = document.getElementById("modal-squadra-corpo");

    const intestazione = el("span", "d-flex align-items-center gap-2");
    if (squadra.logo) {
        const img = el("img", "object-fit-contain");
        img.src = squadra.logo;
        img.alt = squadra.nome;
        img.height = 32;
        intestazione.appendChild(img);
    }
    intestazione.appendChild(el("span", "", squadra.nome));
    titolo.replaceChildren(intestazione);

    const row = el("div", "row g-3");
    row.append(
        creaColonna("Prossimi eventi", "Caricamento eventi in programma..."),
        creaColonna("Ultimi risultati", "Caricamento risultati recenti...")
    );
    corpo.replaceChildren(row);

    bootstrap.Modal.getOrCreateInstance(modalSquadraElement).show();

    const [ulProssimi, ulPassati] = row.querySelectorAll("ul");
    return { ulProssimi, ulPassati };
}

// === Render liste ===
export function renderPreferiti(preferiti, handlers, msgVuoto) {
    if (!preferitiLista) return;
    if (preferiti.length === 0) {
        preferitiLista.replaceChildren(creaVuoto(msgVuoto));
        return;
    }
    preferitiLista.replaceChildren(...preferiti.map((sq) => creaCardSquadra(sq, true, handlers)));
}

export function renderRisultati(squadre, handlers) {
    if (!risultatiLista) return;
    if (!squadre || squadre.length === 0) {
        risultatiLista.replaceChildren(creaVuoto("Nessuna squadra trovata per la ricerca."));
        return;
    }
    risultatiLista.replaceChildren(...squadre.map((sq) => creaCardSquadra(sq, false, handlers)));
}

export function renderProssimiAppuntamenti(eventi, onEventoClick) {
    if (!sezioneAppuntamenti || !appuntamentiLista) return;
    if (!eventi || eventi.length === 0) {
        sezioneAppuntamenti.setAttribute("hidden", "");
        return;
    }
    sezioneAppuntamenti.removeAttribute("hidden");
    const badge = document.getElementById("badge-appuntamenti");
    if (badge) badge.textContent = `${eventi.length} in programma`;

    const elementi = eventi.map((ev) => {
        const li = el(
            "li",
            "list-group-item list-group-item-action",
            `📅 ${ev.dataFormattata} — ${ev.casa} vs ${ev.trasferta} (${ev.lega})`
        );
        li.setAttribute("role", "button");
        li.addEventListener("click", () => onEventoClick?.(ev));
        return li;
    });
    appuntamentiLista.replaceChildren(...elementi);
}
