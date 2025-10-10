function EditTransactionModal({ transaction, onClose, categorie }) {
    // Determina il tipo attuale - con retro-compatibilità
    const tipoIniziale = transaction.tipo === 'accumulo' ? 'movimento_fondo' : transaction.tipo;
    const [tipo, setTipo] = React.useState(tipoIniziale || 'spesa');
    
    const [descrizione, setDescrizione] = React.useState(transaction.descrizione);
    const [importo, setImporto] = React.useState(transaction.importo);
    const [categoria, setCategoria] = React.useState(transaction.categoria);
    const [data, setData] = React.useState(transaction.data);
    const [nota, setNota] = React.useState(transaction.nota || '');
    const [loading, setLoading] = React.useState(false);
    
    // Stati per Movimenti Fondo
    const tipoMovimentoIniziale = transaction.tipoMovimentoFondo || transaction.tipoOperazioneAccumulo || 'versamento';
    const [tipoMovimentoFondo, setTipoMovimentoFondo] = React.useState(tipoMovimentoIniziale);
    const fondoInizialeId = transaction.fondoId || '';
    const [fondoSelezionato, setFondoSelezionato] = React.useState(fondoInizialeId);

    // Stato per Conti
    const contoInizialeId = transaction.contoId || '';
    const [contoSelezionato, setContoSelezionato] = React.useState(contoInizialeId);
    const [conti, setConti] = React.useState([]);

    // Carica i conti da Firebase (dalla collection categorie)
    React.useEffect(() => {
        const unsubscribe = db.collection('categorie')
            .where('tipoContenitore', '==', 'conto')
            .where('archiviato', '==', false)
            .onSnapshot(snapshot => {
                const contiData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Ordina per nome lato client (Firestore non supporta orderBy su più campi con where)
                contiData.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
                setConti(contiData);
            });
        return () => unsubscribe();
    }, []);

    // Filtra i fondi
    const fondi = categorie.filter(cat => cat.isAccumulo && !cat.archiviato);

    // Filtra categorie normali in base al tipo selezionato
    const categorieDisponibili = React.useMemo(() => {
        if (tipo === 'movimento_fondo') {
            return [];
        }
        return categorie.filter(cat => 
            !cat.isAccumulo && 
            cat.applicabileA && 
            cat.applicabileA.includes(tipo)
        );
    }, [tipo, categorie]);

    // Se cambio tipo e la categoria attuale non è valida, resetta
    React.useEffect(() => {
        if (categoria && !categorieDisponibili.find(c => c.nome === categoria)) {
            setCategoria('');
        }
    }, [tipo, categoria, categorieDisponibili]);

    // Warning: Non permettere modifica dei trasferimenti (hanno 2 transazioni atomiche)
    const isTransferimento = transaction.transferGroupId;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validazioni specifiche per movimenti fondo
            if (tipo === 'movimento_fondo' && !fondoSelezionato) {
                alert('Seleziona un fondo');
                setLoading(false);
                return;
            }

            const updateData = {
                tipo,
                descrizione,
                importo: parseFloat(importo),
                data,
                nota,
                contoId: contoSelezionato || null,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Aggiungi campi specifici per movimenti fondo
            if (tipo === 'movimento_fondo') {
                const nomeFondo = fondi.find(f => f.id === fondoSelezionato)?.nome || fondoSelezionato;
                updateData.tipoMovimentoFondo = tipoMovimentoFondo;
                updateData.categoria = nomeFondo;
                updateData.fondoId = fondoSelezionato;
                
                // Retro-compatibilità
                updateData.tipoOperazioneAccumulo = tipoMovimentoFondo;
                updateData.nomeAccumulo = nomeFondo;
            } else {
                // Per spese/entrate, usa la categoria normale
                updateData.categoria = categoria;
                
                // Rimuovi campi movimento_fondo se la transazione viene convertita
                updateData.tipoMovimentoFondo = firebase.firestore.FieldValue.delete();
                updateData.fondoId = firebase.firestore.FieldValue.delete();
                updateData.tipoOperazioneAccumulo = firebase.firestore.FieldValue.delete();
                updateData.nomeAccumulo = firebase.firestore.FieldValue.delete();
            }

            await db.collection('transactions').doc(transaction.id).update(updateData);
            onClose();
        } catch (err) {
            alert('Errore: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const tipoConfig = {
        spesa: { label: 'Spesa', icon: '💸', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-500' },
        entrata: { label: 'Entrata', icon: '💰', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-500' },
        movimento_fondo: { label: 'Movimento Fondo', icon: '🏦', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-500' }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Modifica Transazione</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl" type="button">×</button>
                </div>

                {isTransferimento && (
                    <div className="p-4 bg-orange-50 border-b border-orange-200">
                        <p className="text-sm text-orange-900">
                            <strong>⚠️ Trasferimento</strong> - Questa transazione fa parte di un trasferimento tra conti/fondi. Modificando questa transazione, il trasferimento potrebbe risultare sbilanciato.
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Selezione Tipo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo di Transazione *</label>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(tipoConfig).map(([key, conf]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setTipo(key)}
                                    className={`py-3 px-2 rounded-lg text-sm font-medium border-2 transition ${
                                        tipo === key 
                                            ? `${conf.borderColor} ${conf.bgColor} ${conf.color}` 
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="text-2xl block mb-1">{conf.icon}</span>
                                    <span className="text-xs">{conf.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sottotipi per Movimento Fondo (solo visualizzazione per trasferimenti) */}
                    {tipo === 'movimento_fondo' && !isTransferimento && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Movimento *</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTipoMovimentoFondo('versamento')}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition ${
                                        tipoMovimentoFondo === 'versamento'
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                    ➕ Versamento
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTipoMovimentoFondo('prelievo')}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition ${
                                        tipoMovimentoFondo === 'prelievo'
                                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                    ➖ Prelievo
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Mostra solo tipo movimento se è trasferimento (non modificabile) */}
                    {tipo === 'movimento_fondo' && isTransferimento && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Tipo Movimento</p>
                            <p className="text-sm font-semibold text-gray-900">
                                {tipoMovimentoFondo === 'versamento' ? '➕ Versamento' : '➖ Prelievo'} (Trasferimento)
                            </p>
                        </div>
                    )}

                    {/* Selezione Fondo (se movimento_fondo) */}
                    {tipo === 'movimento_fondo' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fondo *</label>
                            <select
                                value={fondoSelezionato}
                                onChange={(e) => setFondoSelezionato(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Seleziona fondo</option>
                                {fondi.map(fondo => (
                                    <option key={fondo.id} value={fondo.id}>
                                        {fondo.nome}
                                    </option>
                                ))}
                            </select>
                            {fondi.length === 0 && (
                                <p className="text-xs text-orange-600 mt-1">
                                    ⚠️ Nessun fondo disponibile. Creane uno nella sezione Fondi!
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione *</label>
                        <input
                            type="text"
                            value={descrizione}
                            onChange={(e) => setDescrizione(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Importo (€) *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={importo}
                            onChange={(e) => setImporto(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Categoria (solo per spese/entrate) */}
                    {tipo !== 'movimento_fondo' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                            <select
                                value={categoria}
                                onChange={(e) => setCategoria(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Seleziona categoria</option>
                                {categorieDisponibili.map(cat => (
                                    <option key={cat.id} value={cat.nome}>
                                        {cat.emoji && `${cat.emoji} `}{cat.nome}
                                    </option>
                                ))}
                            </select>
                            {categorieDisponibili.length === 0 && (
                                <p className="text-xs text-orange-600 mt-1">
                                    ⚠️ Nessuna categoria disponibile per questo tipo
                                </p>
                            )}
                        </div>
                    )}

                    {/* Selezione Conto (opzionale per spese/entrate) */}
                    {tipo !== 'movimento_fondo' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Conto (opzionale)</label>
                            <select
                                value={contoSelezionato}
                                onChange={(e) => setContoSelezionato(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Nessun conto specifico</option>
                                {conti.map(conto => (
                                    <option key={conto.id} value={conto.id}>
                                        {conto.emoji && `${conto.emoji} `}{conto.nome}
                                    </option>
                                ))}
                            </select>
                            {conti.length === 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                    💡 Nessun conto disponibile. Creane uno nella sezione Conti!
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                        <input
                            type="date"
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nota (opzionale)</label>
                        <textarea
                            value={nota}
                            onChange={(e) => setNota(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows="2"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Salvataggio...' : 'Salva Modifiche'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
