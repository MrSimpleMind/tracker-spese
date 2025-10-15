# 💸 Tracker Spese (Versione Lite)

## 📋 Panoramica

**Tracker Spese Lite** è una Progressive Web App (PWA) **semplificata e veloce** per tracciare le tue spese quotidiane. 

### 🎯 Focus della Versione Lite
- ✅ **Solo Spese** - tracking rapido senza complessità
- ✅ **Categorie** personalizzabili con emoji
- ✅ **Analytics** dettagliate sulle spese
- ✅ **Template Ricorrenti** per spese ripetitive
- ✅ **Grafico Andamento** ultimi 6 mesi

### 🗂️ Cosa è stato rimosso (vs versione Full)
- ❌ Conti e Fondi
- ❌ Entrate
- ❌ Movimenti Fondo e Trasferimenti
- ❌ Reminder
- ❌ Pannello Admin

---

## 🚀 Tecnologie

- **React 18** + ReactDOM (da CDN)
- **Tailwind CSS** per styling responsivo
- **Chart.js** per grafici
- **Firebase** (Authentication + Firestore)
- **PWA** con Service Worker per offline

---

## 📱 Funzionalità

### 1. 💸 Spese
- Inserimento rapido con descrizione, importo, categoria, data
- Navigazione tra mesi con totale spese
- Filtro per categoria e ordinamento
- Dettaglio spesa con modifica ed eliminazione

### 2. 🏷️ Categorie
- Creazione categorie con emoji personalizzate
- Archiviazione categorie non più utilizzate
- Descrizioni opzionali

### 3. 📊 Analytics
- **Spesa Media Mensile** e **Giornaliera**
- **Top Categoria Spese** con percentuale
- **Breakdown per Categoria** con barre visive
- Filtri temporali: ultimo mese, 3 mesi, anno, sempre

### 4. 🔁 Template Ricorrenti
- Crea template per spese mensili/bimestrali/annuali
- Quick Review quando un template scade
- Inserimento rapido da template

---

## 📁 Struttura Progetto

```
tracker-spese/
├── index.html
├── manifest.json
├── sw.js
├── icon-192.png
├── icon-512.png
├── README.md (questo file)
│
└── js/
    ├── firebase-config.js
    ├── components/
    │   ├── App.js
    │   ├── LoginPage.js
    │   ├── TransactionsView.js
    │   ├── CategorieView.js
    │   └── AnalyticsView.js
    └── modals/
        ├── AddTransactionModal.js
        ├── EditTransactionModal.js
        ├── DettaglioTransazioneModal.js
        ├── GraficoAndamentoModal.js
        ├── AddCategoriaModal.js
        ├── EditCategoriaModal.js
        ├── TemplateRicorrentiModal.js
        ├── AddTemplateModal.js
        ├── EditTemplateModal.js
        ├── DettaglioTemplateModal.js
        └── QuickReviewModal.js
```

---

## 🗄️ Modello Dati Firebase

### Collection: `transactions`
```javascript
{
  tipo: "spesa",
  descrizione: string,
  importo: number,
  categoria: string,
  data: "YYYY-MM-DD",
  nota?: string,
  isRicorrente?: boolean,
  templateId?: string,
  userId: string,
  createdAt: timestamp,
  updatedAt?: timestamp
}
```

### Collection: `categorie`
```javascript
{
  nome: string,
  descrizione?: string,
  emoji?: string,
  applicabileA: ["spesa"],
  archiviato: boolean,
  createdAt: timestamp,
  updatedAt?: timestamp
}
```

### Collection: `template_ricorrenti`
```javascript
{
  tipo: "spesa",
  descrizione: string,
  importoStimato: number,
  categoria: string,
  nota?: string,
  frequenza: "mensile" | "bimestrale" | "annuale",
  giornoMese?: number,
  giornoAnno?: number,
  meseAnno?: number,
  prossimaScadenza: "YYYY-MM-DD",
  attivo: boolean,
  userId: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## 🔧 Setup Veloce

### 1. Firebase
1. Crea progetto su [Firebase Console](https://console.firebase.google.com/)
2. Abilita Authentication (Email/Password)
3. Crea database Firestore
4. Copia credenziali in `js/firebase-config.js`

### 2. Test Locale
```bash
# Opzione 1: Python
python -m http.server 8000

# Opzione 2: Node.js
npx serve

# Poi apri: http://localhost:8000
```

### 3. Deploy
**GitHub Pages (gratis)**:
1. Push su GitHub
2. Settings → Pages → Source: main branch
3. URL: `https://username.github.io/repo-name/`

---

## 🔄 Come Recuperare la Versione Full

La versione completa (con Conti, Fondi, Entrate, Reminder, Admin) è salvata nel branch `full-features`.

### Passare alla Versione Full:
```bash
# Commit eventuali modifiche
git add .
git commit -m "Salvataggio versione lite"

# Cambia branch
git checkout full-features

# Torna alla versione lite quando vuoi
git checkout main
```

### Portare una Singola Feature dalla Versione Full:
Se in futuro vuoi riportare SOLO una feature specifica (es: solo i Reminder):

```bash
# Dalla versione lite (main)
git checkout full-features -- js/components/ReminderView.js
git checkout full-features -- js/modals/AddReminderModal.js
git checkout full-features -- js/modals/EditReminderModal.js

# Poi modifica App.js per aggiungere la view
# Commit e push
```

---

## 📈 Usare l'App

### Primo Utilizzo
1. **Login** con email e password
2. **Crea Categorie** (es: 🍕 Alimentari, 🚗 Trasporti, 🎬 Svago)
3. **Aggiungi Spese** con descrizione, importo, categoria, data
4. **Visualizza Analytics** per analizzare le tue abitudini

### Template Ricorrenti
Per spese mensili automatiche:
1. **Spese** → **Template**
2. **Nuovo Template**
3. Inserisci: descrizione (es: "Affitto"), importo, categoria, frequenza
4. Ogni mese ricevi un promemoria per inserire la spesa

---

## 🌐 PWA e Offline

L'app funziona **offline** dopo il primo caricamento:
- Service Worker cachea le risorse
- Firestore sincronizza quando torni online
- Installabile come app nativa (Chrome: icona "Installa", Safari: Condividi → Aggiungi a Home)

---

## 📝 Note Importanti

- **Solo Spese**: questa versione traccia SOLO le spese per massima semplicità
- **Retrocompatibilità**: i dati esistenti (entrate, movimenti fondo) non vengono eliminati, semplicemente non sono più visualizzati
- **Versione Full**: sempre disponibile nel branch `full-features`

---

## 🐛 Troubleshooting

**L'app non carica?**
- Verifica connessione internet
- Controlla console browser (F12) per errori
- Svuota cache: DevTools → Application → Clear storage

**Le spese non si salvano?**
- Verifica autenticazione
- Controlla regole Firestore nella console Firebase
- Verifica configurazione in `firebase-config.js`

---

## 📄 Licenza

Progetto privato per uso personale/familiare.

---

**Versione**: 3.0 Lite  
**Ultimo Aggiornamento**: Ottobre 2025  
**Made with ❤️ for simple expense tracking**
