function DettaglioTemplateModal({ template, onClose }) {
    const [transactions, setTransactions] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        // Carica le transazioni collegate a questo template
        const unsubscribe = db.collection('transactions')
            .where('templateId', '==', template.id)
            .onSnapshot(
                snapshot => {
                    const transactionsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    // Ordina lato client per data (più recente prima) e limita a 12
                    transactionsData.sort((a, b) => new Date(b.data) - new Date(a.data));
                    const transactionsLimitate = transactionsData.slice(0, 12);
                    setTransactions(transactionsLimitate);
                    setLoading(false);
                },
                error => {
                    console.error('Errore caricamento storico:', error);
                    setLoading(false);
                }
            );
        
        return unsubscribe;
    }, [template.id]);

    // Calcola i mesi mancanti (saltati) - solo per template mensili
    const getMesiMancanti = () => {
        if (transactions.length === 0 || template.frequenza !== 'mensile') return [];
        
        const mesiInseriti = transactions.map(t => {
            const data = new Date(t.data);
            return `${data.getFullYear()}-${data.getMonth()}`;
        });
        
        const mesiMancanti = [];
        const oggi = new Date();
        const ultimaTransaction = transactions[transactions.length - 1];
        const dataInizio = ultimaTransaction ? new Date(ultimaTransaction.data) : oggi;
        
        // Controlla gli ultimi 6 mesi
        for (let i = 0; i < 6; i++) {
            const mese = new Date(oggi.getFullYear(), oggi.getMonth() - i, 1);
            const chiaveMese = `${mese.getFullYear()}-${mese.getMonth()}`;
            
            if (!mesiInseriti.includes(chiaveMese) && mese >= dataInizio) {
                mesiMancanti.push({
                    data: mese.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }),
                    chiave: chiaveMese
                });
            }
        }
        
        return mesiMancanti;
    };

    const mesiMancanti = getMesiMancanti();

    const tipoConfig = {
        spesa: { label: 'Spesa', icon: '💸', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
        entrata: { label: 'Entrata', icon: '💰', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
        accumulo: { label: 'Accumulo', icon: '🏦', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' }
    };

    const config = tipoConfig[template.tipo || 'spesa'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[60]">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Dettagli Template</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                <div className="p-4">
                    {/* Info Template */}
                    <div className={`bg-gradient-to-r ${config.bg} ${config.border} border-2 rounded-lg p-4 mb-4 shadow-lg`}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{config.icon}</span>
                            <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                        </div>
                        <p className="text-2xl font-bold mb-1 text-gray-800">{template.descrizione}</p>
                        <p className={`text-3xl font-bold mb-2 ${config.color}`}>€ {parseFloat(template.importoStimato).toFixed(2)}</p>
                        <p className="text-sm text-gray-700">{template.categoria}</p>
                        
                        <div className="border-t border-gray-300 pt-3 mt-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Frequenza:</span>
                                <span className="font-medium text-gray-800">
                                    {template.frequenza === 'mensile' 
                                        ? `Mensile (giorno ${template.giornoMese})` 
                                        : template.frequenza === 'bimestrale'
                                        ? `Bimestrale (giorno ${template.giornoMese})`
                                        : `Annuale (${template.giornoAnno}/${template.meseAnno})`
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between text-sm mt-2">
                                <span className="text-gray-600">Prossima scadenza:</span>
                                <span className="font-medium text-gray-800">
                                    {new Date(template.prossimaScadenza).toLocaleDateString('it-IT')}
                                </span>
                            </div>
                        </div>
                        
                        {template.nota && (
                            <div className="border-t border-gray-300 pt-3 mt-3">
                                <p className="text-sm text-gray-600">Nota:</p>
                                <p className="text-sm mt-1 text-gray-800">{template.nota}</p>
                            </div>
                        )}
                    </div>

                    {/* Storico */}
                    <div className="mb-4">
                        <h3 className="font-bold text-gray-700 mb-3 flex items-center">
                            📊 Storico
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                (ultimi 12 inserimenti)
                            </span>
                        </h3>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        ) : (
                            <>
                                {transactions.length === 0 && mesiMancanti.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <p className="text-3xl mb-2">📭</p>
                                        <p>Nessuna transazione inserita ancora</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {transactions.map(transaction => (
                                            <div key={transaction.id} className={`${config.bg} border ${config.border} rounded-lg p-3`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={config.color}>✅</span>
                                                            <p className="font-medium text-gray-800">
                                                                {new Date(transaction.data).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Inserita il {new Date(transaction.data).toLocaleDateString('it-IT')}
                                                        </p>
                                                    </div>
                                                    <p className={`text-lg font-bold ${config.color}`}>
                                                        € {parseFloat(transaction.importo).toFixed(2)}
                                                    </p>
                                                </div>
                                                {transaction.nota && (
                                                    <p className="text-xs text-gray-600 mt-2 pl-6">
                                                        📝 {transaction.nota}
                                                    </p>
                                                )}
                                            </div>
                                        ))}

                                        {mesiMancanti.map(mese => (
                                            <div key={mese.chiave} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">⏭️</span>
                                                    <p className="font-medium text-gray-600">{mese.data}</p>
                                                    <span className="text-xs text-gray-500 ml-auto">Saltato</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {transactions.length > 0 && (
                                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-blue-900 font-medium">Totale transazioni:</span>
                                            <span className="text-blue-900 font-bold">{transactions.length}</span>
                                        </div>
                                        <div className="flex justify-between text-sm mt-1">
                                            <span className="text-blue-900 font-medium">Somma totale:</span>
                                            <span className="text-blue-900 font-bold">
                                                € {transactions.reduce((acc, t) => acc + parseFloat(t.importo), 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm mt-1">
                                            <span className="text-blue-900 font-medium">Media importo:</span>
                                            <span className="text-blue-900 font-bold">
                                                € {(transactions.reduce((acc, t) => acc + parseFloat(t.importo), 0) / transactions.length).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
}
