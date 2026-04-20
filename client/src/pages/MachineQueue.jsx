import { useEffect, useState } from 'react';

const fmtTime = iso => iso
  ? new Date(iso).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'2-digit', hour:'2-digit', minute:'2-digit' })
  : '—';

export default function MachineQueue() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/queues/machines').then(r => r.json());
    setData(Array.isArray(res) ? res : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const running = data.filter(m => m.status === 'RUNNING').length;
  const idle    = data.filter(m => m.status === 'IDLE').length;
  const queued  = data.reduce((s, m) => s + (m.queue?.length || 0), 0);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold text-primary mb-0"><i className="bi bi-cpu me-2"></i>Machine Queue Status</h4>
        <button className="btn btn-outline-primary btn-sm" onClick={load} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm text-center py-3 border-start border-success border-3">
            <div className="text-muted small">Running Now</div>
            <div className="fw-bold fs-3 text-success">{running}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm text-center py-3 border-start border-warning border-3">
            <div className="text-muted small">In Queue</div>
            <div className="fw-bold fs-3 text-warning">{queued}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm text-center py-3 border-start border-secondary border-3">
            <div className="text-muted small">Idle</div>
            <div className="fw-bold fs-3 text-secondary">{idle}</div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary"></div>
        </div>
      )}

      {!loading && (
        <div className="row g-3">
          {data.map(m => (
            <div key={m.id} className="col-md-6 col-xl-4">
              <div className={`card shadow-sm h-100 border-start border-3 ${m.status === 'RUNNING' ? 'border-success' : 'border-secondary'}`}>
                <div className="card-header d-flex justify-content-between align-items-center py-2">
                  <strong>{m.machine_name}</strong>
                  <span className={`badge ${m.status === 'RUNNING' ? 'bg-success' : 'bg-secondary'}`}>
                    {m.status === 'RUNNING' ? '▶ Running' : 'Idle'}
                  </span>
                </div>
                <div className="card-body p-2">
                  <div className="text-muted small mb-2">Capacity: {m.capacity_kg} kg</div>

                  {m.running && (
                    <div className="p-2 mb-2 rounded" style={{ background:'#e8f5e9', border:'1px solid #81c784' }}>
                      <div className="d-flex justify-content-between align-items-start">
                        <span className="badge bg-success mb-1">▶ PROCESSING</span>
                        <small className="text-muted">{fmtTime(m.running.process_start)}</small>
                      </div>
                      <div className="small fw-semibold">Batch: {m.running.batch_no}</div>
                      <div className="small text-muted">Codes: {m.running.pair_codes_str}</div>
                      <div className="small text-muted">Wt: {parseFloat(m.running.pair_code_weight||0).toFixed(2)} kg | Recipe: {m.running.recipe}</div>
                    </div>
                  )}

                  {m.queue.length > 0 && (
                    <div>
                      <div className="text-muted small fw-semibold mb-1">
                        <i className="bi bi-list-ol me-1"></i>Queue ({m.queue.length})
                      </div>
                      {m.queue.map((q, i) => (
                        <div key={q.id} className="p-2 mb-1 rounded" style={{ background:'#fff8e1', border:'1px solid #f0c040' }}>
                          <div className="d-flex justify-content-between">
                            <span className="badge" style={{ background:'#b8860b', fontSize:'0.65rem' }}>#{i+1} QUEUED</span>
                            <small className="text-muted">{fmtTime(q.created_at)}</small>
                          </div>
                          <div className="small fw-semibold">Batch: {q.batch_no}</div>
                          <div className="small text-muted">Codes: {q.pair_codes_str}</div>
                          <div className="small text-muted">Wt: {parseFloat(q.pair_code_weight||0).toFixed(2)} kg</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!m.running && m.queue.length === 0 && (
                    <div className="text-muted small text-center py-2">No active jobs</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
