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
    // IMPORTANTE: usa TUTTE le transactions, non solo quelle del periodo filtrato
    const patrimonioAccumulato = React.useMemo(() => {
        const tuttiAccumuli = transactions.filter(t => t.tipo === 'accumulo' || t.tipo === 'movimento_fondo');
        return tuttiAccumuli.reduce((acc, t) => {
            const importo = parseFloat(t.importo);
            const tipoMovimento = t.tipoMovimentoFondo || t.tipoOperazioneAccumulo || 'versamento';
            return tipoMovimento === 'prelievo' ? acc - importo : acc + importo;
        }, 0);
    }, [transactions]);

    // 5. Runway (quanto duri con accumuli al ritmo spese medio)
    const runway = React.useMemo(() => {
        if (spese.length === 0) return 0;
        
        // Usa il patrimonio accumulato TOTALE (già calcolato sopra)
        const totaleAccumuli = patrimonioAccumulato;
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
    }, [spese, patrimonioAccumulato]);

    const totaleEntrate = entrate.reduce((acc, t) => acc + parseFloat(t.importo), 0);
    const totaleSpese = spese.reduce((acc, t) => acc + parseFloat(t.importo), 0);

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
                            <p className="text-sm text-gray-600 mt-0.5">Analisi dettagliata delle finanze</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtro Periodo */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Periodo di analisi
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                        { key: 'mese', label: 'Ultimo Mese' },
                        { key: 'tre-mesi', label: '3 Mesi' },
                        { key: 'anno', label: "Quest'Anno" },
                        { key: 'sempre', label: 'Sempre' }
                    ].map(periodo => (
                        <button
                            key={periodo.key}
                            onClick={() => setPeriodoFiltro(periodo.key)}
                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                periodoFiltro === periodo.key 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {periodo.label}
                        </button>
                    ))}
                </div>
            </div>

            {transactionsFiltrate.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-lg border border-gray-200">
                    <p className="text-4xl mb-2">📊</p>
                    <p className="font-medium">Nessuna transazione in questo periodo</p>
                    <p className="text-sm mt-1">Prova con un periodo diverso</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div className="bg-white rounded-lg shadow-sm border-l-4 border-green-500 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Entrate</p>
                            </div>
                            <p className="text-2xl font-bold text-green-600">€{totaleEntrate.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 mt-1">{entrate.length} transazioni</p>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow-sm border-l-4 border-red-500 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Spese</p>
                            </div>
                            <p className="text-2xl font-bold text-red-600">€{totaleSpese.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 mt-1">{spese.length} transazioni</p>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Accumuli</p>
                            </div>
                            <p className="text-2xl font-bold text-blue-600">€{patrimonioAccumulato.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 mt-1">{accumuli.length} operazioni</p>
                        </div>
                    </div>

                    {/* Analytics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Cash Flow */}
                        <div className={`bg-white rounded-lg shadow-sm border-l-4 p-4 ${
                            cashFlowMedioMensile >= 0 ? 'border-green-500' : 'border-red-500'
                        }`}>
                            <div className="flex items-center gap-2 mb-3">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-sm font-semibold text-gray-900">Cash Flow Medio/Mese</h3>
                            </div>
                            <p className={`text-3xl font-bold mb-1 ${
                                cashFlowMedioMensile >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {cashFlowMedioMensile >= 0 ? '+' : ''}€{cashFlowMedioMensile.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-600">Entrate - Spese mensili</p>
                        </div>

                        {/* Top Categoria */}
                        {topCategoriaSpese && (
                            <div className="bg-white rounded-lg shadow-sm border-l-4 border-purple-500 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <h3 className="text-sm font-semibold text-gray-900">Top Categoria Spese</h3>
                                </div>
                                <p className="text-lg font-bold text-gray-900 mb-0.5">{topCategoriaSpese.nome}</p>
                                <p className="text-2xl font-bold text-purple-600 mb-2">€{topCategoriaSpese.totale.toFixed(2)}</p>
                                <div className="bg-gray-200 rounded-full h-2 mb-2">
                                    <div 
                                        className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(topCategoriaSpese.percentuale, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-600">
                                    {topCategoriaSpese.percentuale.toFixed(1)}% delle spese totali
                                </p>
                            </div>
                        )}

                        {/* Tasso Risparmio */}
                        <div className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <h3 className="text-sm font-semibold text-gray-900">Tasso di Risparmio</h3>
                            </div>
                            <p className="text-3xl font-bold text-blue-600 mb-1">
                                {tassoRisparmio.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-600 mb-0.5">
                                Accumuli: €{patrimonioAccumulato.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-600">
                                Entrate: €{totaleEntrate.toFixed(2)}
                            </p>
                        </div>

                        {/* Runway */}
                        {runway > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border-l-4 border-orange-500 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="text-sm font-semibold text-gray-900">Runway</h3>
                                </div>
                                <p className="text-3xl font-bold text-orange-600 mb-1">
                                    {Math.floor(runway)} giorni
                                </p>
                                <p className="text-xs text-gray-600">
                                    Circa {(runway / 30).toFixed(1)} mesi di copertura con gli accumuli attuali
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Info Box */}
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs text-blue-900">
                        <p className="font-semibold mb-0.5">Suggerimento</p>
                        <p>
                            Il <strong>tasso di risparmio</strong> ideale è 10-20% delle entrate. 
                            Un <strong>runway</strong> di 3-6 mesi è considerato un fondo emergenza sano.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
