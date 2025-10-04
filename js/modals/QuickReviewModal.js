function QuickReviewModal({ templates, onClose, categorie }) {
    const [templateStates, setTemplateStates] = React.useState(
        templates.reduce((acc, t) => ({
            ...acc,
            [t.id]: {
                importo: t.importoStimato,
                data: t.prossimaScadenza,
                nota: t.nota || '',
                skipped: false
            }
        }), {})
    );
    const [loading, setLoading] = React.useState(false);

    const calcolaProssimaScadenza = (template) => {
        const oggi = new Date();
        
        if (template.frequenza === 'mensile') {
            let prossimaData = new Date(oggi.getFullYear(), oggi.getMonth() + 1, template.giornoMese);
            
            // Gestione giorni "difficili"
            if (prossimaData.getDate() !== parseInt(template.giornoMese)) {
                prossimaData = new Date(prossimaData.getFullYear(), prossimaData.getMonth() + 1, 0);
            }
            
            return prossimaData.toISOString().split('T')[0];
        } else if (template.frequenza === 'bimestrale') {
            // Bimestrale: +2 mesi
            let prossimaData = new Date(oggi.getFullYear(), oggi.getMonth() + 2, template.giornoMese);
            
            // Gestione giorni "difficili"
            if (prossimaData.getDate() !== parseInt(template.giornoMese)) {
                prossimaData = new Date(prossimaData.getFullYear(), prossimaData.getMonth() + 1, 0);
            }
            
            return prossimaData.toISOString().split('T')[0];
        } else {
            // Annuale
            let prossimaData = new Date(oggi.getFullYear() + 1, template.meseAnno - 1, template.giornoAnno);
            return prossimaData.toISOString().split('T')[0];
        }
    };

    const handleInserisci = async (template) => {
        const state = templateStates[template.id];
        setLoading(true);

        try {
            // Inserisci la transazione
            await db.collection('transactions').add({
                tipo: template.tipo || 'spesa',
                descrizione: template.descrizione,
                importo: parseFloat(state.importo),
                categoria: template.categoria,
                data: state.data,
                nota: state.nota,
                isRicorrente: true,
                templateId: template.id,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: auth.currentUser.uid
            });

            // Aggiorna prossima scadenza del template
            const prossimaScadenza = calcolaProssimaScadenza(template);
            await db.collection('template_ricorrenti').doc(template.id).update({
                prossimaScadenza: prossimaScadenza,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Rimuovi questo template dalla lista
            setTemplateStates(prev => {
                const newState = { ...prev };
                delete newState[template.id];
                return newState;
            });

            // Se era l'ultimo, chiudi modale
            if (Object.keys(templateStates).length === 1) {
                onClose();
            }
        } catch (err) {
            alert('Errore: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSalta = async (template) => {
        setLoading(true);

        try {
            // Aggiorna solo prossima scadenza senza inserire transazione
            const prossimaScadenza = calcolaProssimaScadenza(template);
            await db.collection('template_ricorrenti').doc(template.id).update({
                prossimaScadenza: prossimaScadenza,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Rimuovi dalla lista
            setTemplateStates(prev => {
                const newState = { ...prev };
                delete newState[template.id];
                return newState;
            });

            if (Object.keys(templateStates).length === 1) {
                onClose();
            }
        } catch (err) {
            alert('Errore: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateTemplateState = (templateId, field, value) => {
        setTemplateStates(prev => ({
            ...prev,
            [templateId]: {
                ...prev[templateId],
                [field]: value
            }
        }));
    };

    const templatesAttivi = templates.filter(t => templateStates[t.id]);

    const tipoConfig = {
        spesa: { label: 'Spesa', icon: '💸', color: 'text-red-600', border: 'border-red-200' },
        entrata: { label: 'Entrata', icon: '💰', color: 'text-green-600', border: 'border-green-200' },
        accumulo: { label: 'Accumulo', icon: '🏦', color: 'text-blue-600', border: 'border-blue-200' }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">🔄 Transazioni Ricorrenti</h2>
                        <p className="text-sm text-gray-600">Inserisci le transazioni scadute</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                <div className="p-4">
                    {templatesAttivi.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-4xl mb-2">✅</p>
                            <p className="text-gray-600">Tutte le transazioni sono state gestite!</p>
                            <button
                                onClick={onClose}
                                className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700"
                            >
                                Chiudi
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {templatesAttivi.map(template => {
                                const state = templateStates[template.id];
                                const giorniScadenza = Math.floor((new Date() - new Date(template.prossimaScadenza)) / (1000 * 60 * 60 * 24));
                                const config = tipoConfig[template.tipo || 'spesa'];
                                
                                return (
                                    <div key={template.id} className={`bg-white border-2 ${config.border} rounded-lg p-4 shadow`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-lg">{config.icon}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded bg-gray-100 ${config.color} font-medium`}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                                <p className="font-bold text-lg text-gray-800">{template.descrizione}</p>
                                                <p className="text-sm text-gray-500">{template.categoria}</p>
                                                <p className="text-xs text-orange-600 mt-1">
                                                    ⚠️ Scaduto {giorniScadenza === 0 ? 'oggi' : `${giorniScadenza} giorni fa`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Importo (€)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={state.importo}
                                                    onChange={(e) => updateTemplateState(template.id, 'importo', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Data</label>
                                                <input
                                                    type="date"
                                                    value={state.data}
                                                    onChange={(e) => updateTemplateState(template.id, 'data', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Nota (opzionale)</label>
                                            <input
                                                type="text"
                                                value={state.nota}
                                                onChange={(e) => updateTemplateState(template.id, 'nota', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                                placeholder="Note aggiuntive..."
                                                disabled={loading}
                                            />
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleInserisci(template)}
                                                disabled={loading}
                                                className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                                            >
                                                ✓ Inserisci
                                            </button>
                                            <button
                                                onClick={() => handleSalta(template)}
                                                disabled={loading}
                                                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
                                            >
                                                ⏭️ Salta
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {templatesAttivi.length > 0 && (
                        <button
                            onClick={onClose}
                            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 mt-4"
                        >
                            Chiudi e gestisci dopo
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
