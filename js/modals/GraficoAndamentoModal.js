function GraficoAndamentoModal({ transactions, onClose }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!canvasRef.current) return;

        const oggi = new Date();
        const datiMesi = [];
        
        for (let i = 5; i >= 0; i--) {
            const mese = new Date(oggi.getFullYear(), oggi.getMonth() - i, 1);
            const meseProssimo = new Date(oggi.getFullYear(), oggi.getMonth() - i + 1, 1);
            
            const transactionsDelMese = transactions.filter(t => {
                const dataTransaction = new Date(t.data);
                return dataTransaction >= mese && dataTransaction < meseProssimo;
            });
            
            const spese = transactionsDelMese.filter(t => t.tipo === 'spesa');
            const entrate = transactionsDelMese.filter(t => t.tipo === 'entrata');
            const accumuli = transactionsDelMese.filter(t => t.tipo === 'accumulo');
            
            const totaleSpese = spese.reduce((acc, t) => acc + parseFloat(t.importo), 0);
            const totaleEntrate = entrate.reduce((acc, t) => acc + parseFloat(t.importo), 0);
            const totaleAccumuli = accumuli.reduce((acc, t) => acc + parseFloat(t.importo), 0);
            const cashFlow = totaleEntrate - totaleSpese; // Accumuli neutrali
            
            datiMesi.push({
                mese: mese.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
                spese: totaleSpese,
                entrate: totaleEntrate,
                accumuli: totaleAccumuli,
                cashFlow: cashFlow
            });
        }

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const ctx = canvasRef.current.getContext('2d');
        chartRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: datiMesi.map(d => d.mese),
                datasets: [
                    {
                        label: '💰 Entrate',
                        data: datiMesi.map(d => d.entrate),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.3,
                        fill: false,
                        borderWidth: 3
                    },
                    {
                        label: '💸 Spese',
                        data: datiMesi.map(d => d.spese),
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.3,
                        fill: false,
                        borderWidth: 3
                    },
                    {
                        label: '🏦 Accumuli',
                        data: datiMesi.map(d => d.accumuli),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.3,
                        fill: false,
                        borderWidth: 2,
                        borderDash: [5, 5]
                    },
                    {
                        label: '💵 Cash Flow',
                        data: datiMesi.map(d => d.cashFlow),
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        tension: 0.3,
                        fill: true,
                        borderWidth: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += '€ ' + context.parsed.y.toFixed(2);
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '€ ' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [transactions]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-2xl">
                    <h2 className="text-xl font-bold">📊 Andamento Finanziario</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                <div className="p-4">
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm text-gray-600 mb-2">Ultimi 6 mesi</p>
                        <div style={{ height: '400px' }}>
                            <canvas ref={canvasRef}></canvas>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
}
