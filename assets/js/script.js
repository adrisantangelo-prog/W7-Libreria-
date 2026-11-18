// Mini-libreria — Settimana VII Giorno III
//
// Giorno I:   classi, form, render, click delegato
// Giorno II:  persistenza con localStorage
// Giorno III: ricerca su Open Library con fetch + debounce + AbortController


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

// EXTRA 16 (Giorno II): esporta JSON in una nuova tab
// Blob invece di data: URL, che i browser moderni bloccano
document.getElementById("esporta").addEventListener("click", () => {
  const json = JSON.stringify(libri, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  window.open(URL.createObjectURL(blob));
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


// =====================================================
// === Giorno III: ricerca su Open Library ===
// =====================================================

const spinner = document.getElementById("spinner");
const errore = document.getElementById("errore");
const listaRisultati = document.getElementById("risultati");
const inputCerca = document.getElementById("cerca");

const QUERY_KEY = "ultimaQuery"; // EXTRA 19


// --- Passo 4: helper per gli stati ---
function mostraSpinner() {
  spinner.hidden = false;
  errore.hidden = true;
}

function nascondiSpinner() {
  spinner.hidden = true;
}

function mostraErrore(msg) {
  errore.textContent = msg;
  errore.hidden = false;
}


// --- Passi 5-7: cerca(query) ---
let controller;

function cerca(query) {
  controller?.abort();             // annulla la ricerca precedente, se c'è
  controller = new AbortController();
  const { signal } = controller;

  mostraSpinner();
  localStorage.setItem(QUERY_KEY, query); // EXTRA 19

  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", 10);

  fetch(url, { signal })
    .then((r) => {
      // fetch va in catch solo per errori di rete: un 404/500 va controllato a mano
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((dati) => renderRisultati(dati.docs))
    .catch((err) => {
      if (err.name === "AbortError") return; // annullata da noi: non è un errore
      mostraErrore(`Ricerca non riuscita: ${err.message}`);
    })
    .finally(() => {
      // se è stata annullata, lo spinner serve alla ricerca nuova: non toccarlo
      if (!signal.aborted) nascondiSpinner();
    });
}


// --- Passi 8-10: renderRisultati(docs) ---
function renderRisultati(docs) {
  // EXTRA 18: scarta i libri senza autore
  const validi = docs.filter((d) => d.author_name);

  if (validi.length === 0) {
    const li = document.createElement("li");
    li.className = "nessuno";
    li.textContent = "Nessun risultato.";
    listaRisultati.replaceChildren(li);
    return;
  }

  const righe = validi.map((d) => {
    const autore = d.author_name?.[0] ?? "Autore sconosciuto";
    const anno = d.first_publish_year ?? "?";

    const li = document.createElement("li");

    const info = document.createElement("div");
    info.className = "info";

    const titolo = document.createElement("span");
    titolo.className = "titolo";
    titolo.textContent = d.title; // textContent: dati da API esterna, niente XSS

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${autore} — ${anno}`;

    info.append(titolo, meta);

    const azioni = document.createElement("div");
    azioni.className = "azioni";

    // EXTRA 20
    const btnDettagli = document.createElement("button");
    btnDettagli.type = "button";
    btnDettagli.textContent = "Dettagli";
    btnDettagli.dataset.key = d.key; // es. "/works/OL82563W"

    const btnAggiungi = document.createElement("button");
    btnAggiungi.type = "button";
    btnAggiungi.textContent = "Aggiungi";
    btnAggiungi.dataset.titolo = d.title;
    btnAggiungi.dataset.autore = autore;
    btnAggiungi.dataset.anno = anno;

    azioni.append(btnDettagli, btnAggiungi);
    li.append(info, azioni);
    return li;
  });

  listaRisultati.replaceChildren(...righe);
}


// --- Passi 11-12: input con debounce ---
let timeoutId;

inputCerca.addEventListener("input", (e) => {
  const query = e.target.value.trim();

  clearTimeout(timeoutId); // ogni tasto azzera il timer

  if (query.length < 3) {
    listaRisultati.innerHTML = "";
    controller?.abort();          // niente risultati "in ritardo" dopo aver cancellato
    nascondiSpinner();
    errore.hidden = true;
    localStorage.removeItem(QUERY_KEY); // EXTRA 19
    return;
  }

  // debounce: parte solo se non scrivi nulla per 1000ms
  timeoutId = setTimeout(() => cerca(query), 1000);
});


// --- Passo 13: click delegato sui risultati ---
listaRisultati.addEventListener("click", (e) => {
  // Aggiungi
  const bottone = e.target.closest("button[data-titolo]");
  if (bottone) {
    const { titolo, autore, anno } = bottone.dataset;
    const nuovo = new Libro(titolo, autore, Number(anno) || 0); // "?" → NaN → 0

    libri.push(nuovo);
    salvaLibri();
    renderLibri();

    bottone.textContent = "✓ Aggiunto";
    bottone.disabled = true;
    return;
  }

  // EXTRA 20: Dettagli
  const btnDettagli = e.target.closest("button[data-key]");
  if (btnDettagli) mostraDettagli(btnDettagli.dataset.key);
});


// --- EXTRA 20: secondo fetch sul libro singolo ---
function mostraDettagli(key) {
  fetch(`https://openlibrary.org${key}.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((libro) => {
      // description può essere una stringa oppure { type, value }
      const d = libro.description;
      const testo = typeof d === "string" ? d : d?.value;
      alert(testo ?? "Nessuna descrizione.");
    })
    .catch((err) => mostraErrore(`Dettagli non disponibili: ${err.message}`));
}


// === Avvio ===
renderLibri(); // libri salvati (Giorno II)

// EXTRA 19: riprendi l'ultima ricerca
const querySalvata = localStorage.getItem(QUERY_KEY);
if (querySalvata) {
  inputCerca.value = querySalvata;
  cerca(querySalvata);
}