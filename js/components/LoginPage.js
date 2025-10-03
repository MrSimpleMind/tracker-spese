function LoginPage() {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (err) {
            // Traduci errori comuni in italiano
            let errorMessage = err.message;
            if (err.code === 'auth/user-not-found') {
                errorMessage = 'Account non trovato. Contatta l\'amministratore.';
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = 'Password errata.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Email non valida.';
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = 'Troppi tentativi. Riprova più tardi.';
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">💰</div>
                    <h1 className="text-3xl font-bold text-gray-800">Tracker Spese Famiglia</h1>
                    <p className="text-gray-600 mt-2">App privata - Accedi con le tue credenziali</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            placeholder="nome@esempio.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            minLength="6"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Accesso in corso...' : 'Accedi'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>🔒 Accesso riservato ai membri della famiglia</p>
                    <p className="mt-2">Non hai un account? Contatta l'amministratore</p>
                </div>
            </div>
        </div>
    );
}
