# Tracker Finanze Famiglia

App completa per gestire finanze familiari: entrate, spese, accumuli - Versione 3.0

## 🎯 Novità Versione 3.0

- ✅ **Gestione completa**: Entrate, Spese e Accumuli
- ✅ **Categorie flessibili**: Ogni categoria può applicarsi a uno o più tipi di transazione
- ✅ **Template ricorrenti**: Supportano tutti i tipi (spesa, entrata, accumulo)
- ✅ **Analytics potenziate**: Cash flow, tasso di risparmio, runway, e altro
- ✅ **UI migliorata**: Colori distintivi e filtri multipli
- ✅ **Vista unificata**: Tutte le transazioni in un'unica timeline

## 📊 Funzionalità Principali

### 💰 Gestione Transazioni
- **Spese**: Traccia le uscite (rosso 💸)
- **Entrate**: Registra le entrate (verde 💰)
- **Accumuli**: Monitora i risparmi (blu 🏦)
- Filtri per tipo e categoria
- Ordinamento flessibile
- Template ricorrenti per transazioni ripetitive

### 📁 Categorie Intelligenti
- Sistema flessibile: ogni categoria può applicarsi a spese, entrate o accumuli
- Esempi:
  - "Alimentari" → solo Spese
  - "Stipendio" → solo Entrate
  - "Fondo emergenza" → solo Accumuli
  - "Manutenzione auto" → Spese + Accumuli

### 🔄 Template Ricorrenti
- Mensili, bimestrali o annuali
- Supportano tutti i tipi di transazione
- Alert automatici alla scadenza
- Quick review per inserimento veloce

### 📊 Analytics Avanzate
- **Cash Flow**: Entrate - Spese (accumuli neutrali)
- **Tasso di Risparmio**: % accumuli su entrate
- **Runway**: Quanto duri con i risparmi attuali
- **Top Categoria**: Analisi delle spese principali
- Grafici multi-linea con andamento temporale

### 🔔 Reminder
- Promemoria per scadenze
- Notifiche per reminder scaduti

## 🏗️ Architettura Dati

### Collezione: `transactions`
```javascript
{
  tipo: 'spesa' | 'entrata' | 'accumulo',
  descrizione: string,
  importo: number,
  categoria: string,
  data: string (ISO date),
  nota: string,
  isRicorrente: boolean,
  templateId: string,
  userId: string,
  createdAt: timestamp
}
```

### Collezione: `categorie`
```javascript
{
  nome: string,
  descrizione: string,
  applicabileA: ['spesa', 'entrata', 'accumulo'],
  createdAt: timestamp
}
```

### Collezione: `template_ricorrenti`
```javascript
{
  tipo: 'spesa' | 'entrata' | 'accumulo',
  descrizione: string,
  importoStimato: number,
  categoria: string,
  frequenza: 'mensile' | 'bimestrale' | 'annuale',
  giornoMese: number,
  prossimaScadenza: string (ISO date),
  attivo: boolean,
  userId: string
}
```

## 📁 Struttura Progetto

```
tracker-spese/
├── index.html              # Pagina principale
├── manifest.json           # Configurazione PWA
├── sw.js                   # Service Worker
├── icon-192.png           # Icona app
├── icon-512.png           # Icona app
└── js/
    ├── firebase-config.js  # Configurazione Firebase + fix iOS
    ├── components/         # Componenti React
    │   ├── App.js         # Componente principale
    │   ├── LoginPage.js   # Pagina login
    │   ├── TransactionsView.js # Vista transazioni (ex SpeseView)
    │   ├── CategorieView.js
    │   ├── ReminderView.js
    │   ├── AnalyticsView.js
    │   └── AdminView.js
    └── modals/            # Modali
        ├── AddTransactionModal.js
        ├── EditTransactionModal.js
        ├── GraficoAndamentoModal.js
        ├── AddCategoriaModal.js
        ├── EditCategoriaModal.js
        ├── AddReminderModal.js
        ├── EditReminderModal.js
        ├── TemplateRicorrentiModal.js
        ├── AddTemplateModal.js
        ├── EditTemplateModal.js
        ├── DettaglioTemplateModal.js
        └── QuickReviewModal.js
```

## 🚀 Deploy su GitHub Pages

1. Carica tutti i file su GitHub
2. Abilita GitHub Pages nelle impostazioni del repository
3. L'app sarà disponibile su: `https://tuousername.github.io/tracker-spese/`

## 🔧 Sviluppo Locale

Per testare in locale:
1. Usa un server locale (es: Live Server in VS Code)
2. Oppure: `python -m http.server 8000`
3. Apri: `http://localhost:8000/tracker-spese/`

## ✨ Fix iOS implementati

- Persistenza auth configurata per Safari
- Service Worker con gestione errori iOS
- Debug logging per troubleshooting

## 💡 Logica Accumuli

Gli **accumuli sono neutrali nel cash flow**:
- Se guadagni 2000€ → puoi registrare 1500€ come entrate e 500€ come accumuli
- Cash Flow = Entrate - Spese (accumuli NON sottratti)
- Tasso di Risparmio = Accumuli / Entrate × 100

Esempio:
- Entrate: 2000€
- Spese: 1500€
- Accumuli: 300€
- Cash Flow: 2000 - 1500 = **500€** (positivo!)
- Tasso Risparmio: 300/2000 = **15%**

## 📝 Note Tecniche

- **Framework**: React 18 (inline con Babel)
- **Backend**: Firebase (Auth + Firestore)
- **Styling**: Tailwind CSS
- **Grafici**: Chart.js
- **PWA**: Manifest + Service Worker

## 🔄 Changelog

### v3.0.0 (Attuale)
- Aggiunta gestione Entrate e Accumuli
- Sistema categorie flessibili
- Analytics potenziate con metriche finanziarie
- Template ricorrenti per tutti i tipi
- UI aggiornata con colori distintivi

### v2.0.0
- Refactoring codice organizzato
- Fix iOS/Safari
- Template ricorrenti
- Analytics base

### v1.0.0
- Gestione spese base
- Categorie
- Reminder

## 🎨 Codici Colore

- 🔴 **Rosso**: Spese (€ in negativo)
- 🟢 **Verde**: Entrate (€ in positivo)
- 🔵 **Blu**: Accumuli (€ neutrali)
- 🟣 **Viola**: Cash Flow

## 🛡️ Sicurezza

- Autenticazione Firebase
- Multi-utente con condivisione dati famiglia
- Admin panel per gestione utenti
