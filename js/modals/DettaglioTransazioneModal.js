function DettaglioTransazioneModal({ transaction, onClose, onEdit, onDelete, categorie }) {
    if (!transaction) return null;

    const tipoConfig = {
        spesa: { label: 'Spesa', icon: '💸', color: 'text-red-600', bgColor: 'bg-red-500', lightBg: 'bg-red-50' },
        entrata: { label: 'Entrata', icon: '💰', color: 'text-green-600', bgColor: 'bg-green-500', lightBg: 'bg-green-50' },
        accumulo: { label: 'Accumulo', icon: '🏦', color: 'text-blue-600', bgColor: 'bg-blue-500', lightBg: 'bg-blue-50' }
    };

    const config = tipoConfig[transaction.tipo || 'spesa'];

    // Badge speciale per accumuli
    let accumuloBadge = null;
    if (transaction.tipo === 'accumulo') {
        const isVersamento = transaction.tipoOperazioneAccumulo === 'versamento';
        accumuloBadge = {
            label: isVersamento ? 'Versamento' : 'Prelievo',
            icon: isVersamento ? '➕' : '➖',
            bg: isVersamento ? 'bg-green-100' : 'bg-orange-100',
            color: isVersamento ? 'text-green-800' : 'text-orange-800'
        };
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center rounded-t-2xl">
                    <h3 className="text-lg font-bold text-gray-900">Dettaglio transazione</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Contenuto */}
                <div className="p-6 space-y-4">
                    {/* Tipo e Badge */}
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-lg ${config.lightBg} ${config.color} font-medium text-sm flex items-center gap-1.5`}>
                            <span className="text-base">{config.icon}</span>
                            <span>{config.label}</span>
                        </span>
                        {accumuloBadge && (
                            <span className={`px-3 py-1.5 rounded-lg ${accumuloBadge.bg} ${accumuloBadge.color} font-medium text-sm flex items-center gap-1.5`}>
                                <span className="text-base">{accumuloBadge.icon}</span>
                                <span>{accumuloBadge.label}</span>
                            </span>
                        )}
                    </div>

                    {/* Importo */}
                    <div className="py-4 border-y border-gray-100">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Importo</p>
                        <p className={`text-3xl font-bold ${config.color}`}>
                            {transaction.tipo === 'entrata' ? '+' : transaction.tipo === 'spesa' ? '-' : ''}
                            €{parseFloat(transaction.importo).toFixed(2)}
                        </p>
                    </div>

                    {/* Descrizione */}
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Descrizione</p>
                        <p className="text-base text-gray-800 font-medium">{transaction.descrizione}</p>
                    </div>

                    {/* Categoria */}
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Categoria</p>
                        <p className="text-base text-gray-800">{transaction.categoria}</p>
                    </div>

                    {/* Data */}
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Data</p>
                        <p className="text-base text-gray-800">
                            {new Date(transaction.data).toLocaleDateString('it-IT', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                    {/* Nota (se presente) */}
                    {transaction.nota && (
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Nota</p>
                            <p className="text-sm text-gray-700 italic bg-gray-50 p-3 rounded-lg">
                                {transaction.nota}
                            </p>
                        </div>
                    )}
                </div>

                {/* Pulsanti azione */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-2 rounded-b-2xl">
                    <button
                        onClick={() => {
                            onEdit(transaction);
                            onClose();
                        }}
                        className="flex-1 py-3 px-4 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                        <span>✏️</span>
                        <span>Modifica</span>
                    </button>
                    <button
                        onClick={() => {
                            if (confirm('Vuoi eliminare questa transazione?')) {
                                onDelete(transaction.id);
                                onClose();
                            }
                        }}
                        className="flex-1 py-3 px-4 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                        <span>🗑️</span>
                        <span>Elimina</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
