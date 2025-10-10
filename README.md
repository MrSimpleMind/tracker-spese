# 💰 Tracker Finanze Famiglia

## 📋 Panoramica

**Tracker Finanze Famiglia** è una Progressive Web App (PWA) privata e ottimizzata per dispositivi mobili, progettata per tracciare in modo completo e intuitivo:
- 💸 **Spese e Entrate** con associazione a conti specifici
- 💳 **Conti** (correnti, risparmi, contanti, carte)
- 🏦 **Fondi** di accumulo per obiettivi specifici
- 🔄 **Trasferimenti** unificati tra conti e fondi
- 📊 **Analytics** dettagliate del cash flow
- 🔔 **Reminder** per scadenze e pagamenti
- 🔁 **Template ricorrenti** per transazioni ripetitive

L'app funziona **offline** ed è completamente privata grazie a Firebase Authentication e Firestore.

---

## 🚀 Tecnologie Utilizzate

### Frontend
- **React 18** + ReactDOM (caricati da CDN)
- **Babel Standalone** per compilazione JSX al volo
- **Tailwind CSS** per lo styling responsivo
- **Chart.js** per grafici e visualizzazioni

### Backend
- **Firebase Authentication** (email/password)
- **Firebase Firestore** per database real-time
- **Firebase Hosting** (opzionale)

### PWA
- **Service Worker** con strategia network-first
- **Web App Manifest** per installazione
- **Notifiche Push** (dove supportate)

---

## 📱 Funzionalità Principali

### 1. 💳 Gestione Conti
Sistema completo per tracciare dove sono fisicamente i tuoi soldi:
- **Creazione conti** con nome personalizzato, emoji e descrizione
- **Saldo automatico** calcolato dalle transazioni associate
- **Tipologie**: Conto corrente, risparmio, contanti, carte, PayPal, ecc.
- **Archiviazione** conti non più utilizzati (senza perdere lo storico)
- **Statistiche dettagliate**: entrate, spese, versamenti/prelievi fondi per ogni conto
- **Ledger transazioni** per visualizzare tutte le operazioni di un conto

### 2. 🏦 Gestione Fondi
Accantonamenti per obiettivi specifici che **non impattano il cash flow mensile**:
- **Fondi personalizzati** (es: Vacanze, Emergenze, Auto nuova)
- **Versamenti e prelievi** tracciati separatamente
- **Obiettivi opzionali** con monitoraggio del progresso
- **Storico completo** di tutti i movimenti
- **Archiviazione** fondi completati o non più necessari

### 3. 💸 Transazioni Complete
Sistema unificato per tracciare tutte le operazioni finanziarie:
- **Spese**: con categoria, conto, data e note
- **Entrate**: stipendi, rimborsi, vendite
- **Movimenti Fondo**: versamenti, prelievi, trasferimenti
- **Associazione al conto**: ogni spesa/entrata è collegata a un conto specifico
- **Filtri avanzati**: per tipo, categoria, conto, periodo
- **Ordinamento** personalizzabile
- **Modifica ed eliminazione** con controlli di sicurezza

### 4. 🔄 Sistema Trasferimenti Unificato
Trasferimenti intelligenti tra qualsiasi tipo di contenitore:
- **Conto → Conto** (es: da conto corrente a risparmio)
- **Conto → Fondo** (es: accantono dal conto al fondo vacanze)
- **Fondo → Conto** (es: prelevo dal fondo emergenze)
- **Fondo → Fondo** (es: riorganizzo tra fondi)
- **Doppia scrittura atomica** garantisce coerenza
- **Tracciamento** con `transferGroupId` per audit

### 5. 📊 Vista Conti e Fondi
Dashboard unificata con doppio tab:
- **Patrimonio totale** (somma conti + fondi)
- **Statistiche aggregate** in tempo reale
- **Card dettagliate** per ogni conto/fondo con:
  - Saldo attuale
  - Entrate/spese (per conti)
  - Versamenti/prelievi (per fondi)
  - Badge personalizzati con emoji
- **Azioni rapide**: modifica, archivia, elimina, visualizza transazioni

### 6. 🏷️ Categorie Personalizzabili
Sistema flessibile di categorizzazione:
- **Categorie per tipo**: specificare se applicabile a spese, entrate o movimenti fondo
- **Emoji personalizzate** per identificazione visiva rapida
- **Archiviazione** categorie non più utilizzate
- **Statistiche** per categoria nella sezione Analytics

