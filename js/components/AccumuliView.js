function AccumuliView({ transactions, categorie }) {
    const [showAddAccumulo, setShowAddAccumulo] = React.useState(false);
    const [showOperazione, setShowOperazione] = React.useState(null); // Contiene l'accumulo selezionato
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
        
        // Doppia conferma per sicurezza
        if (!confirm(`Sei ASSOLUTAMENTE SICURO di voler eliminare definitivamente "${nome}"? Scrivi OK nella prossima finestra per confermare.`)) {
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

    return (
        <div className="fade-in">
            <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">🏦 Accumuli</h2>
                <p className="text-gray-600 text-sm">Gestisci i tuoi fondi accantonati</p>
            </div>

            {/* Info Box */}
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                    <span className="text-2xl mr-3">💡</span>
                    <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">Cosa sono gli Accumuli?</p>
                        <p>Gli accumuli sono fondi accantonati per obiettivi specifici (vacanze, emergenze, ecc.). Le spese pagate da accumuli <strong>non impattano il cash flow</strong> perché sono soldi già messi da parte.</p>
                    </div>
                </div>
            </div>

            <button
                onClick={() => setShowAddAccumulo(true)}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 mb-4 shadow"
            >
                ➕ Nuovo Accumulo
            </button>

            {/* Lista Accumuli Attivi */}
            <div className="space-y-4">
                {accumuliAttivi.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-4xl mb-2">🏦</p>
                        <p>Nessun accumulo creato</p>
                        <p className="text-sm mt-2">Crea il primo accumulo per iniziare ad accantonare fondi</p>
                    </div>
                ) : (
                    accumuliAttivi.map(accumulo => {
                        const { saldo, versamenti, prelievi, numeroOperazioni } = calcolaSaldoAccumulo(accumulo.id);
                        
                        return (
                            <div key={accumulo.id} className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-5 shadow-lg">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold mb-1">{accumulo.nome}</h3>
                                        {accumulo.descrizione && (
                                            <p className="text-sm opacity-90">{accumulo.descrizione}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setEditingAccumulo(accumulo)}
                                            className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded"
                                            title="Modifica"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => archiviaAccumulo(accumulo.id, accumulo.nome)}
                                            className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded"
                                            title="Archivia"
                                        >
                                            📦
                                        </button>
                                        <button
                                            onClick={() => eliminaAccumuloDefinitivamente(accumulo.id, accumulo.nome)}
                                            className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded"
                                            title="Elimina definitivamente"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Saldo Principale */}
                                <div className="border-t border-white border-opacity-30 pt-3 mb-3">
                                    <p className="text-sm opacity-75 mb-1">Saldo Attuale</p>
                                    <p className="text-4xl font-bold">€ {saldo.toFixed(2)}</p>
                                </div>
                                
                                {/* Statistiche */}
                                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                                    <div className="bg-white bg-opacity-10 rounded p-2">
                                        <p className="opacity-75">Versamenti</p>
                                        <p className="font-bold">€ {versamenti.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-white bg-opacity-10 rounded p-2">
                                        <p className="opacity-75">Prelievi</p>
                                        <p className="font-bold">€ {prelievi.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-white bg-opacity-10 rounded p-2">
                                        <p className="opacity-75">Operazioni</p>
                                        <p className="font-bold">{numeroOperazioni}</p>
                                    </div>
                                </div>
                                
                                {/* Pulsanti Azione */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setShowOperazione({ ...accumulo, tipo: 'versamento' })}
                                        className="bg-white bg-opacity-20 hover:bg-opacity-30 py-2 px-4 rounded font-medium"
                                    >
                                        ➕ Versa
                                    </button>
                                    <button
                                        onClick={() => setShowOperazione({ ...accumulo, tipo: 'prelievo' })}
                                        className="bg-white bg-opacity-20 hover:bg-opacity-30 py-2 px-4 rounded font-medium"
                                        disabled={saldo <= 0}
                                    >
                                        ➖ Preleva
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Sezione Accumuli Archiviati */}
            {accumuliArchiviati.length > 0 && (
                <div className="mt-6">
                    <button
                        onClick={() => setShowArchiviati(!showArchiviati)}
                        className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 mb-3 flex items-center justify-between px-4"
                    >
                        <span>📦 Accumuli Archiviati ({accumuliArchiviati.length})</span>
                        <span>{showArchiviati ? '▼' : '▶'}</span>
                    </button>
                    
                    {showArchiviati && (
                        <div className="space-y-3">
                            {accumuliArchiviati.map(accumulo => {
                                const { saldo, versamenti, prelievi, numeroOperazioni } = calcolaSaldoAccumulo(accumulo.id);
                                
                                return (
                                    <div key={accumulo.id} className="bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg p-4 shadow opacity-75">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold mb-1">{accumulo.nome}</h3>
                                                {accumulo.descrizione && (
                                                    <p className="text-sm opacity-90">{accumulo.descrizione}</p>
                                                )}
                                                <p className="text-xs opacity-75 mt-1">Archiviato</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => ripristinaAccumulo(accumulo.id, accumulo.nome)}
                                                    className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded text-sm"
                                                    title="Ripristina"
                                                >
                                                    ♻️
                                                </button>
                                                <button
                                                    onClick={() => eliminaAccumuloDefinitivamente(accumulo.id, accumulo.nome)}
                                                    className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded text-sm"
                                                    title="Elimina definitivamente"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="border-t border-white border-opacity-30 pt-2">
                                            <p className="text-sm opacity-75">Saldo Finale</p>
                                            <p className="text-2xl font-bold">€ {saldo.toFixed(2)}</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                                            <div className="bg-white bg-opacity-10 rounded p-2">
                                                <p className="opacity-75">Versamenti</p>
                                                <p className="font-bold">€ {versamenti.toFixed(2)}</p>
                                            </div>
                                            <div className="bg-white bg-opacity-10 rounded p-2">
                                                <p className="opacity-75">Prelievi</p>
                                                <p className="font-bold">€ {prelievi.toFixed(2)}</p>
                                            </div>
                                            <div className="bg-white bg-opacity-10 rounded p-2">
                                                <p className="opacity-75">Operazioni</p>
                                                <p className="font-bold">{numeroOperazioni}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Riepilogo Totale */}
            {accumuliAttivi.length > 0 && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                        <span className="text-blue-900 font-semibold">Totale Accantonato</span>
                        <span className="text-2xl font-bold text-blue-900">
                            € {accumuliAttivi.reduce((acc, a) => acc + calcolaSaldoAccumulo(a.id).saldo, 0).toFixed(2)}
                        </span>
                    </div>
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
