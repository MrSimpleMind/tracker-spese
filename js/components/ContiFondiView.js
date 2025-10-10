function ContiFondiView({ transactions, categorie }) {
    const [tab, setTab] = React.useState('conti'); // 'conti' | 'fondi'
    const [editingConto, setEditingConto] = React.useState(null);
    const [editingFondo, setEditingFondo] = React.useState(null);
    const [showArchiviatiConti, setShowArchiviatiConti] = React.useState(false);
    const [showArchiviatiFondi, setShowArchiviatiFondi] = React.useState(false);
    const [showAddConto, setShowAddConto] = React.useState(false);
    const [showAddFondo, setShowAddFondo] = React.useState(false);
    const [contoLedger, setContoLedger] = React.useState(null);
    const [fondoLedger, setFondoLedger] = React.useState(null);

    // Filtra i conti attivi e archiviati
    const contiAttivi = categorie.filter(cat => cat.tipoContenitore === 'conto' && !cat.archiviato);
    const contiArchiviati = categorie.filter(cat => cat.tipoContenitore === 'conto' && cat.archiviato);
    
    // Filtra i fondi attivi e archiviati (retrocompatibilità con isAccumulo)
    const fondiAttivi = categorie.filter(cat => 
        (cat.tipoContenitore === 'fondo' || cat.isAccumulo) && !cat.archiviato
    );
    const fondiArchiviati = categorie.filter(cat => 
        (cat.tipoContenitore === 'fondo' || cat.isAccumulo) && cat.archiviato
    );

    // Calcola il saldo di un conto (basato su entrate/spese con contoId)
    const calcolaSaldoConto = (contoId) => {
        const operazioni = transactions.filter(t => t.contoId === contoId);
        
        const entrate = operazioni
            .filter(t => t.tipo === 'entrata')
            .reduce((acc, t) => acc + parseFloat(t.importo), 0);
        
        const spese = operazioni
            .filter(t => t.tipo === 'spesa')
            .reduce((acc, t) => acc + parseFloat(t.importo), 0);
        
        // Movimenti fondo associati a questo conto
        const movimentiFondo = operazioni.filter(t => t.tipo === 'movimento_fondo');
        const versamentiFondo = movimentiFondo
            .filter(t => (t.tipoMovimentoFondo || t.tipoOperazioneAccumulo) === 'versamento')
            .reduce((acc, t) => acc + parseFloat(t.importo), 0);
        const preleviFondo = movimentiFondo
            .filter(t => (t.tipoMovimentoFondo || t.tipoOperazioneAccumulo) === 'prelievo')
            .reduce((acc, t) => acc + parseFloat(t.importo), 0);
        
        return {
            saldo: entrate - spese - versamentiFondo + preleviFondo,
            entrate,
            spese,
            versamentiFondo,
            preleviFondo,
            numeroOperazioni: operazioni.length,
            operazioni
        };
    };

    const archiviaConto = async (id, nome) => {
        if (!confirm(`Vuoi archiviare il conto "${nome}"? Verrà nascosto dall'interfaccia ma tutti i dati rimarranno salvati.`)) {
            return;
        }
        await db.collection('categorie').doc(id).update({
            archiviato: true,
            dataArchiviazione: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    };

    const eliminaContoDefinitivamente = async (id, nome) => {
        const { numeroOperazioni } = calcolaSaldoConto(id);
        
        if (numeroOperazioni > 0) {
            alert(`⚠️ Questo conto ha ${numeroOperazioni} transazioni registrate. Non puoi eliminarlo. Archivialo invece.`);
            return;
        }
        
        if (!confirm(`⚠️ ATTENZIONE: Vuoi eliminare DEFINITIVAMENTE il conto "${nome}"? Questa azione NON può essere annullata.`)) {
            return;
        }
        
        await db.collection('categorie').doc(id).delete();
    };

    const ripristinaConto = async (id, nome) => {
        if (!confirm(`Vuoi ripristinare il conto "${nome}"? Tornerà visibile tra i conti attivi.`)) {
            return;
        }
        await db.collection('categorie').doc(id).update({
            archiviato: false,
            dataArchiviazione: null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    };

    // Calcola il saldo di ogni fondo
    const calcolaSaldoFondo = (categoriaId) => {
        const operazioni = transactions.filter(t => 
            (t.tipo === 'accumulo' || t.tipo === 'movimento_fondo') && 
            (t.categoria === categoriaId || t.fondoId === categoriaId)
        );
        
        const versamenti = operazioni
            .filter(t => {
                const tipoOp = t.tipoMovimentoFondo || t.tipoOperazioneAccumulo;
                return tipoOp === 'versamento';
            })
            .reduce((acc, t) => acc + parseFloat(t.importo), 0);
        
        const prelievi = operazioni
            .filter(t => {
                const tipoOp = t.tipoMovimentoFondo || t.tipoOperazioneAccumulo;
                return tipoOp === 'prelievo';
            })
            .reduce((acc, t) => acc + parseFloat(t.importo), 0);
        
        return {
            saldo: versamenti - prelievi,
            versamenti,
            prelievi,
            numeroOperazioni: operazioni.length,
            operazioni
        };
    };

    const archiviaFondo = async (id, nome) => {
        if (!confirm(`Vuoi archiviare il fondo "${nome}"? Verrà nascosto dall'interfaccia ma tutti i dati rimarranno salvati.`)) {
            return;
        }
        
        await db.collection('categorie').doc(id).update({
            archiviato: true,
            dataArchiviazione: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    };

    const eliminaFondoDefinitivamente = async (id, nome) => {
        const { numeroOperazioni } = calcolaSaldoFondo(id);
        
        if (numeroOperazioni > 0) {
            alert(`⚠️ Questo fondo ha ${numeroOperazioni} operazioni registrate. Non puoi eliminarlo. Archivialo invece.`);
            return;
        }
        
        if (!confirm(`⚠️ ATTENZIONE: Vuoi eliminare DEFINITIVAMENTE il fondo "${nome}"? Questa azione NON può essere annullata.`)) {
            return;
        }
        
        await db.collection('categorie').doc(id).delete();
    };

    const ripristinaFondo = async (id, nome) => {
        if (!confirm(`Vuoi ripristinare il fondo "${nome}"? Tornerà visibile tra i fondi attivi.`)) {
            return;
        }
        
        await db.collection('categorie').doc(id).update({
            archiviato: false,
            dataArchiviazione: null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    };

    // Calcolo totale sui conti
    const totaleConti = contiAttivi.reduce((acc, c) => 
        acc + calcolaSaldoConto(c.id).saldo, 0
    );

    // Calcolo totale accantonato nei fondi
    const totaleFondi = fondiAttivi.reduce((acc, f) => 
        acc + calcolaSaldoFondo(f.id).saldo, 0
    );

    // Patrimonio totale
    const patrimonioTotale = totaleConti + totaleFondi;

    return (
        <div className="fade-in">
            {/* Header con Tab e Totale Patrimonio */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 overflow-hidden">
                {/* Tab Switcher */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setTab('conti')}
                        className={`flex-1 py-3 px-4 font-medium text-sm transition flex items-center justify-center gap-2 ${
                            tab === 'conti'
                                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <span>💳</span>
                        <span>Conti</span>
                        {contiAttivi.length > 0 && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                {contiAttivi.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setTab('fondi')}
                        className={`flex-1 py-3 px-4 font-medium text-sm transition flex items-center justify-center gap-2 ${
                            tab === 'fondi'
                                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <span>🏦</span>
                        <span>Fondi</span>
                        {fondiAttivi.length > 0 && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                {fondiAttivi.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Riepilogo Patrimonio */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">💰 Patrimonio Totale</p>
                    <p className="text-3xl font-bold text-blue-600 mb-2">€{patrimonioTotale.toFixed(2)}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-xs text-gray-500">💳 In Conti</p>
                            <p className="font-semibold text-gray-700">€{totaleConti.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">🏦 In Fondi</p>
                            <p className="font-semibold text-gray-700">€{totaleFondi.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenuto Tab CONTI */}
            {tab === 'conti' && (
                <div>
                    {/* Info Box Conti */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mb-4">
                        <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-xs text-blue-900">
                                <p className="font-semibold mb-0.5">Cosa sono i Conti?</p>
                                <p>I conti rappresentano dove sono fisicamente i tuoi soldi (es: Conto Corrente, Contanti, Postepay). Ogni entrata e spesa è collegata a un conto specifico.</p>
                            </div>
                        </div>
                    </div>

                    {/* Pulsante nuovo conto */}
                    <button
                        onClick={() => setShowAddConto(true)}
                        className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-600 shadow-sm mb-4 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Nuovo Conto</span>
                    </button>

                    {/* Lista Conti Attivi */}
                    <div className="space-y-3">
                        {contiAttivi.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 bg-white rounded-lg border border-gray-200">
                                <svg className="w-16 h-16 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                <p className="font-medium">Nessun conto creato</p>
                                <p className="text-sm mt-1">Crea il primo conto per iniziare</p>
                            </div>
                        ) : (
                            contiAttivi.map(conto => {
                                const { saldo, entrate, spese, versamentiFondo, preleviFondo, numeroOperazioni, operazioni } = calcolaSaldoConto(conto.id);
                                
                                return (
                                    <div key={conto.id} className="bg-white rounded-lg shadow-sm border-l-4 border-green-500 overflow-hidden">
                                        {/* Header */}
                                        <div className="p-4 border-b border-gray-100">
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-2xl">{conto.emoji || '💳'}</span>
                                                        <h3 className="text-base font-semibold text-gray-900">{conto.nome}</h3>
                                                    </div>
                                                    {conto.descrizione && (
                                                        <p className="text-sm text-gray-600 line-clamp-2">{conto.descrizione}</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => setEditingConto(conto)}
                                                        className="text-gray-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50"
                                                        title="Modifica conto"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => archiviaConto(conto.id, conto.nome)}
                                                        className="text-gray-400 hover:text-orange-600 p-1.5 rounded hover:bg-orange-50"
                                                        title="Archivia conto"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => eliminaContoDefinitivamente(conto.id, conto.nome)}
                                                        className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"
                                                        title="Elimina definitivamente"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Saldo Principale */}
                                        <div className="p-4 bg-green-50">
                                            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Saldo Attuale</p>
                                            <p className={`text-3xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                €{saldo.toFixed(2)}
                                            </p>
                                        </div>
                                        
                                        {/* Statistiche */}
                                        <div className="grid grid-cols-2 gap-3 p-4 border-b border-gray-100">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-0.5">Entrate</p>
                                                <p className="text-sm font-semibold text-green-600">+€{entrate.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-0.5">Spese</p>
                                                <p className="text-sm font-semibold text-red-600">-€{spese.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        {/* Movimenti Fondo */}
                                        {(versamentiFondo > 0 || preleviFondo > 0) && (
                                            <div className="grid grid-cols-2 gap-3 p-4 border-b border-gray-100 bg-blue-50">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-0.5">🏦 Vers. Fondi</p>
                                                    <p className="text-sm font-semibold text-orange-600">-€{versamentiFondo.toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-0.5">🏦 Prel. Fondi</p>
                                                    <p className="text-sm font-semibold text-green-600">+€{preleviFondo.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Pulsante Ledger */}
                                        <div className="p-3 bg-gray-50">
                                            <button
                                                onClick={() => setContoLedger(conto)}
                                                className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-lg font-medium hover:bg-gray-100 text-sm flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span>Mostra Transazioni ({numeroOperazioni})</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Sezione Conti Archiviati */}
                    {contiArchiviati.length > 0 && (
                        <div className="mt-4">
                            <button
                                onClick={() => setShowArchiviatiConti(!showArchiviatiConti)}
                                className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-between px-4 shadow-sm"
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                    <span>Conti Archiviati ({contiArchiviati.length})</span>
                                </span>
                                <svg className={`w-4 h-4 transition-transform ${showArchiviatiConti ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {showArchiviatiConti && (
                                <div className="space-y-3 mt-3">
                                    {contiArchiviati.map(conto => {
                                        const { saldo, numeroOperazioni } = calcolaSaldoConto(conto.id);
                                        
                                        return (
                                            <div key={conto.id} className="bg-white rounded-lg shadow-sm border-l-4 border-gray-400 opacity-75 p-4">
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xl">{conto.emoji || '💳'}</span>
                                                            <h3 className="text-base font-semibold text-gray-700">{conto.nome}</h3>
                                                            <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">Archiviato</span>
                                                        </div>
                                                        <p className="text-sm text-gray-500">Saldo finale: €{saldo.toFixed(2)} • {numeroOperazioni} transazioni</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => ripristinaConto(conto.id, conto.nome)}
                                                            className="text-gray-400 hover:text-green-600 p-1.5 rounded hover:bg-green-50"
                                                            title="Ripristina"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => eliminaContoDefinitivamente(conto.id, conto.nome)}
                                                            className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"
                                                            title="Elimina definitivamente"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Contenuto Tab FONDI */}
            {tab === 'fondi' && (
                <div>
                    {/* Info Box Fondi */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mb-4">
                        <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-xs text-blue-900">
                                <p className="font-semibold mb-0.5">Cosa sono i Fondi?</p>
                                <p>Fondi accantonati per obiettivi specifici. I movimenti dei fondi <strong>non impattano il cash flow</strong>. Per creare/modificare transazioni dei fondi, vai alla pagina <strong>Finanze</strong>.</p>
                            </div>
                        </div>
                    </div>

                    {/* Pulsante nuovo fondo */}
                    <button
                        onClick={() => setShowAddFondo(true)}
                        className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-600 shadow-sm mb-4 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Nuovo Fondo</span>
                    </button>

                    {/* Lista Fondi Attivi */}
                    <div className="space-y-3">
                        {fondiAttivi.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 bg-white rounded-lg border border-gray-200">
                                <svg className="w-16 h-16 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <p className="font-medium">Nessun fondo creato</p>
                                <p className="text-sm mt-1">Crea il primo fondo per iniziare</p>
                            </div>
                        ) : (
                            fondiAttivi.map(fondo => {
                                const { saldo, versamenti, prelievi, numeroOperazioni, operazioni } = calcolaSaldoFondo(fondo.id);
                                
                                return (
                                    <div key={fondo.id} className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500 overflow-hidden">
                                        {/* Header */}
                                        <div className="p-4 border-b border-gray-100">
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-base font-semibold text-gray-900 mb-0.5">{fondo.nome}</h3>
                                                    {fondo.descrizione && (
                                                        <p className="text-sm text-gray-600 line-clamp-2">{fondo.descrizione}</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => setEditingFondo(fondo)}
                                                        className="text-gray-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50"
                                                        title="Modifica fondo"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => archiviaFondo(fondo.id, fondo.nome)}
                                                        className="text-gray-400 hover:text-orange-600 p-1.5 rounded hover:bg-orange-50"
                                                        title="Archivia fondo"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => eliminaFondoDefinitivamente(fondo.id, fondo.nome)}
                                                        className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"
                                                        title="Elimina definitivamente"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Saldo Principale */}
                                        <div className="p-4 bg-blue-50">
                                            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Saldo Attuale</p>
                                            <p className="text-3xl font-bold text-blue-600">€{saldo.toFixed(2)}</p>
                                        </div>
                                        
                                        {/* Statistiche */}
                                        <div className="grid grid-cols-3 gap-3 p-4 border-b border-gray-100">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-0.5">Versamenti</p>
                                                <p className="text-sm font-semibold text-green-600">+€{versamenti.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-0.5">Prelievi</p>
                                                <p className="text-sm font-semibold text-red-600">-€{prelievi.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-0.5">Operazioni</p>
                                                <p className="text-sm font-semibold text-gray-700">{numeroOperazioni}</p>
                                            </div>
                                        </div>
                                        
                                        {/* Pulsante Ledger */}
                                        <div className="p-3 bg-gray-50">
                                            <button
                                                onClick={() => setFondoLedger(fondo)}
                                                className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-lg font-medium hover:bg-gray-100 text-sm flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span>Mostra Movimenti</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Sezione Fondi Archiviati */}
                    {fondiArchiviati.length > 0 && (
                        <div className="mt-4">
                            <button
                                onClick={() => setShowArchiviatiFondi(!showArchiviatiFondi)}
                                className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-between px-4 shadow-sm"
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                    <span>Fondi Archiviati ({fondiArchiviati.length})</span>
                                </span>
                                <svg className={`w-4 h-4 transition-transform ${showArchiviatiFondi ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {showArchiviatiFondi && (
                                <div className="space-y-3 mt-3">
                                    {fondiArchiviati.map(fondo => {
                                        const { saldo, versamenti, prelievi, numeroOperazioni } = calcolaSaldoFondo(fondo.id);
                                        
                                        return (
                                            <div key={fondo.id} className="bg-white rounded-lg shadow-sm border-l-4 border-gray-400 opacity-75">
                                                <div className="p-4 border-b border-gray-100">
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="text-base font-semibold text-gray-700">{fondo.nome}</h3>
                                                                <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">Archiviato</span>
                                                            </div>
                                                            {fondo.descrizione && (
                                                                <p className="text-sm text-gray-500">{fondo.descrizione}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => ripristinaFondo(fondo.id, fondo.nome)}
                                                                className="text-gray-400 hover:text-green-600 p-1.5 rounded hover:bg-green-50"
                                                                title="Ripristina"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => eliminaFondoDefinitivamente(fondo.id, fondo.nome)}
                                                                className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"
                                                                title="Elimina definitivamente"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="p-4 bg-gray-50">
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Saldo Finale</p>
                                                    <p className="text-2xl font-bold text-gray-600">€{saldo.toFixed(2)}</p>
                                                </div>
                                                
                                                <div className="grid grid-cols-3 gap-3 p-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-0.5">Versamenti</p>
                                                        <p className="text-sm font-semibold text-gray-600">€{versamenti.toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-0.5">Prelievi</p>
                                                        <p className="text-sm font-semibold text-gray-600">€{prelievi.toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-0.5">Operazioni</p>
                                                        <p className="text-sm font-semibold text-gray-600">{numeroOperazioni}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Modale Ledger Conto */}
            {contoLedger && (
                <LedgerContoModal
                    conto={contoLedger}
                    transactions={calcolaSaldoConto(contoLedger.id).operazioni}
                    onClose={() => setContoLedger(null)}
                />
            )}

            {/* Modale Ledger Fondo */}
            {fondoLedger && (
                <LedgerFondoModal
                    fondo={fondoLedger}
                    transactions={calcolaSaldoFondo(fondoLedger.id).operazioni}
                    onClose={() => setFondoLedger(null)}
                />
            )}

            {/* Modali CRUD Conti */}
            {showAddConto && (
                <AddContoModal 
                    onClose={() => setShowAddConto(false)}
                />
            )}

            {editingConto && (
                <EditContoModal 
                    conto={editingConto}
                    onClose={() => setEditingConto(null)}
                />
            )}

            {/* Modali CRUD Fondi */}
            {showAddFondo && (
                <AddAccumuloModal 
                    onClose={() => setShowAddFondo(false)}
                />
            )}

            {editingFondo && (
                <EditAccumuloModal 
                    accumulo={editingFondo}
                    onClose={() => setEditingFondo(null)}
                />
            )}
        </div>
    );
}

// Modale Ledger Conto (in sola lettura)
function LedgerContoModal({ conto, transactions, onClose }) {
    // Ordina per data (più recente prima)
    const transactionsOrdinate = [...transactions].sort((a, b) => 
        new Date(b.data) - new Date(a.data)
    );

    const tipoConfig = {
        spesa: { label: 'Spesa', icon: '💸', color: 'text-red-600', borderColor: 'border-red-500' },
        entrata: { label: 'Entrata', icon: '💰', color: 'text-green-600', borderColor: 'border-green-500' },
        movimento_fondo: { label: 'Movimento Fondo', icon: '🏦', color: 'text-blue-600', borderColor: 'border-blue-500' }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
            <div 
                className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-green-500 text-white p-4 border-b border-green-600 rounded-t-2xl">
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <h3 className="text-xl font-bold">📋 Transazioni del Conto</h3>
                            <p className="text-sm opacity-90 mt-0.5">{conto.emoji} {conto.nome}</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-green-50 border-b border-green-100">
                    <p className="text-xs text-green-900">
                        <strong>💡 Visualizzazione in sola lettura</strong> - Per modificare o creare transazioni, vai alla pagina <strong>Finanze</strong>.
                    </p>
                </div>

                {/* Lista transazioni */}
                <div className="p-4">
                    {transactionsOrdinate.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <p className="text-4xl mb-2">📭</p>
                            <p>Nessuna transazione registrata</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {transactionsOrdinate.map(transaction => {
                                const config = tipoConfig[transaction.tipo] || tipoConfig.spesa;
                                
                                return (
                                    <div 
                                        key={transaction.id} 
                                        className={`bg-white rounded-lg p-3 shadow-sm border-l-4 ${config.borderColor}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                                                        {config.icon} {config.label}
                                                    </span>
                                                    {transaction.tipo === 'movimento_fondo' && (
                                                        <span className="text-xs text-gray-500">
                                                            {(transaction.tipoMovimentoFondo || transaction.tipoOperazioneAccumulo) === 'versamento' 
                                                                ? '➕ Versamento' 
                                                                : '➖ Prelievo'}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-medium text-gray-900">{transaction.descrizione}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {new Date(transaction.data).toLocaleDateString('it-IT', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })} • {transaction.categoria}
                                                </p>
                                            </div>
                                            <p className={`text-lg font-bold whitespace-nowrap ${config.color}`}>
                                                {transaction.tipo === 'entrata' ? '+' : '-'}€{parseFloat(transaction.importo).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
}

// Modale Ledger Fondo (in sola lettura)
function LedgerFondoModal({ fondo, transactions, onClose }) {
    // Ordina per data (più recente prima)
    const transactionsOrdinate = [...transactions].sort((a, b) => 
        new Date(b.data) - new Date(a.data)
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
            <div 
                className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-blue-500 text-white p-4 border-b border-blue-600 rounded-t-2xl">
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <h3 className="text-xl font-bold">📋 Movimenti del Fondo</h3>
                            <p className="text-sm opacity-90 mt-0.5">{fondo.nome}</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border-b border-blue-100">
                    <p className="text-xs text-blue-900">
                        <strong>💡 Visualizzazione in sola lettura</strong> - Per modificare o creare movimenti, vai alla pagina <strong>Finanze</strong> e usa "Movimento Fondo".
                    </p>
                </div>

                {/* Lista transazioni */}
                <div className="p-4">
                    {transactionsOrdinate.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <p className="text-4xl mb-2">📭</p>
                            <p>Nessun movimento registrato</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {transactionsOrdinate.map(transaction => {
                                const tipoMovimento = transaction.tipoMovimentoFondo || transaction.tipoOperazioneAccumulo || 'versamento';
                                const isVersamento = tipoMovimento === 'versamento';
                                const isTrasferimento = transaction.transferGroupId;
                                
                                return (
                                    <div 
                                        key={transaction.id} 
                                        className={`bg-white rounded-lg p-3 shadow-sm border-l-4 ${
                                            isVersamento ? 'border-green-500' : 'border-orange-500'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                                        isVersamento ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                                                    }`}>
                                                        {isVersamento ? '➕ Versamento' : '➖ Prelievo'}
                                                    </span>
                                                    {isTrasferimento && (
                                                        <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">
                                                            🔄 Trasferimento
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-medium text-gray-900">{transaction.descrizione}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {new Date(transaction.data).toLocaleDateString('it-IT', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <p className={`text-lg font-bold whitespace-nowrap ${
                                                isVersamento ? 'text-green-600' : 'text-orange-600'
                                            }`}>
                                                {isVersamento ? '+' : '-'}€{parseFloat(transaction.importo).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
}
