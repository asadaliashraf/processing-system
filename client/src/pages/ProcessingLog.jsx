import { useEffect, useState } from 'react';

export default function ProcessingLog() {
  const [rows, setRows] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    let url = '/api/processing-log?';
    if (fromDate) url += `from_date=${fromDate}&`;
    if (toDate)   url += `to_date=${toDate}&`;
    if (batchFilter) url += `batch_no=${batchFilter}`;
    const data = await fetch(url).then(r => r.json());
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!confirm('Delete this entry?')) return;
    await fetch(`/api/processing-log/${id}`, { method: 'DELETE' });
    load();
  };

  const totalMin = rows.reduce((s, r) => s + parseFloat(r.produced_min || 0), 0);

  return (
    <div>
      <h4 className="fw-bold text-primary mb-4"><i className="bi bi-journal-text me-2"></i>Processing Log</h4>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-auto">
              <label className="form-label small mb-1">From Date</label>
              <input type="date" className="form-control form-control-sm" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div className="col-auto">
              <label className="form-label small mb-1">To Date</label>
              <input type="date" className="form-control form-control-sm" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <div className="col-auto">
              <label className="form-label small mb-1">Batch No</label>
              <input className="form-control form-control-sm" placeholder="Filter by batch..." style={{ width: 150 }}
                value={batchFilter} onChange={e => setBatchFilter(e.target.value)} />
            </div>
            <div className="col-auto">
              <button className="btn btn-primary btn-sm" onClick={load}>
                <i className="bi bi-funnel me-1"></i>Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between">
          <span className="fw-semibold">Entries: {rows.length}</span>
          <span className="fw-bold text-success">Total Produced Min: {totalMin.toFixed(2)}</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover table-sm mb-0" style={{ fontSize: '0.8rem' }}>
            <thead className="table-dark">
              <tr>
                <th>Date</th><th>Batch</th><th>Order</th><th>Pair Codes</th><th>Club</th>
                <th>Weight (kg)</th><th>Machine</th><th>Recipe</th><th>Dryer</th><th>Hydro</th>
                <th>Cycles</th><th>Dryer SAM</th><th>M/C SAM</th><th>Hydro SAM</th><th>Total SAM</th>
                <th>Produced Min</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="17" className="text-center py-3"><div className="spinner-border spinner-border-sm"></div></td></tr>}
              {!loading && rows.length === 0 && (
                <tr><td colSpan="17" className="text-center text-muted py-3">No entries found.</td></tr>
              )}
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.log_date?.split('T')[0]}</td>
                  <td><span className="badge bg-primary">{r.batch_no}</span></td>
                  <td>{r.order_no}</td>
                  <td><strong>{r.pair_codes_str}</strong></td>
                  <td>{r.club_group}</td>
                  <td>{r.pair_code_weight}</td>
                  <td>{r.machine}</td>
                  <td>{r.recipe}</td>
                  <td>{r.dryer}</td>
                  <td>{r.hydro_name || '—'}</td>
                  <td>{r.cycles}</td>
                  <td>{parseFloat(r.dryer_sam || 0).toFixed(4)}</td>
                  <td>{parseFloat(r.machine_sam || 0).toFixed(4)}</td>
                  <td>{parseFloat(r.hydro_sam || 0).toFixed(4)}</td>
                  <td>{parseFloat(r.total_sam || 0).toFixed(4)}</td>
                  <td><strong className="text-success">{parseFloat(r.produced_min || 0).toFixed(2)}</strong></td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger py-0" onClick={() => del(r.id)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
