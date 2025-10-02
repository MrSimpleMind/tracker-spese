function GraficoAndamentoModal({ spese, onClose }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!canvasRef.current) return;

        const oggi = new Date();
        const datiMesi = [];
        
        for (let i = 5; i >= 0; i--) {
            const mese = new Date(oggi.getFullYear(), oggi.getMonth() - i, 1);
            const meseProssimo = new Date(oggi.getFullYear(), oggi.getMonth() - i + 1, 1);
            
            const speseDelMese = spese.filter(s => {
                const dataSpesa = new Date(s.data);
                return dataSpesa >= mese && dataSpesa < meseProssimo;
            });
            
            const totale = speseDelMese.reduce((acc, s) => acc + parseFloat(s.importo), 0);
            
            datiMesi.push({
                mese: mese.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
                totale: totale,
                numSpese: speseDelMese.length
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
                datasets: [{
                    label: 'Spese Mensili (€)',
                    data: datiMesi.map(d => d.totale),
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const index = context.dataIndex;
                                return [
                                    `Totale: € ${context.parsed.y.toFixed(2)}`,
                                    `Spese: ${datiMesi[index].numSpese}`
                                ];
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
    }, [spese]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-2xl">
                    <h2 className="text-xl font-bold">📊 Andamento Spese</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                <div className="p-4">
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm text-gray-600 mb-2">Ultimi 6 mesi</p>
                        <div style={{ height: '300px' }}>
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
