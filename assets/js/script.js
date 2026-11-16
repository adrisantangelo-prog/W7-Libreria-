// Mini-libreria — Settimana VII Giorno I
//
// 1. Classe Libro (id, titolo, autore, anno, letto)
// 2. Classe LibroDigitale che estende Libro (aggiunge dimensioneMb)
// 3. Listener sul form che crea l'istanza giusta e la aggiunge all'array
// 4. Render della lista nel <ul id="lista-libri">
// Bonus: "Segna come letto" con event delegation + extra 15-17


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

  // EXTRA 17
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

// EXTRA 15
class LibroAudio extends Libro {
  constructor(_titolo, _autore, _anno, _durataMinuti) {
    super(_titolo, _autore, _anno);
    this.durataMinuti = _durataMinuti;
  }

  formato() {
    return `audio (${this.durataMinuti} min)`;
  }
}

// === Stato (array di libri) ===
let libri = []; // let perché l'EXTRA 16 la riassegna con filter

// === Render ===
// createElement + textContent (non innerHTML): titolo e autore
// arrivano dall'utente, così non può essere iniettato HTML.
function renderLibri() {
  const righe = libri.map((l) => {
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

    // azioni: bottone "leggi" oppure "✓ letto"
    const azioni = document.createElement("div");
    azioni.className = "azioni";

    if (l.letto) {
      const fatto = document.createElement("span");
      fatto.textContent = "✓ letto";
      azioni.append(fatto);
    } else {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.azione = "leggi";
      btn.textContent = "Segna come letto";
      azioni.append(btn);
    }

    // EXTRA 16
    const rimuovi = document.createElement("button");
    rimuovi.type = "button";
    rimuovi.dataset.azione = "rimuovi";
    rimuovi.textContent = "Rimuovi";
    azioni.append(rimuovi);

    li.append(info, azioni);
    return li;
  });

  document.getElementById("lista-libri").replaceChildren(...righe);
  document.getElementById("contatore").textContent = libri.length;
}

// === Eventi ===

// change sulla select
const campoDimensione = document.getElementById("campo-dimensione");
const campoDurata = document.getElementById("campo-durata"); // EXTRA 15

function aggiornaCampiCondizionali(valore) {
  campoDimensione.hidden = valore !== "digitale";
  campoDurata.hidden = valore !== "audio";
}

document.getElementById("formato").addEventListener("change", (e) => {
  aggiornaCampiCondizionali(e.target.value);
});

// submit del form
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
  renderLibri();

  e.target.reset();
  aggiornaCampiCondizionali("cartaceo");
});

// click delegato sulla lista
document.getElementById("lista-libri").addEventListener("click", (e) => {
  const bottone = e.target.closest("[data-azione]");
  if (!bottone) return;

  const id = bottone.closest("li").dataset.id; // stringa UUID, niente parseInt

  if (bottone.dataset.azione === "leggi") {
    const libro = libri.find((l) => l.id === id);
    libro.segnaComeLetto();
  } else if (bottone.dataset.azione === "rimuovi") {
    // EXTRA 16
    libri = libri.filter((l) => l.id !== id);
  }

  renderLibri();
});

// EXTRA 17: verifica
//console.log(Libro.daStringa("1984|Orwell|1949"));

//renderLibri();