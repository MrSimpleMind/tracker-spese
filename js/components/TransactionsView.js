function TransactionsView({ transactions, categorie, filtroCategoria, setFiltroCategoria, showAddTransaction, setShowAddTransaction, showGrafico, setShowGrafico, editingTransaction, setEditingTransaction }) {
    const [ordinamento, setOrdinamento] = React.useState('data-recente');
    const [showTemplateModal, setShowTemplateModal] = React.useState(false);
    const [templateToInsert, setTemplateToInsert] = React.useState(null);
    const [showFiltersModal, setShowFiltersModal] = React.useState(false);
    const [meseSelezionato, setMeseSelezionato] = React.useState(new Date());
    const [detailTransaction, setDetailTransaction] = React.useState(null);
    
    // Filtra categorie attive (non archiviate)
    const categorieAttive = categorie.filter(cat => !cat.archiviato);
    
    // Filtra transazioni per mese e categoria
    const transactionsFiltrate = React.useMemo(() => {
        let filtrate = transactions;
        
        // Filtro per mese selezionato
        const meseCorrente = meseSelezionato.getMonth();
        const annoCorrente = meseSelezionato.getFullYear();
        filtrate = filtrate.filter(t => {
            const dataTransaction = new Date(t.data);
            return dataTransaction.getMonth() === meseCorrente && dataTransaction.getFullYear() === annoCorrente;
        });
        
        // Filtro categoria
        if (filtroCategoria !== 'tutte') {
            filtrate = filtrate.filter(t => t.categoria === filtroCategoria);
        }
        
        return filtrate;
    }, [transactions, filtroCategoria, meseSelezionato]);

    // Ordina le transazioni filtrate
    const transactionsOrdinate = [...transactionsFiltrate].sort((a, b) => {
        switch (ordinamento) {
            case 'data-recente':
                return new Date(b.data) - new Date(a.data);
            case 'data-vecchia':
                return new Date(a.data) - new Date(b.data);
            case 'importo-alto':
                return parseFloat(b.importo) - parseFloat(a.importo);
            case 'importo-basso':
                return parseFloat(a.importo) - parseFloat(b.importo);
            default:
                return 0;
        }
    });

    // Navigazione mesi
    const mesePrecedente = () => {
        setMeseSelezionato(new Date(meseSelezionato.getFullYear(), meseSelezionato.getMonth() - 1, 1));
    };

    const meseSuccessivo = () => {
        setMeseSelezionato(new Date(meseSelezionato.getFullYear(), meseSelezionato.getMonth() + 1, 1));
    };

    const nomiMesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

    // Calcolo totale spese del mese
    const totaleSpese = transactionsFiltrate.reduce((acc, t) => acc + parseFloat(t.importo), 0);

    // Formattazione importo
    const formatMoney = (num) => {
        return num % 1 === 0 ? `€${num.toFixed(0)}` : `€${num.toFixed(2)}`;
    };

    const eliminaTransaction = async (id) => {
        if (!confirm('Sei sicuro di voler eliminare questa spesa?')) return;
        await db.collection('transactions').doc(id).delete();
    };

    // Verifica se ci sono filtri attivi
    const hasFiltriAttivi = filtroCategoria !== 'tutte' || ordinamento !== 'data-recente';

    return (
        <div className="fade-in">
            {/* Header con selettore mese */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                {/* Navigatore mese */}
                <div className="flex items-center justify-between py-3 px-4 border-b border-gray-100">
                    <button 
                        onClick={mesePrecedente}
                        className="text-gray-600 hover:text-gray-900 p-2"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    
                    <h2 className="text-lg font-semibold text-gray-900">
                        {nomiMesi[meseSelezionato.getMonth()]}, {meseSelezionato.getFullYear()}
                    </h2>
                    
                    <button 
                        onClick={meseSuccessivo}
                        className="text-gray-600 hover:text-gray-900 p-2"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Totale spese del mese */}
                <div className="px-4 py-4">
                    <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Totale Spese</p>
                        <p className="text-3xl font-bold text-red-600">
                            {formatMoney(totaleSpese)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {transactionsFiltrate.length} {transactionsFiltrate.length === 1 ? 'spesa' : 'spese'}
                        </p>
                    </div>

                    {/* Pulsanti grafico e filtri */}
                    <div className="flex items-center justify-center gap-4 pt-3 border-t border-gray-100 mt-3">
                        <button
                            onClick={() => setShowGrafico(true)}
                            className="flex items-center gap-1.5 py-2 text-sm text-gray-600 hover:text-gray-700 font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                            <span>Andamento</span>
                        </button>
                        
                        <button
                            onClick={() => setShowFiltersModal(true)}
                            className={`flex items-center gap-1.5 py-2 text-sm font-medium ${
                                hasFiltriAttivi ? 'text-blue-600' : 'text-gray-600 hover:text-gray-700'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            <span>Filtri</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Pulsanti inserimento */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                    onClick={() => {
                        setTemplateToInsert(null);
                        setShowAddTransaction(true);
                    }}
                    className="bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 shadow flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Aggiungi Spesa</span>
                </button>
                <button
                    onClick={() => setShowTemplateModal(true)}
                    className="bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 shadow flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Ricorrenti</span>
                </button>
            </div>

            {/* Lista spese */}
            <div className="divide-y divide-gray-200 bg-white rounded-lg shadow-sm">
                {transactionsOrdinate.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-4xl mb-2">📭</p>
                        <p>Nessuna spesa registrata questo mese</p>
                    </div>
                ) : (
                    transactionsOrdinate.map(transaction => {
                        const categoria = categorie.find(c => c.nome === transaction.categoria);
                        const emojiCategoria = categoria?.emoji || '💸';
                        
                        return (
                            <div 
                                key={transaction.id} 
                                onClick={() => setDetailTransaction(transaction)}
                                className="py-3 px-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    {/* Info spesa */}
                                    <div className="flex-1 min-w-0">
                                        {/* Descrizione come titolo */}
                                        <p className="text-base font-bold text-gray-900 truncate mb-1">
                                            {transaction.descrizione}
                                        </p>
                                        
                                        {/* Categoria */}
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <span>{emojiCategoria}</span>
                                            <span>{transaction.categoria}</span>
                                            {transaction.isRicorrente && (
                                                <span className="text-orange-500" title="Spesa ricorrente">🔁</span>
                                            )}
                                        </div>
                                        
                                        {/* Data */}
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {new Date(transaction.data).toLocaleDateString('it-IT', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    
                                    {/* Importo e icona */}
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-bold text-red-600 whitespace-nowrap">
                                            €{parseFloat(transaction.importo).toFixed(2)}
                                        </p>
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modale Dettaglio */}
            {detailTransaction && (
                <DettaglioTransazioneModal
                    transaction={detailTransaction}
                    onClose={() => setDetailTransaction(null)}
                    onEdit={setEditingTransaction}
                    onDelete={eliminaTransaction}
                    categorie={categorie}
                />
            )}

            {/* Modale Filtri */}
            {showFiltersModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">🔍 Filtri e ordinamento</h3>
                            <button onClick={() => setShowFiltersModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                        </div>
                        
                        <div className="p-4 space-y-6">
                            {categorieAttive.length > 0 && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">Categoria</label>
                                    <select
                                        value={filtroCategoria}
                                        onChange={(e) => setFiltroCategoria(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                                    >
                                        <option value="tutte">Tutte le categorie</option>
                                        {categorieAttive.map(cat => (
                                            <option key={cat.id} value={cat.nome}>
                                                {cat.emoji ? `${cat.emoji} ` : ''}{cat.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">Ordinamento</label>
                                <select
                                    value={ordinamento}
                                    onChange={(e) => setOrdinamento(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                                >
                                    <option value="data-recente">📅 Data (più recente)</option>
                                    <option value="data-vecchia">📅 Data (più vecchia)</option>
                                    <option value="importo-alto">💰 Importo (più alto)</option>
                                    <option value="importo-basso">💰 Importo (più basso)</option>
                                </select>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setFiltroCategoria('tutte');
                                        setOrdinamento('data-recente');
                                    }}
                                    className="flex-1 py-3 px-4 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                                >
                                    Ripristina
                                </button>
                                <button
                                    onClick={() => setShowFiltersModal(false)}
                                    className="flex-1 py-3 px-4 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    Applica
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showAddTransaction && (
                <AddTransactionModal 
                    onClose={() => {
                        setShowAddTransaction(false);
                        setTemplateToInsert(null);
                    }}
                    categorie={categorie}
                    fromTemplate={templateToInsert}
                />
            )}

            {editingTransaction && (
                <EditTransactionModal 
                    transaction={editingTransaction}
                    onClose={() => setEditingTransaction(null)}
                    categorie={categorie}
                />
            )}

            {showGrafico && (
                <GraficoAndamentoModal 
                    transactions={transactions}
                    onClose={() => setShowGrafico(false)}
                />
            )}

            {showTemplateModal && (
                <TemplateRicorrentiModal 
                    onClose={() => setShowTemplateModal(false)}
                    categorie={categorie}
                    onInsertFromTemplate={(template) => {
                        setShowTemplateModal(false);
                        setTemplateToInsert(template);
                        setShowAddTransaction(true);
                    }}
                />
            )}
        </div>
    );
}
