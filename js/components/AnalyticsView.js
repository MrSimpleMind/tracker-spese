function AnalyticsView({ spese }) {
    const [periodoFiltro, setPeriodoFiltro] = React.useState('sempre');
    
    // Filtra spese per periodo
    const speseFiltrate = React.useMemo(() => {
        const oggi = new Date();
        
        switch (periodoFiltro) {
            case 'mese':
                const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
                return spese.filter(s => new Date(s.data) >= inizioMese);
            
            case 'tre-mesi':
                const inizioTreMesi = new Date(oggi.getFullYear(), oggi.getMonth() - 2, 1);
                return spese.filter(s => new Date(s.data) >= inizioTreMesi);
            
            case 'anno':
                const inizioAnno = new Date(oggi.getFullYear(), 0, 1);
                return spese.filter(s => new Date(s.data) >= inizioAnno);
            
            case 'sempre':
            default:
                return spese;
        }
    }, [spese, periodoFiltro]);

    // CALCOLI ANALYTICS
    
    // 1. Spesa Media Giornaliera
    const spesaMediaGiornaliera = React.useMemo(() => {
        if (speseFiltrate.length === 0) return 0;
        
        const totale = speseFiltrate.reduce((acc, s) => acc + parseFloat(s.importo), 0);
        
        // Calcola giorni del periodo
        let giorni = 1;
        if (speseFiltrate.length > 0) {
            const date = speseFiltrate.map(s => new Date(s.data));
            const dataMin = new Date(Math.min(...date));
            const dataMax = new Date(Math.max(...date));
            giorni = Math.max(1, Math.ceil((dataMax - dataMin) / (1000 * 60 * 60 * 24)) + 1);
        }
        
        return totale / giorni;
    }, [speseFiltrate]);

    // 2. Top Categoria
    const topCategoria = React.useMemo(() => {
        if (speseFiltrate.length === 0) return null;
        
        const totalePerCategoria = {};
        let totaleComplessivo = 0;
        
        speseFiltrate.forEach(s => {
            const importo = parseFloat(s.importo);
            totalePerCategoria[s.categoria] = (totalePerCategoria[s.categoria] || 0) + importo;
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

    // 3. Trend vs Media (confronto mese corrente con media storica)
    const trendVsMedia = React.useMemo(() => {
        if (spese.length === 0) return null;
        
        const oggi = new Date();
        const meseCorrente = oggi.getMonth();
        const annoCorrente = oggi.getFullYear();
        
        // Spese mese corrente
        const speseQuestoMese = spese.filter(s => {
            const data = new Date(s.data);
            return data.getMonth() === meseCorrente && data.getFullYear() === annoCorrente;
        });
        const totaleQuestoMese = speseQuestoMese.reduce((acc, s) => acc + parseFloat(s.importo), 0);
        
        // Calcola media dei mesi precedenti
        const mesiPrecedenti = {};
        spese.forEach(s => {
            const data = new Date(s.data);
            const chiaveMese = `${data.getFullYear()}-${data.getMonth()}`;
            const chiaveMeseCorrente = `${annoCorrente}-${meseCorrente}`;
            
            // Escludi mese corrente
            if (chiaveMese !== chiaveMeseCorrente) {
                mesiPrecedenti[chiaveMese] = (mesiPrecedenti[chiaveMese] || 0) + parseFloat(s.importo);
            }
        });
        
        const valoriMesi = Object.values(mesiPrecedenti);
        const mediaMesi = valoriMesi.length > 0 
            ? valoriMesi.reduce((a, b) => a + b, 0) / valoriMesi.length 
            : totaleQuestoMese;
        
        const differenza = totaleQuestoMese - mediaMesi;
        const percentuale = mediaMesi > 0 ? (differenza / mediaMesi * 100) : 0;
        
        return {
            meseCorrente: totaleQuestoMese,
            media: mediaMesi,
            differenza: differenza,
            percentuale: percentuale
        };
    }, [spese]);

    // 4. Micro-Spese (piccoli importi invisibili)
    const microSpese = React.useMemo(() => {
        const soglia = 20; // Soglia per "piccole spese"
        const microSpeseList = speseFiltrate.filter(s => parseFloat(s.importo) < soglia);
        const totale = microSpeseList.reduce((acc, s) => acc + parseFloat(s.importo), 0);
        const percentuale = speseFiltrate.length > 0 
            ? (microSpeseList.length / speseFiltrate.length * 100) 
            : 0;
        
        // Proiezione annuale (solo se non stiamo già guardando "sempre")
        let proiezioneAnnuale = totale;
        if (periodoFiltro !== 'sempre' && microSpeseList.length > 0) {
            const giorniPeriodo = (() => {
                switch (periodoFiltro) {
                    case 'mese': return 30;
                    case 'tre-mesi': return 90;
                    case 'anno': return 365;
                    default: return 30;
                }
            })();
            proiezioneAnnuale = (totale / giorniPeriodo) * 365;
        }
        
        return {
            numero: microSpeseList.length,
            totale: totale,
            percentuale: percentuale,
            proiezioneAnnuale: proiezioneAnnuale
        };
    }, [speseFiltrate, periodoFiltro]);

    return (
        <div className="fade-in">
            <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">📊 Analytics</h2>
                <p className="text-gray-600 text-sm">Analisi dettagliata delle tue spese</p>
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

            {speseFiltrate.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-4xl mb-2">📊</p>
                    <p>Nessuna spesa registrata in questo periodo</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Card 1: Spesa Media Giornaliera */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-5 shadow-lg">
                        <div className="flex items-center mb-3">
                            <span className="text-3xl mr-3">💰</span>
                            <h3 className="text-lg font-semibold">Spesa Media/Giorno</h3>
                        </div>
                        <p className="text-4xl font-bold mb-2">€ {spesaMediaGiornaliera.toFixed(2)}</p>
                        <p className="text-sm opacity-90">
                            {speseFiltrate.length} spese analizzate
                        </p>
                    </div>

                    {/* Card 2: Top Categoria */}
                    {topCategoria && (
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-5 shadow-lg">
                            <div className="flex items-center mb-3">
                                <span className="text-3xl mr-3">📊</span>
                                <h3 className="text-lg font-semibold">Top Categoria</h3>
                            </div>
                            <p className="text-2xl font-bold mb-1">{topCategoria.nome}</p>
                            <p className="text-3xl font-bold mb-2">€ {topCategoria.totale.toFixed(2)}</p>
                            <div className="bg-white bg-opacity-20 rounded-full h-2 mb-2">
                                <div 
                                    className="bg-white h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${topCategoria.percentuale}%` }}
                                ></div>
                            </div>
                            <p className="text-sm opacity-90">
                                {topCategoria.percentuale.toFixed(1)}% del totale
                            </p>
                        </div>
                    )}

                    {/* Card 3: Trend vs Media */}
                    {trendVsMedia && (
                        <div className={`bg-gradient-to-br ${trendVsMedia.differenza >= 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600'} text-white rounded-lg p-5 shadow-lg`}>
                            <div className="flex items-center mb-3">
                                <span className="text-3xl mr-3">📈</span>
                                <h3 className="text-lg font-semibold">Trend Mese Corrente</h3>
                            </div>
                            <p className="text-4xl font-bold mb-2">
                                {trendVsMedia.differenza >= 0 ? '↑' : '↓'} {Math.abs(trendVsMedia.percentuale).toFixed(1)}%
                            </p>
                            <p className="text-sm opacity-90 mb-1">
                                Questo mese: € {trendVsMedia.meseCorrente.toFixed(2)}
                            </p>
                            <p className="text-sm opacity-90">
                                Media storica: € {trendVsMedia.media.toFixed(2)}
                            </p>
                        </div>
                    )}

                    {/* Card 4: Micro-Spese */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-5 shadow-lg">
                        <div className="flex items-center mb-3">
                            <span className="text-3xl mr-3">🔍</span>
                            <h3 className="text-lg font-semibold">Micro-Spese</h3>
                        </div>
                        <p className="text-sm opacity-90 mb-2">
                            {microSpese.numero} spese &lt; €20
                        </p>
                        <p className="text-4xl font-bold mb-2">€ {microSpese.totale.toFixed(2)}</p>
                        <p className="text-sm opacity-90 mb-1">
                            {microSpese.percentuale.toFixed(0)}% delle tue spese
                        </p>
                        {periodoFiltro !== 'sempre' && (
                            <div className="mt-3 pt-3 border-t border-white border-opacity-30">
                                <p className="text-xs opacity-75">Proiezione annuale:</p>
                                <p className="text-2xl font-bold">€ {microSpese.proiezioneAnnuale.toFixed(0)}/anno</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                    <span className="text-2xl mr-3">💡</span>
                    <div>
                        <p className="font-semibold text-blue-900 mb-1">Suggerimento</p>
                        <p className="text-sm text-blue-800">
                            Le <strong>micro-spese</strong> sono spesso sottovalutate ma possono pesare molto nel lungo periodo. 
                            Un caffè al bar da €1.50 al giorno diventa €547.50 all'anno!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