### 7. 🔁 Template Ricorrenti
Automazione per spese/entrate ripetitive:
- **Frequenze supportate**: mensile, bimestrale, annuale
- **Giorno personalizzabile** per ogni template
- **Quick Review**: notifica quando un template è scaduto
- **Inserimento rapido** o posticipo alla prossima scadenza
- **Storico** di tutte le transazioni generate da template

### 8. 🔔 Reminder
Sistema di promemoria per non dimenticare pagamenti e scadenze:
- **Data scadenza** con ordinamento automatico
- **Importo stimato** opzionale
- **Badge visivo** per scadenze imminenti o passate
- **Completamento** con tracciamento della data
- **Sezione dedicata** per reminder completati
- **Riattivazione** di reminder completati per errore

### 9. 📈 Analytics Avanzate
Dashboard completa per analisi finanziaria:
- **Cash Flow Netto** (entrate - spese)
- **Tasso di Risparmio** percentuale
- **Runway** (mesi di autonomia con le spese attuali)
- **Top Categoria Spese** del mese
- **Grafico andamento** ultimi 6 mesi con linee per:
  - 💰 Entrate
  - 💸 Spese
  - 🏦 Movimenti Fondi
  - 💵 Cash Flow
- **Filtri temporali** per periodo personalizzato

### 10. 👤 Pannello Admin
Tool per gestione utenti familiari (solo per admin):
- **Creazione account** con email e password
- **Generatore password** automatico
- **Lista utenti** creati
- **Tracciamento** locale (collezione `admin_users`)

---

## 📁 Struttura del Progetto

```
tracker-spese/
├── index.html                      # Entry point principale
├── manifest.json                   # PWA manifest
├── sw.js                          # Service Worker per offline
├── icon-192.png                   # Icona PWA 192x192
├── icon-512.png                   # Icona PWA 512x512
├── README.md                      # Documentazione
│
└── js/
    ├── firebase-config.js         # Configurazione Firebase + inizializzazione
    │
    ├── components/                # Componenti React principali
    │   ├── App.js                # Root component + routing
    │   ├── LoginPage.js          # Pagina di login
    │   ├── TransactionsView.js   # Vista transazioni (Finanze)
    │   ├── CategorieView.js      # Gestione categorie
    │   ├── ContiFondiView.js     # Vista unificata Conti e Fondi
    │   ├── ReminderView.js       # Gestione reminder
    │   ├── AnalyticsView.js      # Dashboard analytics
    │   └── AdminView.js          # Pannello amministrazione
    │
    └── modals/                    # Componenti modali
        ├── AddTransactionModal.js      # Nuova transazione
        ├── EditTransactionModal.js     # Modifica transazione
        ├── DettaglioTransazioneModal.js # Dettaglio transazione
        ├── GraficoAndamentoModal.js    # Grafico andamento finanziario
        │
        ├── AddCategoriaModal.js        # Nuova categoria
        ├── EditCategoriaModal.js       # Modifica categoria
        │
        ├── AddContoModal.js           # Nuovo conto
        ├── EditContoModal.js          # Modifica conto
        │
        ├── AddAccumuloModal.js        # Nuovo fondo
        ├── EditAccumuloModal.js       # Modifica fondo
        ├── OperazioneAccumuloModal.js # Operazione su fondo (legacy)
        │
        ├── AddReminderModal.js        # Nuovo reminder
        ├── EditReminderModal.js       # Modifica reminder
        │
        ├── TemplateRicorrentiModal.js # Lista template
        ├── AddTemplateModal.js        # Nuovo template
        ├── EditTemplateModal.js       # Modifica template
        ├── DettaglioTemplateModal.js  # Dettaglio template
        └── QuickReviewModal.js        # Review template scaduti
```

---

## 🗄️ Modello Dati Firebase

### Collection: `transactions`
Tutte le operazioni finanziarie (spese, entrate, movimenti fondi, trasferimenti)

