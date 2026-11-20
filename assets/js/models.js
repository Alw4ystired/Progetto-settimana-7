// SportsHub — Week Project Settimana VII
// Modulo ES: Modelli OOP

export class Squadra {
    constructor(dati) {
        // Riconosce sia il formato grezzo dell'API (idTeam, strTeam...)
        // sia quello salvato in localStorage (id, nome...)
        this.id = dati.idTeam ?? dati.id;
        this.nome = dati.strTeam ?? dati.nome ?? "Squadra sconosciuta";
        this.logo = dati.strBadge ?? dati.logo ?? null;
        this.lega = dati.strLeague ?? dati.lega ?? "Campionato sconosciuto";
        this.paese = dati.strCountry ?? dati.paese ?? "Paese sconosciuto";
        this.sport = dati.strSport ?? dati.sport ?? "Sport sconosciuto";
    }
}

export class Evento {
    constructor(dati) {
        this.id = dati.idEvent;
        this.nomeEvento = dati.strEvent ?? `${dati.strHomeTeam} vs ${dati.strAwayTeam}`;
        this.dataRaw = dati.dateEvent ?? null;
        this.ora = dati.strTime ?? null;
        this.casa = dati.strHomeTeam ?? "Casa";
        this.trasferta = dati.strAwayTeam ?? "Trasferta";
        this.punteggioCasa = dati.intHomeScore ?? null;
        this.punteggioTrasferta = dati.intAwayScore ?? null;
        this.lega = dati.strLeague ?? "Competizione non specificata";
        this.sport = dati.strSport ?? "Sport non specificato";
        this.stadio = dati.strVenue ?? null;
        this.paese = dati.strCountry ?? null;
        this.locandina = dati.strThumb ?? null;
        this.stato = dati.strStatus ?? null;
        this.squadraRiferimento = dati.squadraRiferimento ?? null;
    }

    // Getter per formattare la data in italiano
    get dataFormattata() {
        if (!this.dataRaw) return "Data non disponibile";
        const d = new Date(this.dataRaw);
        return new Intl.DateTimeFormat("it-IT", {
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(d);
    }

    // Getter per il punteggio o 'vs'
    get punteggio() {
        if (this.punteggioCasa !== null && this.punteggioTrasferta !== null) {
            return `${this.punteggioCasa} - ${this.punteggioTrasferta}`;
        }
        return "vs";
    }
}
