// Mini-libreria persistente — Settimana VII Giorno II
//
// Base di ieri (classi, form, render, click delegato) +
// persistenza con localStorage: salva, carica, svuota.


// === Classi ===
class Libro {
  letto = false;

  constructor(_titolo, _autore, _anno) {
    this.id = crypto.randomUUID();
    this.titolo = _titolo;
    this.autore = _autore;
    this.anno = _anno;
  }

  segnaComeLetto() {
    this.letto = true;
  }

  formato() {
    return "cartaceo";
  }

  // Passo 4: da oggetto "puro" (JSON) a istanza vera.
  // `this` è la classe su cui lo chiami: Libro.fromJSON crea un Libro,
  // LibroDigitale.fromJSON crea un LibroDigitale (il metodo è ereditato).
  // Object.assign poi copia sopra tutto il resto: id originale, letto, dimensioneMb…
  static fromJSON(d) {
    return Object.assign(new this(d.titolo, d.autore, d.anno), d);
  }

  // EXTRA di ieri (17)
  static daStringa(s) {
    const [titolo, autore, anno] = s.split("|");
    return new Libro(titolo, autore, Number(anno));
  }
}

class LibroDigitale extends Libro {
  constructor(_titolo, _autore, _anno, _dimensioneMb) {
    super(_titolo, _autore, _anno);
    this.dimensioneMb = _dimensioneMb;
  }

  formato() {
    return `digitale (${this.dimensioneMb} MB)`;
  }
}

// EXTRA di ieri (15)
class LibroAudio extends Libro {
  constructor(_titolo, _autore, _anno, _durataMinuti) {
    super(_titolo, _autore, _anno);
    this.durataMinuti = _durataMinuti;
  }

  formato() {
    return `audio (${this.durataMinuti} min)`;
  }
}


// === Persistenza (passi 1-4) ===
const STORAGE_KEY = "libri";

function salvaLibri() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(libri));
}

function caricaLibri() {
  // getItem restituisce null se la chiave non esiste → ?? "[]" → array vuoto
  const dati = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");

  // JSON.parse dà oggetti puri, senza metodi (niente formato(), segnaComeLetto()):
  // li ri-istanziamo nella classe giusta guardando quali proprietà hanno.
  return dati.map((d) => {
    if (d.dimensioneMb !== undefined) return LibroDigitale.fromJSON(d);
    if (d.durataMinuti !== undefined) return LibroAudio.fromJSON(d);
    return Libro.fromJSON(d);
  });
}


// === Stato ===
// Passo 6: let, perché "Svuota tutto" e "Rimuovi" riassegnano l'array
let libri = caricaLibri();

// EXTRA 17 e 18: stato della sola visualizzazione (non viene salvato)
let filtro = "tutti";        // "tutti" | "letti" | "da-leggere"
let ordinamento = "nessuno"; // "nessuno" | "titolo" | "anno"


// === Render ===
function libriDaMostrare() {
  // EXTRA 17: filtro
  const filtrati = libri.filter((l) => {
    if (filtro === "letti") return l.letto;
    if (filtro === "da-leggere") return !l.letto;
    return true;
  });

  // EXTRA 18: toSorted ordina una copia, l'array salvato resta com'è
  if (ordinamento === "titolo") {
    return filtrati.toSorted((a, b) => a.titolo.localeCompare(b.titolo));
  }
  if (ordinamento === "anno") {
    return filtrati.toSorted((a, b) => a.anno - b.anno);
  }
  return filtrati;
}

