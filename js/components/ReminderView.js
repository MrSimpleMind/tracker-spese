function ReminderView({ reminders, showAddReminder, setShowAddReminder, editingReminder, setEditingReminder }) {
    const oggi = new Date().toISOString().split('T')[0];
    
    const toggleCompletato = async (id, completato) => {
        await db.collection('reminders').doc(id).update({
            completato: !completato
        });
    };

    const eliminaReminder = async (id) => {
        if (confirm('Vuoi eliminare questo reminder?')) {
            await db.collection('reminders').doc(id).delete();
        }
    };

    const reminderAttivi = reminders.filter(r => !r.completato);
    const reminderCompletati = reminders.filter(r => r.completato);

    return (
        <div className="fade-in">
            <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">I tuoi Reminder</h2>
                <p className="text-gray-600 text-sm">Gestisci promemoria e scadenze</p>
            </div>

            <button
                onClick={() => setShowAddReminder(true)}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 mb-4 shadow"
            >
                ➕ Nuovo Reminder
            </button>

            <div className="mb-6">
                <h3 className="font-bold text-gray-700 mb-3">Da Fare ({reminderAttivi.length})</h3>
                <div className="space-y-3">
                    {reminderAttivi.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <p className="text-3xl mb-2">✅</p>
                            <p>Nessun reminder attivo</p>
                        </div>
                    ) : (
                        reminderAttivi.map(reminder => {
                            const isScaduto = reminder.dataScadenza < oggi;
                            return (
                                <div key={reminder.id} className={`bg-white rounded-lg p-4 shadow border-l-4 ${isScaduto ? 'border-red-500' : 'border-blue-500'}`}>
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={() => toggleCompletato(reminder.id, reminder.completato)}
                                            className="mt-1 w-6 h-6 rounded border-2 border-gray-300 hover:border-blue-600 flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-800">{reminder.titolo}</p>
                                            {reminder.descrizione && (
                                                <p className="text-sm text-gray-600 mt-1">{reminder.descrizione}</p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                <span className={`text-xs px-2 py-1 rounded ${isScaduto ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {isScaduto ? '⚠️ Scaduto' : '📅'} {new Date(reminder.dataScadenza).toLocaleDateString('it-IT')}
                                                </span>
                                                {reminder.importoStimato && (
                                                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                                                        💰 € {reminder.importoStimato}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => setEditingReminder(reminder)}
                                                className="text-blue-500 hover:text-blue-700 p-1"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => eliminaReminder(reminder.id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {reminderCompletati.length > 0 && (
                <div>
                    <h3 className="font-bold text-gray-700 mb-3">Completati ({reminderCompletati.length})</h3>
                    <div className="space-y-3">
                        {reminderCompletati.map(reminder => (
                            <div key={reminder.id} className="bg-gray-50 rounded-lg p-4 shadow opacity-75">
                                <div className="flex items-start gap-3">
                                    <button
                                        onClick={() => toggleCompletato(reminder.id, reminder.completato)}
                                        className="mt-1 w-6 h-6 rounded border-2 border-green-500 bg-green-500 text-white flex items-center justify-center flex-shrink-0"
                                    >
                                        ✓
                                    </button>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-600 line-through">{reminder.titolo}</p>
                                        {reminder.descrizione && (
                                            <p className="text-sm text-gray-500 mt-1">{reminder.descrizione}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => eliminaReminder(reminder.id)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
