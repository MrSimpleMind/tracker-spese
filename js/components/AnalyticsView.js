function AnalyticsView({ transactions }) {
    const [periodoFiltro, setPeriodoFiltro] = React.useState('sempre');
    
    // Filtra transazioni per periodo (solo spese)
    const speseFiltrate = React.useMemo(() => {
        const oggi = new Date();
        const spese = transactions.filter(t => t.tipo === 'spesa');
        
        switch (periodoFiltro) {
            case 'mese':
                const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
                return spese.filter(t => new Date(t.data) >= inizioMese);
            
            case 'tre-mesi':
                const inizioTreMesi = new Date(oggi.getFullYear(), oggi.getMonth() - 2, 1);
                return spese.filter(t => new Date(t.data) >= inizioTreMesi);
            
            case 'anno':
                const inizioAnno = new Date(oggi.getFullYear(), 0, 1);
                return spese.filter(t => new Date(t.data) >= inizioAnno);
            
            case 'sempre':
            default:
                return spese;
        }
    }, [transactions, periodoFiltro]);

    // CALCOLI ANALYTICS
    
    // 1. Spesa Media Mensile
    const spesaMediaMensile = React.useMemo(() => {
        if (speseFiltrate.length === 0) return 0;
        
        const totaleSpese = speseFiltrate.reduce((acc, t) => acc + parseFloat(t.importo), 0);
        
        // Calcola mesi del periodo
        let mesi = 1;
        if (speseFiltrate.length > 0) {
            const date = speseFiltrate.map(t => new Date(t.data));
            const dataMin = new Date(Math.min(...date));
            const dataMax = new Date(Math.max(...date));
            mesi = Math.max(1, Math.ceil((dataMax - dataMin) / (1000 * 60 * 60 * 24 * 30)));
        }
        
        return totaleSpese / mesi;
    }, [speseFiltrate]);

    // 2. Spesa Media Giornaliera
    const spesaMediaGiornaliera = React.useMemo(() => {
        if (speseFiltrate.length === 0) return 0;
        
        const totaleSpese = speseFiltrate.reduce((acc, t) => acc + parseFloat(t.importo), 0);
        
        // Calcola giorni del periodo
        let giorni = 1;
        if (speseFiltrate.length > 0) {
            const date = speseFiltrate.map(t => new Date(t.data));
            const dataMin = new Date(Math.min(...date));
            const dataMax = new Date(Math.max(...date));
            giorni = Math.max(1, Math.ceil((dataMax - dataMin) / (1000 * 60 * 60 * 24)) + 1);
        }
        
        return totaleSpese / giorni;
    }, [speseFiltrate]);

    // 3. Top Categoria Spese
    const topCategoriaSpese = React.useMemo(() => {
        if (speseFiltrate.length === 0) return null;
        
        const totalePerCategoria = {};
        let totaleComplessivo = 0;
        
        speseFiltrate.forEach(t => {
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
    }, [speseFiltrate]);

    // 4. Breakdown per Categoria
    const breakdownCategorie = React.useMemo(() => {
        if (speseFiltrate.length === 0) return [];
        
        const totalePerCategoria = {};
        let totaleComplessivo = 0;
        
        speseFiltrate.forEach(t => {
            const importo = parseFloat(t.importo);
            totalePerCategoria[t.categoria] = (totalePerCategoria[t.categoria] || 0) + importo;
            totaleComplessivo += importo;
        });
        
        return Object.entries(totalePerCategoria)
            .map(([cat, tot]) => ({
                nome: cat,
                totale: tot,
                percentuale: (tot / totaleComplessivo * 100)
            }))
            .sort((a, b) => b.totale - a.totale);
    }, [speseFiltrate]);

    const totaleSpese = speseFiltrate.reduce((acc, t) => acc + parseFloat(t.importo), 0);

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex items-center gap-2">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
                        <p className="text-sm text-gray-600 mt-0.5">Analisi dettagliata delle spese</p>
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

            {speseFiltrate.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-lg border border-gray-200">
                    <p className="text-4xl mb-2">📊</p>
                    <p className="font-medium">Nessuna spesa in questo periodo</p>
                    <p className="text-sm mt-1">Prova con un periodo diverso</p>
                </div>
            ) : (
                <>
                    {/* Summary Card */}
                    <div className="bg-white rounded-lg shadow-sm border-l-4 border-red-500 p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-sm text-gray-600 uppercase tracking-wide font-semibold">Spese Totali</p>
                        </div>
                        <p className="text-3xl font-bold text-red-600 mb-1">€{totaleSpese.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{speseFiltrate.length} spese registrate</p>
                    </div>

                    {/* Analytics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {/* Spesa Media Mensile */}
                        <div className="bg-white rounded-lg shadow-sm border-l-4 border-orange-500 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <h3 className="text-sm font-semibold text-gray-900">Spesa Media/Mese</h3>
                            </div>
                            <p className="text-3xl font-bold text-orange-600 mb-1">
                                €{spesaMediaMensile.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-600">Media calcolata sul periodo</p>
                        </div>

                        {/* Spesa Media Giornaliera */}
                        <div className="bg-white rounded-lg shadow-sm border-l-4 border-yellow-500 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-sm font-semibold text-gray-900">Spesa Media/Giorno</h3>
                            </div>
                            <p className="text-3xl font-bold text-yellow-600 mb-1">
                                €{spesaMediaGiornaliera.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-600">Media calcolata sul periodo</p>
                        </div>

                        {/* Top Categoria */}
                        {topCategoriaSpese && (
                            <div className="bg-white rounded-lg shadow-sm border-l-4 border-purple-500 p-4 sm:col-span-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <h3 className="text-sm font-semibold text-gray-900">Categoria Principale</h3>
                                </div>
                                <p className="text-lg font-bold text-gray-900 mb-0.5">{topCategoriaSpese.nome}</p>
                                <p className="text-3xl font-bold text-purple-600 mb-3">€{topCategoriaSpese.totale.toFixed(2)}</p>
                                <div className="bg-gray-200 rounded-full h-3 mb-2">
                                    <div 
                                        className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(topCategoriaSpese.percentuale, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {topCategoriaSpese.percentuale.toFixed(1)}% delle spese totali
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Breakdown per Categoria */}
                    {breakdownCategorie.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <h3 className="text-base font-semibold text-gray-900 mb-4">📊 Spese per Categoria</h3>
                            <div className="space-y-3">
                                {breakdownCategorie.map((cat, idx) => (
                                    <div key={idx} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-900">{cat.nome}</span>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-gray-900">
                                                    €{cat.totale.toFixed(2)}
                                                </span>
                                                <span className="text-xs text-gray-500 ml-2">
                                                    {cat.percentuale.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(cat.percentuale, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Info Box */}
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs text-blue-900">
                        <p className="font-semibold mb-0.5">💡 Suggerimento</p>
                        <p>
                            Monitorare le spese per categoria aiuta a identificare dove è possibile risparmiare. 
                            Prova a impostare un budget mensile per ogni categoria principale!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
