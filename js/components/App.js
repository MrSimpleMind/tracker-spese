function App() {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [view, setView] = React.useState('spese');
    const [spese, setSpese] = React.useState([]);
    const [categorie, setCategorie] = React.useState([]);
    const [reminders, setReminders] = React.useState([]);
    const [showAddSpesa, setShowAddSpesa] = React.useState(false);
    const [showAddCategoria, setShowAddCategoria] = React.useState(false);
    const [showAddReminder, setShowAddReminder] = React.useState(false);
    const [showGrafico, setShowGrafico] = React.useState(false);
    const [editingSpesa, setEditingSpesa] = React.useState(null);
    const [editingCategoria, setEditingCategoria] = React.useState(null);
    const [editingReminder, setEditingReminder] = React.useState(null);
    const [filtroCategoria, setFiltroCategoria] = React.useState('tutte');
    const [reminderScaduti, setReminderScaduti] = React.useState(0);

    // Auth listener
    React.useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // Listener Firestore - Spese
    React.useEffect(() => {
        if (!user) return;
        
        const unsubscribe = db.collection('spese')
            .orderBy('data', 'desc')
            .onSnapshot(snapshot => {
                const speseData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setSpese(speseData);
            });
        
        return unsubscribe;
    }, [user]);

    // Listener Firestore - Categorie
    React.useEffect(() => {
        if (!user) return;
        
        const unsubscribe = db.collection('categorie')
            .orderBy('nome')
            .onSnapshot(snapshot => {
                const categorieData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCategorie(categorieData);
            });
        
        return unsubscribe;
    }, [user]);

    // Listener Firestore - Reminder
    React.useEffect(() => {
        if (!user) return;
        
        const unsubscribe = db.collection('reminders')
            .orderBy('dataScadenza')
            .onSnapshot(snapshot => {
                const remindersData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setReminders(remindersData);
                
                const oggi = new Date().toISOString().split('T')[0];
                const scaduti = remindersData.filter(r => 
                    !r.completato && r.dataScadenza < oggi
                ).length;
                setReminderScaduti(scaduti);
                
                // FIX iOS: Controlla se le notifiche sono supportate (iOS Safari non le supporta)
                if (scaduti > 0 && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                    try {
                        new Notification('Tracker Spese', {
                            body: `Hai ${scaduti} reminder scaduti!`,
                            icon: '💰'
                        });
                    } catch (error) {
                        console.log('ℹ️ Notifiche non supportate su questo browser (normale per iOS)');
                    }
                }
            });
        
        return unsubscribe;
    }, [user]);

    // FIX iOS: Richiedi permesso notifiche solo se supportate
    React.useEffect(() => {
        if (user && typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission().catch(err => {
                console.log('ℹ️ Notifiche non supportate su questo browser (normale per iOS)');
            });
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Caricamento...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <LoginPage />;
    }

    return (
        <div className="min-h-screen pb-20">
            <div className="bg-blue-600 text-white p-3 sticky top-0 z-10 shadow-lg">
                <div className="flex justify-between items-center">
                    <span className="text-sm truncate flex-1 mr-2">{user.email}</span>
                    <button 
                        onClick={() => auth.signOut()}
                        className="bg-blue-700 px-4 py-2 rounded text-sm hover:bg-blue-800 whitespace-nowrap"
                    >
                        Esci
                    </button>
                </div>
            </div>

            {reminderScaduti > 0 && view !== 'reminder' && (
                <div className="bg-red-500 text-white p-3 text-center cursor-pointer hover:bg-red-600"
                     onClick={() => setView('reminder')}>
                    ⚠️ Hai {reminderScaduti} reminder scaduti! Clicca per visualizzarli
                </div>
            )}

            <div className="max-w-4xl mx-auto p-4">
                {view === 'spese' && (
                    <SpeseView 
                        spese={spese}
                        categorie={categorie}
                        filtroCategoria={filtroCategoria}
                        setFiltroCategoria={setFiltroCategoria}
                        showAddSpesa={showAddSpesa}
                        setShowAddSpesa={setShowAddSpesa}
                        showGrafico={showGrafico}
                        setShowGrafico={setShowGrafico}
                        editingSpesa={editingSpesa}
                        setEditingSpesa={setEditingSpesa}
                    />
                )}
                
                {view === 'categorie' && (
                    <CategorieView 
                        categorie={categorie}
                        showAddCategoria={showAddCategoria}
                        setShowAddCategoria={setShowAddCategoria}
                        editingCategoria={editingCategoria}
                        setEditingCategoria={setEditingCategoria}
                    />
                )}
                
                {view === 'reminder' && (
                    <ReminderView 
                        reminders={reminders}
                        showAddReminder={showAddReminder}
                        setShowAddReminder={setShowAddReminder}
                        editingReminder={editingReminder}
                        setEditingReminder={setEditingReminder}
                    />
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
                <div className="flex justify-around items-center p-2">
                    <button 
                        onClick={() => setView('spese')}
                        className={`flex flex-col items-center p-2 rounded flex-1 ${view === 'spese' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
                    >
                        <span className="text-2xl">💳</span>
                        <span className="text-xs mt-1">Spese</span>
                    </button>
                    
                    <button 
                        onClick={() => setView('categorie')}
                        className={`flex flex-col items-center p-2 rounded flex-1 ${view === 'categorie' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
                    >
                        <span className="text-2xl">📁</span>
                        <span className="text-xs mt-1">Categorie</span>
                    </button>
                    
                    <button 
                        onClick={() => setView('reminder')}
                        className={`flex flex-col items-center p-2 rounded flex-1 relative ${view === 'reminder' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
                    >
                        <span className="text-2xl">🔔</span>
                        <span className="text-xs mt-1">Reminder</span>
                        {reminderScaduti > 0 && (
                            <span className="absolute top-0 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center badge">
                                {reminderScaduti}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
