import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(e => setError(e.message));
  }, []);

  if (error) return (
    <div className="alert alert-danger">
      <strong>Connection Error:</strong> {error}<br />
      <small>Make sure the server is running and the database is set up.</small>
    </div>
  );
  if (!data) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

  const today = new Date().toLocaleDateString('en-GB');

  return (
    <div>
      <h4 className="mb-4 fw-bold text-primary">
        <i className="bi bi-speedometer2 me-2"></i>Dashboard
        <small className="text-muted fs-6 ms-3">{today}</small>
      </h4>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Batches', value: data.totalBatches, icon: 'layers', color: 'primary' },
          { label: 'Machines', value: data.totalMachines, icon: 'cpu', color: 'success' },
          { label: "Batches Today", value: data.batchesToday, icon: 'calendar-check', color: 'info' },
          { label: "Produced Min Today", value: Number(data.producedMinToday).toFixed(0), icon: 'clock', color: 'warning' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="col-12 col-sm-6 col-xl-3">
            <div className={`card border-0 shadow-sm h-100`}>
              <div className="card-body d-flex align-items-center gap-3">
                <div className={`rounded-circle bg-${color} bg-opacity-10 p-3`}>
                  <i className={`bi bi-${icon} fs-3 text-${color}`}></i>
                </div>
                <div>
                  <div className="text-muted small">{label}</div>
                  <div className="fw-bold fs-4">{value}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Log */}
      <div className="card shadow-sm">
        <div className="card-header bg-white fw-semibold">
          <i className="bi bi-clock-history me-2"></i>Recent Processing Entries
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Date</th><th>Batch</th><th>Order No</th>
                <th>Pair Codes</th><th>Machine</th><th>Produced Min</th>
              </tr>
            </thead>
            <tbody>
              {data.recentLog.length === 0 && (
                <tr><td colSpan="6" className="text-center text-muted py-3">No entries yet. Use Batch Form to submit.</td></tr>
              )}
              {data.recentLog.map((row, i) => (
                <tr key={i}>
                  <td>{row.log_date?.split('T')[0]}</td>
                  <td><span className="badge bg-primary">{row.batch_no}</span></td>
                  <td>{row.order_no}</td>
                  <td>{row.pair_codes_str}</td>
                  <td><span className="badge bg-success">{row.machine}</span></td>
                  <td><strong>{Number(row.produced_min).toFixed(2)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
