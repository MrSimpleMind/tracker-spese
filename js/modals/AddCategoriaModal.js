function AddCategoriaModal({ onClose }) {
    const [nome, setNome] = React.useState('');
    const [descrizione, setDescrizione] = React.useState('');
    const [emoji, setEmoji] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await db.collection('categorie').add({
                nome,
                descrizione,
                emoji: emoji || '📁',
                applicabileA: ['spesa'], // Solo spese nella versione lite
                archiviato: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
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
                    <h2 className="text-xl font-bold">📁 Nuova Categoria</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl" type="button">×</button>
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
                            placeholder="Es: Alimentari, Trasporti, Svago..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Emoji (opzionale)</label>
                        <input
                            type="text"
                            value={emoji}
                            onChange={(e) => setEmoji(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="🍕 🚗 🎬 ..."
                            maxLength="2"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Aggiungi un'emoji per identificare visivamente la categoria
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione (opzionale)</label>
                        <textarea
                            value={descrizione}
                            onChange={(e) => setDescrizione(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows="2"
                            placeholder="Breve descrizione della categoria..."
                        />
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                        <p className="text-xs text-blue-900">
                            💡 <strong>Suggerimento:</strong> Crea categorie ampie (es: "Alimentari" invece di "Supermercato Esselunga") 
                            per facilitare l'analisi delle spese.
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
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50"
                        >
                            {loading ? 'Creazione...' : 'Crea Categoria'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
