function AddTransactionModal({ onClose, categorie, fromTemplate = null }) {
    const [tipo, setTipo] = React.useState(fromTemplate?.tipo || 'spesa');
    const [descrizione, setDescrizione] = React.useState(fromTemplate?.descrizione || '');
    const [importo, setImporto] = React.useState(fromTemplate?.importoStimato || '');
    const [categoria, setCategoria] = React.useState(fromTemplate?.categoria || '');
    const [data, setData] = React.useState(fromTemplate?.prossimaScadenza || new Date().toISOString().split('T')[0]);
    const [nota, setNota] = React.useState(fromTemplate?.nota || '');
    const [loading, setLoading] = React.useState(false);
    const [templateId] = React.useState(fromTemplate?.id || null);

    // Filtra categorie in base al tipo selezionato
    const categorieDisponibili = categorie.filter(cat => 
        cat.applicabileA && cat.applicabileA.includes(tipo)
    );

    // Se cambio tipo e la categoria attuale non è valida, resetta
    React.useEffect(() => {
        if (categoria && !categorieDisponibili.find(c => c.nome === categoria)) {
            setCategoria('');
        }
    }, [tipo, categoria, categorieDisponibili]);

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
            const transactionData = {
                tipo,
                descrizione,
                importo: parseFloat(importo),
                categoria,
                data,
                nota,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: auth.currentUser.uid
            };
            
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
            
            onClose();
        } catch (err) {
            alert('Errore: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const tipoConfig = {
        spesa: { label: 'Spesa', icon: '💸', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-500' },
        entrata: { label: 'Entrata', icon: '💰', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-500' }
    };

    const config = tipoConfig[tipo];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">
                            {fromTemplate ? `🔄 ${config.label} da Template` : `Nuova ${config.label}`}
                        </h2>
                        {fromTemplate && (
                            <p className="text-xs text-orange-600 mt-1">⚠️ Template: {fromTemplate.descrizione}</p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Selezione Tipo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(tipoConfig).map(([key, conf]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setTipo(key)}
                                    className={`py-3 px-4 rounded-lg text-sm font-medium border-2 transition ${
                                        tipo === key 
                                            ? `${conf.borderColor} ${conf.bgColor} ${conf.color}` 
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="text-2xl block mb-1">{conf.icon}</span>
                                    {conf.label}
                                </button>
                            ))}
                        </div>
                    </div>

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
                                'Es: Stipendio Gennaio'
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
                                    {cat.nome}
                                </option>
                            ))}
                        </select>
                        {categorieDisponibili.length === 0 && (
                            <p className="text-xs text-orange-600 mt-1">
                                ⚠️ Nessuna categoria disponibile per questo tipo. Creane una nella sezione Categorie!
                            </p>
                        )}
                    </div>

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
                                'bg-green-600 hover:bg-green-700 text-white'
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
