function OperazioneAccumuloModal({ accumulo, onClose }) {
    const isVersamento = accumulo.tipo === 'versamento';
    
    const [importo, setImporto] = React.useState('');
    const [data, setData] = React.useState(new Date().toISOString().split('T')[0]);
    const [descrizione, setDescrizione] = React.useState(
        isVersamento ? `Versamento ${accumulo.nome}` : `Prelievo ${accumulo.nome}`
    );
    const [nota, setNota] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Crea una transazione speciale di tipo "accumulo"
            await db.collection('transactions').add({
                tipo: 'accumulo', // Tipo speciale per operazioni su accumuli
                tipoOperazioneAccumulo: isVersamento ? 'versamento' : 'prelievo',
                categoria: accumulo.id,
                categoriaName: accumulo.nome, // Salviamo anche il nome per comodità
                descrizione,
                importo: parseFloat(importo),
                data,
                nota,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: auth.currentUser.uid
            });
            
            onClose();
        } catch (err) {
            alert('Errore: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">
                            {isVersamento ? '➕ Versamento' : '➖ Prelievo'}
                        </h2>
                        <p className="text-sm text-gray-600">{accumulo.nome}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className={`${isVersamento ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-3 text-sm`}>
                        <p className="font-semibold mb-1">
                            {isVersamento ? '💡 Versamento' : '⚠️ Prelievo'}
                        </p>
                        <p className={isVersamento ? 'text-green-900' : 'text-orange-900'}>
                            {isVersamento 
                                ? 'Aggiungi fondi all\'accumulo. Il versamento NON verrà conteggiato come spesa nel cash flow.'
                                : 'Preleva fondi dall\'accumulo per pagare una spesa. Il prelievo NON impatterà il cash flow mensile perché sono soldi già accantonati.'
                            }
                        </p>
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
                            autoFocus
                        />
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione *</label>
                        <input
                            type="text"
                            value={descrizione}
                            onChange={(e) => setDescrizione(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                            placeholder={isVersamento ? 'Es: Stipendio di gennaio' : 'Es: Pagamento hotel vacanza'}
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
                            className={`flex-1 ${isVersamento ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'} text-white py-3 rounded-lg font-medium disabled:opacity-50`}
                        >
                            {loading ? 'Salvataggio...' : (isVersamento ? '✅ Versa' : '✅ Preleva')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
