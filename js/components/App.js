function App() {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [view, setView] = React.useState('spese');
    const [transactions, setTransactions] = React.useState([]);
    const [categorie, setCategorie] = React.useState([]);
    const [showAddTransaction, setShowAddTransaction] = React.useState(false);
    const [showAddCategoria, setShowAddCategoria] = React.useState(false);
    const [showGrafico, setShowGrafico] = React.useState(false);
    const [editingTransaction, setEditingTransaction] = React.useState(null);
    const [editingCategoria, setEditingCategoria] = React.useState(null);
    const [filtroCategoria, setFiltroCategoria] = React.useState('tutte');
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

    // Listener Firestore - Transactions (solo spese)
    React.useEffect(() => {
        if (!user) return;
        
        const unsubscribe = db.collection('transactions')
            .where('tipo', '==', 'spesa')
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
            .where('tipoContenitore', '==', null)
            .orderBy('nome')
            .onSnapshot(snapshot => {
                const categorieData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCategorie(categorieData.filter(c => !c.tipoContenitore && !c.isAccumulo));
            });
        
        return unsubscribe;
    }, [user]);

    // Listener Firestore - Template Ricorrenti
    React.useEffect(() => {
        if (!user) return;
        
        const unsubscribe = db.collection('template_ricorrenti')
            .where('userId', '==', user.uid)
            .where('attivo', '==', true)
            .where('tipo', '==', 'spesa')
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
            'spese': 'Spese',
            'categorie': 'Categorie',
            'analytics': 'Analytics'
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
                    <button 
                        onClick={() => auth.signOut()}
                        className="bg-blue-700 px-4 py-2 rounded text-sm hover:bg-blue-800 whitespace-nowrap"
                    >
                        Esci
                    </button>
                </div>
            </div>

            {templatesScaduti.length > 0 && (
                <div className="bg-orange-500 text-white p-3 text-center cursor-pointer hover:bg-orange-600 flex items-center justify-center gap-2"
                     onClick={() => setShowQuickReview(true)}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Hai {templatesScaduti.length} spese ricorrenti da inserire! Clicca per gestirle</span>
                </div>
            )}

            <div className="max-w-4xl mx-auto p-4">
                {view === 'spese' && (
                    <TransactionsView 
                        transactions={transactions}
                        categorie={categorie}
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
                
                {view === 'analytics' && (
                    <AnalyticsView 
                        transactions={transactions}
                    />
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
                <div className="flex justify-around items-center p-2">
                    <button 
                        onClick={() => setView('spese')}
                        className={`flex flex-col items-center p-2 rounded flex-1 ${view === 'spese' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="text-xs mt-1">Spese</span>
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
