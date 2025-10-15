function AddTransactionModal({ onClose, categorie, fromTemplate = null }) {
    const [descrizione, setDescrizione] = React.useState(fromTemplate?.descrizione || '');
    const [importo, setImporto] = React.useState(fromTemplate?.importoStimato || '');
    const [categoria, setCategoria] = React.useState(fromTemplate?.categoria || '');
    const [data, setData] = React.useState(fromTemplate?.prossimaScadenza || new Date().toISOString().split('T')[0]);
    const [nota, setNota] = React.useState(fromTemplate?.nota || '');
    const [loading, setLoading] = React.useState(false);
    const [templateId] = React.useState(fromTemplate?.id || null);

    // Filtra categorie attive (non archiviate e non fondi/conti)
    const categorieDisponibili = categorie.filter(cat => 
        !cat.archiviato && 
        !cat.tipoContenitore && 
        !cat.isAccumulo
    );

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
                tipo: 'spesa',
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">
                            {fromTemplate ? `🔄 Spesa da Template` : `💸 Nuova Spesa`}
                        </h2>
                        {fromTemplate && (
                            <p className="text-xs text-orange-600 mt-1">⚠️ Template: {fromTemplate.descrizione}</p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl" type="button">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione *</label>
                        <input
                            type="text"
                            value={descrizione}
                            onChange={(e) => setDescrizione(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                            placeholder="Es: Spesa supermercato"
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
                                    {cat.emoji && `${cat.emoji} `}{cat.nome}
                                </option>
                            ))}
                        </select>
                        {categorieDisponibili.length === 0 && (
                            <p className="text-xs text-orange-600 mt-1">
                                ⚠️ Nessuna categoria disponibile. Creane una nella sezione Categorie!
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
                            rows="3"
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
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium disabled:opacity-50"
                        >
                            {loading ? 'Salvataggio...' : 'Aggiungi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