```javascript
{
  // Campi comuni
  tipo: "spesa" | "entrata" | "movimento_fondo",
  descrizione: string,
  importo: number,
  data: "YYYY-MM-DD",
  nota?: string,
  userId: string,
  createdAt: timestamp,
  updatedAt?: timestamp,
  
  // Per spese/entrate
  categoria: string,              // Nome categoria
  contoId?: string,              // ID del conto associato
  
  // Per movimenti fondo
  tipoMovimentoFondo?: "versamento" | "prelievo",
  fondoId?: string,              // ID del fondo
  
  // Per trasferimenti (genera 2 transazioni)
  transferGroupId?: string,      // ID gruppo trasferimento
  transferFrom?: string,         // Origine (conto-{id} o fondo-{id})
  transferTo?: string,           // Destinazione (conto-{id} o fondo-{id})
  
  // Per transazioni da template
  isRicorrente?: boolean,
  templateId?: string,
  
  // Retrocompatibilità
  tipoOperazioneAccumulo?: string,  // vecchio sistema
  nomeAccumulo?: string             // vecchio sistema
}
```

### Collection: `categorie`
Categorie per transazioni + Conti + Fondi (collection unificata)

```javascript
{
  nome: string,
  descrizione?: string,
  emoji?: string,
  
  // Per categorie normali
  applicabileA?: string[],       // ["spesa", "entrata", "movimento_fondo"]
  
  // Per conti (tipoContenitore = 'conto')
  tipoContenitore?: "conto" | "fondo",
  saldoIniziale?: number,
  saldoCorrente?: number,        // Calcolato automaticamente
  
  // Per fondi (isAccumulo = true o tipoContenitore = 'fondo')
  isAccumulo?: boolean,          // Flag fondo (retrocompatibilità)
  obiettivo?: number,            // Obiettivo di risparmio
  
  // Stato
  archiviato?: boolean,
  dataArchiviazione?: timestamp,
  
  // Timestamp
  createdAt: timestamp,
  updatedAt?: timestamp
}
```

### Collection: `template_ricorrenti`
Template per transazioni ricorrenti

