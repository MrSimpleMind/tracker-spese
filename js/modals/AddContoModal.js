function AddContoModal({ onClose }) {
    const [nome, setNome] = React.useState('');
    const [emoji, setEmoji] = React.useState('💳');
    const [saldoIniziale, setSaldoIniziale] = React.useState('0');
    const [descrizione, setDescrizione] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    // Lista emoji comuni per conti
    const emojiComuni = ['💳', '🏦', '💰', '💵', '💶', '💷', '🪙', '💸', '🏧', '📊'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const newConto = {
                nome,
                emoji,
                saldoIniziale: parseFloat(saldoIniziale),
                saldoCorrente: parseFloat(saldoIniziale),
                descrizione,
                tipoContenitore: 'conto', // Importante: identifica questo come un conto
                archiviato: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('categorie').add(newConto);
            
            // Piccolo delay per permettere a Firebase di completare
            setTimeout(() => {
                onClose();
            }, 100);
        } catch (err) {
            console.error('Errore nella creazione del conto:', err);
            alert('Errore nel creare il conto: ' + err.message);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Nuovo Conto</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl" type="button">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Selezione Emoji */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Icona *</label>
                        <div className="grid grid-cols-10 gap-2">
                            {emojiComuni.map(em => (
                                <button
                                    key={em}
                                    type="button"
                                    onClick={() => setEmoji(em)}
                                    className={`text-2xl p-2 rounded-lg border-2 transition ${
                                        emoji === em 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {em}
                                </button>
                            ))}
                        </div>
                        <div className="mt-2">
                            <input
                                type="text"
                                value={emoji}
                                onChange={(e) => setEmoji(e.target.value)}
                                placeholder="O inserisci emoji personalizzata"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                maxLength="2"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Conto *</label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Es: Conto Corrente Principale"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Iniziale (€) *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={saldoIniziale}
                            onChange={(e) => setSaldoIniziale(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            💡 Inserisci il saldo attuale del conto
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione (opzionale)</label>
                        <textarea
                            value={descrizione}
                            onChange={(e) => setDescrizione(e.target.value)}
                            placeholder="Es: Conto principale per le spese quotidiane"
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
                            {loading ? 'Creazione...' : 'Crea Conto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
