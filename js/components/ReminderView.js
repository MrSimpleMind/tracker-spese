function ReminderView({ reminders, showAddReminder, setShowAddReminder, editingReminder, setEditingReminder }) {
    const [showCompletati, setShowCompletati] = React.useState(false);
    const oggi = new Date().toISOString().split('T')[0];
    
    const toggleCompletato = async (id, completato) => {
        await db.collection('reminders').doc(id).update({
            completato: !completato,
            dataCompletamento: !completato ? firebase.firestore.FieldValue.serverTimestamp() : null
        });
    };

    const eliminaReminder = async (id) => {
        if (confirm('Vuoi eliminare questo reminder?')) {
            await db.collection('reminders').doc(id).delete();
        }
    };

    const reminderAttivi = reminders.filter(r => !r.completato);
    const reminderCompletati = reminders.filter(r => r.completato);

    // Conta reminder scaduti
    const reminderScaduti = reminderAttivi.filter(r => r.dataScadenza < oggi).length;

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">⏰ Reminder</h2>
                        <p className="text-sm text-gray-600 mt-0.5">Promemoria e scadenze</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Attivi</p>
                        <p className="text-xl font-bold text-gray-700">
                            {reminderAttivi.length}
                            {reminderScaduti > 0 && (
                                <span className="text-sm text-red-600 ml-1">({reminderScaduti} scaduti)</span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Pulsante nuovo reminder */}
            <button
                onClick={() => setShowAddReminder(true)}
                className="w-full bg-blue-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-600 shadow-sm mb-4 flex items-center justify-center gap-2"
            >
                <span className="text-xl">➕</span>
                <span>Nuovo Reminder</span>
            </button>

            {/* Reminder attivi */}
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Da Fare ({reminderAttivi.length})
                </h3>
                <div className="space-y-2">
                    {reminderAttivi.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-white rounded-lg border border-gray-200">
                            <p className="text-4xl mb-2">✅</p>
                            <p className="font-medium">Nessun reminder attivo</p>
                            <p className="text-sm mt-1">Ottimo lavoro!</p>
                        </div>
                    ) : (
                        reminderAttivi
                            .sort((a, b) => {
                                // Ordina prima per scadenza (scaduti per primi), poi per data
                                const aScaduto = a.dataScadenza < oggi;
                                const bScaduto = b.dataScadenza < oggi;
                                if (aScaduto && !bScaduto) return -1;
                                if (!aScaduto && bScaduto) return 1;
                                return new Date(a.dataScadenza) - new Date(b.dataScadenza);
                            })
                            .map(reminder => {
                                const isScaduto = reminder.dataScadenza < oggi;
                                const dataScadenza = new Date(reminder.dataScadenza);
                                const dataFormattata = dataScadenza.toLocaleDateString('it-IT', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                });

                                return (
                                    <div 
                                        key={reminder.id} 
                                        className={`bg-white rounded-lg shadow-sm border-l-4 p-3 ${
                                            isScaduto ? 'border-red-500' : 'border-blue-500'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Checkbox */}
                                            <button
                                                onClick={() => toggleCompletato(reminder.id, reminder.completato)}
                                                className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                                                    isScaduto 
                                                        ? 'border-red-400 hover:border-red-600 hover:bg-red-50' 
                                                        : 'border-gray-300 hover:border-blue-600 hover:bg-blue-50'
                                                }`}
                                            />
                                            
                                            {/* Contenuto */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900">{reminder.titolo}</p>
                                                {reminder.descrizione && (
                                                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{reminder.descrizione}</p>
                                                )}
                                                
                                                {/* Badge info */}
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                                                        isScaduto 
                                                            ? 'bg-red-50 text-red-700 border border-red-200' 
                                                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    }`}>
                                                        {isScaduto ? (
                                                            <>
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                </svg>
                                                                <span>Scaduto</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                <span>{dataFormattata}</span>
                                                            </>
                                                        )}
                                                    </span>
                                                    {reminder.importoStimato && (
                                                        <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 font-medium">
                                                            €{parseFloat(reminder.importoStimato).toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Azioni */}
                                            <div className="flex gap-1 flex-shrink-0">
                                                <button
                                                    onClick={() => setEditingReminder(reminder)}
                                                    className="text-gray-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50"
                                                    title="Modifica"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => eliminaReminder(reminder.id)}
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
            </div>

            {/* Reminder completati */}
            {reminderCompletati.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowCompletati(!showCompletati)}
                        className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-between px-4 shadow-sm mb-3"
                    >
                        <span className="flex items-center gap-2">
                            <span>✅</span>
                            <span>Completati ({reminderCompletati.length})</span>
                        </span>
                        <svg className={`w-4 h-4 transition-transform ${showCompletati ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    
                    {showCompletati && (
                        <div className="space-y-2">
                            {reminderCompletati.map(reminder => (
                                <div key={reminder.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 opacity-75">
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={() => toggleCompletato(reminder.id, reminder.completato)}
                                            className="mt-0.5 w-5 h-5 rounded border-2 border-green-500 bg-green-500 text-white flex items-center justify-center flex-shrink-0"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-600 line-through">{reminder.titolo}</p>
                                            {reminder.descrizione && (
                                                <p className="text-sm text-gray-500 mt-0.5">{reminder.descrizione}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => eliminaReminder(reminder.id)}
                                            className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"
                                            title="Elimina"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modali */}
            {showAddReminder && (
                <AddReminderModal onClose={() => setShowAddReminder(false)} />
            )}

            {editingReminder && (
                <EditReminderModal 
                    reminder={editingReminder}
                    onClose={() => setEditingReminder(null)}
                />
            )}
        </div>
    );
}
