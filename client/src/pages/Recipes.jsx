import { useEffect, useState } from 'react';

const EMPTY = { recipe_name: '', cycle_time_hours: '' };

export default function Recipes() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');

  const load = () => fetch('/api/recipes').then(r => r.json()).then(setRows);
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    const url = editId ? `/api/recipes/${editId}` : '/api/recipes';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.error) { setMsg('Error: ' + data.error); return; }
    setMsg(editId ? 'Updated!' : 'Added!');
    setForm(EMPTY); setEditId(null); load();
    setTimeout(() => setMsg(''), 3000);
  };

  const del = async (id) => {
    if (!confirm('Delete this recipe?')) return;
    await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h4 className="fw-bold text-primary mb-4"><i className="bi bi-journal-code me-2"></i>Recipes</h4>
      {msg && <div className="alert alert-success py-2">{msg}</div>}

      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white fw-semibold">{editId ? 'Edit Recipe' : 'Add Recipe'}</div>
        <div className="card-body">
          <form onSubmit={save}>
            <div className="row g-2">
              <div className="col-6 col-md-4">
                <label className="form-label small mb-1">Recipe Name *</label>
                <input className="form-control form-control-sm" required placeholder="e.g. EWSH-6113"
                  value={form.recipe_name} onChange={e => setForm({ ...form, recipe_name: e.target.value })} />
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label small mb-1">Cycle Time (hours) *</label>
                <input type="number" step="0.5" className="form-control form-control-sm" required
                  value={form.cycle_time_hours} onChange={e => setForm({ ...form, cycle_time_hours: e.target.value })} />
              </div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button className="btn btn-primary btn-sm" type="submit">
                {editId ? 'Update' : 'Add Recipe'}
              </button>
              {editId && <button className="btn btn-secondary btn-sm" type="button"
                onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancel</button>}
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-white fw-semibold">All Recipes ({rows.length})</div>
        <div className="table-responsive">
          <table className="table table-hover table-sm mb-0">
            <thead className="table-light">
              <tr><th>Recipe Name</th><th>Cycle Time (hours)</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.recipe_name}</strong></td>
                  <td>{r.cycle_time_hours} hrs</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1 py-0"
                      onClick={() => { setEditId(r.id); setForm({ recipe_name: r.recipe_name, cycle_time_hours: r.cycle_time_hours }); window.scrollTo(0,0); }}>
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
