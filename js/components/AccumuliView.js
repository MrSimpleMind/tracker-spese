function AccumuliView({ transactions, categorie }) {
    const [editingFondo, setEditingFondo] = React.useState(null);
    const [showArchiviati, setShowArchiviati] = React.useState(false);
    const [showAddFondo, setShowAddFondo] = React.useState(false);
    const [fondoLedger, setFondoLedger] = React.useState(null); // Per mostrare il ledger

    // Filtra i fondi (ex accumuli) attivi e archiviati
    const fondiAttivi = categorie.filter(cat => cat.isAccumulo && !cat.archiviato);
    const fondiArchiviati = categorie.filter(cat => cat.isAccumulo && cat.archiviato);

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
        if (!confirm(`Vuoi archiviare il fondo "${nome}"? Verrà nascosto dall'interfaccia ma tutti i dati rimarranno salvati e potrai ripristinarlo in futuro.`)) {
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

    // Calcolo totale accantonato
    const totaleAccantonato = fondiAttivi.reduce((acc, f) => 
        acc + calcolaSaldoFondo(f.id).saldo, 0
    );

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Fondi</h2>
                            <p className="text-sm text-gray-600 mt-0.5">Gestisci i tuoi fondi accantonati</p>
                        </div>
                    </div>
                    {fondiAttivi.length > 0 && (
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Totale</p>
                            <p className="text-xl font-bold text-blue-600">€{totaleAccantonato.toFixed(2)}</p>
                        </div>
                    )}
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                    <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-xs text-blue-900">
                            <p className="font-semibold mb-0.5">Cosa sono i Fondi?</p>
                            <p>Fondi accantonati per obiettivi specifici. I movimenti dei fondi <strong>non impattano il cash flow</strong>. Per creare/modificare transazioni dei fondi, vai alla pagina <strong>Finanze</strong>.</p>
                        </div>
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
                        onClick={() => setShowArchiviati(!showArchiviati)}
                        className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-between px-4 shadow-sm"
                    >
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                            <span>Fondi Archiviati ({fondiArchiviati.length})</span>
                        </span>
                        <svg className={`w-4 h-4 transition-transform ${showArchiviati ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    
                    {showArchiviati && (
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

            {/* Modale Ledger */}
            {fondoLedger && (
                <LedgerFondoModal
                    fondo={fondoLedger}
                    transactions={calcolaSaldoFondo(fondoLedger.id).operazioni}
                    onClose={() => setFondoLedger(null)}
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
