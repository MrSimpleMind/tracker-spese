function TransactionsView({ transactions, categorie, filtroTipo, setFiltroTipo, filtroCategoria, setFiltroCategoria, showAddTransaction, setShowAddTransaction, showGrafico, setShowGrafico, editingTransaction, setEditingTransaction }) {
    const [ordinamento, setOrdinamento] = React.useState('data-recente');
    const [showTemplateModal, setShowTemplateModal] = React.useState(false);
    const [templateToInsert, setTemplateToInsert] = React.useState(null);
    const [showFiltersModal, setShowFiltersModal] = React.useState(false);
    const [meseSelezionato, setMeseSelezionato] = React.useState(new Date());
    const [detailTransaction, setDetailTransaction] = React.useState(null); // Modale dettaglio
    
    // Filtra categorie attive (non archiviati) per i filtri
    const categorieAttive = categorie.filter(cat => !cat.archiviato);
    
    // Il filtro tipo ora è un array di tipi selezionati
    const transactionsFiltrate = React.useMemo(() => {
        let filtrate = transactions;
        
        // Filtro per mese selezionato
        const meseCorrente = meseSelezionato.getMonth();
        const annoCorrente = meseSelezionato.getFullYear();
        filtrate = filtrate.filter(t => {
            const dataTransaction = new Date(t.data);
            return dataTransaction.getMonth() === meseCorrente && dataTransaction.getFullYear() === annoCorrente;
        });
        
        // Filtro tipo (selezione multipla)
        if (filtroTipo && filtroTipo.length > 0) {
            filtrate = filtrate.filter(t => filtroTipo.includes(t.tipo));
        }
        
        // Filtro categoria
        if (filtroCategoria !== 'tutte') {
            filtrate = filtrate.filter(t => t.categoria === filtroCategoria);
        }
        
        return filtrate;
    }, [transactions, filtroTipo, filtroCategoria, meseSelezionato]);

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

    // Calcola saldi totali dei conti e fondi fino alla fine del mese selezionato
    const calcolaSaldiTotali = React.useMemo(() => {
        const fineDelMese = new Date(meseSelezionato.getFullYear(), meseSelezionato.getMonth() + 1, 0, 23, 59, 59);
        
        // Filtra transazioni fino alla fine del mese
        const transazioniFinoAMese = transactions.filter(t => new Date(t.data) <= fineDelMese);
        
        // Calcola saldo per ogni conto
        const conti = categorie.filter(c => c.tipoContenitore === 'conto' && !c.archiviato);
        let totaleConti = 0;
        
        conti.forEach(conto => {
            const transazioniConto = transazioniFinoAMese.filter(t => t.contoId === conto.id);
            const saldoConto = transazioniConto.reduce((acc, t) => {
                if (t.tipo === 'entrata') return acc + parseFloat(t.importo);
                if (t.tipo === 'spesa') return acc - parseFloat(t.importo);
                return acc;
            }, 0);
            totaleConti += saldoConto;
        });
        
        // Calcola saldo per ogni fondo
        const fondi = categorie.filter(c => (c.isAccumulo || c.tipoContenitore === 'fondo') && !c.archiviato);
        let totaleFondi = 0;
        
        fondi.forEach(fondo => {
            const transazioniFondo = transazioniFinoAMese.filter(t => 
                (t.fondoId === fondo.id) || 
                (t.tipo === 'accumulo' && t.nomeAccumulo === fondo.nome) ||
                (t.tipo === 'movimento_fondo' && t.categoria === fondo.nome)
            );
            const saldoFondo = transazioniFondo.reduce((acc, t) => {
                const tipoMov = t.tipoMovimentoFondo || t.tipoOperazioneAccumulo;
                if (tipoMov === 'versamento') return acc + parseFloat(t.importo);
                if (tipoMov === 'prelievo') return acc - parseFloat(t.importo);
                return acc;
            }, 0);
            totaleFondi += saldoFondo;
        });
        
        return { conti: totaleConti, fondi: totaleFondi };
    }, [transactions, categorie, meseSelezionato]);

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

    const eliminaTransaction = async (id) => {
        await db.collection('transactions').doc(id).delete();
    };

    const tipoConfig = {
        spesa: { label: 'Spese', icon: '💸', color: 'text-red-600', bgColor: 'bg-red-500', lightBg: 'bg-red-50', border: 'border-red-500' },
        entrata: { label: 'Entrate', icon: '💰', color: 'text-green-600', bgColor: 'bg-green-500', lightBg: 'bg-green-50', border: 'border-green-500' },
        movimento_fondo: { label: 'Movimenti Fondo', icon: '🏦', color: 'text-blue-600', bgColor: 'bg-blue-500', lightBg: 'bg-blue-50', border: 'border-blue-500' },
        // Retro-compatibilità
        accumulo: { label: 'Movimenti Fondo', icon: '🏦', color: 'text-blue-600', bgColor: 'bg-blue-500', lightBg: 'bg-blue-50', border: 'border-blue-500' }
    };

    // Controlla se ci sono filtri attivi
    const hasFiltriAttivi = (filtroTipo && filtroTipo.length > 0 && filtroTipo.length < 3) || filtroCategoria !== 'tutte' || ordinamento !== 'data-recente';

    return (
        <div className="fade-in">
            {/* Header con selettore mese e filtri */}
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

                {/* Statistiche mese */}
                <div className="px-4 py-3">
                    <div className="grid grid-cols-3 gap-3 text-center mb-3">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Spese</p>
                            <p className="text-base font-bold text-red-600">
                                {formatMoney(totaleSpese)}
                            </p>
                        </div>
                        
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Entrate</p>
                            <p className="text-base font-bold text-green-600">
                                {formatMoney(totaleEntrate)}
                            </p>
                        </div>
                        
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Saldo</p>
                            <p className={`text-base font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {saldo >= 0 ? '+' : ''}{formatMoney(Math.abs(saldo))}
                            </p>
                        </div>
                    </div>

                    {/* Saldi totali a fine mese */}
                    <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5">
                                <span className="text-gray-500">💳 Conti:</span>
                                <span className={`font-bold ${calcolaSaldiTotali.conti >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    {formatMoney(calcolaSaldiTotali.conti)}
                                </span>
                            </div>
                            <span className="text-gray-300">|</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-gray-500">🏦 Fondi:</span>
                                <span className={`font-bold ${calcolaSaldiTotali.fondi >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    {formatMoney(calcolaSaldiTotali.fondi)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Pulsanti grafico e filtri */}
                    <div className="flex items-center justify-center gap-4 pt-2 border-t border-gray-100 mt-2">
                        <button
                            onClick={() => setShowGrafico(true)}
                            className="flex items-center gap-1.5 py-2 text-sm text-gray-600 hover:text-gray-700 font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                            <span>Mostra andamento</span>
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
                    <span>Aggiungi</span>
                </button>
                <button
                    onClick={() => setShowTemplateModal(true)}
                    className="bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 shadow flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                    <span>Template</span>
                </button>
            </div>

            {/* Lista transazioni */}
            <div className="divide-y divide-gray-200">
                {transactionsOrdinate.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-4xl mb-2">📭</p>
                        <p>Nessuna transazione registrata</p>
                    </div>
                ) : (
                    transactionsOrdinate.map(transaction => {
                        const config = tipoConfig[transaction.tipo || 'spesa'];
                        
                        // Badge speciale per movimenti fondo
                        let movimentoBadge = null;
                        if (transaction.tipo === 'accumulo' || transaction.tipo === 'movimento_fondo') {
                            const tipoMovimento = transaction.tipoMovimentoFondo || transaction.tipoOperazioneAccumulo || 'versamento';
                            const isVersamento = tipoMovimento === 'versamento';
                            const isTrasferimento = transaction.transferGroupId;
                            movimentoBadge = {
                                label: isTrasferimento 
                                    ? (isVersamento ? '🔄 In' : '🔄 Out')
                                    : (isVersamento ? 'Versamento' : 'Prelievo'),
                                icon: isVersamento ? '➕' : '➖'
                            };
                        }
                        
                        return (
                            <div 
                                key={transaction.id} 
                                onClick={() => setDetailTransaction(transaction)}
                                className="bg-white py-3 px-2 cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    {/* Info transazione */}
                                    <div className="flex-1 min-w-0">
                                        {/* Descrizione come titolo principale */}
                                        <p className="text-base font-bold text-gray-900 truncate mb-1">
                                            {transaction.descrizione || transaction.categoria}
                                        </p>
                                        
                                        {/* Metadati secondari */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Categoria */}
                                            <span className="text-xs text-gray-600 flex items-center gap-1">
                                                <span>{config.icon}</span>
                                                <span>{transaction.categoria}</span>
                                            </span>
                                            
                                            {/* Badge movimento fondo */}
                                            {movimentoBadge && (
                                                <span className="text-xs text-gray-500">
                                                    {movimentoBadge.icon} {movimentoBadge.label}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Conto */}
                                        {transaction.contoId && (() => {
                                            const conto = categorie.find(c => c.id === transaction.contoId);
                                            return conto ? (
                                                <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                                                    <span>{conto.emoji || '💳'}</span>
                                                    <span>{conto.nome}</span>
                                                </p>
                                            ) : null;
                                        })()}
                                        {!transaction.contoId && transaction.tipo !== 'movimento_fondo' && transaction.tipo !== 'accumulo' && (
                                            <p className="text-xs text-orange-500 mt-0.5">
                                                🔍 Conto non assegnato
                                            </p>
                                        )}
                                        
                                        {/* Data */}
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {new Date(transaction.data).toLocaleDateString('it-IT')}
                                        </p>
                                    </div>
                                    
                                    {/* Importo e icona */}
                                    <div className="flex items-center gap-2">
                                        <p className={`text-base font-bold ${config.color} whitespace-nowrap`}>
                                            {transaction.tipo === 'entrata' ? '+' : transaction.tipo === 'spesa' ? '-' : ''}
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
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">Tipo di operazione</label>
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
                                    <button onClick={() => setFiltroTipo([])} className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline">
                                        Mostra tutte le operazioni
                                    </button>
                                )}
                            </div>

                            {categorieAttive.length > 0 && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">Categoria</label>
                                    <select
                                        value={filtroCategoria}
                                        onChange={(e) => setFiltroCategoria(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                                    >
                                        <option value="tutte">Tutte le categorie</option>
                                        {categorieAttive.map(cat => <option key={cat.id} value={cat.nome}>{cat.nome}</option>)}
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
