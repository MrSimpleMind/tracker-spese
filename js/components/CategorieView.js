function CategorieView({ categorie, showAddCategoria, setShowAddCategoria, editingCategoria, setEditingCategoria }) {
    // Filtra solo le categorie normali (esclude gli accumuli)
    const categorieNormali = categorie.filter(cat => !cat.isAccumulo);
    
    const eliminaCategoria = async (id) => {
        if (confirm('Vuoi eliminare questa categoria? Le transazioni associate rimarranno ma dovrai riassegnarle.')) {
            await db.collection('categorie').doc(id).delete();
        }
    };

    const tipoConfig = {
        spesa: { label: 'Spese', icon: '💸', color: 'bg-red-100 text-red-700' },
        entrata: { label: 'Entrate', icon: '💰', color: 'bg-green-100 text-green-700' },
        accumulo: { label: 'Accumuli', icon: '🏦', color: 'bg-blue-100 text-blue-700' }
    };

    return (
        <div className="fade-in">
            <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Le tue Categorie</h2>
                <p className="text-gray-600 text-sm">Gestisci le categorie per organizzare le transazioni</p>
            </div>

            <button
                onClick={() => setShowAddCategoria(true)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 mb-4 shadow"
            >
                ➕ Nuova Categoria
            </button>

            <div className="space-y-3">
                {categorieNormali.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-4xl mb-2">📁</p>
                        <p>Nessuna categoria creata</p>
                        <p className="text-sm mt-2">Crea la prima categoria per iniziare</p>
                    </div>
                ) : (
                    categorieNormali.map(cat => {
                        const applicabilita = cat.applicabileA || ['spesa'];
                        
                        return (
                            <div key={cat.id} className="bg-white rounded-lg p-4 shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <p className="font-bold text-lg text-gray-800">{cat.nome}</p>
                                        {cat.descrizione && <p className="text-sm text-gray-500 mt-1">{cat.descrizione}</p>}
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setEditingCategoria(cat)}
                                            className="text-blue-500 hover:text-blue-700 p-2"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => eliminaCategoria(cat.id)}
                                            className="text-red-500 hover:text-red-700 p-2"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {applicabilita.map(tipo => {
                                        const config = tipoConfig[tipo];
                                        return (
                                            <span 
                                                key={tipo}
                                                className={`text-xs px-2 py-1 rounded-full ${config.color} flex items-center gap-1`}
                                            >
                                                <span>{config.icon}</span>
                                                <span>{config.label}</span>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

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
