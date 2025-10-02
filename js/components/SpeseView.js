function SpeseView({ spese, categorie, filtroCategoria, setFiltroCategoria, showAddSpesa, setShowAddSpesa, showGrafico, setShowGrafico, editingSpesa, setEditingSpesa }) {
    const speseFiltrate = filtroCategoria === 'tutte' 
        ? spese 
        : spese.filter(s => s.categoria === filtroCategoria);

    const totale = speseFiltrate.reduce((acc, spesa) => acc + parseFloat(spesa.importo), 0);

    const oggi = new Date();
    const meseCorrente = oggi.getMonth();
    const annoCorrente = oggi.getFullYear();
    
    const speseQuestoMese = spese.filter(s => {
        const dataSpesa = new Date(s.data);
        return dataSpesa.getMonth() === meseCorrente && dataSpesa.getFullYear() === annoCorrente;
    });
    
    const speseMeseScorso = spese.filter(s => {
        const dataSpesa = new Date(s.data);
        const meseScorso = meseCorrente === 0 ? 11 : meseCorrente - 1;
        const annoMeseScorso = meseCorrente === 0 ? annoCorrente - 1 : annoCorrente;
        return dataSpesa.getMonth() === meseScorso && dataSpesa.getFullYear() === annoMeseScorso;
    });
    
    const totaleQuestoMese = speseQuestoMese.reduce((acc, s) => acc + parseFloat(s.importo), 0);
    const totaleMeseScorso = speseMeseScorso.reduce((acc, s) => acc + parseFloat(s.importo), 0);
    const differenza = totaleQuestoMese - totaleMeseScorso;
    const percentuale = totaleMeseScorso > 0 ? ((differenza / totaleMeseScorso) * 100).toFixed(1) : 0;

    const eliminaSpesa = async (id) => {
        if (confirm('Vuoi eliminare questa spesa?')) {
            await db.collection('spese').doc(id).delete();
        }
    };

    return (
        <div className="fade-in">
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                <button
                    onClick={() => setFiltroCategoria('tutte')}
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${filtroCategoria === 'tutte' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                    Tutte
                </button>
                {categorie.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setFiltroCategoria(cat.nome)}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${filtroCategoria === cat.nome ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        {cat.nome}
                    </button>
                ))}
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 mb-4 shadow-lg">
                <div className="mb-3">
                    <p className="text-xs opacity-90 mb-1">
                        {filtroCategoria !== 'tutte' ? filtroCategoria : 'Totale generale'}
                    </p>
                    <p className="text-3xl font-bold">€ {totale.toFixed(2)}</p>
                    <p className="text-xs opacity-75 mt-1">{speseFiltrate.length} spese</p>
                </div>
                
                {filtroCategoria === 'tutte' && (
                    <>
                        <div className="border-t border-blue-500 pt-3 mt-3">
                            <div className="flex justify-between items-start text-xs mb-2">
                                <div className="flex-1">
                                    <p className="opacity-75 mb-1">Questo mese</p>
                                    <p className="text-lg font-bold">€ {totaleQuestoMese.toFixed(2)}</p>
                                    <p className="opacity-75">{speseQuestoMese.length} spese</p>
                                </div>
                                <div className="flex-1 text-right">
                                    <p className="opacity-75 mb-1">Mese scorso</p>
                                    <p className="text-lg font-bold">€ {totaleMeseScorso.toFixed(2)}</p>
                                    <p className="opacity-75">{speseMeseScorso.length} spese</p>
                                </div>
                            </div>
                            {totaleMeseScorso > 0 && (
                                <div className={`text-center py-2 px-3 rounded ${differenza > 0 ? 'bg-red-500' : 'bg-green-500'} bg-opacity-30 mb-2`}>
                                    <span className="font-bold">
                                        {differenza > 0 ? '↑' : '↓'} {Math.abs(percentuale)}%
                                    </span>
                                    <span className="text-xs ml-2">
                                        {differenza > 0 ? 'speso di più' : 'risparmiato'} (€ {Math.abs(differenza).toFixed(2)})
                                    </span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setShowGrafico(true)}
                            className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 py-2 px-4 rounded text-sm font-medium mt-2"
                        >
                            📊 Mostra Andamento
                        </button>
                    </>
                )}
            </div>

            <button
                onClick={() => setShowAddSpesa(true)}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 mb-4 shadow"
            >
                ➕ Aggiungi Spesa
            </button>

            <div className="space-y-3">
                {speseFiltrate.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-4xl mb-2">📭</p>
                        <p>Nessuna spesa registrata</p>
                    </div>
                ) : (
                    speseFiltrate.map(spesa => {
                        return (
                            <div key={spesa.id} className="bg-white rounded-lg p-4 shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <p className="font-bold text-lg text-gray-800">{spesa.descrizione}</p>
                                        <p className="text-sm text-gray-500">{spesa.categoria}</p>
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                        <button
                                            onClick={() => setEditingSpesa(spesa)}
                                            className="text-blue-500 hover:text-blue-700 p-1"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => eliminaSpesa(spesa.id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-xs text-gray-400">
                                        {new Date(spesa.data).toLocaleDateString('it-IT')}
                                        {spesa.nota && <p className="mt-1 text-gray-500">{spesa.nota}</p>}
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600">€ {parseFloat(spesa.importo).toFixed(2)}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {showAddSpesa && (
                <AddSpesaModal 
                    onClose={() => setShowAddSpesa(false)}
                    categorie={categorie}
                />
            )}

            {editingSpesa && (
                <EditSpesaModal 
                    spesa={editingSpesa}
                    onClose={() => setEditingSpesa(null)}
                    categorie={categorie}
                />
            )}

            {showGrafico && (
                <GraficoAndamentoModal 
                    spese={spese}
                    onClose={() => setShowGrafico(false)}
                />
            )}
        </div>
    );
}
