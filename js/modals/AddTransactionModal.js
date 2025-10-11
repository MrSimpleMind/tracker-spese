function AddTransactionModal({ onClose, categorie, fromTemplate = null }) {
    const [tipo, setTipo] = React.useState(fromTemplate?.tipo || 'spesa');
    const [descrizione, setDescrizione] = React.useState(fromTemplate?.descrizione || '');
    const [importo, setImporto] = React.useState(fromTemplate?.importoStimato || '');
    const [categoria, setCategoria] = React.useState(fromTemplate?.categoria || '');
    const [data, setData] = React.useState(fromTemplate?.prossimaScadenza || new Date().toISOString().split('T')[0]);
    const [nota, setNota] = React.useState(fromTemplate?.nota || '');
    const [loading, setLoading] = React.useState(false);
    const [templateId] = React.useState(fromTemplate?.id || null);
    
    // Stati per Movimenti Fondo
    const [tipoMovimentoFondo, setTipoMovimentoFondo] = React.useState('versamento'); // versamento, prelievo, trasferimento
    const [fondoSelezionato, setFondoSelezionato] = React.useState('');
    const [fondoDa, setFondoDa] = React.useState(''); // per trasferimenti
    const [fondoA, setFondoA] = React.useState(''); // per trasferimenti
    
    // Stati per Conti
    const [contoId, setContoId] = React.useState(fromTemplate?.contoId || ''); // Conto per spese/entrate
    const [contoAssociatoId, setContoAssociatoId] = React.useState(fromTemplate?.contoId || ''); // Conto associato per movimenti fondo

    // Filtra i fondi (categorie con isAccumulo=true o tipoContenitore='fondo')
    const fondi = categorie.filter(cat => 
        (cat.isAccumulo || cat.tipoContenitore === 'fondo') && !cat.archiviato
    );
    
    // Filtra i conti (categorie con tipoContenitore='conto')
    const conti = categorie.filter(cat => 
        cat.tipoContenitore === 'conto' && !cat.archiviato
    );

    // Filtra categorie normali in base al tipo selezionato
    const categorieDisponibili = React.useMemo(() => {
        if (tipo === 'movimento_fondo') {
            return []; // I movimenti fondo non usano categorie normali
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

    // Resetta selezioni fondo quando cambio tipo movimento
    React.useEffect(() => {
        setFondoSelezionato('');
        setFondoDa('');
        setFondoA('');
    }, [tipoMovimentoFondo]);

    const calcolaProssimaScadenza = () => {
        if (!fromTemplate) return null;
        
        const oggi = new Date();
        
        if (fromTemplate.frequenza === 'mensile') {
            let prossimaData = new Date(oggi.getFullYear(), oggi.getMonth() + 1, fromTemplate.giornoMese);
            
            if (prossimaData.getDate() !== parseInt(fromTemplate.giornoMese)) {
                prossimaData = new Date(prossimaData.getFullYear(), prossimaData.getMonth() + 1, 0);
            }
            
            return prossimaData.toISOString().split('T')[0];
        } else if (fromTemplate.frequenza === 'bimestrale') {
            let prossimaData = new Date(oggi.getFullYear(), oggi.getMonth() + 2, fromTemplate.giornoMese);
            
            if (prossimaData.getDate() !== parseInt(fromTemplate.giornoMese)) {
                prossimaData = new Date(prossimaData.getFullYear(), prossimaData.getMonth() + 1, 0);
            }
            
            return prossimaData.toISOString().split('T')[0];
        } else {
            let prossimaData = new Date(oggi.getFullYear() + 1, fromTemplate.meseAnno - 1, fromTemplate.giornoAnno);
            return prossimaData.toISOString().split('T')[0];
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validazioni specifiche per movimenti fondo
            if (tipo === 'movimento_fondo') {
                if (tipoMovimentoFondo === 'trasferimento') {
                    if (!fondoDa || !fondoA) {
                        alert('Seleziona sia il fondo di origine che quello di destinazione');
                        setLoading(false);
                        return;
                    }
                    if (fondoDa === fondoA) {
                        alert('I fondi di origine e destinazione devono essere diversi');
                        setLoading(false);
                        return;
                    }
                } else {
                    if (!fondoSelezionato) {
                        alert('Seleziona un fondo');
                        setLoading(false);
                        return;
                    }
                }
            }

            // CASO TRASFERIMENTO: crea due transazioni atomiche (supporta conti E fondi)
            if (tipo === 'movimento_fondo' && tipoMovimentoFondo === 'trasferimento') {
                const transferGroupId = `transfer_${Date.now()}`;
                const batch = db.batch();
                
                // Parse origine e destinazione (formato: "conto-{id}" o "fondo-{id}")
                const [tipoDa, idDa] = fondoDa.split('-');
                const [tipoA, idA] = fondoA.split('-');
                
                // Trova i nomi
                const nomeDa = tipoDa === 'conto' 
                    ? conti.find(c => c.id === idDa)?.nome 
                    : fondi.find(f => f.id === idDa)?.nome;
                const nomeA = tipoA === 'conto'
                    ? conti.find(c => c.id === idA)?.nome
                    : fondi.find(f => f.id === idA)?.nome;
                
                // Transazione 1: Uscita dall'origine
                const ref1 = db.collection('transactions').doc();
                const trans1 = {
                    importo: parseFloat(importo),
                    data,
                    nota: nota || `Trasferimento da ${nomeDa} a ${nomeA}`,
                    transferGroupId,
                    transferTo: fondoA,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    userId: auth.currentUser.uid
                };
                
                if (tipoDa === 'conto') {
                    // Da Conto: è una spesa
                    trans1.tipo = 'spesa';
                    trans1.categoria = 'Trasferimento';
                    trans1.contoId = idDa;
                    trans1.descrizione = descrizione || `Trasferimento a ${nomeA}`;
                } else {
                    // Da Fondo: è un prelievo fondo
                    trans1.tipo = 'movimento_fondo';
                    trans1.tipoMovimentoFondo = 'prelievo';
                    trans1.categoria = nomeDa;
                    trans1.fondoId = idDa;
                    trans1.descrizione = descrizione || `Trasferimento a ${nomeA}`;
                    // Retro-compatibilità
                    trans1.tipoOperazioneAccumulo = 'prelievo';
                    trans1.nomeAccumulo = nomeDa;
                }
                batch.set(ref1, trans1);
                
                // Transazione 2: Entrata nella destinazione
                const ref2 = db.collection('transactions').doc();
                const trans2 = {
                    importo: parseFloat(importo),
                    data,
                    nota: nota || `Trasferimento da ${nomeDa} a ${nomeA}`,
                    transferGroupId,
                    transferFrom: fondoDa,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    userId: auth.currentUser.uid
                };
                
                if (tipoA === 'conto') {
                    // A Conto: è un'entrata
                    trans2.tipo = 'entrata';
                    trans2.categoria = 'Trasferimento';
                    trans2.contoId = idA;
                    trans2.descrizione = descrizione || `Trasferimento da ${nomeDa}`;
                } else {
                    // A Fondo: è un versamento fondo
                    trans2.tipo = 'movimento_fondo';
                    trans2.tipoMovimentoFondo = 'versamento';
                    trans2.categoria = nomeA;
                    trans2.fondoId = idA;
                    trans2.descrizione = descrizione || `Trasferimento da ${nomeDa}`;
                    // Retro-compatibilità
                    trans2.tipoOperazioneAccumulo = 'versamento';
                    trans2.nomeAccumulo = nomeA;
                }
                batch.set(ref2, trans2);
                
                await batch.commit();
                
            } else {
                // CASO NORMALE: singola transazione
                const transactionData = {
                    tipo,
                    descrizione,
                    importo: parseFloat(importo),
                    data,
                    nota,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    userId: auth.currentUser.uid
                };
                
                // Aggiungi campi specifici per movimenti fondo
                if (tipo === 'movimento_fondo') {
                    const nomeFondo = fondi.find(f => f.id === fondoSelezionato)?.nome || fondoSelezionato;
                    transactionData.tipoMovimentoFondo = tipoMovimentoFondo;
                    transactionData.categoria = nomeFondo; // Il fondo è la categoria
                    transactionData.fondoId = fondoSelezionato;
                    
                    // Conto associato opzionale per movimenti fondo
                    if (contoAssociatoId) {
                        transactionData.contoId = contoAssociatoId;
                    }
                    
                    // Retro-compatibilità con vecchio sistema "accumulo"
                    transactionData.tipoOperazioneAccumulo = tipoMovimentoFondo;
                    transactionData.nomeAccumulo = nomeFondo;
                } else {
                    // Per spese/entrate, usa la categoria normale E il conto
                    transactionData.categoria = categoria;
                    transactionData.contoId = contoId; // NUOVO: salva il conto
                }
                
                // Se viene da template, aggiungi flag
                if (templateId) {
                    transactionData.isRicorrente = true;
                    transactionData.templateId = templateId;
                }

                await db.collection('transactions').add(transactionData);
                
                // Se viene da template, aggiorna la prossima scadenza
                if (templateId) {
                    const prossimaScadenza = calcolaProssimaScadenza();
                    await db.collection('template_ricorrenti').doc(templateId).update({
                        prossimaScadenza: prossimaScadenza,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
            
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

    const config = tipoConfig[tipo];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">
                            {fromTemplate ? `🔄 ${config.label} da Template` : `Nuova Transazione`}
                        </h2>
                        {fromTemplate && (
                            <p className="text-xs text-orange-600 mt-1">⚠️ Template: {fromTemplate.descrizione}</p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl" type="button">×</button>
                </div>

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

                    {/* Sottotipi per Movimento Fondo */}
                    {tipo === 'movimento_fondo' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Movimento *</label>
                            <div className="grid grid-cols-3 gap-2">
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
                                <button
                                    type="button"
                                    onClick={() => setTipoMovimentoFondo('trasferimento')}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition ${
                                        tipoMovimentoFondo === 'trasferimento'
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                    🔄 Trasferimento
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Selezione Fondo (se movimento_fondo e NON trasferimento) */}
                    {tipo === 'movimento_fondo' && tipoMovimentoFondo !== 'trasferimento' && (
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

                    {/* Selezione Contenitori (se trasferimento) - UNIFICATO per conti e fondi */}
                    {tipo === 'movimento_fondo' && tipoMovimentoFondo === 'trasferimento' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Da *</label>
                                <select
                                    value={fondoDa}
                                    onChange={(e) => setFondoDa(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Seleziona origine</option>
                                    <optgroup label="💳 Conti">
                                        {conti.map(conto => (
                                            <option key={`conto-${conto.id}`} value={`conto-${conto.id}`}>
                                                {conto.emoji && `${conto.emoji} `}{conto.nome}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="🏬 Fondi">
                                        {fondi.map(fondo => (
                                            <option key={`fondo-${fondo.id}`} value={`fondo-${fondo.id}`}>
                                                {fondo.nome}
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">A *</label>
                                <select
                                    value={fondoA}
                                    onChange={(e) => setFondoA(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Seleziona destinazione</option>
                                    <optgroup label="💳 Conti">
                                        {conti.map(conto => (
                                            <option 
                                                key={`conto-${conto.id}`} 
                                                value={`conto-${conto.id}`}
                                                disabled={`conto-${conto.id}` === fondoDa}
                                            >
                                                {conto.emoji && `${conto.emoji} `}{conto.nome}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="🏬 Fondi">
                                        {fondi.map(fondo => (
                                            <option 
                                                key={`fondo-${fondo.id}`} 
                                                value={`fondo-${fondo.id}`}
                                                disabled={`fondo-${fondo.id}` === fondoDa}
                                            >
                                                {fondo.nome}
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione *</label>
                        <input
                            type="text"
                            value={descrizione}
                            onChange={(e) => setDescrizione(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                            placeholder={
                                tipo === 'spesa' ? 'Es: Spesa supermercato' :
                                tipo === 'entrata' ? 'Es: Stipendio Gennaio' :
                                tipoMovimentoFondo === 'versamento' ? 'Es: Accantonamento mensile' :
                                tipoMovimentoFondo === 'prelievo' ? 'Es: Prelievo per vacanza' :
                                'Es: Riorganizzazione fondi'
                            }
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
                            placeholder="0.00"
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
                                    ⚠️ Nessuna categoria disponibile per questo tipo. Creane una nella sezione Categorie!
                                </p>
                            )}
                        </div>
                    )}

                    {/* Conto (per spese/entrate) */}
                    {tipo !== 'movimento_fondo' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {tipo === 'spesa' ? 'Da quale conto?' : 'Su quale conto?'} *
                            </label>
                            <select
                                value={contoId}
                                onChange={(e) => setContoId(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Seleziona conto</option>
                                {conti.map(conto => (
                                    <option key={conto.id} value={conto.id}>
                                        {conto.emoji && `${conto.emoji} `}{conto.nome}
                                    </option>
                                ))}
                            </select>
                            {conti.length === 0 && (
                                <p className="text-xs text-orange-600 mt-1">
                                    ⚠️ Nessun conto disponibile. Creane uno nella sezione Conti e Fondi!
                                </p>
                            )}
                        </div>
                    )}

                    {/* Conto Associato (opzionale per movimenti fondo) */}
                    {tipo === 'movimento_fondo' && tipoMovimentoFondo !== 'trasferimento' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {tipoMovimentoFondo === 'versamento' ? 'Da quale conto?' : 'Su quale conto?'} (opzionale)
                            </label>
                            <select
                                value={contoAssociatoId}
                                onChange={(e) => setContoAssociatoId(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Nessun conto associato</option>
                                {conti.map(conto => (
                                    <option key={conto.id} value={conto.id}>
                                        {conto.emoji && `${conto.emoji} `}{conto.nome}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Indica da/su quale conto stai effettuando il movimento
                            </p>
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
                            placeholder="Note aggiuntive..."
                        />
                    </div>

                    {/* Info box per movimenti fondo */}
                    {tipo === 'movimento_fondo' && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                            <p className="text-xs text-blue-900">
                                <strong>💡 I Movimenti Fondo non impattano il cash flow</strong> - sono accantonamenti che modificano solo il saldo dei fondi.
                            </p>
                        </div>
                    )}

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
                            className={`flex-1 py-3 rounded-lg font-medium disabled:opacity-50 ${
                                tipo === 'spesa' ? 'bg-red-600 hover:bg-red-700 text-white' :
                                tipo === 'entrata' ? 'bg-green-600 hover:bg-green-700 text-white' :
                                'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            {loading ? 'Salvataggio...' : 'Aggiungi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
