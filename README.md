# Tracker Spese Famiglia

App per tracciare spese familiari - Versione refactorizzata e ottimizzata per iOS/Safari

## 🎯 Novità Versione 2.0

- ✅ **Codice organizzato**: File separati per componenti e modali
- ✅ **Fix iOS/Safari**: Risolto problema schermata bianca dopo login
- ✅ **Più manutenibile**: Ogni componente ha il suo file
- ✅ **Performance migliorate**: Caricamento più veloce

## 📁 Struttura Progetto

```
tracker-spese/
├── index.html              # Pagina principale (pulita e organizzata)
├── manifest.json           # Configurazione PWA
├── sw.js                   # Service Worker
├── icon-192.png           # Icona app
├── icon-512.png           # Icona app
└── js/
    ├── firebase-config.js  # Configurazione Firebase + fix iOS
    ├── components/         # Componenti React
    │   ├── App.js         # Componente principale
    │   ├── LoginPage.js   # Pagina login/registrazione
    │   ├── SpeseView.js   # Vista spese
    │   ├── CategorieView.js # Vista categorie
    │   └── ReminderView.js  # Vista reminder
    └── modals/            # Modali
        ├── AddSpesaModal.js
        ├── EditSpesaModal.js
        ├── GraficoAndamentoModal.js
        ├── AddCategoriaModal.js
        ├── EditCategoriaModal.js
        ├── AddReminderModal.js
        └── EditReminderModal.js
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

## 📝 Note Tecniche

- **Framework**: React 18 (inline con Babel)
- **Backend**: Firebase (Auth + Firestore)
- **Styling**: Tailwind CSS
- **Grafici**: Chart.js
- **PWA**: Manifest + Service Worker

## 🔄 Backup

Il file originale è stato salvato come `index.html.backup`
