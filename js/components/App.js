function App() {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [view, setView] = React.useState('transactions');
    const [transactions, setTransactions] = React.useState([]);
    const [categorie, setCategorie] = React.useState([]);
    const [reminders, setReminders] = React.useState([]);
    const [showAddTransaction, setShowAddTransaction] = React.useState(false);
    const [showAddCategoria, setShowAddCategoria] = React.useState(false);
    const [showAddReminder, setShowAddReminder] = React.useState(false);
    const [showGrafico, setShowGrafico] = React.useState(false);
    const [editingTransaction, setEditingTransaction] = React.useState(null);
    const [editingCategoria, setEditingCategoria] = React.useState(null);
    const [editingReminder, setEditingReminder] = React.useState(null);
    const [filtroTipo, setFiltroTipo] = React.useState([]);
    const [filtroCategoria, setFiltroCategoria] = React.useState('tutte');
    const [reminderScaduti, setReminderScaduti] = React.useState(0);
    const [templatesScaduti, setTemplatesScaduti] = React.useState([]);
    const [showQuickReview, setShowQuickReview] = React.useState(false);

    // Auth listener
    React.useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // Listener Firestore - Transactions
    React.useEffect(() => {
        if (!user) return;
        
        const unsubscribe = db.collection('transactions')
            .orderBy('data', 'desc')
            .onSnapshot(snapshot => {
                const transactionsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTransactions(transactionsData);
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
                
                // FIX iOS: Controlla se le notifiche sono supportate
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

    // Listener Firestore - Template Ricorrenti
    React.useEffect(() => {
        if (!user) return;
        
        const unsubscribe = db.collection('template_ricorrenti')
            .where('userId', '==', user.uid)
            .where('attivo', '==', true)
            .onSnapshot(snapshot => {
                const templatesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                // Controlla quali template sono scaduti
                const oggi = new Date().toISOString().split('T')[0];
                const scaduti = templatesData.filter(t => t.prossimaScadenza <= oggi);
                setTemplatesScaduti(scaduti);
            });
        
        return unsubscribe;
    }, [user]);

    // Aggiorna il titolo della pagina in base alla view
    React.useEffect(() => {
        const titles = {
            'transactions': 'Finanze',
            'categorie': 'Categorie',
            'accumuli': 'Fondi',
            'reminder': 'Reminder',
            'analytics': 'Analytics',
            'admin': 'Admin'
        };
        document.title = `${titles[view] || 'Tracker Spese'} | Tracker Spese`;
    }, [view]);

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
                    <div className="flex gap-2">
                        {user.email === 'monzalcolica@gmail.com' && (
                            <button 
                                onClick={() => setView('admin')}
                                className={`px-4 py-2 rounded text-sm whitespace-nowrap flex items-center gap-1.5 ${view === 'admin' ? 'bg-blue-800' : 'bg-blue-700 hover:bg-blue-800'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span>Admin</span>
                            </button>
                        )}
                        <button 
                            onClick={() => auth.signOut()}
                            className="bg-blue-700 px-4 py-2 rounded text-sm hover:bg-blue-800 whitespace-nowrap"
                        >
                            Esci
                        </button>
                    </div>
                </div>
            </div>

            {reminderScaduti > 0 && view !== 'reminder' && (
                <div className="bg-red-500 text-white p-3 text-center cursor-pointer hover:bg-red-600 flex items-center justify-center gap-2"
                     onClick={() => setView('reminder')}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Hai {reminderScaduti} reminder scaduti! Clicca per visualizzarli</span>
                </div>
            )}

            {templatesScaduti.length > 0 && (
                <div className="bg-orange-500 text-white p-3 text-center cursor-pointer hover:bg-orange-600 flex items-center justify-center gap-2"
                     onClick={() => setShowQuickReview(true)}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Hai {templatesScaduti.length} transazioni ricorrenti da inserire! Clicca per gestirle</span>
                </div>
            )}

            <div className="max-w-4xl mx-auto p-4">
                {view === 'transactions' && (
                    <TransactionsView 
                        transactions={transactions}
                        categorie={categorie}
                        filtroTipo={filtroTipo}
                        setFiltroTipo={setFiltroTipo}
                        filtroCategoria={filtroCategoria}
                        setFiltroCategoria={setFiltroCategoria}
                        showAddTransaction={showAddTransaction}
                        setShowAddTransaction={setShowAddTransaction}
                        showGrafico={showGrafico}
                        setShowGrafico={setShowGrafico}
                        editingTransaction={editingTransaction}
                        setEditingTransaction={setEditingTransaction}
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
                
                {view === 'accumuli' && (
                    <AccumuliView 
                        transactions={transactions}
                        categorie={categorie}
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
                
                {view === 'analytics' && (
                    <AnalyticsView 
                        transactions={transactions}
                    />
                )}
                
                {view === 'admin' && (
                    <AdminView />
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
                <div className="flex justify-around items-center p-2">
                    <button 
                        onClick={() => setView('transactions')}
                        className={`flex flex-col items-center p-2 rounded flex-1 ${view === 'transactions' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="text-xs mt-1">Finanze</span>
                    </button>
                    
                    <button 
                        onClick={() => setView('categorie')}
                        className={`flex flex-col items-center p-2 rounded flex-1 ${view === 'categorie' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <span className="text-xs mt-1">Categorie</span>
                    </button>
                    
                    <button 
                        onClick={() => setView('accumuli')}
                        className={`flex flex-col items-center p-2 rounded flex-1 ${view === 'accumuli' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="text-xs mt-1">Fondi</span>
                    </button>
                    
                    <button 
                        onClick={() => setView('reminder')}
                        className={`flex flex-col items-center p-2 rounded flex-1 relative ${view === 'reminder' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="text-xs mt-1">Reminder</span>
                        {reminderScaduti > 0 && (
                            <span className="absolute top-0 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center badge">
                                {reminderScaduti}
                            </span>
                        )}
                    </button>
                    
                    <button 
                        onClick={() => setView('analytics')}
                        className={`flex flex-col items-center p-2 rounded flex-1 ${view === 'analytics' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-xs mt-1">Analytics</span>
                    </button>
                </div>
            </div>

            {showQuickReview && (
                <QuickReviewModal 
                    templates={templatesScaduti}
                    onClose={() => setShowQuickReview(false)}
                    categorie={categorie}
                />
            )}
        </div>
    );
}
