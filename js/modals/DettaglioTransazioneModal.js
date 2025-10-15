function DettaglioTransazioneModal({ transaction, onClose, onEdit, onDelete, categorie }) {
    const categoria = categorie.find(c => c.nome === transaction.categoria);
    const emojiCategoria = categoria?.emoji || '💸';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b p-4">
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-2xl font-bold text-gray-900 flex-1 pr-2">
                            {transaction.descrizione}
                        </h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl flex-shrink-0">×</button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{emojiCategoria}</span>
                        <span>{transaction.categoria}</span>
                        {transaction.isRicorrente && (
                            <span className="text-orange-500" title="Spesa ricorrente">🔁</span>
                        )}
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {/* Importo */}
                    <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 text-center">
                        <p className="text-sm text-red-700 mb-1">Importo</p>
                        <p className="text-3xl font-bold text-red-600">
                            €{parseFloat(transaction.importo).toFixed(2)}
                        </p>
                    </div>

                    {/* Data */}
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">📅 Data</p>
                        <p className="text-base text-gray-900">
                            {new Date(transaction.data).toLocaleDateString('it-IT', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                    </div>

                    {/* Nota */}
                    {transaction.nota && (
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">📝 Nota</p>
                            <p className="text-base text-gray-900 whitespace-pre-wrap">
                                {transaction.nota}
                            </p>
                        </div>
                    )}

                    {/* Info Ricorrente */}
                    {transaction.isRicorrente && (
                        <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
                            <p className="text-sm text-orange-900">
                                🔁 <strong>Spesa Ricorrente</strong><br />
                                Questa spesa è stata creata da un template automatico
                            </p>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="border-t pt-4">
                        <p className="text-xs text-gray-400">
                            Creata il {transaction.createdAt?.toDate().toLocaleString('it-IT')}
                        </p>
                        {transaction.updatedAt && (
                            <p className="text-xs text-gray-400 mt-1">
                                Ultima modifica: {transaction.updatedAt?.toDate().toLocaleString('it-IT')}
                            </p>
                        )}
                    </div>

                    {/* Azioni */}
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={() => {
                                onClose();
                                onEdit(transaction);
                            }}
                            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Modifica</span>
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                onDelete(transaction.id);
                            }}
                            className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Elimina</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
