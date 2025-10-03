function AddTemplateModal({ onClose, categorie }) {
    const [descrizione, setDescrizione] = React.useState('');
    const [importoStimato, setImportoStimato] = React.useState('');
    const [categoria, setCategoria] = React.useState('');
    const [nota, setNota] = React.useState('');
    const [frequenza, setFrequenza] = React.useState('mensile');
    const [giornoMese, setGiornoMese] = React.useState(1);
    const [giornoAnno, setGiornoAnno] = React.useState(1);
    const [meseAnno, setMeseAnno] = React.useState(1);
    const [loading, setLoading] = React.useState(false);

    const calcolaProssimaScadenza = () => {
        const oggi = new Date();
        
        if (frequenza === 'mensile') {
            let prossimaData = new Date(oggi.getFullYear(), oggi.getMonth(), giornoMese);
            
            // Se la data è già passata questo mese, passa al mese prossimo
            if (prossimaData < oggi) {
                prossimaData = new Date(oggi.getFullYear(), oggi.getMonth() + 1, giornoMese);
            }
            
            // Gestione giorni "difficili" (es. 31 in mesi con 30 giorni)
            // Impostiamo l'ultimo giorno del mese se il giorno non esiste
            if (prossimaData.getDate() !== parseInt(giornoMese)) {
                prossimaData = new Date(prossimaData.getFullYear(), prossimaData.getMonth() + 1, 0);
            }
            
            return prossimaData.toISOString().split('T')[0];
        } else {
            // Annuale
            let prossimaData = new Date(oggi.getFullYear(), meseAnno - 1, giornoAnno);
            
            // Se la data è già passata quest'anno, passa all'anno prossimo
            if (prossimaData < oggi) {
                prossimaData = new Date(oggi.getFullYear() + 1, meseAnno - 1, giornoAnno);
            }
            
            return prossimaData.toISOString().split('T')[0];
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const prossimaScadenza = calcolaProssimaScadenza();
            
            const templateData = {
                descrizione,
                importoStimato: parseFloat(importoStimato),
                categoria,
                nota,
                frequenza,
                attivo: true,
                prossimaScadenza,
                userId: auth.currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (frequenza === 'mensile') {
                templateData.giornoMese = parseInt(giornoMese);
            } else {
                templateData.giornoAnno = parseInt(giornoAnno);
                templateData.meseAnno = parseInt(meseAnno);
            }

            await db.collection('template_ricorrenti').add(templateData);
            onClose();
        } catch (err) {
            alert('Errore: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const mesi = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[60]">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Nuovo Template</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
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
                            placeholder="Es: Affitto, Netflix, Bolletta luce..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Importo Stimato (€) *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={importoStimato}
                            onChange={(e) => setImportoStimato(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                            placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">Potrai modificarlo quando inserisci la spesa</p>
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
                            {categorie.map(cat => (
                                <option key={cat.id} value={cat.nome}>
                                    {cat.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">🔄 Frequenza *</label>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <button
                                type="button"
                                onClick={() => setFrequenza('mensile')}
                                className={`py-2 px-4 rounded-lg text-sm font-medium ${frequenza === 'mensile' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                            >
                                📅 Mensile
                            </button>
                            <button
                                type="button"
                                onClick={() => setFrequenza('annuale')}
                                className={`py-2 px-4 rounded-lg text-sm font-medium ${frequenza === 'annuale' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                            >
                                📅 Annuale
                            </button>
                        </div>

                        {frequenza === 'mensile' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Giorno del mese *</label>
                                <select
                                    value={giornoMese}
                                    onChange={(e) => setGiornoMese(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(giorno => (
                                        <option key={giorno} value={giorno}>
                                            {giorno}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    💡 Prossima scadenza: {new Date(calcolaProssimaScadenza()).toLocaleDateString('it-IT')}
                                </p>
                            </div>
                        )}

                        {frequenza === 'annuale' && (
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giorno *</label>
                                    <select
                                        value={giornoAnno}
                                        onChange={(e) => setGiornoAnno(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(giorno => (
                                            <option key={giorno} value={giorno}>
                                                {giorno}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mese *</label>
                                    <select
                                        value={meseAnno}
                                        onChange={(e) => setMeseAnno(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        {mesi.map((mese, index) => (
                                            <option key={index + 1} value={index + 1}>
                                                {mese}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 col-span-2">
                                    💡 Prossima scadenza: {new Date(calcolaProssimaScadenza()).toLocaleDateString('it-IT')}
                                </p>
                            </div>
                        )}
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
                            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Salvataggio...' : 'Crea Template'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
