function TransactionsView({ transactions, categorie, filtroTipo, setFiltroTipo, filtroCategoria, setFiltroCategoria, showAddTransaction, setShowAddTransaction, showGrafico, setShowGrafico, editingTransaction, setEditingTransaction }) {
    const [ordinamento, setOrdinamento] = React.useState('data-recente');
    const [showTemplateModal, setShowTemplateModal] = React.useState(false);
    const [templateToInsert, setTemplateToInsert] = React.useState(null);
    
    // Filtra per tipo E categoria
    const transactionsFiltrate = React.useMemo(() => {
        let filtrate = transactions;
        
        // Filtro tipo
        if (filtroTipo !== 'tutte') {
            filtrate = filtrate.filter(t => t.tipo === filtroTipo);
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

    // Calcoli per il mese corrente
    const oggi = new Date();
    const meseCorrente = oggi.getMonth();
    const annoCorrente = oggi.getFullYear();
    
    const transactionsQuestoMese = transactions.filter(t => {
        const dataTransaction = new Date(t.data);
        return dataTransaction.getMonth() === meseCorrente && dataTransaction.getFullYear() === annoCorrente;
    });
    
    const transactionsMeseScorso = transactions.filter(t => {
        const dataTransaction = new Date(t.data);
        const meseScorso = meseCorrente === 0 ? 11 : meseCorrente - 1;
        const annoMeseScorso = meseCorrente === 0 ? annoCorrente - 1 : annoCorrente;
        return dataTransaction.getMonth() === meseScorso && dataTransaction.getFullYear() === annoMeseScorso;
    });
    
    // Separa per tipo per i calcoli
    const speseQuestoMese = transactionsQuestoMese.filter(t => t.tipo === 'spesa');
    const entrateQuestoMese = transactionsQuestoMese.filter(t => t.tipo === 'entrata');
    const accumuliQuestoMese = transactionsQuestoMese.filter(t => t.tipo === 'accumulo');
    
    const speseMeseScorso = transactionsMeseScorso.filter(t => t.tipo === 'spesa');
    const entrateMeseScorso = transactionsMeseScorso.filter(t => t.tipo === 'entrata');
    
    const totaleSpese = speseQuestoMese.reduce((acc, t) => acc + parseFloat(t.importo), 0);
    const totaleEntrate = entrateQuestoMese.reduce((acc, t) => acc + parseFloat(t.importo), 0);
    const totaleAccumuli = accumuliQuestoMese.reduce((acc, t) => acc + parseFloat(t.importo), 0);
    
    const totaleSpeseMeseScorso = speseMeseScorso.reduce((acc, t) => acc + parseFloat(t.importo), 0);
    const totaleEntrateMeseScorso = entrateMeseScorso.reduce((acc, t) => acc + parseFloat(t.importo), 0);
    
    // Cash flow: Entrate - Spese (accumuli neutrali)
    const cashFlowQuestoMese = totaleEntrate - totaleSpese;
    const cashFlowMeseScorso = totaleEntrateMeseScorso - totaleSpeseMeseScorso;
    const differenzaCashFlow = cashFlowQuestoMese - cashFlowMeseScorso;
    const percentualeCashFlow = cashFlowMeseScorso !== 0 ? ((differenzaCashFlow / Math.abs(cashFlowMeseScorso)) * 100).toFixed(1) : 0;

    // Totale transazioni filtrate (per visualizzazione)
    const totaleFiltrato = transactionsFiltrate.reduce((acc, t) => {
        if (t.tipo === 'spesa') return acc - parseFloat(t.importo);
        if (t.tipo === 'entrata') return acc + parseFloat(t.importo);
        return acc; // accumuli neutrali nel totale visualizzato
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

    return (
        <div className="fade-in">
            {/* Filtri per tipo */}
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                <button
                    onClick={() => setFiltroTipo('tutte')}
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${filtroTipo === 'tutte' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                    Tutte
                </button>
                {Object.entries(tipoConfig).map(([key, config]) => (
                    <button
                        key={key}
                        onClick={() => setFiltroTipo(key)}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium flex items-center gap-1 ${
                            filtroTipo === key 
                                ? `${config.bgColor} text-white` 
                                : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                    </button>
                ))}
            </div>

            {/* Filtri per categoria */}
            {categorie.length > 0 && (
                <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                    <button
                        onClick={() => setFiltroCategoria('tutte')}
                        className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium ${filtroCategoria === 'tutte' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        Tutte le categorie
                    </button>
                    {categorie.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setFiltroCategoria(cat.nome)}
                            className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium ${filtroCategoria === cat.nome ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                            {cat.nome}
                        </button>
                    ))}
                </div>
            )}

            {/* Summary Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 mb-4 shadow-lg">
                {filtroTipo === 'tutte' && filtroCategoria === 'tutte' ? (
                    <>
                        <div className="mb-3">
                            <p className="text-xs opacity-90 mb-1">Questo mese</p>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <p className="text-xs opacity-75">💰 Entrate</p>
                                    <p className="text-lg font-bold">€ {totaleEntrate.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-xs opacity-75">💸 Spese</p>
                                    <p className="text-lg font-bold">€ {totaleSpese.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-xs opacity-75">🏦 Accumuli</p>
                                    <p className="text-lg font-bold">€ {totaleAccumuli.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="border-t border-blue-500 pt-3">
                            <p className="text-xs opacity-75 mb-1">💵 Cash Flow</p>
                            <p className={`text-3xl font-bold ${cashFlowQuestoMese >= 0 ? 'text-white' : 'text-red-200'}`}>
                                {cashFlowQuestoMese >= 0 ? '+' : ''}€ {cashFlowQuestoMese.toFixed(2)}
                            </p>
                            {cashFlowMeseScorso !== 0 && (
                                <div className={`text-center py-2 px-3 rounded mt-2 ${differenzaCashFlow >= 0 ? 'bg-green-500' : 'bg-red-500'} bg-opacity-30`}>
                                    <span className="font-bold">
                                        {differenzaCashFlow >= 0 ? '↑' : '↓'} {Math.abs(percentualeCashFlow)}%
                                    </span>
                                    <span className="text-xs ml-2">
                                        vs mese scorso
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        <button
                            onClick={() => setShowGrafico(true)}
                            className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 py-2 px-4 rounded text-sm font-medium mt-3"
                        >
                            📊 Mostra Andamento
                        </button>
                    </>
                ) : (
                    <>
                        <p className="text-xs opacity-90 mb-1">
                            {filtroTipo !== 'tutte' ? tipoConfig[filtroTipo].label : 'Tutte'} 
                            {filtroCategoria !== 'tutte' ? ` - ${filtroCategoria}` : ''}
                        </p>
                        <p className="text-3xl font-bold">
                            {totaleFiltrato >= 0 ? '+' : ''}€ {Math.abs(totaleFiltrato).toFixed(2)}
                        </p>
                        <p className="text-xs opacity-75 mt-1">{transactionsFiltrate.length} transazioni</p>
                    </>
                )}
            </div>

            {/* Pulsanti inserimento */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                <button
                    onClick={() => {
                        setTemplateToInsert({ tipo: 'spesa' });
                        setShowAddTransaction(true);
                    }}
                    className="bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 shadow text-sm"
                >
                    <span className="text-xl block">💸</span>
                    Spesa
                </button>
                <button
                    onClick={() => {
                        setTemplateToInsert({ tipo: 'entrata' });
                        setShowAddTransaction(true);
                    }}
                    className="bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 shadow text-sm"
                >
                    <span className="text-xl block">💰</span>
                    Entrata
                </button>
                <button
                    onClick={() => {
                        setTemplateToInsert({ tipo: 'accumulo' });
                        setShowAddTransaction(true);
                    }}
                    className="bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 shadow text-sm"
                >
                    <span className="text-xl block">🏦</span>
                    Accumulo
                </button>
                <button
                    onClick={() => setShowTemplateModal(true)}
                    className="bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 shadow text-sm"
                >
                    <span className="text-xl block">⚙️</span>
                    Template
                </button>
            </div>

            {/* Ordinamento */}
            {transactionsFiltrate.length > 0 && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        🔄 Ordina per:
                    </label>
                    <select
                        value={ordinamento}
                        onChange={(e) => setOrdinamento(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                    >
                        <option value="data-recente">📅 Data (più recente)</option>
                        <option value="data-vecchia">📅 Data (più vecchia)</option>
                        <option value="importo-alto">💰 Importo (più alto)</option>
                        <option value="importo-basso">💰 Importo (più basso)</option>
                    </select>
                </div>
            )}

            {/* Lista transazioni */}
            <div className="space-y-3">
                {transactionsOrdinate.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-4xl mb-2">📭</p>
                        <p>Nessuna transazione registrata</p>
                    </div>
                ) : (
                    transactionsOrdinate.map(transaction => {
                        const config = tipoConfig[transaction.tipo || 'spesa'];
                        
                        return (
                            <div key={transaction.id} className={`bg-white rounded-lg p-4 shadow border-l-4 ${config.border}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">{config.icon}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${config.lightBg} ${config.color} font-medium`}>
                                                {config.label}
                                            </span>
                                        </div>
                                        <p className="font-bold text-lg text-gray-800">{transaction.descrizione}</p>
                                        <p className="text-sm text-gray-500">{transaction.categoria}</p>
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                        <button
                                            onClick={() => setEditingTransaction(transaction)}
                                            className="text-blue-500 hover:text-blue-700 p-1"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => eliminaTransaction(transaction.id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-xs text-gray-400">
                                        {new Date(transaction.data).toLocaleDateString('it-IT')}
                                        {transaction.nota && <p className="mt-1 text-gray-500">{transaction.nota}</p>}
                                    </div>
                                    <p className={`text-2xl font-bold ${config.color}`}>
                                        {transaction.tipo === 'entrata' ? '+' : transaction.tipo === 'spesa' ? '-' : ''}
                                        € {parseFloat(transaction.importo).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

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
