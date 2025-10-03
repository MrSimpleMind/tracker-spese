function DettaglioTemplateModal({ template, onClose }) {
    const [spese, setSpese] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        // Carica le spese collegate a questo template
        const unsubscribe = db.collection('spese')
            .where('templateId', '==', template.id)
            .orderBy('data', 'desc')
            .limit(12)
            .onSnapshot(snapshot => {
                const speseData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setSpese(speseData);
                setLoading(false);
            });
        
        return unsubscribe;
    }, [template.id]);

    // Calcola i mesi mancanti (saltati)
    const getMesiMancanti = () => {
        if (spese.length === 0 || template.frequenza !== 'mensile') return [];
        
        const mesiInseriti = spese.map(s => {
            const data = new Date(s.data);
            return `${data.getFullYear()}-${data.getMonth()}`;
        });
        
        const mesiMancanti = [];
        const oggi = new Date();
        const ultimaSpesa = spese[spese.length - 1];
        const dataInizio = ultimaSpesa ? new Date(ultimaSpesa.data) : oggi;
        
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

    const navigateToSpesa = (spesaId) => {
        // Chiudi modale e scrollа alla spesa (da implementare)
        onClose();
        // TODO: highlight spesa nella lista
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[60]">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Dettagli Template</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                <div className="p-4">
                    {/* Info Template */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 mb-4 shadow-lg">
                        <p className="text-2xl font-bold mb-1">{template.descrizione}</p>
                        <p className="text-3xl font-bold mb-2">€ {parseFloat(template.importoStimato).toFixed(2)}</p>
                        <p className="text-sm opacity-90">{template.categoria}</p>
                        
                        <div className="border-t border-blue-500 pt-3 mt-3">
                            <div className="flex justify-between text-sm">
                                <span className="opacity-75">Frequenza:</span>
                                <span className="font-medium">
                                    {template.frequenza === 'mensile' 
                                        ? `Mensile (giorno ${template.giornoMese})` 
                                        : `Annuale (${template.giornoAnno}/${template.meseAnno})`
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between text-sm mt-2">
                                <span className="opacity-75">Prossima scadenza:</span>
                                <span className="font-medium">
                                    {new Date(template.prossimaScadenza).toLocaleDateString('it-IT')}
                                </span>
                            </div>
                        </div>
                        
                        {template.nota && (
                            <div className="border-t border-blue-500 pt-3 mt-3">
                                <p className="text-sm opacity-75">Nota:</p>
                                <p className="text-sm mt-1">{template.nota}</p>
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
                                {spese.length === 0 && mesiMancanti.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <p className="text-3xl mb-2">📭</p>
                                        <p>Nessuna spesa inserita ancora</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {/* Mescola spese e mesi mancanti in ordine cronologico */}
                                        {spese.map(spesa => (
                                            <div key={spesa.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-green-600">✅</span>
                                                            <p className="font-medium text-gray-800">
                                                                {new Date(spesa.data).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Inserita il {new Date(spesa.data).toLocaleDateString('it-IT')}
                                                        </p>
                                                    </div>
                                                    <p className="text-lg font-bold text-green-700">
                                                        € {parseFloat(spesa.importo).toFixed(2)}
                                                    </p>
                                                </div>
                                                {spesa.nota && (
                                                    <p className="text-xs text-gray-600 mt-2 pl-6">
                                                        📝 {spesa.nota}
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

                                {spese.length > 0 && (
                                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-blue-900 font-medium">Totale spese:</span>
                                            <span className="text-blue-900 font-bold">{spese.length}</span>
                                        </div>
                                        <div className="flex justify-between text-sm mt-1">
                                            <span className="text-blue-900 font-medium">Somma totale:</span>
                                            <span className="text-blue-900 font-bold">
                                                € {spese.reduce((acc, s) => acc + parseFloat(s.importo), 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm mt-1">
                                            <span className="text-blue-900 font-medium">Media importo:</span>
                                            <span className="text-blue-900 font-bold">
                                                € {(spese.reduce((acc, s) => acc + parseFloat(s.importo), 0) / spese.length).toFixed(2)}
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
