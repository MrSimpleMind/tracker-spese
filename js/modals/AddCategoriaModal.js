function AddCategoriaModal({ onClose }) {
    const [nome, setNome] = React.useState('');
    const [descrizione, setDescrizione] = React.useState('');
    const [applicabileA, setApplicabileA] = React.useState(['spesa']); // Default solo spese
    const [loading, setLoading] = React.useState(false);

    const toggleApplicabilita = (tipo) => {
        if (applicabileA.includes(tipo)) {
            setApplicabileA(applicabileA.filter(t => t !== tipo));
        } else {
            setApplicabileA([...applicabileA, tipo]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (applicabileA.length === 0) {
            alert('Seleziona almeno un tipo di transazione per questa categoria');
            return;
        }
        
        setLoading(true);

        try {
            await db.collection('categorie').add({
                nome,
                icona: '📁',
                descrizione,
                applicabileA,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            onClose();
        } catch (err) {
            alert('Errore: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const tipoConfig = {
        spesa: { label: 'Spese', icon: '💸', color: 'text-red-600' },
        entrata: { label: 'Entrate', icon: '💰', color: 'text-green-600' }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Nuova Categoria</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                            placeholder="Es: Alimentari, Stipendio, Bollette..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione (opzionale)</label>
                        <input
                            type="text"
                            value={descrizione}
                            onChange={(e) => setDescrizione(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Es: Spese per cibo e bevande"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Applicabile a *
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            Seleziona a quali tipi di transazioni si applica questa categoria
                        </p>
                        <div className="space-y-2">
                            {Object.entries(tipoConfig).map(([key, conf]) => (
                                <label 
                                    key={key}
                                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition ${
                                        applicabileA.includes(key) 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={applicabileA.includes(key)}
                                        onChange={() => toggleApplicabilita(key)}
                                        className="w-5 h-5 text-blue-600"
                                    />
                                    <span className="text-2xl">{conf.icon}</span>
                                    <span className={`font-medium ${conf.color}`}>{conf.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-900">
                            💡 <strong>Esempio:</strong> "Alimentari" solo per Spese, "Stipendio" solo per Entrate, 
                            "Manutenzione" per entrambe.
                        </p>
                        <p className="text-xs text-blue-800 mt-2">
                            ℹ️ Per gestire accumuli, vai nella sezione 🏦 Accumuli
                        </p>
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
                            {loading ? 'Salvataggio...' : 'Crea'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
