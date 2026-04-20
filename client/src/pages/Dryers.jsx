import { useEffect, useState } from 'react';

const EMPTY = { dryer_name: '', capacity_kg: '', drying_duration_min: '' };

export default function Dryers() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');

  const load = () => fetch('/api/dryers').then(r => r.json()).then(setRows);
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    const url = editId ? `/api/dryers/${editId}` : '/api/dryers';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.error) { setMsg('Error: ' + data.error); return; }
    setMsg(editId ? 'Updated!' : 'Added!');
    setForm(EMPTY); setEditId(null); load();
    setTimeout(() => setMsg(''), 3000);
  };

  const del = async (id) => {
    if (!confirm('Delete this dryer?')) return;
    await fetch(`/api/dryers/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h4 className="fw-bold text-primary mb-4"><i className="bi bi-wind me-2"></i>Dryers</h4>
      {msg && <div className="alert alert-success py-2">{msg}</div>}

      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white fw-semibold">{editId ? 'Edit Dryer' : 'Add Dryer'}</div>
        <div className="card-body">
          <form onSubmit={save}>
            <div className="row g-2">
              <div className="col-6 col-md-4">
                <label className="form-label small mb-1">Dryer Name *</label>
                <input className="form-control form-control-sm" required placeholder="e.g. Traiventa-11"
                  value={form.dryer_name} onChange={e => setForm({ ...form, dryer_name: e.target.value })} />
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label small mb-1">Capacity (kg) *</label>
                <input type="number" step="0.01" className="form-control form-control-sm" required
                  value={form.capacity_kg} onChange={e => setForm({ ...form, capacity_kg: e.target.value })} />
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label small mb-1">Drying Duration (min) *</label>
                <input type="number" step="0.01" className="form-control form-control-sm" required
                  value={form.drying_duration_min} onChange={e => setForm({ ...form, drying_duration_min: e.target.value })} />
              </div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button className="btn btn-primary btn-sm" type="submit">
                {editId ? 'Update' : 'Add Dryer'}
              </button>
              {editId && <button className="btn btn-secondary btn-sm" type="button"
                onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancel</button>}
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-white fw-semibold">All Dryers ({rows.length})</div>
        <div className="table-responsive">
          <table className="table table-hover table-sm mb-0">
            <thead className="table-light">
              <tr><th>Dryer Name</th><th>Capacity (kg)</th><th>Drying Duration (min)</th><th>Dryer SAM/kg</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.dryer_name}</strong></td>
                  <td>{r.capacity_kg} kg</td>
                  <td>{r.drying_duration_min} min</td>
                  <td className="text-muted">{(r.drying_duration_min / r.capacity_kg).toFixed(4)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1 py-0"
                      onClick={() => { setEditId(r.id); setForm({ dryer_name: r.dryer_name, capacity_kg: r.capacity_kg, drying_duration_min: r.drying_duration_min }); window.scrollTo(0,0); }}>
                      <i className="bi bi-pencil"></i>
                    </button>
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
