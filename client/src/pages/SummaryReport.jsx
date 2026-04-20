import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SummaryReport() {
  const [rows,      setRows]      = useState([]);
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [generated, setGenerated] = useState(false);
  const navigate = useNavigate();

  const generate = async () => {
    setLoading(true);
    let url = '/api/reports/summary?';
    if (fromDate) url += `from_date=${fromDate}&`;
    if (toDate)   url += `to_date=${toDate}`;
    const data = await fetch(url).then(r => r.json());
    setRows(Array.isArray(data) ? data : []);
    setGenerated(true);
    setLoading(false);
  };

  const totalMin = rows.reduce((s, r) => s + parseFloat(r.total_produced_min || 0), 0);
  const totalWt  = rows.reduce((s, r) => s + parseFloat(r.batch_weight      || 0), 0);

  return (
    <div>
      <h4 className="fw-bold text-primary mb-4">
        <i className="bi bi-bar-chart-line me-2"></i>Summary Report — Produced Minutes
      </h4>

      {/* Filters */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-auto">
              <label className="form-label small mb-1">From Date</label>
              <input type="date" className="form-control form-control-sm"
                value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div className="col-auto">
              <label className="form-label small mb-1">To Date</label>
              <input type="date" className="form-control form-control-sm"
                value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <div className="col-auto">
              <button className="btn btn-primary" onClick={generate} disabled={loading}>
                {loading
                  ? <span className="spinner-border spinner-border-sm"></span>
                  : <><i className="bi bi-play-fill me-1"></i>Generate Report</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {generated && (
        <>
          {/* KPI cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm text-center py-3">
                <div className="text-muted small">Total Batches</div>
                <div className="fw-bold fs-3 text-primary">{rows.length}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm text-center py-3">
                <div className="text-muted small">Total Weight (kg)</div>
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
            <div className="card-header bg-white py-2">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Click a <strong>Batch No</strong> to open its detail report.
              </small>
            </div>
            <div className="table-responsive">
              <table className="table table-hover table-sm mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Date</th>
                    <th>Batch No</th>
                    <th>Order No</th>
                    <th>Issue Doc</th>
                    <th>Receive Doc</th>
                    <th>Weight (kg)</th>
                    <th>Dzns</th>
                    <th>Pcs</th>
                    <th>Cost Code</th>
                    <th>Machines</th>
                    <th>Dryers</th>
                    <th>Total Cycles</th>
                    <th>Produced Min</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan="13" className="text-center text-muted py-3">
                        No completed batches found for the selected range.
                      </td>
                    </tr>
                  )}
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.log_date?.split('T')[0]}</td>
                      <td>
                        <span
                          className="badge bg-primary"
                          style={{ cursor: 'pointer', fontSize: '0.82rem' }}
                          title="Click to open detail report"
                          onClick={() => navigate(`/detail-report?batch=${encodeURIComponent(r.batch_no)}`)}
                        >
                          {r.batch_no}
                        </span>
                      </td>
                      <td>{r.order_no}</td>
                      <td>{r.issue_doc}</td>
                      <td>{r.receive_doc}</td>
                      <td>{parseFloat(r.batch_weight || 0).toFixed(2)}</td>
                      <td>{r.dzns}</td>
                      <td>{r.pcs}</td>
                      <td>{r.cost_code}</td>
                      <td>{r.machines}</td>
                      <td>{r.dryers}</td>
                      <td>{r.total_cycles}</td>
                      <td><strong className="text-success">{parseFloat(r.total_produced_min || 0).toFixed(2)}</strong></td>
                    </tr>
                  ))}
                  {rows.length > 0 && (
                    <tr className="table-warning fw-bold">
                      <td colSpan="5">TOTAL</td>
                      <td>{totalWt.toFixed(2)}</td>
                      <td colSpan="6"></td>
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
