function AdminView() {
    const [users, setUsers] = React.useState([]);
    const [newEmail, setNewEmail] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const [error, setError] = React.useState('');

    // Carica lista utenti creati dall'admin
    React.useEffect(() => {
        const unsubscribe = db.collection('admin_users')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const usersData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setUsers(usersData);
            });
        
        return unsubscribe;
    }, []);

    const createUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            // Creiamo l'utente usando Firebase Auth
            await auth.createUserWithEmailAndPassword(newEmail, newPassword);
            
            // Salviamo le credenziali in Firestore (solo per visibilità admin)
            await db.collection('admin_users').add({
                email: newEmail,
                password: newPassword, // SOLO per uso interno famiglia
                createdBy: auth.currentUser.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            setMessage(`✅ Utente ${newEmail} creato con successo!`);
            setNewEmail('');
            setNewPassword('');
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError('Questa email è già registrata');
            } else if (err.code === 'auth/invalid-email') {
                setError('Email non valida');
            } else if (err.code === 'auth/weak-password') {
                setError('Password troppo debole (minimo 6 caratteri)');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const generatePassword = () => {
        // Genera una password casuale di 10 caratteri
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 10; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewPassword(password);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setMessage('📋 Copiato negli appunti!');
        setTimeout(() => setMessage(''), 2000);
    };

    const deleteUser = async (userId, email) => {
        if (!confirm(`Vuoi eliminare l'utente ${email}? Questa azione eliminerà solo il record admin, non l'account Firebase.`)) {
            return;
        }

        try {
            await db.collection('admin_users').doc(userId).delete();
            setMessage(`✅ Utente ${email} rimosso dalla lista`);
        } catch (err) {
            setError('Errore durante l\'eliminazione: ' + err.message);
        }
    };

    return (
        <div className="fade-in">
            <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">🛡️ Pannello Admin</h2>
                <p className="text-gray-600 text-sm">Gestisci gli utenti autorizzati all'accesso</p>
            </div>

            {/* Form creazione utente */}
            <div className="bg-white rounded-lg p-6 shadow mb-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4">➕ Crea Nuovo Utente</h3>
                
                <form onSubmit={createUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                            placeholder="nome@esempio.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                                minLength="6"
                                placeholder="Minimo 6 caratteri"
                            />
                            <button
                                type="button"
                                onClick={generatePassword}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 whitespace-nowrap"
                            >
                                🎲 Genera
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            💡 Clicca "Genera" per creare una password casuale sicura
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                            ❌ {error}
                        </div>
                    )}

                    {message && !error && (
                        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
                            {message}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Creazione...' : '✅ Crea Utente'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Lista utenti creati */}
            <div className="bg-white rounded-lg p-6 shadow mb-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                    👥 Utenti Creati ({users.length})
                </h3>
                
                {users.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <p className="text-3xl mb-2">👤</p>
                        <p>Nessun utente creato ancora</p>
                        <p className="text-xs mt-2">Gli utenti già esistenti non sono visibili</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {users.map(user => (
                            <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800">{user.email}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Creato il {user.createdAt?.toDate().toLocaleDateString('it-IT')} alle {user.createdAt?.toDate().toLocaleTimeString('it-IT')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => deleteUser(user.id, user.email)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Rimuovi dalla lista"
                                    >
                                        🗑️
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Email:</p>
                                        <div className="flex gap-1">
                                            <code className="flex-1 text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200 truncate">
                                                {user.email}
                                            </code>
                                            <button
                                                onClick={() => copyToClipboard(user.email)}
                                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                                                title="Copia email"
                                            >
                                                📋
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Password:</p>
                                        <div className="flex gap-1">
                                            <code className="flex-1 text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200 truncate">
                                                {user.password}
                                            </code>
                                            <button
                                                onClick={() => copyToClipboard(user.password)}
                                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                                                title="Copia password"
                                            >
                                                📋
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Istruzioni per condividere credenziali */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                <h4 className="font-bold text-blue-900 mb-2">📤 Come condividere le credenziali</h4>
                <ol className="text-sm text-blue-800 space-y-2">
                    <li>1️⃣ Crea l'utente usando il form sopra</li>
                    <li>2️⃣ Clicca sui pulsanti 📋 per copiare email e password</li>
                    <li>3️⃣ Condividile con la persona in modo sicuro (WhatsApp, SMS, ecc.)</li>
                    <li>4️⃣ La persona potrà accedere dalla pagina di login</li>
                </ol>
            </div>

            {/* Info importante */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h4 className="font-bold text-orange-900 mb-2">⚠️ Nota Importante</h4>
                <p className="text-sm text-orange-800 mb-2">
                    Gli utenti già esistenti (creati prima di questa funzionalità) non sono visibili qui perché Firebase non permette di recuperare le password per motivi di sicurezza.
                </p>
                <p className="text-sm text-orange-800">
                    Per gestire utenti esistenti o cambiare password, accedi alla{' '}
                    <a 
                        href="https://console.firebase.google.com/u/0/project/tracker-di-spese/authentication/users" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline font-medium"
                    >
                        Console Firebase → Authentication
                    </a>
                </p>
            </div>
        </div>
    );
}
