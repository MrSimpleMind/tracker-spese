function GraficoAndamentoModal({ transactions, onClose }) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);

    React.useEffect(() => {
        if (!canvasRef.current) return;

        const oggi = new Date();
        const datiMesi = [];
        
        // Prepara dati ultimi 6 mesi
        for (let i = 5; i >= 0; i--) {
            const mese = new Date(oggi.getFullYear(), oggi.getMonth() - i, 1);
            const meseProssimo = new Date(oggi.getFullYear(), oggi.getMonth() - i + 1, 1);
            
            const speseDelMese = transactions.filter(t => {
                const dataTransaction = new Date(t.data);
                return t.tipo === 'spesa' && dataTransaction >= mese && dataTransaction < meseProssimo;
            });
            
            const totaleSpese = speseDelMese.reduce((acc, t) => acc + parseFloat(t.importo), 0);
            
            datiMesi.push({
                mese: mese.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
                spese: totaleSpese
            });
        }

        // Distruggi grafico precedente se esiste
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        // Crea nuovo grafico
        const ctx = canvasRef.current.getContext('2d');
        chartRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: datiMesi.map(d => d.mese),
                datasets: [
                    {
                        label: '💸 Spese',
                        data: datiMesi.map(d => d.spese),
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 3,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        pointBackgroundColor: '#ef4444',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
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
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 13,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                return '💸 Spese: € ' + context.parsed.y.toFixed(2);
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
                            },
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: false
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

    // Calcola statistica veloce
    const totaleSpese = transactions
        .filter(t => t.tipo === 'spesa')
        .reduce((acc, t) => acc + parseFloat(t.importo), 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">📊 Andamento Spese</h2>
                        <p className="text-sm text-gray-500 mt-1">Ultimi 6 mesi</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                <div className="p-4">
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 mb-4">
                        <div style={{ height: '350px' }}>
                            <canvas ref={canvasRef}></canvas>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-1">Totale Spese (tutti i tempi)</p>
                            <p className="text-3xl font-bold text-red-600">€{totaleSpese.toFixed(2)}</p>
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
