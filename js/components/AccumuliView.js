function AccumuliView({ transactions, categorie }) {
    const [showAddAccumulo, setShowAddAccumulo] = React.useState(false);
    const [showOperazione, setShowOperazione] = React.useState(null);
    const [editingAccumulo, setEditingAccumulo] = React.useState(null);
    const [showArchiviati, setShowArchiviati] = React.useState(false);

    // Filtra gli accumuli attivi e archiviati
    const accumuliAttivi = categorie.filter(cat => cat.isAccumulo && !cat.archiviato);
    const accumuliArchiviati = categorie.filter(cat => cat.isAccumulo && cat.archiviato);

    // Calcola il saldo di ogni accumulo
    const calcolaSaldoAccumulo = (categoriaId) => {
        const operazioni = transactions.filter(t => 
            t.tipo === 'accumulo' && t.categoria === categoriaId
        );
        
        const versamenti = operazioni
            .filter(t => t.tipoOperazioneAccumulo === 'versamento')
            .reduce((acc, t) => acc + parseFloat(t.importo), 0);
        
        const prelievi = operazioni
            .filter(t => t.tipoOperazioneAccumulo === 'prelievo')
            .reduce((acc, t) => acc + parseFloat(t.importo), 0);
        
        return {
            saldo: versamenti - prelievi,
            versamenti,
            prelievi,
            numeroOperazioni: operazioni.length
        };
    };

    const archiviaAccumulo = async (id, nome) => {
        if (!confirm(`Vuoi archiviare l'accumulo "${nome}"? Verrà nascosto dall'interfaccia ma tutti i dati rimarranno salvati e potrai ripristinarlo in futuro.`)) {
            return;
        }
        
        await db.collection('categorie').doc(id).update({
            archiviato: true,
            dataArchiviazione: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    };

    const eliminaAccumuloDefinitivamente = async (id, nome) => {
        if (!confirm(`⚠️ ATTENZIONE: Vuoi eliminare DEFINITIVAMENTE l'accumulo "${nome}"? Questa azione NON può essere annullata. Le transazioni registrate rimarranno visibili in "Finanze" per lo storico.`)) {
            return;
        }
        
        if (!confirm(`Sei ASSOLUTAMENTE SICURO di voler eliminare definitivamente "${nome}"?`)) {
            return;
        }
        
        await db.collection('categorie').doc(id).delete();
    };

    const ripristinaAccumulo = async (id, nome) => {
        if (!confirm(`Vuoi ripristinare l'accumulo "${nome}"? Tornerà visibile tra gli accumuli attivi.`)) {
            return;
        }
        
        await db.collection('categorie').doc(id).update({
            archiviato: false,
            dataArchiviazione: null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    };

    // Calcolo totale accantonato
    const totaleAccantonato = accumuliAttivi.reduce((acc, a) => 
        acc + calcolaSaldoAccumulo(a.id).saldo, 0
    );

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">🏦 Accumuli</h2>
                        <p className="text-sm text-gray-600 mt-0.5">Gestisci i tuoi fondi accantonati</p>
                    </div>
                    {accumuliAttivi.length > 0 && (
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Totale</p>
                            <p className="text-xl font-bold text-blue-600">€{totaleAccantonato.toFixed(2)}</p>
                        </div>
                    )}
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                    <div className="flex items-start gap-2">
                        <span className="text-lg">💡</span>
                        <div className="text-xs text-blue-900">
                            <p className="font-semibold mb-0.5">Cosa sono gli Accumuli?</p>
                            <p>Fondi accantonati per obiettivi specifici. Le spese pagate da accumuli <strong>non impattano il cash flow</strong>.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pulsante nuovo accumulo */}
            <button
                onClick={() => setShowAddAccumulo(true)}
                className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-600 shadow-sm mb-4 flex items-center justify-center gap-2"
            >
                <span className="text-xl">➕</span>
                <span>Nuovo Accumulo</span>
            </button>

            {/* Lista Accumuli Attivi */}
            <div className="space-y-3">
                {accumuliAttivi.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-white rounded-lg border border-gray-200">
                        <p className="text-4xl mb-2">🏦</p>
                        <p className="font-medium">Nessun accumulo creato</p>
                        <p className="text-sm mt-1">Crea il primo accumulo per iniziare</p>
                    </div>
                ) : (
                    accumuliAttivi.map(accumulo => {
                        const { saldo, versamenti, prelievi, numeroOperazioni } = calcolaSaldoAccumulo(accumulo.id);
                        
                        return (
                            <div key={accumulo.id} className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500 overflow-hidden">
                                {/* Header */}
                                <div className="p-4 border-b border-gray-100">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-semibold text-gray-900 mb-0.5">{accumulo.nome}</h3>
                                            {accumulo.descrizione && (
                                                <p className="text-sm text-gray-600 line-clamp-2">{accumulo.descrizione}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setEditingAccumulo(accumulo)}
                                                className="text-gray-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50"
                                                title="Modifica"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => archiviaAccumulo(accumulo.id, accumulo.nome)}
                                                className="text-gray-400 hover:text-orange-600 p-1.5 rounded hover:bg-orange-50"
                                                title="Archivia"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => eliminaAccumuloDefinitivamente(accumulo.id, accumulo.nome)}
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
                                
                                {/* Pulsanti Azione */}
                                <div className="p-3 bg-gray-50 grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setShowOperazione({ ...accumulo, tipo: 'versamento' })}
                                        className="bg-green-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-green-700 text-sm flex items-center justify-center gap-1.5"
                                    >
                                        <span>➕</span>
                                        <span>Versa</span>
                                    </button>
                                    <button
                                        onClick={() => setShowOperazione({ ...accumulo, tipo: 'prelievo' })}
                                        className={`py-2 px-3 rounded-lg font-medium text-sm flex items-center justify-center gap-1.5 ${
                                            saldo <= 0 
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                                : 'bg-orange-600 text-white hover:bg-orange-700'
                                        }`}
                                        disabled={saldo <= 0}
                                    >
                                        <span>➖</span>
                                        <span>Preleva</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Sezione Accumuli Archiviati */}
            {accumuliArchiviati.length > 0 && (
                <div className="mt-4">
                    <button
                        onClick={() => setShowArchiviati(!showArchiviati)}
                        className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-between px-4 shadow-sm"
                    >
                        <span className="flex items-center gap-2">
                            <span>📦</span>
                            <span>Accumuli Archiviati ({accumuliArchiviati.length})</span>
                        </span>
                        <svg className={`w-4 h-4 transition-transform ${showArchiviati ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    
                    {showArchiviati && (
                        <div className="space-y-3 mt-3">
                            {accumuliArchiviati.map(accumulo => {
                                const { saldo, versamenti, prelievi, numeroOperazioni } = calcolaSaldoAccumulo(accumulo.id);
                                
                                return (
                                    <div key={accumulo.id} className="bg-white rounded-lg shadow-sm border-l-4 border-gray-400 opacity-75">
                                        <div className="p-4 border-b border-gray-100">
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-base font-semibold text-gray-700">{accumulo.nome}</h3>
                                                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">Archiviato</span>
                                                    </div>
                                                    {accumulo.descrizione && (
                                                        <p className="text-sm text-gray-500">{accumulo.descrizione}</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => ripristinaAccumulo(accumulo.id, accumulo.nome)}
                                                        className="text-gray-400 hover:text-green-600 p-1.5 rounded hover:bg-green-50"
                                                        title="Ripristina"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => eliminaAccumuloDefinitivamente(accumulo.id, accumulo.nome)}
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

            {/* Modali */}
            {showAddAccumulo && (
                <AddAccumuloModal 
                    onClose={() => setShowAddAccumulo(false)}
                />
            )}

            {showOperazione && (
                <OperazioneAccumuloModal 
                    accumulo={showOperazione}
                    onClose={() => setShowOperazione(null)}
                />
            )}

            {editingAccumulo && (
                <EditAccumuloModal 
                    accumulo={editingAccumulo}
                    onClose={() => setEditingAccumulo(null)}
                />
            )}
        </div>
    );
}
