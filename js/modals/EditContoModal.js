function EditContoModal({ conto, onClose }) {
    const [nome, setNome] = React.useState(conto.nome);
    const [emoji, setEmoji] = React.useState(conto.emoji || '💳');
    const [descrizione, setDescrizione] = React.useState(conto.descrizione || '');
    const [loading, setLoading] = React.useState(false);

    // Lista emoji comuni per conti
    const emojiComuni = ['💳', '🏦', '💰', '💵', '💶', '💷', '🪙', '💸', '🏧', '📊'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updateData = {
                nome,
                emoji,
                descrizione,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('conti').doc(conto.id).update(updateData);
            onClose();
        } catch (err) {
            alert('Errore nel modificare il conto: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleArchivia = async () => {
        if (!confirm(`Vuoi davvero ${conto.archiviato ? 'ripristinare' : 'archiviare'} questo conto?`)) {
            return;
        }

        setLoading(true);
        try {
            await db.collection('conti').doc(conto.id).update({
                archiviato: !conto.archiviato,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
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
                    <h2 className="text-xl font-bold">Modifica Conto</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl" type="button">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Info Saldo (non modificabile) */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">Saldo Corrente</p>
                        <p className="text-2xl font-bold text-blue-900">
                            €{conto.saldoCorrente?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                            💡 Il saldo viene aggiornato automaticamente dalle transazioni
                        </p>
                    </div>

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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione (opzionale)</label>
                        <textarea
                            value={descrizione}
                            onChange={(e) => setDescrizione(e.target.value)}
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

                    {/* Pulsante Archivia/Ripristina */}
                    <div className="pt-4 border-t">
                        <button
                            type="button"
                            onClick={handleArchivia}
                            disabled={loading}
                            className={`w-full py-3 rounded-lg font-medium ${
                                conto.archiviato
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            } disabled:opacity-50`}
                        >
                            {conto.archiviato ? '♻️ Ripristina Conto' : '📦 Archivia Conto'}
                        </button>
                        {!conto.archiviato && (
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                I conti archiviati non vengono eliminati ma nascosti
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
