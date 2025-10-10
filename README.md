# Tracker Finanze Famiglia

## Panoramica
Tracker Finanze Famiglia e una Progressive Web App privata per tracciare entrate, spese, fondi accantonati e promemoria familiari. L'interfaccia e ottimizzata per dispositivi mobili, usa Firebase (Auth + Firestore) come backend e continua a funzionare offline tramite manifest e service worker.

## Stack principale
- React 18 e ReactDOM da CDN, compilati al volo con Babel standalone
- Tailwind CSS per lo stile e Chart.js per la reportistica
- Firebase Authentication e Firestore SDK compat
- Service worker con strategia network-first e manifest dedicato

## Navigazione e funzionalita
- **Autenticazione**: login email/password con persistenza locale; il pulsante Admin compare solo per `monzalcolica@gmail.com`.
- **Finanze**: lista unica delle transazioni con filtri multipli, ordinamenti, dettaglio, modifica, eliminazione e grafico andamento.
- **Template ricorrenti**: gestione di template mensili, bimestrali o annuali; quick review automatica quando `prossimaScadenza` e trascorsa.
- **Categorie**: creazione, modifica, archiviazione e ripristino; ogni categoria definisce i tipi supportati (`spesa`, `entrata`, `movimento_fondo`).
- **Fondi (accumuli)**: riepilogo saldi, statistiche, ledger in sola lettura e archiviazione dei fondi non piu usati.
- **Reminder**: promemoria con stato, importo stimato e badge per le scadenze; toggle completato con tracciamento della data.
- **Analytics**: indicatori di cash flow, tasso di risparmio, runway, top categoria spese e riepilogo grafico degli ultimi sei mesi.
- **Pannello Admin**: creazione rapida di account familiari con generatore di password e tracciamento locale (solo per uso interno).
- **PWA e notifiche**: installabile, registra un service worker e richiede le notifiche quando supportate; fallback e log per Safari/iOS.

## Flussi principali
1. **Inserire una transazione**: dal tab Finanze aprire "Aggiungi", selezionare il tipo (`spesa`, `entrata`, `movimento_fondo`). I trasferimenti tra fondi creano due scritture legate da `transferGroupId`.
2. **Gestire template scaduti**: il banner arancione apre la quick review per inserire o posticipare ogni template scaduto, aggiornando `prossimaScadenza`.
3. **Archiviare o ripristinare**: nelle viste Categorie e Fondi e possibile archiviare, ripristinare o (per fondi senza movimenti) eliminare definitivamente.
4. **Reminder**: i promemoria attivi sono ordinati per scadenza; la sezione "Completati" permette di riaprire o eliminare gli elementi gia gestiti.

## Struttura del progetto
```
tracker-spese/
  index.html
  manifest.json
  sw.js
  icon-192.png
  icon-512.png
  js/
    firebase-config.js
    components/
      App.js                # root app e listener Firestore
      LoginPage.js
      TransactionsView.js
      CategorieView.js
      AccumuliView.js
      ReminderView.js
      AnalyticsView.js
      AdminView.js
      modals/DettaglioTransazioneModal.js (legacy)
    modals/
      AddTransactionModal.js
      EditTransactionModal.js
      GraficoAndamentoModal.js
      AddCategoriaModal.js
      EditCategoriaModal.js
      AddAccumuloModal.js
      EditAccumuloModal.js
      OperazioneAccumuloModal.js
      AddReminderModal.js
      EditReminderModal.js
      TemplateRicorrentiModal.js
      AddTemplateModal.js
      EditTemplateModal.js
      DettaglioTemplateModal.js
      QuickReviewModal.js
      AddSpesaModal.js (legacy)
      EditSpesaModal.js (legacy)
```

## Configurazione iniziale
1. **Firebase**  
   - Creare un progetto, abilitare Authentication (email/password) e Firestore.  
   - Aggiornare le chiavi in `js/firebase-config.js`.  
   - Definire regole Firestore coerenti con le collezioni usate (transactions, categorie, template_ricorrenti, reminders, admin_users).
2. **Utenti**  
   - Creare almeno un account via console Firebase oppure con il pannello Admin.  
   - L'utente admin e determinato dal controllo email in `App.js`.

## Esecuzione locale
- Servire la cartella con un server statico (es. `python -m http.server 8000` o `npx serve`).  
- Aprire `http://localhost:8000/tracker-spese/`.  
- Per testare offline caricare l'app online una prima volta cosi il service worker popola la cache.

## Deploy
1. Pubblicare tutti i file su un hosting statico (GitHub Pages, Netlify, ecc.).  
2. Se il percorso di pubblicazione cambia, aggiornare `start_url` e `scope` in `manifest.json`, i riferimenti in `index.html` e la registrazione del service worker in `js/firebase-config.js`.  
3. Dopo un aggiornamento importante incrementare `CACHE_NAME` in `sw.js` o svuotare la cache del browser.

## Modello dati principale
- **transactions**
  ```
  {
    tipo: "spesa" | "entrata" | "movimento_fondo",
    descrizione: string,
    importo: number,
    categoria: string,
    data: "YYYY-MM-DD",
    nota?: string,
    tipoMovimentoFondo?: "versamento" | "prelievo",
    fondoId?: string,
    transferGroupId?: string,
    transferFrom?: string,
    transferTo?: string,
    isRicorrente?: boolean,
    templateId?: string,
    tipoOperazioneAccumulo?: string,  // compatibilita precedente
    nomeAccumulo?: string,            // compatibilita precedente
    userId: string,
    createdAt: timestamp,
    updatedAt?: timestamp
  }
  ```
- **categorie**
  ```
  {
    nome: string,
    descrizione?: string,
    applicabileA: string[],
    isAccumulo?: boolean,
    obiettivo?: number,
    archiviato?: boolean,
    dataArchiviazione?: timestamp,
    emoji?: string,
    createdAt: timestamp,
    updatedAt?: timestamp
  }
  ```
- **template_ricorrenti**
  ```
  {
    tipo: "spesa" | "entrata" | "movimento_fondo",
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
- **reminders**
  ```
  {
    titolo: string,
    descrizione?: string,
    dataScadenza: "YYYY-MM-DD",
    importoStimato?: number,
    completato: boolean,
    dataCompletamento?: timestamp,
    createdAt: timestamp,
    updatedAt?: timestamp
  }
  ```
- **admin_users** (supporto locale per il pannello admin)
  ```
  {
    email: string,
    password: string,
    createdBy: string,
    createdAt: timestamp
  }
  ```

## PWA e notifiche
- `firebase-config.js` registra il service worker e imposta la persistenza auth per Safari.
- `sw.js` applica una strategia network-first: le risposte valide vengono memorizzate in cache e sono riutilizzate offline.
- Le notifiche vengono richieste solo quando l'API `Notification` e disponibile; Safari iOS potrebbe ignorarle, sono gia presenti log diagnostici.

## Limitazioni e note operative
- La collezione `admin_users` memorizza le password in chiaro a scopo familiare: ripulirla periodicamente e non utilizzarla in ambienti esterni.
- I modali segnati come legacy restano per compatibilita con dati storici; la UI corrente usa le versioni in `js/modals`.
- L'app dipende da CDN pubblici; per un deploy completamente offline considerare un processo di build dedicato.
- Evitare di alterare l'ordine degli script in `index.html`: i componenti React sono caricati nel global scope.
