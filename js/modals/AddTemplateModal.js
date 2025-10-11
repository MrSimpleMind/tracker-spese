function AddTemplateModal({ onClose, categorie }) {
    const [tipo, setTipo] = React.useState('spesa');
    const [descrizione, setDescrizione] = React.useState('');
    const [importoStimato, setImportoStimato] = React.useState('');
    const [categoria, setCategoria] = React.useState('');
    const [nota, setNota] = React.useState('');
    const [frequenza, setFrequenza] = React.useState('mensile');
    const [giornoMese, setGiornoMese] = React.useState(1);
    const [giornoAnno, setGiornoAnno] = React.useState(1);
    const [meseAnno, setMeseAnno] = React.useState(1);
    const [primaScadenzaManuale, setPrimaScadenzaManuale] = React.useState('');
    const [usaPrimaScadenzaManuale, setUsaPrimaScadenzaManuale] = React.useState(false);
    const [contoId, setContoId] = React.useState('');
    const [conti, setConti] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    // Carica i conti disponibili
    React.useEffect(() => {
        const loadConti = async () => {
            try {
                const snapshot = await db.collection('conti')
                    .where('userId', '==', auth.currentUser.uid)
                    .get();
                
                const contiData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setConti(contiData);
            } catch (err) {
                console.error('Errore caricamento conti:', err);
            }
        };
        loadConti();
    }, []);

    // Filtra categorie in base al tipo selezionato
    const categorieDisponibili = categorie.filter(cat => 
        cat.applicabileA && cat.applicabileA.includes(tipo)
    );

    // Se cambio tipo e la categoria attuale non è valida, resetta
    React.useEffect(() => {
        if (categoria && !categorieDisponibili.find(c => c.nome === categoria)) {
            setCategoria('');
        }
    }, [tipo, categoria, categorieDisponibili]);

    const calcolaProssimaScadenza = () => {
        const oggi = new Date();
        
        if (frequenza === 'mensile') {
            let prossimaData = new Date(oggi.getFullYear(), oggi.getMonth(), giornoMese);
            
            if (prossimaData < oggi) {
                prossimaData = new Date(oggi.getFullYear(), oggi.getMonth() + 1, giornoMese);
            }
            
            if (prossimaData.getDate() !== parseInt(giornoMese)) {
                prossimaData = new Date(prossimaData.getFullYear(), prossimaData.getMonth() + 1, 0);
            }
            
            return prossimaData.toISOString().split('T')[0];
        } else if (frequenza === 'bimestrale') {
            let prossimaData = new Date(oggi.getFullYear(), oggi.getMonth(), giornoMese);
            
            if (prossimaData < oggi) {
                prossimaData = new Date(oggi.getFullYear(), oggi.getMonth() + 2, giornoMese);
            }
            
            if (prossimaData.getDate() !== parseInt(giornoMese)) {
                prossimaData = new Date(prossimaData.getFullYear(), prossimaData.getMonth() + 1, 0);
            }
            
            return prossimaData.toISOString().split('T')[0];
        } else {
            let prossimaData = new Date(oggi.getFullYear(), meseAnno - 1, giornoAnno);
            
            if (prossimaData < oggi) {
                prossimaData = new Date(oggi.getFullYear() + 1, meseAnno - 1, giornoAnno);
            }
            
            return prossimaData.toISOString().split('T')[0];
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const prossimaScadenza = usaPrimaScadenzaManuale && primaScadenzaManuale 
                ? primaScadenzaManuale 
                : calcolaProssimaScadenza();
            
            const templateData = {
                tipo,
                descrizione,
                importoStimato: parseFloat(importoStimato),
                categoria,
                contoId: contoId || null,
                nota,
                frequenza,
                attivo: true,
                prossimaScadenza,
                userId: auth.currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (frequenza === 'mensile' || frequenza === 'bimestrale') {
                templateData.giornoMese = parseInt(giornoMese);
            } else {
                templateData.giornoAnno = parseInt(giornoAnno);
                templateData.meseAnno = parseInt(meseAnno);
            }

            await db.collection('template_ricorrenti').add(templateData);
            onClose();
        } catch (err) {
            alert('Errore: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const mesi = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];

    const tipoConfig = {
        spesa: { label: 'Spesa', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-500' },
        entrata: { label: 'Entrata', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-500' },
        movimento_fondo: { label: 'Movimento Fondo', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-500' }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[60]">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Nuovo Template</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Selezione Tipo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(tipoConfig).map(([key, conf]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setTipo(key)}
                                    className={`py-3 px-4 rounded-lg text-sm font-medium border-2 transition ${
                                        tipo === key 
                                            ? `${conf.borderColor} ${conf.bgColor} ${conf.color}` 
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                    {conf.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione *</label>
                        <input
                            type="text"
                            value={descrizione}
                            onChange={(e) => setDescrizione(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                            placeholder={
                                tipo === 'spesa' ? 'Es: Affitto, Netflix...' :
                                tipo === 'entrata' ? 'Es: Stipendio, Freelance...' :
                                'Es: Fondo emergenza, Risparmio...'
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Importo Stimato (€) *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={importoStimato}
                            onChange={(e) => setImportoStimato(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                            placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">Potrai modificarlo quando inserisci la transazione</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                        <select
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Seleziona categoria</option>
                            {categorieDisponibili.map(cat => (
                                <option key={cat.id} value={cat.nome}>
                                    {cat.nome}
                                </option>
                            ))}
                        </select>
                        {categorieDisponibili.length === 0 && (
                            <p className="text-xs text-orange-600 mt-1">
                                ⚠️ Nessuna categoria disponibile per questo tipo. Creane una nella sezione Categorie!
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Conto *</label>
                        <select
                            value={contoId}
                            onChange={(e) => setContoId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Seleziona conto</option>
                            {conti.map(conto => (
                                <option key={conto.id} value={conto.id}>
                                    {conto.nome} - {conto.saldo.toFixed(2)}€
                                </option>
                            ))}
                        </select>
                        {conti.length === 0 && (
                            <p className="text-xs text-orange-600 mt-1">
                                ⚠️ Nessun conto disponibile. Creane uno nella sezione Conti!
                            </p>
                        )}
                    </div>

                    <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">🔄 Frequenza *</label>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <button
                                type="button"
                                onClick={() => setFrequenza('mensile')}
                                className={`py-2 px-4 rounded-lg text-sm font-medium ${frequenza === 'mensile' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                            >
                                📅 Mensile
                            </button>
                            <button
                                type="button"
                                onClick={() => setFrequenza('bimestrale')}
                                className={`py-2 px-4 rounded-lg text-sm font-medium ${frequenza === 'bimestrale' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                            >
                                📅 Bimestrale
                            </button>
                            <button
                                type="button"
                                onClick={() => setFrequenza('annuale')}
                                className={`py-2 px-4 rounded-lg text-sm font-medium ${frequenza === 'annuale' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                            >
                                📅 Annuale
                            </button>
                        </div>

                        {(frequenza === 'mensile' || frequenza === 'bimestrale') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Giorno del mese *</label>
                                <select
                                    value={giornoMese}
                                    onChange={(e) => setGiornoMese(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(giorno => (
                                        <option key={giorno} value={giorno}>
                                            {giorno}
                                        </option>
                                    ))}
                                </select>
                                {!usaPrimaScadenzaManuale && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 Prossima scadenza: {new Date(calcolaProssimaScadenza()).toLocaleDateString('it-IT')}
                                    </p>
                                )}
                            </div>
                        )}

                        {frequenza === 'annuale' && (
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giorno *</label>
                                    <select
                                        value={giornoAnno}
                                        onChange={(e) => setGiornoAnno(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(giorno => (
                                            <option key={giorno} value={giorno}>
                                                {giorno}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mese *</label>
                                    <select
                                        value={meseAnno}
                                        onChange={(e) => setMeseAnno(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        {mesi.map((mese, index) => (
                                            <option key={index + 1} value={index + 1}>
                                                {mese}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {!usaPrimaScadenzaManuale && (
                                    <p className="text-xs text-gray-500 mt-1 col-span-2">
                                        💡 Prossima scadenza: {new Date(calcolaProssimaScadenza()).toLocaleDateString('it-IT')}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Prima scadenza manuale (per testing) */}
                    <div className="border-t pt-4">
                        <div className="flex items-center mb-2">
                            <input
                                type="checkbox"
                                id="usaPrimaScadenzaManuale"
                                checked={usaPrimaScadenzaManuale}
                                onChange={(e) => setUsaPrimaScadenzaManuale(e.target.checked)}
                                className="mr-2"
                            />
                            <label htmlFor="usaPrimaScadenzaManuale" className="text-sm font-medium text-gray-700">
                                👁️ Imposta prima scadenza manualmente (per test)
                            </label>
                        </div>
                        
                        {usaPrimaScadenzaManuale && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prima scadenza *</label>
                                <input
                                    type="date"
                                    value={primaScadenzaManuale}
                                    onChange={(e) => setPrimaScadenzaManuale(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required={usaPrimaScadenzaManuale}
                                />
                                <p className="text-xs text-orange-600 mt-1">
                                    ⚠️ Utile per testare: puoi impostare una data passata per vedere il banner di alert
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nota (opzionale)</label>
                        <textarea
                            value={nota}
                            onChange={(e) => setNota(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows="2"
                            placeholder="Note aggiuntive..."
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Salvataggio...' : 'Crea Template'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
