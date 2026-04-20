import { useState, useEffect, useCallback } from 'react';

const today = new Date().toLocaleDateString('en-GB');

const STATUS_COLOR = {
  PLANNED:       { bg: '#e8f4ff', text: '#1a5faa', border: '#4a90d9' },
  PROCESSING:    { bg: '#fff3cd', text: '#856404', border: '#ffc107' },
  PROCESSED:     { bg: '#d1ecf1', text: '#0c5460', border: '#17a2b8' },
  DRYING:        { bg: '#ffe0b2', text: '#7b3f00', border: '#ff9800' },
  DRIED:         { bg: '#d4edda', text: '#155724', border: '#28a745' },
  HYDRO_RUNNING: { bg: '#e8d5f5', text: '#5b2c8c', border: '#9c27b0' },
  COMPLETED:     { bg: '#c8e6c9', text: '#1b5e20', border: '#4caf50' },
};

const statusLabel = s => ({
  PLANNED: 'PLANNED', PROCESSING: 'PROCESSING', PROCESSED: 'PROCESSED',
  DRYING: 'DRYING', DRIED: 'DRIED', HYDRO_RUNNING: 'HYDRO', COMPLETED: 'COMPLETED',
}[s] || s);

export default function BatchForm() {
  // ── STATE ─────────────────────────────────────────────────────────────────
  const [batches,       setBatches]      = useState([]);      // array of batch objects
  const [batchInput,    setBatchInput]   = useState('');      // first batch input
  const [addInput,      setAddInput]     = useState('');      // add-another-batch input
  const [showAddPanel,  setShowAddPanel] = useState(false);   // toggle Add panel
  const [pairRows,      setPairRows]     = useState([]);      // all pair code rows (multi-batch)
  const [machines,      setMachines]     = useState([]);
  const [busyMachines,  setBusyMachines] = useState({});
  const [error,         setError]        = useState('');
  const [msg,           setMsg]          = useState('');
  const [loading,       setLoading]      = useState(false);
  const [addLoading,    setAddLoading]   = useState(false);
  const [saving,        setSaving]       = useState(false);
  const [shift,         setShift]        = useState('Morning');
  const [operator,      setOperator]     = useState('');
  const [shiftIncharge, setShiftIncharge]= useState('');

  // ── LOAD AVAILABILITY ─────────────────────────────────────────────────────
  const loadAvailability = useCallback(() => {
    fetch('/api/availability').then(r => r.json()).then(data => {
      const map = {};
      (data.busyMachines || []).forEach(m => { map[m.machine] = { ...m, queue_count: 0 }; });
      (data.queuedMachines || []).forEach(q => {
        if (map[q.machine]) map[q.machine].queue_count = q.queue_count;
        else map[q.machine] = { queue_count: q.queue_count };
      });
      setBusyMachines(map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/machines').then(r => r.json()).then(setMachines);

    loadAvailability();
  }, []);

  // ── FETCH ONE BATCH AND RETURN DATA (does not set state) ──────────────────
  const fetchBatchData = async (bno) => {
    const res  = await fetch(`/api/batch-form-v2/${encodeURIComponent(bno)}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data; // { batch, pairCodes, plans }
  };

  // Build pair rows for one batch given its data + existing plans
  const buildRows = (batchData) => {
    const planMap = {};
    for (const plan of batchData.plans) {
      // A plan's pair_codes_str may contain codes from multiple batches — map each
      plan.pair_codes_str.split('+').forEach(pc => { planMap[pc.trim()] = plan; });
    }
    return batchData.pairCodes.map(pc => {
      const plan = planMap[pc.pair_code];
      return {
        batchNo:       batchData.batch.batch_no,
        pc:            pc.pair_code,
        weight:        parseFloat(pc.weight_kg),
        seq:           pc.seq_no,
        selected:      !!plan,
        machine:       plan?.machine        || '',
        machine_cap:   plan?.machine_cap    || 0,
        recipe:        pc.recipe            || '',
        recipe_ct_hrs: pc.recipe_ct_hrs    || plan?.recipe_ct_hrs || 0,
        planStatus:    plan?.status         || null,
        planId:        plan?.id             || null,
        clubGroup:     plan?.club_group     || '',
        dryer:         plan?.dryer          || '',
        dryer_cap:     plan?.dryer_cap      || 0,
        drying_dur_min:plan?.drying_dur_min || 0,
        hydro_name:    plan?.hydro_name     || '',
        hydro_cap:     plan?.hydro_cap      || 0,
        hydro_ct_min:  plan?.hydro_ct_min   || 0,
        dryer_sam:     plan?.dryer_sam      || 0,
        hydro_sam:     plan?.hydro_sam      || 0,
        produce_dzns:  0, produce_pcs: 0,
        waste_dzns:    0, waste_pcs:   0,
        cycles:        1,
      };
    });
  };

  // ── LOAD FIRST / PRIMARY BATCH ────────────────────────────────────────────
  const loadBatch = async (bno) => {
    const target = (bno || batchInput).trim();
    if (!target) return;
    setError(''); setMsg(''); setLoading(true);
    try {
      const data = await fetchBatchData(target);
      setBatches([data.batch]);
      setPairRows(buildRows(data));
      setBatchInput(target);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  // ── ADD ANOTHER BATCH ─────────────────────────────────────────────────────
  const addBatch = async () => {
    const target = addInput.trim();
    if (!target) return;
    if (batches.find(b => b.batch_no === target)) {
      setError(`Batch ${target} is already loaded.`); return;
    }
    setError(''); setMsg(''); setAddLoading(true);
    try {
      const data = await fetchBatchData(target);
      setBatches(prev => [...prev, data.batch]);
      // Append new batch's pair rows, filtering out any pc already in the table
      const existingPcs = new Set(pairRows.map(r => r.pc));
      const newRows = buildRows(data).filter(r => !existingPcs.has(r.pc));
      setPairRows(prev => [...prev, ...newRows]);
      setAddInput('');
      setShowAddPanel(false);
    } catch (e) { setError(e.message); }
    setAddLoading(false);
  };

  // ── REMOVE A BATCH ────────────────────────────────────────────────────────
  const removeBatch = (bno) => {
    setBatches(prev => prev.filter(b => b.batch_no !== bno));
    setPairRows(prev => prev.filter(r => r.batchNo !== bno));
    setError(''); setMsg('');
  };

  // ── REFRESH ALL LOADED BATCHES ────────────────────────────────────────────
  const refresh = async () => {
    if (!batches.length) return;
    setError(''); setMsg('');
    loadAvailability();
    try {
      const allData = await Promise.all(batches.map(b => fetchBatchData(b.batch_no)));
      setBatches(allData.map(d => d.batch));
      // Rebuild rows, preserving batch order
      const rows = allData.flatMap(d => buildRows(d));
      setPairRows(rows);
    } catch (e) { setError(e.message); }
  };

  // ── CLEAR FORM ────────────────────────────────────────────────────────────
  const clearForm = () => {
    setBatches([]); setPairRows([]); setBatchInput('');
    setAddInput(''); setShowAddPanel(false);
    setMsg(''); setError('');
  };

  // ── ROW HELPERS ───────────────────────────────────────────────────────────
  const update = (idx, field, value) =>
    setPairRows(prev => { const n = [...prev]; n[idx] = { ...n[idx], [field]: value }; return n; });

  const toggleSelect = (idx) => {
    const row = pairRows[idx];
    if (row.planStatus && row.planStatus !== 'PLANNED') return;
    update(idx, 'selected', !row.selected);
  };

  const onMachineChange = (idx, name) => {
    const m = machines.find(x => x.machine_name === name);
    setPairRows(prev => {
      const n = [...prev];
      n[idx] = { ...n[idx], machine: name, machine_cap: m ? +m.capacity_kg : 0 };
      return n;
    });
  };

  // ── SAM CALCULATION ───────────────────────────────────────────────────────
  const calcSAM = (row) => {
    const dryerSam   = row.dryer_cap   > 0 ? row.drying_dur_min / row.dryer_cap   : 0;
    const machineSam = row.machine_cap > 0 ? (row.recipe_ct_hrs * 60) / row.machine_cap : 0;
    const hydroSam   = row.hydro_cap   > 0 ? row.hydro_ct_min   / row.hydro_cap   : 0;
    const totalSam   = dryerSam + machineSam + hydroSam;
    const producedMin = totalSam * row.weight * row.cycles;
    return { dryerSam, machineSam, hydroSam, totalSam, producedMin };
  };

  // ── SAVE ──────────────────────────────────────────────────────────────────
  const save = async () => {
    if (!batches.length) return;
    setSaving(true); setError(''); setMsg('');

    // Only include newly-checked rows or still-PLANNED rows
    const checkedRows = pairRows.filter(r => r.selected && (!r.planStatus || r.planStatus === 'PLANNED'));
    for (const r of checkedRows) {
      if (!r.machine) { setError(`Select a machine for pair code ${r.pc} (batch ${r.batchNo})`); setSaving(false); return; }
      if (!r.recipe)  { setError(`Select a recipe for pair code ${r.pc} (batch ${r.batchNo})`);  setSaving(false); return; }
    }

    // Group by machine across ALL batches → inter-batch clubbing happens naturally
    const machineGroups = {};
    for (const r of checkedRows) {
      if (!machineGroups[r.machine]) machineGroups[r.machine] = [];
      machineGroups[r.machine].push(r);
    }

    // Front-end validation: capacity only (busy machine → queue, not error)
    for (const [machineName, rows] of Object.entries(machineGroups)) {
      const totalWt = rows.reduce((s, r) => s + r.weight, 0);
      const cap     = rows[0].machine_cap;
      if (cap > 0 && totalWt > cap) {
        setError(`Total weight ${totalWt}kg of pair codes [${rows.map(r => r.pc).join(', ')}] assigned to ${machineName} exceeds its capacity of ${cap}kg.`);
        setSaving(false); return;
      }
    }

    // Build assignments — each machine group becomes one assignment
    // If the group spans multiple batches → combined batch_no
    const assignments = Object.entries(machineGroups).map(([, rows]) => {
      const batchNos = [...new Set(rows.map(r => r.batchNo))];
      const batchNo  = batchNos.join('+');
      const orderNos = batchNos.map(bn => batches.find(b => b.batch_no === bn)?.order_no || '').join('+');
      return {
        batch_no:         batchNo,
        order_no:         orderNos,
        pair_codes:       rows.map(r => r.pc),
        pair_code_weight: rows.reduce((s, r) => s + r.weight, 0),
        machine:          rows[0].machine,
        machine_cap:      rows[0].machine_cap,
        recipe:           rows[0].recipe,
        recipe_ct_hrs:    rows[0].recipe_ct_hrs,
      };
    });

    try {
      const res  = await fetch('/api/batch-form-v2/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loadedBatchNos: batches.map(b => b.batch_no),
          assignments,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setSaving(false); return; }
      setMsg('Saved! Go to Process Tracking to start processing.');
      loadAvailability();
      await refresh();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  // ── DERIVED VALUES ────────────────────────────────────────────────────────
  const totalProducedMin = pairRows.reduce((s, r) => s + calcSAM(r).producedMin, 0);
  const totalWeight      = pairRows.reduce((s, r) => s + r.weight, 0);
  const selectedMachines = [...new Set(pairRows.filter(r => r.selected && r.machine).map(r => r.machine))];
  const cycleCount       = selectedMachines.length;
  const isMultiBatch     = batches.length > 1;

  // ── STYLES ────────────────────────────────────────────────────────────────
  const fLabel  = { fontSize: '0.78rem', fontWeight: 600, color: '#333', whiteSpace: 'nowrap' };
  const fInput  = { fontSize: '0.8rem', padding: '2px 6px', height: 24, borderRadius: 2, border: '1px solid #999', background: '#fff' };
  const fSelect = { ...fInput };
  const thS     = { background: '#1a3a5c', color: '#fff', fontSize: '0.72rem', padding: '4px 6px', border: '1px solid #2d5a8e', textAlign: 'center' };
  const thSub   = { fontSize: '0.68rem', padding: '3px 5px', border: '1px solid #2d5a8e', textAlign: 'center' };
  const tdS     = { fontSize: '0.75rem', padding: '3px 5px', border: '1px solid #ccc', verticalAlign: 'middle' };
  const btnBase = { fontSize: '0.75rem', padding: '4px 10px', border: '1px solid #666', background: 'linear-gradient(to bottom, #e8e8e8, #ccc)', borderRadius: 3, cursor: 'pointer', fontWeight: 600, color: '#333' };
  const btnSave = { ...btnBase, background: 'linear-gradient(to bottom, #4a90d9, #1a5faa)', color: '#fff', border: '1px solid #1a5faa', padding: '5px 24px' };
  const btnAdd  = { ...btnBase, background: 'linear-gradient(to bottom, #5cb85c, #3d8b3d)', color: '#fff', border: '1px solid #3d8b3d', padding: '5px 24px' };
  const btnExit = { ...btnBase, padding: '5px 24px' };

  // ── BATCH HEADER COLORS (for multi-batch separator rows) ──────────────────
  const BATCH_COLORS = ['#1a3a5c', '#2d6a3a', '#6a1a3a', '#3a2d6a', '#6a4a1a'];
  const batchColorMap = {};
  batches.forEach((b, i) => { batchColorMap[b.batch_no] = BATCH_COLORS[i % BATCH_COLORS.length]; });

  return (
    <div style={{ fontFamily: 'Tahoma, Arial, sans-serif', maxWidth: 1550, margin: '0 auto' }}>

      {/* ── TITLE BAR ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(to right, #1a3a5c, #2d6aa0, #1a3a5c)',
        padding: '10px 18px', borderRadius: '4px 4px 0 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700, letterSpacing: 1 }}>
          EFlow Batch Entry
        </span>
        <div style={{ textAlign: 'right', color: '#fff', fontSize: '0.8rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>WelCome</div>
          <div style={{ color: '#90c8f0' }}>NADIR</div>
        </div>
      </div>

      {/* ── HEADER FORM ───────────────────────────────────────────────────── */}
      <div style={{ background: '#f0f4f8', border: '1px solid #b0c4de', borderTop: 'none', padding: '10px 16px' }}>

        {/* Row 1 — Batch lookup */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 6, alignItems: 'center' }}>
          <label style={fLabel}>Cost Center</label>
          <input style={{ ...fInput, width: 120 }} defaultValue="243901" />

          <label style={{ ...fLabel, marginLeft: 10 }}>Batch No</label>
          <input style={{ ...fInput, width: 110 }} value={batchInput}
            placeholder="e.g. 82487"
            onChange={e => setBatchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadBatch()} />
          <button style={{ ...btnBase, background: 'linear-gradient(to bottom,#5cb85c,#3d8b3d)', color: '#fff', border: '1px solid #3d8b3d' }}
            onClick={() => loadBatch()} disabled={loading}>
            {loading ? '…' : 'Load'}
          </button>
          {batches.length > 0 && (
            <button style={{ ...btnBase, background: '#e8f0ff', border: '1px solid #4a90d9', color: '#1a3a5c' }}
              onClick={refresh} title="Refresh all loaded batches">
              🔄 Refresh
            </button>
          )}

          <label style={{ ...fLabel, marginLeft: 10 }}>Order No</label>
          <input style={{ ...fInput, width: 100 }}
            value={batches.map(b => b.order_no).filter(Boolean).join(' / ')} readOnly />

          <label style={{ ...fLabel, marginLeft: 10 }}>Weight</label>
          <input style={{ ...fInput, width: 100 }}
            value={batches.length ? batches.map(b => `${b.weight_kg}kg`).join(' + ') : ''} readOnly />

          {cycleCount > 0 && (
            <span style={{ marginLeft: 12, fontWeight: 700, fontSize: '0.8rem', color: '#1a5faa', background: '#e8f0ff', padding: '2px 10px', borderRadius: 3, border: '1px solid #4a90d9' }}>
              Planned Cycles: {cycleCount}
            </span>
          )}
        </div>

        {/* Loaded batch tags */}
        {batches.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6, alignItems: 'center' }}>
            <span style={fLabel}>Loaded Batches:</span>
            {batches.map(b => (
              <span key={b.batch_no} style={{
                background: batchColorMap[b.batch_no], color: '#fff',
                padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                B{b.batch_no}
                {batches.length > 1 && (
                  <span style={{ cursor: 'pointer', fontWeight: 900, fontSize: '0.8rem', opacity: 0.8 }}
                    onClick={() => removeBatch(b.batch_no)} title="Remove this batch">✕</span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Row 2 */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 6, alignItems: 'center' }}>
          <label style={fLabel}>Recipe</label>
          <input style={{ ...fInput, width: 300 }} readOnly
            value={pairRows.find(r => r.recipe)?.recipe || ''}
            placeholder="Auto-filled from assignments" />

          <label style={{ ...fLabel, marginLeft: 10 }}>Issue Doc</label>
          <input style={{ ...fInput, width: 110 }}
            value={batches.map(b => b.issue_doc).filter(Boolean).join(' / ')} readOnly />

          <label style={{ ...fLabel, marginLeft: 10 }}>Receive Doc</label>
          <input style={{ ...fInput, width: 110 }}
            value={batches.map(b => b.receive_doc).filter(Boolean).join(' / ')} readOnly />
        </div>

        {/* Row 3 */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 6, alignItems: 'center' }}>
          <label style={fLabel}>Operator</label>
          <input style={{ ...fInput, width: 180 }} value={operator}
            onChange={e => setOperator(e.target.value)} placeholder="Operator name" />

          <label style={{ ...fLabel, marginLeft: 10 }}>Shift</label>
          <select style={{ ...fSelect, width: 110 }} value={shift} onChange={e => setShift(e.target.value)}>
            <option>Morning</option><option>Afternoon</option><option>Night</option>
          </select>

          <label style={{ ...fLabel, marginLeft: 10 }}>Shift Incharge</label>
          <input style={{ ...fInput, width: 180 }} value={shiftIncharge}
            onChange={e => setShiftIncharge(e.target.value)} placeholder="Incharge name" />

          <label style={{ ...fLabel, marginLeft: 10 }}>Date</label>
          <input style={{ ...fInput, width: 100 }} value={today} readOnly />
        </div>

        {/* Row 4 — summary */}
        {batches.length > 0 && (
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={fLabel}>Dozens</label>
            <input style={{ ...fInput, width: 80 }}
              value={batches.reduce((s, b) => s + (b.dzns || 0), 0)} readOnly />
            <label style={fLabel}>Pcs</label>
            <input style={{ ...fInput, width: 80 }}
              value={batches.reduce((s, b) => s + (b.pcs || 0), 0)} readOnly />
            <label style={fLabel}>Cost Code</label>
            <input style={{ ...fInput, width: 200 }}
              value={batches.map(b => b.cost_code).filter(Boolean).join(' / ')} readOnly />
            <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: '0.82rem', color: '#1a5c3a' }}>
              Total Produced Min: {totalProducedMin.toFixed(2)}
            </span>
          </div>
        )}

        {/* Messages */}
        {error && <div style={{ marginTop: 6, padding: '4px 10px', background: '#fdd', border: '1px solid #e88', borderRadius: 3, color: '#900', fontSize: '0.8rem' }}>{error}</div>}
        {msg   && <div style={{ marginTop: 6, padding: '4px 10px', background: '#dfd', border: '1px solid #8b8', borderRadius: 3, color: '#060', fontSize: '0.8rem' }}>{msg}</div>}
      </div>

      {/* ── ADD BATCH PANEL ───────────────────────────────────────────────── */}
      {showAddPanel && (
        <div style={{ background: '#fffbe6', border: '1px solid #f0c040', borderTop: 'none', padding: '8px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#7a5800' }}>Add Another Batch to Club:</span>
          <input
            style={{ ...fInput, width: 130 }}
            value={addInput}
            placeholder="Enter batch no."
            autoFocus
            onChange={e => setAddInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addBatch()}
          />
          <button
            style={{ ...btnBase, background: 'linear-gradient(to bottom,#4a90d9,#1a5faa)', color: '#fff', border: '1px solid #1a5faa' }}
            onClick={addBatch} disabled={addLoading}>
            {addLoading ? '…' : 'Add Batch'}
          </button>
          <button style={{ ...btnBase, padding: '3px 10px' }} onClick={() => { setShowAddPanel(false); setAddInput(''); setError(''); }}>
            Cancel
          </button>
          <span style={{ fontSize: '0.72rem', color: '#7a5800' }}>
            Pair codes from this batch will appear in the table. Assign them to the same machine as another batch's pair codes to club them together.
          </span>
        </div>
      )}

      {/* ── WORKFLOW HINT ─────────────────────────────────────────────────── */}
      {pairRows.length > 0 && (
        <div style={{ background: '#fff8dc', border: '1px solid #e6d87a', borderTop: 'none', padding: '5px 16px', fontSize: '0.72rem', color: '#555' }}>
          <strong>WORKFLOW:</strong>&nbsp;
          ✔ Check <b>1 pair code</b> → assign Machine &amp; Recipe → Save → <i>individual run</i>.&nbsp;
          ✔ Check <b>multiple pair codes (same or different batches)</b> → assign <b>same Machine</b> → Save → <i>auto-clubbed (1 cycle)</i>.&nbsp;
          ✔ Check multiple → assign <b>different Machines</b> → Save → <i>separate cycles each</i>.&nbsp;
          Dryer &amp; Hydro are assigned in <b>Process Tracking</b> after processing completes.
        </div>
      )}

      {/* ── PAIR CODE TABLE ───────────────────────────────────────────────── */}
      {pairRows.length > 0 && (
        <div style={{ border: '1px solid #b0c4de', borderTop: 'none', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMultiBatch ? 1350 : 1250 }}>
            <thead>
              <tr>
                <th style={{ ...thS, width: 36 }} rowSpan={2}></th>
                {isMultiBatch && <th style={thS} rowSpan={2}>Batch</th>}
                <th style={thS} rowSpan={2}>Pair<br />Code</th>
                <th style={thS} rowSpan={2}>Club<br />ID</th>
                <th style={thS} rowSpan={2}>PPC<br />Weight (kg)</th>
                <th style={{ ...thS, background: '#2d5a8e' }} colSpan={2}>Produce Able</th>
                <th style={{ ...thS, background: '#3a2d5a' }} colSpan={2}>Declared Waste</th>
                <th style={thS} rowSpan={2}>Machine<br />Assigned</th>
                <th style={thS} rowSpan={2}>Recipe</th>
                <th style={thS} rowSpan={2}>Dryer<br />Assigned</th>
                <th style={thS} rowSpan={2}>Hydro<br />(opt.)</th>
                <th style={thS} rowSpan={2}>Cycles</th>
                <th style={{ ...thS, background: '#1a5c3a' }} colSpan={4}>SAM / kg</th>
                <th style={thS} rowSpan={2}>Prod.<br />Min</th>
                <th style={{ ...thS, background: '#5c3a1a' }} rowSpan={2}>Status</th>
              </tr>
              <tr>
                <th style={{ ...thS, ...thSub, background: '#2d5a8e' }}>Dzns</th>
                <th style={{ ...thS, ...thSub, background: '#2d5a8e' }}>Pcs</th>
                <th style={{ ...thS, ...thSub, background: '#3a2d5a' }}>Dzns</th>
                <th style={{ ...thS, ...thSub, background: '#3a2d5a' }}>Pcs</th>
                <th style={{ ...thS, ...thSub, background: '#1a5c3a', fontSize: '0.65rem' }}>Dryer</th>
                <th style={{ ...thS, ...thSub, background: '#1a5c3a', fontSize: '0.65rem' }}>M/C</th>
                <th style={{ ...thS, ...thSub, background: '#1a5c3a', fontSize: '0.65rem' }}>Hydro</th>
                <th style={{ ...thS, ...thSub, background: '#1a5c3a', fontSize: '0.65rem' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rows = [];
                let lastBatchNo = null;
                pairRows.forEach((row, idx) => {
                  // Insert batch separator row in multi-batch mode
                  if (isMultiBatch && row.batchNo !== lastBatchNo) {
                    lastBatchNo = row.batchNo;
                    const bColor = batchColorMap[row.batchNo] || '#1a3a5c';
                    const bObj   = batches.find(b => b.batch_no === row.batchNo);
                    rows.push(
                      <tr key={`sep-${row.batchNo}`}>
                        <td colSpan={20} style={{
                          background: bColor, color: '#fff', fontWeight: 700,
                          fontSize: '0.75rem', padding: '4px 10px',
                          borderTop: '2px solid #fff',
                        }}>
                          Batch {row.batchNo}
                          {bObj ? ` — Order: ${bObj.order_no || '—'}  |  Weight: ${bObj.weight_kg} kg  |  Dzns: ${bObj.dzns}  |  Pcs: ${bObj.pcs}` : ''}
                        </td>
                      </tr>
                    );
                  }

                  const sam      = calcSAM(row);
                  const isLocked = !!(row.planStatus && row.planStatus !== 'PLANNED');
                  const sc       = STATUS_COLOR[row.planStatus] || {};
                  const bColor   = batchColorMap[row.batchNo] || '#1a3a5c';
                  const rowBg    = isLocked
                    ? '#efefef'
                    : row.selected
                      ? '#f0f8ff'
                      : idx % 2 === 0 ? '#fff' : '#f7fbff';

                  rows.push(
                    <tr key={idx} style={{ background: rowBg }}>

                      {/* Checkbox */}
                      <td style={{ ...tdS, textAlign: 'center' }}>
                        <input type="checkbox"
                          checked={row.selected}
                          disabled={isLocked}
                          title={isLocked ? `Cannot change — status is ${row.planStatus}` : ''}
                          onChange={() => toggleSelect(idx)}
                          style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }} />
                      </td>

                      {/* Batch column (multi-batch only) */}
                      {isMultiBatch && (
                        <td style={{ ...tdS, textAlign: 'center' }}>
                          <span style={{ background: bColor, color: '#fff', padding: '1px 6px', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700 }}>
                            B{row.batchNo}
                          </span>
                        </td>
                      )}

                      {/* Pair Code */}
                      <td style={{ ...tdS, fontWeight: 700, color: '#1a3a5c' }}>{row.pc}</td>

                      {/* Club ID */}
                      <td style={{ ...tdS, textAlign: 'center' }}>
                        {row.clubGroup
                          ? <span style={{ background: '#1a3a5c', color: '#fff', padding: '1px 7px', borderRadius: 10, fontSize: '0.68rem', fontWeight: 700 }}>{row.clubGroup}</span>
                          : <span style={{ color: '#bbb', fontSize: '0.68rem' }}>—</span>
                        }
                      </td>

                      {/* Weight */}
                      <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{row.weight}</td>

                      {/* Produce Able */}
                      <td style={{ ...tdS, textAlign: 'center', background: '#eef2ff' }}>
                        <input type="number" style={{ ...fInput, width: 48, textAlign: 'center' }}
                          disabled={isLocked} value={row.produce_dzns}
                          onChange={e => update(idx, 'produce_dzns', e.target.value)} />
                      </td>
                      <td style={{ ...tdS, textAlign: 'center', background: '#eef2ff' }}>
                        <input type="number" style={{ ...fInput, width: 48, textAlign: 'center' }}
                          disabled={isLocked} value={row.produce_pcs}
                          onChange={e => update(idx, 'produce_pcs', e.target.value)} />
                      </td>

                      {/* Declared Waste */}
                      <td style={{ ...tdS, textAlign: 'center', background: '#f5eeff' }}>
                        <input type="number" style={{ ...fInput, width: 48, textAlign: 'center' }}
                          disabled={isLocked} value={row.waste_dzns}
                          onChange={e => update(idx, 'waste_dzns', e.target.value)} />
                      </td>
                      <td style={{ ...tdS, textAlign: 'center', background: '#f5eeff' }}>
                        <input type="number" style={{ ...fInput, width: 48, textAlign: 'center' }}
                          disabled={isLocked} value={row.waste_pcs}
                          onChange={e => update(idx, 'waste_pcs', e.target.value)} />
                      </td>

                      {/* Machine */}
                      <td style={tdS}>
                        {isLocked
                          ? <span style={{ fontWeight: 700, color: '#1a5c3a' }}>{row.machine}</span>
                          : row.selected
                            ? <>
                                <select style={{ ...fSelect, width: 95 }}
                                  value={row.machine}
                                  onChange={e => onMachineChange(idx, e.target.value)}>
                                  <option value="">— select —</option>
                                  {machines.map(m => {
                                    const busy = busyMachines[m.machine_name];
                                    const qc   = busy?.queue_count || 0;
                                    const label = busy?.batch_no
                                      ? `🟡 ${m.machine_name} [BUSY – B${busy.batch_no}${qc > 0 ? `, +${qc} queued` : ''}]`
                                      : `${m.machine_name} (${m.capacity_kg}kg)`;
                                    return (
                                      <option key={m.id} value={m.machine_name}>{label}</option>
                                    );
                                  })}
                                </select>
                                {row.machine && busyMachines[row.machine]?.batch_no && (
                                  <div style={{ fontSize: '0.63rem', color: '#b8860b', fontWeight: 700 }}>
                                    🟡 Busy — will be queued after B{busyMachines[row.machine].batch_no}
                                  </div>
                                )}
                              </>
                            : <span style={{ color: '#bbb', fontSize: '0.7rem' }}>check to assign</span>
                        }
                        {row.machine && !isLocked && row.selected && !busyMachines[row.machine] &&
                          <div style={{ fontSize: '0.63rem', color: '#888' }}>{row.machine_cap} kg cap</div>}
                      </td>

                      {/* Recipe — read-only, set in Pair Codes master data */}
                      <td style={tdS}>
                        {row.recipe
                          ? <>
                              <span style={{ fontWeight: 700 }}>{row.recipe}</span>
                              <div style={{ fontSize: '0.63rem', color: '#888' }}>{row.recipe_ct_hrs} hrs</div>
                            </>
                          : <span style={{ color: '#bbb', fontSize: '0.68rem' }}>not set</span>
                        }
                      </td>

                      {/* Dryer — read-only */}
                      <td style={{ ...tdS, textAlign: 'center' }}>
                        {row.dryer
                          ? <span style={{ fontWeight: 700, color: '#7b3f00', fontSize: '0.72rem' }}>{row.dryer}</span>
                          : <span style={{ color: '#bbb', fontSize: '0.68rem' }}>via Process Tracking</span>
                        }
                        {row.dryer && <div style={{ fontSize: '0.62rem', color: '#aaa' }}>{row.drying_dur_min} min</div>}
                      </td>

                      {/* Hydro — read-only */}
                      <td style={{ ...tdS, textAlign: 'center' }}>
                        {row.hydro_name
                          ? <span style={{ fontWeight: 700, color: '#5b2c8c', fontSize: '0.72rem' }}>{row.hydro_name}</span>
                          : <span style={{ color: '#bbb', fontSize: '0.68rem' }}>—</span>
                        }
                      </td>

                      {/* Cycles */}
                      <td style={{ ...tdS, textAlign: 'center' }}>
                        {isLocked
                          ? <strong>{row.cycles}</strong>
                          : <input type="number" min="1" style={{ ...fInput, width: 44, textAlign: 'center' }}
                              value={row.cycles}
                              onChange={e => update(idx, 'cycles', parseInt(e.target.value) || 1)} />
                        }
                      </td>

                      {/* SAM values */}
                      <td style={{ ...tdS, textAlign: 'right', background: '#f0fff0', fontSize: '0.68rem' }}>
                        {sam.dryerSam > 0 ? sam.dryerSam.toFixed(4) : '—'}
                      </td>
                      <td style={{ ...tdS, textAlign: 'right', background: '#f0fff0', fontSize: '0.68rem' }}>
                        {sam.machineSam > 0 ? sam.machineSam.toFixed(4) : '—'}
                      </td>
                      <td style={{ ...tdS, textAlign: 'right', background: '#f0fff0', fontSize: '0.68rem' }}>
                        {sam.hydroSam > 0 ? sam.hydroSam.toFixed(4) : '—'}
                      </td>
                      <td style={{ ...tdS, textAlign: 'right', background: '#d4f5d4', fontSize: '0.7rem', fontWeight: 700 }}>
                        {sam.totalSam > 0 ? sam.totalSam.toFixed(4) : '—'}
                      </td>

                      {/* Produced Minutes */}
                      <td style={{ ...tdS, textAlign: 'right', background: '#fffacc', fontWeight: 700, color: '#1a5c3a', fontSize: '0.8rem' }}>
                        {sam.producedMin > 0 ? sam.producedMin.toFixed(2) : '—'}
                      </td>

                      {/* Status */}
                      <td style={{ ...tdS, textAlign: 'center', minWidth: 80 }}>
                        {row.planStatus
                          ? <span style={{
                              background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                              padding: '2px 7px', borderRadius: 3, fontSize: '0.68rem', fontWeight: 700,
                            }}>
                              {statusLabel(row.planStatus)}
                            </span>
                          : row.selected
                            ? <span style={{ background: '#e8f4e8', color: '#3a7a3a', border: '1px solid #5cb85c', padding: '2px 7px', borderRadius: 3, fontSize: '0.68rem', fontWeight: 700 }}>
                                READY
                              </span>
                            : <span style={{ color: '#bbb', fontSize: '0.68rem' }}>—</span>
                        }
                      </td>
                    </tr>
                  );
                });
                return rows;
              })()}

              {/* TOTALS ROW */}
              <tr style={{ background: '#f0f4f8', fontWeight: 700 }}>
                <td colSpan={isMultiBatch ? 4 : 3} style={{ ...tdS, textAlign: 'right', fontSize: '0.8rem' }}>TOTAL</td>
                <td style={{ ...tdS, textAlign: 'center' }}>{totalWeight.toFixed(2)}</td>
                <td colSpan={8} style={tdS}></td>
                <td colSpan={4} style={tdS}></td>
                <td style={{ ...tdS, textAlign: 'right', background: '#fffacc', color: '#1a5c3a', fontSize: '0.85rem' }}>
                  {totalProducedMin > 0 ? totalProducedMin.toFixed(2) : '—'}
                </td>
                <td style={tdS}></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── BOTTOM BUTTONS ────────────────────────────────────────────────── */}
      <div style={{ background: '#e0e8f0', border: '1px solid #b0c4de', borderTop: 'none', padding: '8px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        {batches.length > 0 && (
          <button style={{ ...btnSave, opacity: saving ? 0.7 : 1 }} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
        <button style={btnAdd} onClick={() => { setShowAddPanel(prev => !prev); setError(''); setMsg(''); }}>
          {showAddPanel ? '− Cancel Add' : '+ Add Batch'}
        </button>
        <button style={btnExit} onClick={clearForm}>Exit</button>

        {!batches.length && (
          <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: 8 }}>
            Enter a Batch No and click <strong>Load</strong> to begin. Use <strong>+ Add Batch</strong> to club multiple batches together.
          </span>
        )}
        {isMultiBatch && (
          <span style={{ fontSize: '0.75rem', color: '#1a5faa', fontWeight: 600, marginLeft: 8 }}>
            🔗 Multi-batch mode — pair codes from different batches assigned to the same machine will be clubbed together.
          </span>
        )}
      </div>

    </div>
  );
}
