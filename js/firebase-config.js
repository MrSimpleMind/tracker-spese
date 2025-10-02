// Configurazione Firebase con fix per iOS/Safari
const firebaseConfig = {
    apiKey: "AIzaSyAIDL3WgLSagcABDgXh3P0zlHq77lYTnpc",
    authDomain: "tracker-di-spese.firebaseapp.com",
    projectId: "tracker-di-spese",
    storageBucket: "tracker-di-spese.firebasestorage.app",
    messagingSenderId: "68753897947",
    appId: "1:68753897947:web:3699b0dde868c1457a4ffe"
};

// Inizializza Firebase
firebase.initializeApp(firebaseConfig);

// Istanze Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// FIX iOS: Imposta la persistenza locale per Safari
// Safari ha restrizioni più severe su storage e cookies
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
        console.log('✅ Persistenza auth configurata per iOS/Safari');
    })
    .catch((error) => {
        console.warn('⚠️ Errore configurazione persistenza:', error);
        // Non blocchiamo l'app, alcuni browser potrebbero non supportarlo
    });

// Registra Service Worker per PWA (gestisce errori su iOS)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/tracker-spese/sw.js')
            .then(reg => console.log('✅ Service Worker registrato'))
            .catch(err => console.log('ℹ️ Service Worker non registrato (normale su alcuni browser iOS):', err));
    });
}

// Debug utile per iOS
auth.onAuthStateChanged(user => {
    if (user) {
        console.log('✅ Utente autenticato:', user.email);
    } else {
        console.log('ℹ️ Nessun utente autenticato');
    }
});
