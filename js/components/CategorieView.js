function CategorieView({ categorie, showAddCategoria, setShowAddCategoria, editingCategoria, setEditingCategoria }) {
    const [showArchiviati, setShowArchiviati] = React.useState(false);
    
    // Filtra categorie normali (non accumuli, non conti, non fondi) attive e archiviate
    const categorieNormaliAttive = categorie.filter(cat => 
        !cat.isAccumulo && 
        cat.tipoContenitore !== 'conto' && 
        cat.tipoContenitore !== 'fondo' && 
        !cat.archiviato
    );
    const categorieNormaliArchiviate = categorie.filter(cat => 
        !cat.isAccumulo && 
        cat.tipoContenitore !== 'conto' && 
        cat.tipoContenitore !== 'fondo' && 
        cat.archiviato
    );
    
    const eliminaCategoria = async (id) => {
        if (confirm('Vuoi eliminare questa categoria? Le transazioni associate rimarranno ma dovrai riassegnarle.')) {
            await db.collection('categorie').doc(id).delete();
        }
    };

    const archiviaCategoria = async (id, nome) => {
        if (!confirm(`Vuoi archiviare la categoria "${nome}"? Verrà nascosta ma potrai ripristinarla in futuro.`)) {
            return;
        }
        
        await db.collection('categorie').doc(id).update({
            archiviato: true,
            dataArchiviazione: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    };

    const ripristinaCategoria = async (id, nome) => {
        if (!confirm(`Vuoi ripristinare la categoria "${nome}"?`)) {
            return;
        }
        
        await db.collection('categorie').doc(id).update({
            archiviato: false,
            dataArchiviazione: null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    };

    const tipoConfig = {
        spesa: { label: 'Spese', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' },
        entrata: { label: 'Entrate', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
        accumulo: { label: 'Accumuli', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
        movimento_fondo: { label: 'Movimenti Fondo', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' }
    };

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Categorie</h2>
                            <p className="text-sm text-gray-600 mt-0.5">Organizza le tue transazioni</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Totale</p>
                        <p className="text-xl font-bold text-gray-700">{categorieNormaliAttive.length}</p>
                    </div>
                </div>
            </div>

            {/* Pulsante nuova categoria */}
            <button
                onClick={() => setShowAddCategoria(true)}
                className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-600 shadow-sm mb-4 flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Nuova Categoria</span>
            </button>

            {/* Lista categorie attive */}
            <div className="space-y-2">
                {categorieNormaliAttive.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-white rounded-lg border border-gray-200">
                        <svg className="w-16 h-16 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <p className="font-medium">Nessuna categoria creata</p>
                        <p className="text-sm mt-1">Crea la prima categoria per iniziare</p>
                    </div>
                ) : (
                    categorieNormaliAttive.map(cat => {
                        const applicabilita = cat.applicabileA || ['spesa'];
                        const emoji = cat.emoji || '📁';
                        
                        return (
                            <div key={cat.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between gap-3">
                                    {/* Info categoria */}
                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                        <span className="text-2xl">{emoji}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900">{cat.nome}</p>
                                            {cat.descrizione && (
                                                <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{cat.descrizione}</p>
                                            )}
                                            {/* Badge applicabilità */}
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {applicabilita.map(tipo => {
                                                    const config = tipoConfig[tipo];
                                                    return (
                                                        <span 
                                                        key={tipo}
                                                        className={`text-xs px-2 py-0.5 rounded ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
                                                        >
                                                        {config.label}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Azioni */}
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setEditingCategoria(cat)}
                                            className="text-gray-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50"
                                            title="Modifica"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => archiviaCategoria(cat.id, cat.nome)}
                                            className="text-gray-400 hover:text-orange-600 p-1.5 rounded hover:bg-orange-50"
                                            title="Archivia"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => eliminaCategoria(cat.id)}
                                            className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"
                                            title="Elimina"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Sezione categorie archiviate */}
            {categorieNormaliArchiviate.length > 0 && (
                <div className="mt-4">
                    <button
                        onClick={() => setShowArchiviati(!showArchiviati)}
                        className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-between px-4 shadow-sm"
                    >
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                            <span>Categorie Archiviate ({categorieNormaliArchiviate.length})</span>
                        </span>
                        <svg className={`w-4 h-4 transition-transform ${showArchiviati ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    
                    {showArchiviati && (
                        <div className="space-y-2 mt-3">
                            {categorieNormaliArchiviate.map(cat => {
                                const applicabilita = cat.applicabileA || ['spesa'];
                                const emoji = cat.emoji || '📁';
                                
                                return (
                                    <div key={cat.id} className="bg-white rounded-lg shadow-sm border border-gray-300 p-3 opacity-75">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                                <span className="text-2xl grayscale">{emoji}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <p className="font-semibold text-gray-700">{cat.nome}</p>
                                                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">Archiviato</span>
                                                    </div>
                                                    {cat.descrizione && (
                                                        <p className="text-sm text-gray-500 line-clamp-2">{cat.descrizione}</p>
                                                    )}
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {applicabilita.map(tipo => {
                                                            const config = tipoConfig[tipo];
                                                            return (
                                                                <span 
                                                                    key={tipo}
                                                                    className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200"
                                                                >
                                                                    {config.label}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => ripristinaCategoria(cat.id, cat.nome)}
                                                    className="text-gray-400 hover:text-green-600 p-1.5 rounded hover:bg-green-50"
                                                    title="Ripristina"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => eliminaCategoria(cat.id)}
                                                    className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"
                                                    title="Elimina definitivamente"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Modali */}
            {showAddCategoria && (
                <AddCategoriaModal onClose={() => setShowAddCategoria(false)} />
            )}

            {editingCategoria && (
                <EditCategoriaModal 
                    categoria={editingCategoria}
                    onClose={() => setEditingCategoria(null)}
                />
            )}
        </div>
    );
}