```javascript
{
  tipo: "spesa" | "entrata" | "movimento_fondo",
  descrizione: string,
  importoStimato: number,
  categoria: string,
  nota?: string,
  
  // Frequenza
  frequenza: "mensile" | "bimestrale" | "annuale",
  giornoMese?: number,           // Per mensile/bimestrale (1-31)
  giornoAnno?: number,           // Per annuale (1-31)
  meseAnno?: number,             // Per annuale (1-12)
  
  // Stato
  prossimaScadenza: "YYYY-MM-DD",
  attivo: boolean,
  
  // Metadata
  userId: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Collection: `reminders`
Promemoria per scadenze

```javascript
{
  titolo: string,
  descrizione?: string,
  dataScadenza: "YYYY-MM-DD",
  importoStimato?: number,
  
  // Stato
  completato: boolean,
  dataCompletamento?: timestamp,
  
  // Metadata
  createdAt: timestamp,
  updatedAt?: timestamp
}
```

### Collection: `admin_users`
Utenti creati dal pannello admin (solo uso interno/familiare)

```javascript
{
  email: string,
  password: string,              // ATTENZIONE: in chiaro (solo uso familiare!)
  createdBy: string,             // Email admin che ha creato l'utente
  createdAt: timestamp
}
```

---

## 🔧 Setup e Configurazione

### 1. Prerequisiti
- Account Firebase (piano gratuito è sufficiente)
- Conoscenze base di Firebase Console
- Web server per testing locale (opzionale)

### 2. Configurazione Firebase

#### A. Crea Progetto Firebase
1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Crea nuovo progetto
3. Abilita **Authentication** → Email/Password
4. Crea database **Firestore** in modalità test o production

#### B. Configura Firestore Rules
Esempio di regole di sicurezza base:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Utente autenticato può leggere/scrivere solo i propri dati
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    match /categorie/{categoriaId} {
      allow read, write: if request.auth != null;
    }
    
    match /template_ricorrenti/{templateId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /reminders/{reminderId} {
      allow read, write: if request.auth != null;
    }
    
    match /admin_users/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### C. Ottieni Credenziali Firebase
1. Vai in **Project Settings** → **General**
2. Nella sezione "Your apps", crea una Web App
3. Copia le credenziali Firebase

#### D. Aggiorna `firebase-config.js`
```javascript
const firebaseConfig = {
    apiKey: "TUA_API_KEY",
    authDomain: "tuo-progetto.firebaseapp.com",
    projectId: "tuo-progetto",
    storageBucket: "tuo-progetto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

### 3. Creazione Primo Utente
Puoi creare il primo utente in due modi:

**A. Da Firebase Console**
1. Authentication → Users → Add user
2. Inserisci email e password

**B. Da Pannello Admin (dopo login)**
1. Modifica `App.js` per impostare temporaneamente il tuo email come admin
2. Accedi all'app e usa il pannello Admin per creare altri utenti

### 4. Test Locale
```bash
# Opzione 1: Python
python -m http.server 8000

# Opzione 2: Node.js
npx serve

# Opzione 3: VS Code Live Server
# Installa estensione "Live Server" e click destro su index.html
```

Apri: `http://localhost:8000/tracker-spese/`

### 5. Deploy in Produzione

#### Opzione A: Firebase Hosting
```bash
# Installa Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inizializza progetto
firebase init hosting

# Deploy
firebase deploy
```

#### Opzione B: GitHub Pages
1. Crea repository pubblico su GitHub
2. Push del codice
3. Settings → Pages → Source: main branch
4. L'app sarà disponibile su `https://username.github.io/repo-name/`

#### Opzione C: Netlify / Vercel
1. Drag & drop della cartella su Netlify/Vercel
2. Deploy automatico

---

## 🎯 Come Usare l'App

### Primo Utilizzo

1. **Login**
   - Inserisci email e password
   - Il sistema salva la sessione localmente

2. **Crea Conti**
   - Vai in **Conti e Fondi** → Tab **Conti**
   - Clicca **Nuovo Conto**
   - Inserisci: nome, emoji, saldo iniziale, descrizione
   - Esempio: "💳 Conto Corrente Principale" con saldo €1500

3. **Crea Categorie**
   - Vai in **Categorie**
   - Clicca **Nuova Categoria**
   - Scegli emoji, nome e per quali tipi è applicabile
   - Esempio: "🍕 Alimentari" per spese

4. **Crea Fondi** (opzionale)
   - Vai in **Conti e Fondi** → Tab **Fondi**
   - Clicca **Nuovo Fondo**
   - Inserisci nome e obiettivo
   - Esempio: "✈️ Fondo Vacanze" con obiettivo €3000

### Operazioni Quotidiane

#### Registrare una Spesa
1. **Finanze** → **Aggiungi**
2. Tipo: **💸 Spesa**
3. Descrizione: "Spesa supermercato"
4. Importo: 45.50
5. Categoria: "Alimentari"
6. **Da quale conto**: "Conto Corrente"
7. Data: oggi
8. **Aggiungi**

#### Registrare un'Entrata
1. **Finanze** → **Aggiungi**
2. Tipo: **💰 Entrata**
3. Descrizione: "Stipendio Ottobre"
4. Importo: 2000
5. Categoria: "Stipendio"
6. **Su quale conto**: "Conto Corrente"
7. **Aggiungi**

#### Versare in un Fondo
1. **Finanze** → **Aggiungi**
2. Tipo: **🏦 Movimento Fondo**
3. Tipo Movimento: **➕ Versamento**
4. Fondo: "Fondo Vacanze"
5. Descrizione: "Accantonamento mensile"
6. Importo: 200
7. **Da quale conto** (opzionale): "Conto Corrente"
8. **Aggiungi**

#### Trasferimento tra Conti
1. **Finanze** → **Aggiungi**
2. Tipo: **🏦 Movimento Fondo**
3. Tipo Movimento: **🔄 Trasferimento**
4. **Da**: Conto Corrente
5. **A**: Conto Risparmio
6. Importo: 500
7. **Aggiungi**

### Funzioni Avanzate

#### Template Ricorrenti
Crea template per spese/entrate mensili automatiche:

1. **Finanze** → **Template**
2. **Nuovo Template**
3. Esempio:
   - Tipo: Spesa
   - Descrizione: "Affitto"
   - Importo: 800
   - Categoria: "Casa"
   - Frequenza: Mensile
   - Giorno: 1
4. **Crea Template**

Ogni mese il giorno 1, apparirà un banner per inserire rapidamente la transazione.

#### Reminder
Imposta promemoria per non dimenticare scadenze:

1. **Reminder** → **Nuovo Reminder**
2. Titolo: "Pagare assicurazione"
3. Data: 2025-11-15
4. Importo: 450
5. **Crea**

Il reminder apparirà in evidenza quando la scadenza si avvicina.

---

## 📊 Dashboard Analytics

### Metriche Principali
- **Cash Flow Netto**: Differenza tra entrate e spese
- **Tasso di Risparmio**: (Entrate - Spese) / Entrate × 100
- **Runway**: Mesi di autonomia con spese attuali
- **Top Categoria**: Categoria con più spese del mese

### Grafico Andamento
Visualizza l'andamento degli ultimi 6 mesi con 4 linee:
- 💰 **Entrate** (verde)
- 💸 **Spese** (rosso)
- 🏦 **Movimenti Fondi** (blu tratteggiato)
- 💵 **Cash Flow** (viola con area riempita)

---

## 🔒 Sicurezza e Privacy

### Best Practices
- ✅ **Autenticazione** obbligatoria per ogni operazione
- ✅ **Regole Firestore** per proteggere i dati
- ✅ **HTTPS** obbligatorio per PWA
- ⚠️ **Admin Password**: la collezione `admin_users` salva password in chiaro - **solo per uso familiare**

### Raccomandazioni
- Non condividere le credenziali Firebase pubblicamente
- Implementa regole Firestore più restrittive per produzione
- Per uso non familiare, rimuovi il pannello Admin o cripta le password

---

## 🌐 PWA e Offline

### Funzionalità Offline
- ✅ L'app continua a funzionare senza connessione
- ✅ Service Worker cachea automaticamente risorse statiche
- ✅ Firebase Firestore sincronizza quando torna online
- ✅ Installabile su dispositivi mobili e desktop

### Installazione
1. Apri l'app nel browser
2. Chrome/Edge: clicca l'icona "Installa" nella barra degli indirizzi
3. Safari iOS: Condividi → Aggiungi a Home
4. L'app apparirà come app nativa

### Cache Management
Per svuotare la cache dopo aggiornamenti importanti:
1. Incrementa `CACHE_NAME` in `sw.js`
2. Oppure: DevTools → Application → Clear storage

---

## 🐛 Troubleshooting

### Problema: L'app non carica
**Soluzione**: 
- Verifica connessione internet
- Controlla console browser (F12) per errori
- Svuota cache e ricarica

### Problema: Le transazioni non si salvano
**Soluzione**:
- Verifica di essere autenticato
- Controlla regole Firestore
- Verifica configurazione Firebase in `firebase-config.js`

### Problema: Conti non visualizzati
**Soluzione**:
- I conti devono avere `tipoContenitore: 'conto'`
- Verifica che non siano archiviati (`archiviato: false`)

### Problema: Trasferimenti sbilanciati
**Soluzione**:
- Non modificare manualmente transazioni con `transferGroupId`
- Elimina e ricrea il trasferimento se necessario

### Problema: Service Worker non funziona
**Soluzione**:
- PWA richiede HTTPS (eccetto localhost)
- Verifica registrazione SW in DevTools → Application

---

## 📝 Limitazioni e Note

### Limitazioni Tecniche
- **Dipendenza CDN**: l'app carica React/Babel/Tailwind da CDN pubblici
- **Admin Panel**: password in chiaro nella collezione `admin_users`
- **No Build Process**: tutto compilato runtime con Babel standalone
- **Safari iOS**: le notifiche push potrebbero non funzionare

### Note Operative
- I **fondi** non impattano il cash flow (sono accantonamenti)
- Le **transazioni con transferGroupId** sono atomiche e non vanno modificate singolarmente
- Le **categorie archiviate** restano visibili nelle transazioni storiche
- I **template scaduti** generano banner arancione per quick review

---

## 🚀 Roadmap Futura

### Funzionalità Pianificate
- [ ] **Export dati** in CSV/Excel
- [ ] **Budget mensili** per categoria
- [ ] **Grafici avanzati** con breakdown per categoria
- [ ] **Multi-valuta** con conversione automatica
- [ ] **Ricerche testuali** nelle transazioni
- [ ] **Tags personalizzabili** per transazioni
- [ ] **Allegati** (foto scontrini)
- [ ] **Obiettivi di risparmio** con tracking progressivo
- [ ] **Condivisione familiare** con ruoli e permessi

---

## 👥 Contributi

Questo progetto è stato sviluppato per uso personale/familiare. Se vuoi contribuire:

1. Fork il repository
2. Crea un branch per la tua feature
3. Commit delle modifiche
4. Push e apri una Pull Request

---

## 📄 Licenza

Progetto privato per uso personale. Non distribuire senza autorizzazione.

---

## 📧 Contatti

Per domande o supporto, contatta l'amministratore del progetto.

---

**Versione**: 2.0  
**Ultimo Aggiornamento**: Ottobre 2025  
**Made with ❤️ for family finance tracking**
