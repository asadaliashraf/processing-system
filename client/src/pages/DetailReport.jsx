import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function DetailReport() {
  const [batches,       setBatches]       = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [rows,          setRows]          = useState([]);
  const [loaded,        setLoaded]        = useState(false);
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();

  useEffect(() => {
    fetch('/api/batches').then(r => r.json()).then(setBatches);
  }, []);

  // Auto-load if batch param came from Summary Report
  useEffect(() => {
    const bno = searchParams.get('batch');
    if (bno) {
      setSelectedBatch(bno);
      fetch(`/api/reports/detail/${encodeURIComponent(bno)}`).then(r => r.json()).then(data => {
        setRows(Array.isArray(data) ? data : []);
        setLoaded(true);
      });
    }
  }, [searchParams]);

  const load = async () => {
    if (!selectedBatch) return;
    const data = await fetch(`/api/reports/detail/${encodeURIComponent(selectedBatch)}`).then(r => r.json());
    setRows(Array.isArray(data) ? data : []);
    setLoaded(true);
  };

  const totalMin = rows.reduce((s, r) => s + parseFloat(r.produced_min || 0), 0);
  const totalWt  = rows.reduce((s, r) => s + parseFloat(r.pair_code_weight || 0), 0);

  const batchInfo = rows.length > 0 ? rows[0] : null;

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-4">
        <h4 className="fw-bold text-primary mb-0">
          <i className="bi bi-list-columns me-2"></i>Detail Report — Pair Code Level
        </h4>
        {searchParams.get('batch') && (
          <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-1"></i>Back to Summary
          </button>
        )}
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-auto">
              <label className="form-label small mb-1">Select Batch</label>
              <select className="form-select form-select-sm" style={{ width: 220 }}
                value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                <option value="">Select a batch...</option>
                {batches.map(b => (
                  <option key={b.id} value={b.batch_no}>{b.batch_no} — Order {b.order_no}</option>
                ))}
              </select>
            </div>
            <div className="col-auto">
              <button className="btn btn-primary btn-sm" onClick={load} disabled={!selectedBatch}>
                <i className="bi bi-play-fill me-1"></i>Load Detail
              </button>
            </div>
          </div>
        </div>
      </div>

      {loaded && (
        <>
          {/* Batch header */}
          {batchInfo && (
            <div className="card shadow-sm mb-4 border-primary">
              <div className="card-header bg-primary text-white fw-semibold">
                Batch {batchInfo.batch_no} — Order {batchInfo.order_no}
              </div>
              <div className="card-body py-2">
                <div className="row g-3">
                  {[
                    ['Issue Doc', batchInfo.issue_doc], ['Receive Doc', batchInfo.receive_doc],
                    ['Batch Weight', `${batchInfo.batch_weight} kg`], ['Dozens', batchInfo.dzns],
                    ['Date', batchInfo.log_date?.split('T')[0]],
                  ].map(([l, v]) => (
                    <div key={l} className="col-auto">
                      <div className="text-muted small">{l}</div>
                      <div className="fw-semibold">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Summary KPIs */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm text-center py-3">
                <div className="text-muted small">Pair Code Groups</div>
                <div className="fw-bold fs-3 text-primary">{rows.length}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm text-center py-3">
                <div className="text-muted small">Total Weight Processed (kg)</div>
                <div className="fw-bold fs-3 text-info">{totalWt.toFixed(2)}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm text-center py-3">
                <div className="text-muted small">Total Produced Minutes</div>
                <div className="fw-bold fs-3 text-success">{totalMin.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover table-sm mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Pair Code(s)</th><th>Club</th><th>Weight (kg)</th>
                    <th>Machine</th><th>M/C Cap (kg)</th><th>Recipe</th><th>CT (hrs)</th>
                    <th>Dryer</th><th>Dryer Cap</th><th>Dry Dur (min)</th>
                    <th>Hydro</th><th>Hydro Cap</th><th>Hydro CT (min)</th>
                    <th>Cycles</th>
                    <th>Dryer SAM</th><th>M/C SAM</th><th>Hydro SAM</th><th>Total SAM</th>
                    <th>Produced Min</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan="19" className="text-center text-muted py-3">No data for this batch.</td></tr>
                  )}
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td><strong>{r.pair_codes_str}</strong></td>
                      <td>{r.club_group}</td>
                      <td>{parseFloat(r.pair_code_weight || 0).toFixed(2)}</td>
                      <td><span className="badge bg-success">{r.machine}</span></td>
                      <td>{r.machine_cap}</td>
                      <td>{r.recipe}</td>
                      <td>{r.recipe_ct_hrs}</td>
                      <td>{r.dryer}</td>
                      <td>{r.dryer_cap}</td>
                      <td>{r.drying_dur_min}</td>
                      <td>{r.hydro_name || '—'}</td>
                      <td>{r.hydro_cap || '—'}</td>
                      <td>{r.hydro_ct_min || '—'}</td>
                      <td>{r.cycles}</td>
                      <td>{parseFloat(r.dryer_sam || 0).toFixed(4)}</td>
                      <td>{parseFloat(r.machine_sam || 0).toFixed(4)}</td>
                      <td>{parseFloat(r.hydro_sam || 0).toFixed(4)}</td>
                      <td className="fw-semibold">{parseFloat(r.total_sam || 0).toFixed(4)}</td>
                      <td><strong className="text-success">{parseFloat(r.produced_min || 0).toFixed(2)}</strong></td>
                    </tr>
                  ))}
                  {rows.length > 0 && (
                    <tr className="table-warning fw-bold">
                      <td colSpan="2">TOTAL</td>
                      <td>{totalWt.toFixed(2)}</td>
                      <td colSpan="15"></td>
                      <td>{totalMin.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
