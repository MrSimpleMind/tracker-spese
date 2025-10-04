function AnalyticsView({ transactions }) {
    const [periodoFiltro, setPeriodoFiltro] = React.useState('sempre');
    
    // Filtra transazioni per periodo
    const transactionsFiltrate = React.useMemo(() => {
        const oggi = new Date();
        
        switch (periodoFiltro) {
            case 'mese':
                const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
                return transactions.filter(t => new Date(t.data) >= inizioMese);
            
            case 'tre-mesi':
                const inizioTreMesi = new Date(oggi.getFullYear(), oggi.getMonth() - 2, 1);
                return transactions.filter(t => new Date(t.data) >= inizioTreMesi);
            
            case 'anno':
                const inizioAnno = new Date(oggi.getFullYear(), 0, 1);
                return transactions.filter(t => new Date(t.data) >= inizioAnno);
            
            case 'sempre':
            default:
                return transactions;
        }
    }, [transactions, periodoFiltro]);

    // Separa per tipo
    const spese = transactionsFiltrate.filter(t => t.tipo === 'spesa');
    const entrate = transactionsFiltrate.filter(t => t.tipo === 'entrata');
    const accumuli = transactionsFiltrate.filter(t => t.tipo === 'accumulo');

    // CALCOLI ANALYTICS
    
    // 1. Cash Flow Medio Mensile
    const cashFlowMedioMensile = React.useMemo(() => {
        if (transactionsFiltrate.length === 0) return 0;
        
        const totaleEntrate = entrate.reduce((acc, t) => acc + parseFloat(t.importo), 0);
        const totaleSpese = spese.reduce((acc, t) => acc + parseFloat(t.importo), 0);
        
        // Calcola mesi del periodo
        let mesi = 1;
        if (transactionsFiltrate.length > 0) {
            const date = transactionsFiltrate.map(t => new Date(t.data));
            const dataMin = new Date(Math.min(...date));
            const dataMax = new Date(Math.max(...date));
            mesi = Math.max(1, Math.ceil((dataMax - dataMin) / (1000 * 60 * 60 * 24 * 30)));
        }
        
        const cashFlow = totaleEntrate - totaleSpese;
        return cashFlow / mesi;
    }, [transactionsFiltrate, entrate, spese]);

    // 2. Top Categoria Spese
    const topCategoriaSpese = React.useMemo(() => {
        if (spese.length === 0) return null;
        
        const totalePerCategoria = {};
        let totaleComplessivo = 0;
        
        spese.forEach(t => {
            const importo = parseFloat(t.importo);
            totalePerCategoria[t.categoria] = (totalePerCategoria[t.categoria] || 0) + importo;
            totaleComplessivo += importo;
        });
        
        const categoriaMax = Object.entries(totalePerCategoria).reduce((max, [cat, tot]) => 
            tot > max.totale ? { nome: cat, totale: tot } : max
        , { nome: '', totale: 0 });
        
        const percentuale = totaleComplessivo > 0 ? (categoriaMax.totale / totaleComplessivo * 100) : 0;
        
        return {
            nome: categoriaMax.nome,
            totale: categoriaMax.totale,
            percentuale: percentuale
        };
    }, [spese]);

    // 3. Tasso di Risparmio (Accumuli / Entrate)
    const tassoRisparmio = React.useMemo(() => {
        const totaleEntrate = entrate.reduce((acc, t) => acc + parseFloat(t.importo), 0);
        const totaleAccumuli = accumuli.reduce((acc, t) => {
            const importo = parseFloat(t.importo);
            return t.tipoOperazioneAccumulo === 'prelievo' ? acc - importo : acc + importo;
        }, 0);
        
        if (totaleEntrate === 0) return 0;
        return (totaleAccumuli / totaleEntrate * 100);
    }, [entrate, accumuli]);

    // 4. Patrimonio Accumulato (somma accumuli - prelievi)
    const patrimonioAccumulato = React.useMemo(() => {
        return accumuli.reduce((acc, t) => {
            const importo = parseFloat(t.importo);
            // Se è un versamento, aggiungi; se è un prelievo, sottrai
            return t.tipoOperazioneAccumulo === 'prelievo' ? acc - importo : acc + importo;
        }, 0);
    }, [accumuli]);

    // 5. Runway (quanto duri con accumuli al ritmo spese medio)
    const runway = React.useMemo(() => {
        if (spese.length === 0) return 0;
        
        const totaleAccumuli = accumuli.reduce((acc, t) => {
            const importo = parseFloat(t.importo);
            return t.tipoOperazioneAccumulo === 'prelievo' ? acc - importo : acc + importo;
        }, 0);
        const totaleSpese = spese.reduce((acc, t) => acc + parseFloat(t.importo), 0);
        
        // Calcola giorni del periodo
        let giorni = 1;
        if (spese.length > 0) {
            const date = spese.map(t => new Date(t.data));
            const dataMin = new Date(Math.min(...date));
            const dataMax = new Date(Math.max(...date));
            giorni = Math.max(1, Math.ceil((dataMax - dataMin) / (1000 * 60 * 60 * 24)) + 1);
        }
        
        const spesaMediaGiornaliera = totaleSpese / giorni;
        
        if (spesaMediaGiornaliera === 0) return 0;
        return totaleAccumuli / spesaMediaGiornaliera; // giorni di runway
    }, [spese, accumuli]);

    return (
        <div className="fade-in">
            <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Analytics Finanziarie</h2>
                <p className="text-gray-600 text-sm">Analisi dettagliata delle tue finanze</p>
            </div>

            {/* Filtro Periodo */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    📅 Periodo di analisi:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                        onClick={() => setPeriodoFiltro('mese')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${periodoFiltro === 'mese' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Ultimo Mese
                    </button>
                    <button
                        onClick={() => setPeriodoFiltro('tre-mesi')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${periodoFiltro === 'tre-mesi' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        3 Mesi
                    </button>
                    <button
                        onClick={() => setPeriodoFiltro('anno')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${periodoFiltro === 'anno' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Quest'Anno
                    </button>
                    <button
                        onClick={() => setPeriodoFiltro('sempre')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${periodoFiltro === 'sempre' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Sempre
                    </button>
                </div>
            </div>

            {transactionsFiltrate.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-4xl mb-2">📊</p>
                    <p>Nessuna transazione registrata in questo periodo</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-xs text-green-700 font-medium mb-1">💰 Entrate Totali</p>
                            <p className="text-3xl font-bold text-green-700">
                                € {entrate.reduce((acc, t) => acc + parseFloat(t.importo), 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-green-600 mt-1">{entrate.length} transazioni</p>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-xs text-red-700 font-medium mb-1">💸 Spese Totali</p>
                            <p className="text-3xl font-bold text-red-700">
                                € {spese.reduce((acc, t) => acc + parseFloat(t.importo), 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-red-600 mt-1">{spese.length} transazioni</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-xs text-blue-700 font-medium mb-1">🏦 Accumuli Totali</p>
                            <p className="text-3xl font-bold text-blue-700">
                                € {patrimonioAccumulato.toFixed(2)}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">{accumuli.length} transazioni</p>
                        </div>
                    </div>

                    {/* Analytics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Card 1: Cash Flow Medio Mensile */}
                        <div className={`bg-gradient-to-br ${cashFlowMedioMensile >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} text-white rounded-lg p-5 shadow-lg`}>
                            <div className="flex items-center mb-3">
                                <span className="text-3xl mr-3">💵</span>
                                <h3 className="text-lg font-semibold">Cash Flow Medio/Mese</h3>
                            </div>
                            <p className="text-4xl font-bold mb-2">
                                {cashFlowMedioMensile >= 0 ? '+' : ''}€ {cashFlowMedioMensile.toFixed(2)}
                            </p>
                            <p className="text-sm opacity-90">
                                Entrate - Spese (accumuli neutrali)
                            </p>
                        </div>

                        {/* Card 2: Top Categoria Spese */}
                        {topCategoriaSpese && (
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-5 shadow-lg">
                                <div className="flex items-center mb-3">
                                    <span className="text-3xl mr-3">📊</span>
                                    <h3 className="text-lg font-semibold">Top Categoria Spese</h3>
                                </div>
                                <p className="text-2xl font-bold mb-1">{topCategoriaSpese.nome}</p>
                                <p className="text-3xl font-bold mb-2">€ {topCategoriaSpese.totale.toFixed(2)}</p>
                                <div className="bg-white bg-opacity-20 rounded-full h-2 mb-2">
                                    <div 
                                        className="bg-white h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${topCategoriaSpese.percentuale}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm opacity-90">
                                    {topCategoriaSpese.percentuale.toFixed(1)}% delle spese totali
                                </p>
                            </div>
                        )}

                        {/* Card 3: Tasso di Risparmio */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-5 shadow-lg">
                            <div className="flex items-center mb-3">
                                <span className="text-3xl mr-3">🎯</span>
                                <h3 className="text-lg font-semibold">Tasso di Risparmio</h3>
                            </div>
                            <p className="text-4xl font-bold mb-2">{tassoRisparmio.toFixed(1)}%</p>
                            <p className="text-sm opacity-90 mb-1">
                                Accumuli: € {patrimonioAccumulato.toFixed(2)}
                            </p>
                            <p className="text-sm opacity-90">
                                su Entrate: € {entrate.reduce((acc, t) => acc + parseFloat(t.importo), 0).toFixed(2)}
                            </p>
                        </div>

                        {/* Card 4: Runway */}
                        {runway > 0 && (
                            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-5 shadow-lg">
                                <div className="flex items-center mb-3">
                                    <span className="text-3xl mr-3">⏱️</span>
                                    <h3 className="text-lg font-semibold">Runway</h3>
                                </div>
                                <p className="text-4xl font-bold mb-2">{Math.floor(runway)} giorni</p>
                                <p className="text-sm opacity-90">
                                    Con gli accumuli attuali (€ {patrimonioAccumulato.toFixed(2)}) 
                                    puoi coprire le spese per circa {(runway / 30).toFixed(1)} mesi
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                    <span className="text-2xl mr-3">💡</span>
                    <div>
                        <p className="font-semibold text-blue-900 mb-1">Suggerimento</p>
                        <p className="text-sm text-blue-800">
                            Il <strong>tasso di risparmio</strong> ideale dovrebbe essere almeno il 10-20% delle entrate. 
                            Un <strong>runway</strong> di 3-6 mesi di spese è considerato un fondo emergenza sano.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
