function TemplateRicorrentiModal({ onClose, categorie, onInsertFromTemplate }) {
    const [templates, setTemplates] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showAddTemplate, setShowAddTemplate] = React.useState(false);
    const [editingTemplate, setEditingTemplate] = React.useState(null);
    const [showDettaglio, setShowDettaglio] = React.useState(null);

    // Carica templates
    React.useEffect(() => {
        const unsubscribe = db.collection('template_ricorrenti')
            .where('userId', '==', auth.currentUser.uid)
            .onSnapshot(
                snapshot => {
                    const templatesData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    // Ordina lato client invece che con orderBy (che richiede indice)
                    templatesData.sort((a, b) => a.descrizione.localeCompare(b.descrizione));
                    setTemplates(templatesData);
                    setLoading(false);
                },
                error => {
                    console.error('Errore caricamento template:', error);
                    alert('Errore nel caricamento dei template: ' + error.message);
                    setLoading(false);
                }
            );
        
        return unsubscribe;
    }, []);

    const eliminaTemplate = async (id) => {
        if (confirm('Vuoi eliminare questo template? Le spese già inserite rimarranno.')) {
            await db.collection('template_ricorrenti').doc(id).delete();
        }
    };

    const togglePausa = async (id, attivo) => {
        await db.collection('template_ricorrenti').doc(id).update({
            attivo: !attivo,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    };

    const calcolaGiorniMancanti = (prossimaScadenza) => {
        const oggi = new Date();
        const scadenza = new Date(prossimaScadenza);
        const diff = Math.ceil((scadenza - oggi) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const templatesAttivi = templates.filter(t => t.attivo);
    const templatesInPausa = templates.filter(t => !t.attivo);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">⚙️ Template Ricorrenti</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                <div className="p-4">
                    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-900">
                            💡 I template sono "ricette" per creare spese ricorrenti. Quando scade un template, 
                            potrai inserire velocemente la spesa nella sezione Spese.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowAddTemplate(true)}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 mb-4 shadow"
                    >
                        ➕ Nuovo Template
                    </button>

                    {/* Templates Attivi */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-700 mb-3 flex items-center">
                            <span className="text-green-500 mr-2">●</span>
                            Attivi ({templatesAttivi.length})
                        </h3>
                        
                        {templatesAttivi.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-3xl mb-2">📋</p>
                                <p>Nessun template attivo</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {templatesAttivi.map(template => {
                                    const giorniMancanti = calcolaGiorniMancanti(template.prossimaScadenza);
                                    const isScaduto = giorniMancanti < 0;
                                    
                                    return (
                                        <div key={template.id} className={`bg-white rounded-lg p-4 shadow border-l-4 ${isScaduto ? 'border-red-500' : 'border-green-500'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <p className="font-bold text-lg text-gray-800">{template.descrizione}</p>
                                                    <p className="text-sm text-gray-500">{template.categoria}</p>
                                                </div>
                                                <p className="text-xl font-bold text-blue-600">€ {parseFloat(template.importoStimato).toFixed(2)}</p>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2 text-xs mb-3">
                                                <span className="px-2 py-1 bg-gray-100 rounded">
                                                    {template.frequenza === 'mensile' ? `📅 Mensile (giorno ${template.giornoMese})` : `📅 Annuale (${template.giornoAnno}/${template.meseAnno})`}
                                                </span>
                                                <span className={`px-2 py-1 rounded ${isScaduto ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {isScaduto 
                                                        ? `⚠️ Scaduto ${Math.abs(giorniMancanti)} giorni fa` 
                                                        : `Prossima: ${new Date(template.prossimaScadenza).toLocaleDateString('it-IT')} (${giorniMancanti === 0 ? 'oggi' : `tra ${giorniMancanti} giorni`})`
                                                    }
                                                </span>
                                            </div>

                                            <div className="flex gap-2">
                                                {isScaduto && (
                                                    <button
                                                        onClick={() => onInsertFromTemplate(template)}
                                                        className="flex-1 bg-green-500 text-white py-2 px-3 rounded text-sm font-medium hover:bg-green-600"
                                                    >
                                                        ✓ Inserisci Ora
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setShowDettaglio(template)}
                                                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm font-medium hover:bg-gray-200"
                                                >
                                                    📊 Dettagli
                                                </button>
                                                <button
                                                    onClick={() => togglePausa(template.id, template.attivo)}
                                                    className="bg-yellow-100 text-yellow-700 py-2 px-3 rounded text-sm font-medium hover:bg-yellow-200"
                                                >
                                                    ⏸️
                                                </button>
                                                <button
                                                    onClick={() => setEditingTemplate(template)}
                                                    className="bg-blue-100 text-blue-700 py-2 px-3 rounded text-sm font-medium hover:bg-blue-200"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => eliminaTemplate(template.id)}
                                                    className="bg-red-100 text-red-700 py-2 px-3 rounded text-sm font-medium hover:bg-red-200"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Templates In Pausa */}
                    {templatesInPausa.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-700 mb-3 flex items-center">
                                <span className="text-gray-400 mr-2">●</span>
                                In Pausa ({templatesInPausa.length})
                            </h3>
                            
                            <div className="space-y-3">
                                {templatesInPausa.map(template => (
                                    <div key={template.id} className="bg-gray-50 rounded-lg p-4 shadow opacity-75">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-600">{template.descrizione}</p>
                                                <p className="text-sm text-gray-500">{template.categoria}</p>
                                            </div>
                                            <p className="text-lg font-bold text-gray-500">€ {parseFloat(template.importoStimato).toFixed(2)}</p>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => togglePausa(template.id, template.attivo)}
                                                className="flex-1 bg-green-100 text-green-700 py-2 px-3 rounded text-sm font-medium hover:bg-green-200"
                                            >
                                                ▶️ Riattiva
                                            </button>
                                            <button
                                                onClick={() => setEditingTemplate(template)}
                                                className="bg-blue-100 text-blue-700 py-2 px-3 rounded text-sm font-medium hover:bg-blue-200"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => eliminaTemplate(template.id)}
                                                className="bg-red-100 text-red-700 py-2 px-3 rounded text-sm font-medium hover:bg-red-200"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 mt-6"
                    >
                        Chiudi
                    </button>
                </div>
            </div>

            {showAddTemplate && (
                <AddTemplateModal 
                    onClose={() => setShowAddTemplate(false)}
                    categorie={categorie}
                />
            )}

            {editingTemplate && (
                <EditTemplateModal 
                    template={editingTemplate}
                    onClose={() => setEditingTemplate(null)}
                    categorie={categorie}
                />
            )}

            {showDettaglio && (
                <DettaglioTemplateModal 
                    template={showDettaglio}
                    onClose={() => setShowDettaglio(null)}
                />
            )}
        </div>
    );
}
