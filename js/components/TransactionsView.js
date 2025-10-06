function TransactionsView({ transactions, categorie, filtroTipo, setFiltroTipo, filtroCategoria, setFiltroCategoria, showAddTransaction, setShowAddTransaction, showGrafico, setShowGrafico, editingTransaction, setEditingTransaction }) {
    const [ordinamento, setOrdinamento] = React.useState('data-recente');
    const [showTemplateModal, setShowTemplateModal] = React.useState(false);
    const [templateToInsert, setTemplateToInsert] = React.useState(null);
    const [showFiltersModal, setShowFiltersModal] = React.useState(false);
    const [meseSelezionato, setMeseSelezionato] = React.useState(new Date());
    
    // Filtra categorie attive (non archiviati) per i filtri
    const categorieAttive = categorie.filter(cat => !cat.archiviato);
    
    // Il filtro tipo ora è un array di tipi selezionati
    const transactionsFiltrate = React.useMemo(() => {
        let filtrate = transactions;
        
        // Filtro tipo (selezione multipla)
        if (filtroTipo && filtroTipo.length > 0) {
            filtrate = filtrate.filter(t => filtroTipo.includes(t.tipo));
        }
        
        // Filtro categoria
        if (filtroCategoria !== 'tutte') {
            filtrate = filtrate.filter(t => t.categoria === filtroCategoria);
        }
        
        return filtrate;
    }, [transactions, filtroTipo, filtroCategoria]);

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

    // Funzioni per navigare i mesi
    const mesePrecedente = () => {
        setMeseSelezionato(new Date(meseSelezionato.getFullYear(), meseSelezionato.getMonth() - 1, 1));
    };

    const meseSuccessivo = () => {
        setMeseSelezionato(new Date(meseSelezionato.getFullYear(), meseSelezionato.getMonth() + 1, 1));
    };

    const nomiMesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

    // Calcoli per il mese selezionato
    const meseCorrente = meseSelezionato.getMonth();
    const annoCorrente = meseSelezionato.getFullYear();
    
    const transactionsMeseSelezionato = transactions.filter(t => {
        const dataTransaction = new Date(t.data);
        return dataTransaction.getMonth() === meseCorrente && dataTransaction.getFullYear() === annoCorrente;
    });
    
    // Separa per tipo per i calcoli
    const speseMese = transactionsMeseSelezionato.filter(t => t.tipo === 'spesa');
    const entrateMese = transactionsMeseSelezionato.filter(t => t.tipo === 'entrata');
    
    const totaleSpese = speseMese.reduce((acc, t) => acc + parseFloat(t.importo), 0);
    const totaleEntrate = entrateMese.reduce((acc, t) => acc + parseFloat(t.importo), 0);
    const saldo = totaleEntrate - totaleSpese;

    // Funzione per formattare i numeri (rimuove .00 se non necessario)
    const formatMoney = (num) => {
        return num % 1 === 0 ? `€${num.toFixed(0)}` : `€${num.toFixed(2)}`;
    };

    // Totale transazioni filtrate (per visualizzazione)
    const totaleFiltrato = transactionsFiltrate.reduce((acc, t) => {
        if (t.tipo === 'spesa') return acc - parseFloat(t.importo);
        if (t.tipo === 'entrata') return acc + parseFloat(t.importo);
        return acc;
    }, 0);

    const eliminaTransaction = async (id) => {
        if (confirm('Vuoi eliminare questa transazione?')) {
            await db.collection('transactions').doc(id).delete();
        }
    };

    const tipoConfig = {
        spesa: { label: 'Spese', icon: '💸', color: 'text-red-600', bgColor: 'bg-red-500', lightBg: 'bg-red-50', border: 'border-red-500' },
        entrata: { label: 'Entrate', icon: '💰', color: 'text-green-600', bgColor: 'bg-green-500', lightBg: 'bg-green-50', border: 'border-green-500' },
        accumulo: { label: 'Accumuli', icon: '🏦', color: 'text-blue-600', bgColor: 'bg-blue-500', lightBg: 'bg-blue-50', border: 'border-blue-500' }
    };

    // Controlla se ci sono filtri attivi
    const hasFiltriAttivi = (filtroTipo && filtroTipo.length > 0 && filtroTipo.length < 3) || filtroCategoria !== 'tutte' || ordinamento !== 'data-recente';

    return (
        <div className="fade-in">
            {/* Header con selettore mese e filtri - STILE MINIMALE */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                {/* Navigatore mese */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <button 
                        onClick={mesePrecedente}
                        className="text-gray-600 hover:text-gray-900 p-2"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    
                    <h2 className="text-lg font-semibold text-gray-900">
                        {nomiMesi[meseCorrente]}, {annoCorrente}
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

                {/* Statistiche mese - OTTIMIZZATO */}
                <div className="p-4">
                    {/* Numeri - Occupano tutto lo spazio disponibile */}
                    <div className="grid grid-cols-3 gap-3 text-center mb-3">
                        {/* Spese */}
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Spese</p>
                            <p className="text-base font-bold text-red-600">
                                {formatMoney(totaleSpese)}
                            </p>
                        </div>
                        
                        {/* Entrate */}
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Entrate</p>
                            <p className="text-base font-bold text-green-600">
                                {formatMoney(totaleEntrate)}
                            </p>
                        </div>
                        
                        {/* Saldo */}
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Saldo</p>
                            <p className={`text-base font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {saldo >= 0 ? '+' : ''}{formatMoney(Math.abs(saldo))}
                            </p>
                        </div>
                    </div>

                    {/* Pulsanti grafico e filtri - sulla stessa riga */}
                    <div className="flex items-center justify-center gap-4 pt-2 border-t border-gray-100">
                        <button
                            onClick={() => setShowGrafico(true)}
                            className="flex items-center gap-1.5 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            <span>📊</span>
                            <span>Mostra andamento</span>
                        </button>
                        
                        <button
                            onClick={() => setShowFiltersModal(true)}
                            className={`flex items-center gap-1.5 py-2 text-sm font-medium ${
                                hasFiltriAttivi 
                                    ? 'text-blue-600' 
                                    : 'text-gray-600 hover:text-gray-700'
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

            {/* Pulsanti inserimento - PIÙ COMPATTI */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                    onClick={() => {
                        setTemplateToInsert(null);
                        setShowAddTransaction(true);
                    }}
                    className="bg-blue-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-600 shadow flex items-center justify-center gap-2"
                >
                    <span className="text-xl">➕</span>
                    <span>Aggiungi</span>
                </button>
                <button
                    onClick={() => setShowTemplateModal(true)}
                    className="bg-gray-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-gray-700 shadow flex items-center justify-center gap-2"
                >
                    <span className="text-xl">⚙️</span>
                    <span>Template</span>
                </button>
            </div>

            {/* Lista transazioni - CARD OTTIMIZZATE */}
            <div className="space-y-2">
                {transactionsOrdinate.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-4xl mb-2">📭</p>
                        <p>Nessuna transazione registrata</p>
                    </div>
                ) : (
                    transactionsOrdinate.map(transaction => {
                        const config = tipoConfig[transaction.tipo || 'spesa'];
                        
                        // Badge speciale per accumuli
                        let accumuloBadge = null;
                        if (transaction.tipo === 'accumulo') {
                            const isVersamento = transaction.tipoOperazioneAccumulo === 'versamento';
                            accumuloBadge = {
                                label: isVersamento ? '➕ Versamento' : '➖ Prelievo',
                                bg: isVersamento ? 'bg-green-100' : 'bg-orange-100',
                                color: isVersamento ? 'text-green-800' : 'text-orange-800'
                            };
                        }
                        
                        return (
                            <div key={transaction.id} className={`bg-white rounded-lg p-3 shadow-sm border-l-4 ${config.border}`}>
                                {/* Prima riga: Badge + Descrizione + Importo + Azioni */}
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${config.lightBg} ${config.color} font-medium whitespace-nowrap`}>
                                                {config.icon} {config.label}
                                            </span>
                                            {accumuloBadge && (
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${accumuloBadge.bg} ${accumuloBadge.color} font-medium whitespace-nowrap`}>
                                                    {accumuloBadge.label}
                                                </span>
                                            )}
                                        </div>
                                        <p className="font-bold text-base text-gray-800 truncate">{transaction.descrizione}</p>
                                    </div>
                                    
                                    {/* Importo e azioni */}
                                    <div className="flex items-start gap-2">
                                        <p className={`text-lg font-bold ${config.color} whitespace-nowrap`}>
                                            {transaction.tipo === 'entrata' ? '+' : transaction.tipo === 'spesa' ? '-' : ''}
                                            €{parseFloat(transaction.importo).toFixed(2)}
                                        </p>
                                        <div className="flex gap-0.5">
                                            <button
                                                onClick={() => setEditingTransaction(transaction)}
                                                className="text-blue-500 hover:text-blue-700 p-1 text-sm"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => eliminaTransaction(transaction.id)}
                                                className="text-red-500 hover:text-red-700 p-1 text-sm"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Seconda riga: Categoria + Data */}
                                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                    <span>{transaction.categoria}</span>
                                    <span>•</span>
                                    <span>{new Date(transaction.data).toLocaleDateString('it-IT')}</span>
                                </div>
                                
                                {/* Nota se presente */}
                                {transaction.nota && (
                                    <p className="text-xs text-gray-600 mt-1.5 italic">{transaction.nota}</p>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modale Filtri */}
            {showFiltersModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">🔍 Filtri e ordinamento</h3>
                            <button
                                onClick={() => setShowFiltersModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-6">
                            {/* Filtro tipo operazione - SELEZIONE MULTIPLA */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">
                                    Tipo di operazione
                                </label>
                                <div className="space-y-2">
                                    {Object.entries(tipoConfig).map(([key, config]) => {
                                        const isSelected = filtroTipo && filtroTipo.includes(key);
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    if (!filtroTipo || filtroTipo.length === 0) {
                                                        setFiltroTipo([key]);
                                                    } else if (isSelected) {
                                                        const newFiltro = filtroTipo.filter(t => t !== key);
                                                        setFiltroTipo(newFiltro.length === 0 ? [] : newFiltro);
                                                    } else {
                                                        setFiltroTipo([...filtroTipo, key]);
                                                    }
                                                }}
                                                className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-between border-2 transition-all ${
                                                    isSelected
                                                        ? `${config.bgColor} text-white border-transparent`
                                                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className={isSelected ? '' : 'opacity-50'}>{config.icon}</span>
                                                    <span>{config.label}</span>
                                                </div>
                                                {isSelected && <span className="text-xl">✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                                {filtroTipo && filtroTipo.length > 0 && (
                                    <button
                                        onClick={() => setFiltroTipo([])}
                                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                                    >
                                        Mostra tutte le operazioni
                                    </button>
                                )}
                            </div>

                            {/* Filtro categoria */}
                            {categorieAttive.length > 0 && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">
                                        Categoria
                                    </label>
                                    <select
                                        value={filtroCategoria}
                                        onChange={(e) => setFiltroCategoria(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                                    >
                                        <option value="tutte">Tutte le categorie</option>
                                        {categorieAttive.map(cat => (
                                            <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Ordinamento */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">
                                    Ordinamento
                                </label>
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

                            {/* Pulsanti azione */}
                            <div className="flex gap-2 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setFiltroTipo([]);
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
