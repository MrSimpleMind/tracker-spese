function DettaglioTransazioneModal({ transaction, onClose, onEdit, onDelete, categorie }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
    
    const tipoConfig = {
        spesa: { label: 'Spesa', icon: '💸', color: 'text-red-600', bgColor: 'bg-red-500', lightBg: 'bg-red-50', border: 'border-red-500' },
        entrata: { label: 'Entrata', icon: '💰', color: 'text-green-600', bgColor: 'bg-green-500', lightBg: 'bg-green-50', border: 'border-green-500' },
        accumulo: { label: 'Accumulo', icon: '🏦', color: 'text-blue-600', bgColor: 'bg-blue-500', lightBg: 'bg-blue-50', border: 'border-blue-500' }
    };

    const config = tipoConfig[transaction.tipo || 'spesa'];
    
    // Trova la categoria per mostrare l'emoji se disponibile
    const categoria = categorie.find(cat => cat.nome === transaction.categoria);
    
    const handleDelete = async () => {
        await onDelete(transaction.id);
        onClose();
    };

    const handleEdit = () => {
        onEdit(transaction);
        onClose();
    };

    const formatData = (dataString) => {
        const data = new Date(dataString);
        return data.toLocaleDateString('it-IT', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
            <div 
                className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header colorato */}
                <div className={`${config.bgColor} text-white p-6 rounded-t-2xl`}>
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl">{config.icon}</span>
                            <div>
                                <h3 className="text-xl font-bold">{config.label}</h3>
                                {transaction.tipo === 'accumulo' && transaction.nomeAccumulo && (
                                    <p className="text-sm opacity-90 mt-0.5">
                                        {transaction.tipoOperazioneAccumulo === 'versamento' ? '➕' : '➖'} {transaction.nomeAccumulo}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    {/* Importo grande */}
                    <div className="mt-4">
                        <p className="text-4xl font-bold">
                            {transaction.tipo === 'entrata' ? '+' : transaction.tipo === 'spesa' ? '-' : ''}
                            €{parseFloat(transaction.importo).toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Contenuto dettagli */}
                <div className="p-6 space-y-4">
                    {/* Data */}
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">📅</div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Data</p>
                            <p className="text-gray-900 font-medium capitalize">{formatData(transaction.data)}</p>
                        </div>
                    </div>

                    {/* Categoria */}
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">{categoria?.emoji || '📁'}</div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Categoria</p>
                            <p className="text-gray-900 font-medium">{transaction.categoria}</p>
                        </div>
                    </div>

                    {/* Descrizione (se presente) */}
                    {transaction.descrizione && transaction.descrizione.trim() !== '' && (
                        <div className="flex items-start gap-3">
                            <div className="text-2xl">📝</div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Descrizione</p>
                                <p className="text-gray-900 whitespace-pre-wrap break-words">{transaction.descrizione}</p>
                            </div>
                        </div>
                    )}

                    {/* Mostra dettagli accumulo specifici */}
                    {transaction.tipo === 'accumulo' && (
                        <>
                            {transaction.tipoOperazioneAccumulo && (
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl">
                                        {transaction.tipoOperazioneAccumulo === 'versamento' ? '➕' : '➖'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Tipo operazione</p>
                                        <p className="text-gray-900 font-medium capitalize">{transaction.tipoOperazioneAccumulo}</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Template ricorrente (se presente) */}
                    {transaction.isTemplate && (
                        <div className={`${config.lightBg} border-l-4 ${config.border} p-3 rounded`}>
                            <p className="text-sm font-medium ${config.color}">⚙️ Transazione da template ricorrente</p>
                        </div>
                    )}
                </div>

                {/* Footer con azioni */}
                <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleEdit}
                            className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Modifica</span>
                        </button>
                        
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center justify-center gap-2 py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Elimina</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modale conferma eliminazione */}
            {showDeleteConfirm && (
                <div 
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
                    onClick={() => setShowDeleteConfirm(false)}
                >
                    <div 
                        className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-4">
                            <div className="text-5xl mb-3">⚠️</div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">Conferma eliminazione</h4>
                            <p className="text-gray-600">
                                Sei sicuro di voler eliminare questa transazione? 
                                <br/>
                                <span className="font-semibold">Questa azione non può essere annullata.</span>
                            </p>
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                            >
                                Elimina
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
