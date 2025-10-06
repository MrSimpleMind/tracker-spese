function AddAccumuloModal({ onClose }) {
    const [nome, setNome] = React.useState('');
    const [descrizione, setDescrizione] = React.useState('');
    const [obiettivo, setObiettivo] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await db.collection('categorie').add({
                nome,
                icona: '🏦',
                descrizione,
                isAccumulo: true, // Flag che identifica questa categoria come fondo
                obiettivo: obiettivo ? parseFloat(obiettivo) : null,
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
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">🏦 Nuovo Fondo</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl" type="button">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-3 text-sm text-blue-900">
                        <p className="font-semibold mb-1">💡 Cos'è un Fondo?</p>
                        <p>Un fondo dedicato per un obiettivo specifico. I movimenti del fondo non impattano il cash flow mensile.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fondo *</label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                            placeholder="Es: Fondo Vacanze, Emergenze, Macchina Nuova..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione (opzionale)</label>
                        <textarea
                            value={descrizione}
                            onChange={(e) => setDescrizione(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows="2"
                            placeholder="Es: Per le vacanze estive 2025"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Obiettivo (€) - Opzionale</label>
                        <input
                            type="number"
                            step="0.01"
                            value={obiettivo}
                            onChange={(e) => setObiettivo(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Es: 3000.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">L'importo che vuoi raggiungere</p>
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
                            {loading ? 'Creazione...' : 'Crea Fondo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
