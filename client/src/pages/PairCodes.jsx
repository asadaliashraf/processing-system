import { useEffect, useState } from 'react';

const EMPTY = { batch_no: '', pair_code: '', weight_kg: '', seq_no: '', recipe: '' };

export default function PairCodes() {
  const [rows,        setRows]        = useState([]);
  const [batches,     setBatches]     = useState([]);
  const [recipes,     setRecipes]     = useState([]);
  const [form,        setForm]        = useState(EMPTY);
  const [editId,      setEditId]      = useState(null);
  const [msg,         setMsg]         = useState('');
  const [filterBatch, setFilterBatch] = useState('');

  const load = () => {
    fetch('/api/pair-codes').then(r => r.json()).then(setRows);
    fetch('/api/batches').then(r => r.json()).then(setBatches);
    fetch('/api/recipes').then(r => r.json()).then(setRecipes);
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    const url = editId ? `/api/pair-codes/${editId}` : '/api/pair-codes';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.error) { setMsg('Error: ' + data.error); return; }
    setMsg(editId ? 'Updated!' : 'Added!');
    setForm(EMPTY); setEditId(null); load();
    setTimeout(() => setMsg(''), 3000);
  };

  const del = async (id) => {
    if (!confirm('Delete this pair code?')) return;
    await fetch(`/api/pair-codes/${id}`, { method: 'DELETE' });
    load();
  };

  const edit = (row) => {
    setEditId(row.id);
    setForm({ batch_no: row.batch_no, pair_code: row.pair_code, weight_kg: row.weight_kg, seq_no: row.seq_no, recipe: row.recipe || '' });
    window.scrollTo(0, 0);
  };

  const filtered = filterBatch ? rows.filter(r => r.batch_no === filterBatch) : rows;

  return (
    <div>
      <h4 className="fw-bold text-primary mb-4"><i className="bi bi-tag me-2"></i>Pair Codes</h4>

      {msg && <div className="alert alert-success py-2">{msg}</div>}

      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white fw-semibold">{editId ? 'Edit Pair Code' : 'Add New Pair Code'}</div>
        <div className="card-body">
          <form onSubmit={save}>
            <div className="row g-2">
              <div className="col-6 col-md-2">
                <label className="form-label small mb-1">Batch No *</label>
                <select className="form-select form-select-sm" required
                  value={form.batch_no} onChange={e => setForm({ ...form, batch_no: e.target.value })}>
                  <option value="">Select batch...</option>
                  {batches.map(b => <option key={b.id} value={b.batch_no}>{b.batch_no} — {b.order_no}</option>)}
                </select>
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label small mb-1">Pair Code *</label>
                <input className="form-control form-control-sm" required
                  value={form.pair_code} onChange={e => setForm({ ...form, pair_code: e.target.value })} />
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label small mb-1">Weight (kg) *</label>
                <input type="number" step="0.01" className="form-control form-control-sm" required
                  value={form.weight_kg} onChange={e => setForm({ ...form, weight_kg: e.target.value })} />
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label small mb-1">Sequence No</label>
                <input type="number" className="form-control form-control-sm"
                  value={form.seq_no} onChange={e => setForm({ ...form, seq_no: e.target.value })} />
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label small mb-1">Recipe</label>
                <select className="form-select form-select-sm"
                  value={form.recipe} onChange={e => setForm({ ...form, recipe: e.target.value })}>
                  <option value="">— no recipe —</option>
                  {recipes.map(r => (
                    <option key={r.id} value={r.recipe_name}>
                      {r.recipe_name} ({r.cycle_time_hours}h)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button className="btn btn-primary btn-sm" type="submit">
                <i className={`bi bi-${editId ? 'check' : 'plus'}-circle me-1`}></i>
                {editId ? 'Update' : 'Add Pair Code'}
              </button>
              {editId && <button className="btn btn-secondary btn-sm" type="button"
                onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancel</button>}
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <span className="fw-semibold">All Pair Codes ({filtered.length})</span>
          <select className="form-select form-select-sm w-auto"
            value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
            <option value="">All Batches</option>
            {batches.map(b => <option key={b.id} value={b.batch_no}>{b.batch_no}</option>)}
          </select>
        </div>
        <div className="table-responsive">
          <table className="table table-hover table-sm mb-0">
            <thead className="table-light">
              <tr>
                <th>Batch No</th><th>Pair Code</th><th>Weight (kg)</th>
                <th>Recipe</th><th>Seq No</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td><span className="badge bg-primary">{r.batch_no}</span></td>
                  <td><strong>{r.pair_code}</strong></td>
                  <td>{r.weight_kg} kg</td>
                  <td>{r.recipe
                    ? <span className="badge bg-info text-dark">{r.recipe}</span>
                    : <span className="text-muted small">—</span>}
                  </td>
                  <td>{r.seq_no}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1 py-0" onClick={() => edit(r)}>
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
