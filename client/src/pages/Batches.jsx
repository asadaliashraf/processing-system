import { useEffect, useState } from 'react';

const EMPTY = { batch_no: '', order_no: '', issue_doc: '', receive_doc: '', weight_kg: '', dzns: '', pcs: '', cost_code: '' };

export default function Batches() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');

  const load = () => fetch('/api/batches').then(r => r.json()).then(setRows);
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    const url = editId ? `/api/batches/${editId}` : '/api/batches';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.error) { setMsg('Error: ' + data.error); return; }
    setMsg(editId ? 'Updated!' : 'Added!');
    setForm(EMPTY); setEditId(null); load();
    setTimeout(() => setMsg(''), 3000);
  };

  const del = async (id) => {
    if (!confirm('Delete this batch?')) return;
    await fetch(`/api/batches/${id}`, { method: 'DELETE' });
    load();
  };

  const edit = (row) => {
    setEditId(row.id);
    setForm({ batch_no: row.batch_no, order_no: row.order_no || '', issue_doc: row.issue_doc || '',
      receive_doc: row.receive_doc || '', weight_kg: row.weight_kg || '', dzns: row.dzns || '',
      pcs: row.pcs || '', cost_code: row.cost_code || '' });
    window.scrollTo(0, 0);
  };

  const filtered = rows.filter(r =>
    r.batch_no.includes(search) || (r.order_no || '').includes(search)
  );

  return (
    <div>
      <h4 className="fw-bold text-primary mb-4"><i className="bi bi-layers me-2"></i>Batches</h4>

      {msg && <div className="alert alert-success py-2">{msg}</div>}

      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white fw-semibold">{editId ? 'Edit Batch' : 'Add New Batch'}</div>
        <div className="card-body">
          <form onSubmit={save}>
            <div className="row g-2">
              {[
                ['batch_no', 'Batch No *', 'text', true],
                ['order_no', 'Order No', 'text', false],
                ['issue_doc', 'Issue Doc', 'text', false],
                ['receive_doc', 'Receive Doc', 'text', false],
                ['weight_kg', 'Weight (kg)', 'number', false],
                ['dzns', 'Dozens', 'number', false],
                ['pcs', 'Pieces', 'number', false],
                ['cost_code', 'Cost Code', 'text', false],
              ].map(([key, label, type, req]) => (
                <div key={key} className="col-6 col-md-3">
                  <label className="form-label small mb-1">{label}</label>
                  <input type={type} className="form-control form-control-sm"
                    value={form[key]} required={req}
                    onChange={e => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
            </div>
            <div className="mt-3 d-flex gap-2">
              <button className="btn btn-primary btn-sm" type="submit">
                <i className={`bi bi-${editId ? 'check' : 'plus'}-circle me-1`}></i>
                {editId ? 'Update' : 'Add Batch'}
              </button>
              {editId && <button className="btn btn-secondary btn-sm" type="button"
                onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancel</button>}
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <span className="fw-semibold">All Batches ({filtered.length})</span>
          <input className="form-control form-control-sm w-auto" placeholder="Search batch/order..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="table-responsive">
          <table className="table table-hover table-sm mb-0">
            <thead className="table-light">
              <tr>
                <th>Batch No</th><th>Order No</th><th>Issue Doc</th><th>Receive Doc</th>
                <th>Weight (kg)</th><th>Dozens</th><th>Pcs</th><th>Cost Code</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.batch_no}</strong></td>
                  <td>{r.order_no}</td><td>{r.issue_doc}</td><td>{r.receive_doc}</td>
                  <td>{r.weight_kg}</td><td>{r.dzns}</td><td>{r.pcs}</td><td>{r.cost_code}</td>
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