function renderLibri() {
  const righe = libriDaMostrare().map((l) => {
    const li = document.createElement("li");
    if (l.letto) li.classList.add("letto");
    li.dataset.id = l.id;

    // info: titolo + badge + meta
    const info = document.createElement("div");
    info.className = "info";

    const titolo = document.createElement("span");
    titolo.className = "titolo";
    titolo.textContent = l.titolo;

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = l.formato();

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${l.autore} — ${l.anno}`;

    info.append(titolo, badge, meta);

    // azioni: "Segna come letto" oppure "✓ letto", e sempre "Rimuovi" (passo 13)
    const azioni = document.createElement("div");
    azioni.className = "azioni";

    if (l.letto) {
      const fatto = document.createElement("span");
      fatto.textContent = "✓ letto";
      azioni.append(fatto);
    } else {
      const btnLeggi = document.createElement("button");
      btnLeggi.type = "button";
      btnLeggi.dataset.azione = "leggi";
      btnLeggi.textContent = "Segna come letto";
      azioni.append(btnLeggi);
    }

    const btnRimuovi = document.createElement("button");
    btnRimuovi.type = "button";
    btnRimuovi.dataset.azione = "rimuovi";
    btnRimuovi.textContent = "Rimuovi";
    azioni.append(btnRimuovi);

    li.append(info, azioni);
    return li;
  });

  document.getElementById("lista-libri").replaceChildren(...righe);
  document.getElementById("contatore").textContent = libri.length;
}


// === Eventi ===

// change sulla select del formato: mostra il campo giusto
const campoDimensione = document.getElementById("campo-dimensione");
const campoDurata = document.getElementById("campo-durata");

function aggiornaCampiCondizionali(valore) {
  campoDimensione.hidden = valore !== "digitale";
  campoDurata.hidden = valore !== "audio";
}

document.getElementById("formato").addEventListener("change", (e) => {
  aggiornaCampiCondizionali(e.target.value);
});

// submit del form (passo 7: salva dopo il push)
document.getElementById("aggiungi-libro").addEventListener("submit", (e) => {
  e.preventDefault();

  const dati = Object.fromEntries(new FormData(e.target));
  const anno = Number(dati.anno);

  let nuovo;
  if (dati.formato === "digitale") {
    nuovo = new LibroDigitale(dati.titolo, dati.autore, anno, Number(dati.dimensioneMb));
  } else if (dati.formato === "audio") {
    nuovo = new LibroAudio(dati.titolo, dati.autore, anno, Number(dati.durataMinuti));
  } else {
    nuovo = new Libro(dati.titolo, dati.autore, anno);
  }

  libri.push(nuovo);
  salvaLibri();
  renderLibri();

  e.target.reset();
  aggiornaCampiCondizionali("cartaceo");
});

// click delegato sulla lista (passi 8 e 14)
document.getElementById("lista-libri").addEventListener("click", (e) => {
  const bottone = e.target.closest("[data-azione]");
  if (!bottone) return;

  const id = bottone.closest("li").dataset.id; // stringa UUID, niente parseInt

  if (bottone.dataset.azione === "leggi") {
    libri.find((l) => l.id === id).segnaComeLetto();
  } else if (bottone.dataset.azione === "rimuovi") {
    libri = libri.filter((l) => l.id !== id);
  }

  salvaLibri();
  renderLibri();
});

// Svuota tutto (passo 11)
document.getElementById("svuota-tutto").addEventListener("click", () => {
  libri = [];
  localStorage.removeItem(STORAGE_KEY);
  renderLibri();
});

// EXTRA 16: esporta JSON in una nuova tab
/* Trasforma l’array libri in una stringa di testo JSON. Prende tre argomenti:
libri è cosa trasformare.
null è un filtro opzionale. Con null vengono incluse tutte le proprietà.
2 sono gli spazi di rientro, per avere un testo leggibile su più righe invece che tutto su una riga. */
// domani lo sostitusci utiliazzando Postman e Api
document.getElementById("esporta").addEventListener("click", () => {
  const json = JSON.stringify(libri, null, 2);
  window.open("data:application/json;charset=utf-8," + encodeURIComponent(json));
});




// EXTRA 17: filtro (delegato sul contenitore dei 3 bottoni)
document.getElementById("filtri").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-filtro]");
  if (!btn) return;

  filtro = btn.dataset.filtro;
  document.querySelectorAll("#filtri [data-filtro]").forEach((b) => {
    b.classList.toggle("attivo", b === btn);
  });
  renderLibri();
});

// EXTRA 18: ordinamento (solo visualizzazione, con toSorted)
document.getElementById("ordina").addEventListener("change", (e) => {
  ordinamento = e.target.value;
  renderLibri();
});


// Primo render: mostra i libri caricati da localStorage
renderLibri();