import { useEffect, useState } from 'react';

const fmtTime = iso => iso
  ? new Date(iso).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'2-digit', hour:'2-digit', minute:'2-digit' })
  : '—';

function QueueCard({ item, runningStatus, queuedStatus, runningLabel, startField }) {
  const isRunning = item.status === 'RUNNING';
  return (
    <div className={`card shadow-sm h-100 border-start border-3 ${isRunning ? 'border-success' : 'border-secondary'}`}>
      <div className="card-header d-flex justify-content-between align-items-center py-2">
        <strong>{item.name}</strong>
        <span className={`badge ${isRunning ? 'bg-success' : 'bg-secondary'}`}>
          {isRunning ? `▶ ${runningLabel}` : 'Idle'}
        </span>
      </div>
      <div className="card-body p-2">
        <div className="text-muted small mb-2">
          Cap: {item.capacity_kg} kg
          {item.duration_min ? ` | ${item.duration_min} min` : ''}
        </div>

        {item.running && (
          <div className="p-2 mb-2 rounded" style={{ background:'#e8f5e9', border:'1px solid #81c784' }}>
            <div className="d-flex justify-content-between align-items-start">
              <span className="badge bg-success mb-1">▶ {runningStatus}</span>
              <small className="text-muted">{fmtTime(item.running[startField])}</small>
            </div>
            <div className="small fw-semibold">Batch: {item.running.batch_no}</div>
            <div className="small text-muted">Codes: {item.running.pair_codes_str}</div>
            <div className="small text-muted">Wt: {parseFloat(item.running.pair_code_weight||0).toFixed(2)} kg</div>
          </div>
        )}

        {item.queue.length > 0 && (
          <div>
            <div className="text-muted small fw-semibold mb-1">
              <i className="bi bi-list-ol me-1"></i>Queue ({item.queue.length})
            </div>
            {item.queue.map((q, i) => (
              <div key={q.id} className="p-2 mb-1 rounded" style={{ background:'#fff8e1', border:'1px solid #f0c040' }}>
                <div className="d-flex justify-content-between">
                  <span className="badge" style={{ background:'#b8860b', fontSize:'0.65rem' }}>#{i+1} {queuedStatus}</span>
                  <small className="text-muted">{fmtTime(q.created_at)}</small>
                </div>
                <div className="small fw-semibold">Batch: {q.batch_no}</div>
                <div className="small text-muted">Codes: {q.pair_codes_str}</div>
                <div className="small text-muted">Wt: {parseFloat(q.pair_code_weight||0).toFixed(2)} kg</div>
              </div>
            ))}
          </div>
        )}

        {!item.running && item.queue.length === 0 && (
          <div className="text-muted small text-center py-2">No active jobs</div>
        )}
      </div>
    </div>
  );
}

export default function DryerQueue() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/queues/dryers').then(r => r.json());
    setData(Array.isArray(res) ? res : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const dryers = data.filter(d => d.type === 'Dryer');
  const hydros = data.filter(d => d.type === 'Hydro');

  const dryerRunning = dryers.filter(d => d.status === 'RUNNING').length;
  const dryerQueued  = dryers.reduce((s, d) => s + (d.queue?.length || 0), 0);
  const hydroRunning = hydros.filter(h => h.status === 'RUNNING').length;
  const hydroQueued  = hydros.reduce((s, h) => s + (h.queue?.length || 0), 0);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold text-primary mb-0"><i className="bi bi-wind me-2"></i>Dryer &amp; Hydro Queue Status</h4>
        <button className="btn btn-outline-primary btn-sm" onClick={load} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center py-3 border-start border-success border-3">
            <div className="text-muted small">Dryers Running</div>
            <div className="fw-bold fs-3 text-success">{dryerRunning}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center py-3 border-start border-warning border-3">
            <div className="text-muted small">Dryers Queued</div>
            <div className="fw-bold fs-3 text-warning">{dryerQueued}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center py-3 border-start border-success border-3">
            <div className="text-muted small">Hydros Running</div>
            <div className="fw-bold fs-3 text-success">{hydroRunning}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm text-center py-3 border-start border-warning border-3">
            <div className="text-muted small">Hydros Queued</div>
            <div className="fw-bold fs-3 text-warning">{hydroQueued}</div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary"></div>
        </div>
      )}

      {!loading && (
        <>
          <h6 className="fw-semibold text-muted mb-2"><i className="bi bi-wind me-1"></i>Dryers</h6>
          <div className="row g-3 mb-4">
            {dryers.map((d, i) => (
              <div key={i} className="col-md-6 col-xl-4">
                <QueueCard item={d} runningStatus="DRYING" queuedStatus="DRYER_QUEUED"
                  runningLabel="Drying" startField="dryer_start" />
              </div>
            ))}
          </div>

          <h6 className="fw-semibold text-muted mb-2"><i className="bi bi-droplet me-1"></i>Hydro Extractors</h6>
          <div className="row g-3">
            {hydros.map((h, i) => (
              <div key={i} className="col-md-6 col-xl-4">
                <QueueCard item={h} runningStatus="HYDRO_RUNNING" queuedStatus="HYDRO_QUEUED"
                  runningLabel="Hydro" startField="hydro_start" />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
