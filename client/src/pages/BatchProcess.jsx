import { useState, useEffect, useCallback } from 'react';

const STATUS_META = {
  PLANNED:       { label: 'Planned',           bg: '#e8f4ff', text: '#1a5faa', border: '#4a90d9', step: 1 },
  QUEUED:        { label: '⏳ Queued',          bg: '#fff8e1', text: '#b8860b', border: '#f0c040', step: 1 },
  PROCESSING:    { label: 'Processing…',       bg: '#fff3cd', text: '#856404', border: '#ffc107', step: 2 },
  PROCESSED:     { label: 'Processed ✓',       bg: '#d1ecf1', text: '#0c5460', border: '#17a2b8', step: 3 },
  DRYER_QUEUED:  { label: '⏳ Dryer Queued',   bg: '#fff8e1', text: '#b8860b', border: '#f0c040', step: 3 },
  DRYING:        { label: 'Drying…',           bg: '#ffe0b2', text: '#7b3f00', border: '#ff9800', step: 4 },
  DRIED:         { label: 'Dried ✓',           bg: '#d4edda', text: '#155724', border: '#28a745', step: 5 },
  HYDRO_QUEUED:  { label: '⏳ Hydro Queued',   bg: '#fff8e1', text: '#b8860b', border: '#f0c040', step: 5 },
  HYDRO_RUNNING: { label: 'Hydro Running…',    bg: '#e8d5f5', text: '#5b2c8c', border: '#9c27b0', step: 6 },
  COMPLETED:     { label: '✅ Completed',       bg: '#c8e6c9', text: '#1b5e20', border: '#4caf50', step: 7 },
};

const fmtTime = iso => iso
  ? new Date(iso).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'2-digit', hour:'2-digit', minute:'2-digit' })
  : '—';

const STATUSES = ['ALL', 'PLANNED', 'QUEUED', 'PROCESSING', 'PROCESSED', 'DRYER_QUEUED', 'DRYING', 'DRIED', 'HYDRO_QUEUED', 'HYDRO_RUNNING', 'COMPLETED'];

export default function BatchProcess() {
  const [rows,         setRows]         = useState([]);
  const [dryers,       setDryers]       = useState([]);
  const [hydroList,    setHydroList]    = useState([]);
  const [busyDryers,   setBusyDryers]   = useState({}); // dryerName → {batch_no,…}
  const [busyHydros,   setBusyHydros]   = useState({}); // hydroName → {batch_no,…}
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterBatch,  setFilterBatch]  = useState('');
  const [loading,      setLoading]      = useState(false);
  const [actionMsg,    setActionMsg]    = useState('');
  const [rowSelections, setRowSelections] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    let url = '/api/batch-process?';
    if (filterStatus !== 'ALL') url += `status=${filterStatus}&`;
    if (filterBatch.trim())     url += `batch_no=${filterBatch.trim()}`;
    const data = await fetch(url).then(r => r.json());
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [filterStatus, filterBatch]);

  const loadAvailability = useCallback(() => {
    fetch('/api/availability').then(r => r.json()).then(data => {
      const dm = {}, hm = {};
      (data.busyDryers   || []).forEach(d => { dm[d.dryer]      = { ...d, queue_count: 0 }; });
      (data.queuedDryers || []).forEach(d => { if (dm[d.dryer]) dm[d.dryer].queue_count = d.queue_count; else dm[d.dryer] = { queue_count: d.queue_count }; });
      (data.busyHydros   || []).forEach(h => { hm[h.hydro_name] = { ...h, queue_count: 0 }; });
      (data.queuedHydros || []).forEach(h => { if (hm[h.hydro_name]) hm[h.hydro_name].queue_count = h.queue_count; else hm[h.hydro_name] = { queue_count: h.queue_count }; });
      setBusyDryers(dm);
      setBusyHydros(hm);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/dryers').then(r => r.json()).then(setDryers);
    fetch('/api/hydro').then(r => r.json()).then(setHydroList);
    loadAvailability();
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (url, method = 'PUT', body = null) => {
    setActionMsg('');
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch(url, opts);
    const data = await res.json();
    if (data.error) { setActionMsg('❌ ' + data.error); return false; }
    setActionMsg('✅ Done!');
    loadAvailability();
    await load();
    return true;
  };

  const getRowSel = (id, field) => (rowSelections[id] || {})[field] || '';
  const setRowSel = (id, field, val) =>
    setRowSelections(prev => ({ ...prev, [id]: { ...(prev[id]||{}), [field]: val } }));

  // Progress bar steps
  const ProgressBar = ({ status }) => {
    const steps = [
      { key:'PLANNED',s:1,label:'Planned' }, { key:'PROCESSING',s:2,label:'Processing' },
      { key:'PROCESSED',s:3,label:'Processed' }, { key:'DRYING',s:4,label:'Drying' },
      { key:'DRIED',s:5,label:'Dried' }, { key:'HYDRO_RUNNING',s:6,label:'Hydro' },
      { key:'COMPLETED',s:7,label:'Done' },
    ];
    const cur = STATUS_META[status]?.step || 1;
    return (
      <div style={{ display:'flex', alignItems:'center', gap:0, fontSize:'0.62rem' }}>
        {steps.map((s, i) => (
          <div key={s.key} style={{ display:'flex', alignItems:'center' }}>
            <div style={{
              width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
              background: cur >= s.s ? '#1a5faa' : '#ddd',
              color: cur >= s.s ? '#fff' : '#999', fontWeight:700, fontSize:'0.6rem',
            }}>{s.s}</div>
            {i < steps.length-1 && (
              <div style={{ width:18, height:3, background: cur > s.s ? '#1a5faa' : '#ddd' }}></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const StatusBadge = ({ status }) => {
    const m = STATUS_META[status] || {};
    return (
      <span style={{
        background: m.bg, color: m.text, border: `1px solid ${m.border}`,
        padding: '2px 10px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700,
        whiteSpace: 'nowrap',
      }}>{m.label || status}</span>
    );
  };

  // Group rows by batch for display
  const groupedByBatch = {};
  for (const row of rows) {
    if (!groupedByBatch[row.batch_no]) groupedByBatch[row.batch_no] = [];
    groupedByBatch[row.batch_no].push(row);
  }

  return (
    <div style={{ fontFamily: 'Tahoma, Arial, sans-serif', maxWidth: 1400, margin: '0 auto' }}>

      {/* TITLE */}
      <div style={{
        background: 'linear-gradient(to right, #1a3a5c, #2d6aa0, #1a3a5c)',
        padding: '10px 18px', borderRadius: '4px 4px 0 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color:'#fff', fontSize:'1.2rem', fontWeight:700 }}>
          Batch Process Tracking
        </span>
        <span style={{ color:'#90c8f0', fontSize:'0.78rem' }}>
          Processing → Drying → Hydro (optional) → Complete
        </span>
      </div>

      {/* FILTERS */}
      <div style={{ background:'#f0f4f8', border:'1px solid #b0c4de', borderTop:'none', padding:'8px 16px', display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
        <label style={{ fontSize:'0.78rem', fontWeight:600 }}>Filter by Status:</label>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{
                fontSize:'0.72rem', padding:'3px 10px', borderRadius:12, cursor:'pointer', fontWeight:600,
                background: filterStatus===s ? '#1a3a5c' : '#e8eef5',
                color:      filterStatus===s ? '#fff'    : '#333',
                border:     filterStatus===s ? '1px solid #1a3a5c' : '1px solid #ccc',
              }}>
              {s === 'ALL' ? 'All' : STATUS_META[s]?.label || s}
            </button>
          ))}
        </div>
        <input placeholder="Filter batch no…"
          style={{ fontSize:'0.78rem', padding:'3px 8px', border:'1px solid #ccc', borderRadius:3, width:140 }}
          value={filterBatch} onChange={e => setFilterBatch(e.target.value)} />
        <button onClick={load}
          style={{ fontSize:'0.78rem', padding:'3px 12px', border:'1px solid #4a90d9', borderRadius:3, background:'#e8f0ff', cursor:'pointer', fontWeight:600 }}>
          🔄 Refresh
        </button>
        {actionMsg && (
          <span style={{ fontSize:'0.78rem', fontWeight:600, color: actionMsg.startsWith('✅') ? '#155724' : '#721c24' }}>
            {actionMsg}
          </span>
        )}
        <span style={{ marginLeft:'auto', fontSize:'0.75rem', color:'#555' }}>
          {rows.length} assignment(s)
        </span>
      </div>

      {/* CONTENT */}
      <div style={{ border:'1px solid #b0c4de', borderTop:'none' }}>
        {loading && (
          <div style={{ textAlign:'center', padding:40, color:'#888' }}>Loading…</div>
        )}

        {!loading && rows.length === 0 && (
          <div style={{ textAlign:'center', padding:40, color:'#888' }}>
            No assignments found. Use the <b>Batch Form</b> to plan batch assignments first.
          </div>
        )}

        {!loading && Object.entries(groupedByBatch).map(([batchNo, batchRows]) => (
          <div key={batchNo} style={{ borderBottom:'2px solid #b0c4de', marginBottom:0 }}>

            {/* Batch header */}
            <div style={{
              background:'linear-gradient(to right, #2d5a8e22, #fff)',
              padding:'6px 16px', borderBottom:'1px solid #d0dcea',
              display:'flex', gap:16, alignItems:'center', flexWrap:'wrap',
            }}>
              <span style={{ fontWeight:700, fontSize:'0.9rem', color:'#1a3a5c' }}>
                Batch {batchNo}
              </span>
              {batchRows[0]?.order_no && (
                <span style={{ fontSize:'0.78rem', color:'#555' }}>Order: <b>{batchRows[0].order_no}</b></span>
              )}
              <span style={{ fontSize:'0.78rem', color:'#555' }}>
                {batchRows.length} assignment{batchRows.length > 1 ? 's' : ''}
              </span>
              <span style={{ fontSize:'0.78rem', color:'#1a5faa', fontWeight:600 }}>
                {batchRows.filter(r=>r.status==='COMPLETED').length}/{batchRows.length} completed
              </span>
            </div>

            {/* Assignment cards */}
            {batchRows.map(row => {
              const meta     = STATUS_META[row.status] || {};
              const selDryer = getRowSel(row.id, 'dryer');
              const selHydro = getRowSel(row.id, 'hydro');
              const dryerObj = dryers.find(d => d.dryer_name === selDryer);
              const hydroObj = hydroList.find(h => h.hydro_name === selHydro);

              return (
                <div key={row.id} style={{
                  margin:'10px 16px', borderRadius:6,
                  border:`1px solid ${meta.border||'#ccc'}`,
                  background: meta.bg || '#fff',
                  overflow:'hidden',
                }}>
                  {/* Card header */}
                  <div style={{
                    background: row.status==='COMPLETED' ? '#2e7d32' : '#1a3a5c',
                    color:'#fff', padding:'6px 14px',
                    display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8,
                  }}>
                    <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                      <span style={{ fontWeight:700, fontSize:'0.88rem' }}>
                        {row.pair_codes_str}
                      </span>
                      {row.club_group && (
                        <span style={{ background:'rgba(255,255,255,0.2)', padding:'1px 8px', borderRadius:10, fontSize:'0.7rem' }}>
                          {row.club_group}
                        </span>
                      )}
                      <span style={{ fontSize:'0.75rem', opacity:0.85 }}>{row.pair_code_weight} kg</span>
                    </div>
                    <ProgressBar status={row.status} />
                  </div>

                  {/* Card body */}
                  <div style={{ padding:'10px 14px' }}>
                    <div style={{ display:'flex', gap:0, flexWrap:'wrap' }}>

                      {/* ── PROCESSING SECTION ── */}
                      <Section title="⚙ Processing" color="#1a3a5c">
                        <Field label="Machine"   value={row.machine} />
                        <Field label="Recipe"    value={row.recipe} />
                        <Field label="Cap (kg)"  value={row.machine_cap} />
                        <Field label="CT (hrs)"  value={row.recipe_ct_hrs} />
                        <Field label="SAM/kg"    value={row.machine_sam ? (+row.machine_sam).toFixed(4) : '—'} />
                        <Field label="Started"   value={fmtTime(row.process_start)} />
                        <Field label="Completed" value={fmtTime(row.process_end)} />
                        <div style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
                          {row.status === 'PLANNED' && (
                            <ActionBtn color="#1a5faa" onClick={() => act(`/api/batch-process/${row.id}/start-processing`)}>
                              ▶ Start Processing
                            </ActionBtn>
                          )}
                          {row.status === 'QUEUED' && (
                            <span style={{ fontSize:'0.72rem', color:'#b8860b', fontWeight:700, background:'#fff8e1', padding:'3px 8px', borderRadius:4, border:'1px solid #f0c040' }}>
                              ⏳ In Queue — will start automatically when machine is free
                            </span>
                          )}
                          {row.status === 'PROCESSING' && (
                            <ActionBtn color="#28a745" onClick={() => act(`/api/batch-process/${row.id}/complete-processing`)}>
                              ✓ Complete Processing
                            </ActionBtn>
                          )}
                          {row.status !== 'PLANNED' && row.status !== 'PROCESSING' && row.status !== 'QUEUED' && (
                            <span style={{ fontSize:'0.72rem', color:'#888' }}>Processing done</span>
                          )}
                        </div>
                      </Section>

                      <Divider />

                      {/* ── DRYING SECTION ── */}
                      <Section title="💨 Drying" color="#e65100"
                        dimmed={['PLANNED','QUEUED','PROCESSING'].includes(row.status)}>
                        {row.dryer
                          ? <>
                              <Field label="Dryer"     value={row.dryer} />
                              <Field label="Cap (kg)"  value={row.dryer_cap} />
                              <Field label="Dur (min)" value={row.drying_dur_min} />
                              <Field label="SAM/kg"    value={row.dryer_sam ? (+row.dryer_sam).toFixed(4) : '—'} />
                              <Field label="Started"   value={fmtTime(row.dryer_start)} />
                              <Field label="Completed" value={fmtTime(row.dryer_end)} />
                            </>
                          : <span style={{ fontSize:'0.72rem', color:'#aaa' }}>Not assigned yet</span>
                        }
                        <div style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
                          {row.status === 'PROCESSED' && (
                            <>
                              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                                <select style={{ fontSize:'0.75rem', padding:'3px 6px', border:'1px solid #ccc', borderRadius:3 }}
                                  value={selDryer}
                                  onChange={e => setRowSel(row.id, 'dryer', e.target.value)}>
                                  <option value="">— select dryer —</option>
                                  {dryers.map(d => {
                                    const busy = busyDryers[d.dryer_name];
                                    const overCap = d.capacity_kg > 0 && row.pair_code_weight > d.capacity_kg;
                                    const qc = busy?.queue_count || 0;
                                    return (
                                      <option key={d.id} value={d.dryer_name} disabled={overCap}>
                                        {busy && busy.batch_no
                                          ? `🟡 ${d.dryer_name} [BUSY – B${busy.batch_no}${qc > 0 ? ` +${qc} queued` : ''}]`
                                          : overCap
                                            ? `⚠ ${d.dryer_name} (${d.capacity_kg}kg – UNDER CAPACITY)`
                                            : `${d.dryer_name} (${d.capacity_kg}kg / ${d.drying_duration_min}min)`
                                        }
                                      </option>
                                    );
                                  })}
                                </select>
                                {selDryer && busyDryers[selDryer]?.batch_no && (
                                  <span style={{ fontSize:'0.65rem', color:'#b8860b', fontWeight:700 }}>
                                    ⏳ Busy — will be queued after B{busyDryers[selDryer].batch_no}
                                  </span>
                                )}
                                {selDryer && dryerObj && row.pair_code_weight > dryerObj.capacity_kg && (
                                  <span style={{ fontSize:'0.65rem', color:'#c0392b', fontWeight:700 }}>
                                    ⚠ Weight {row.pair_code_weight}kg exceeds dryer capacity {dryerObj.capacity_kg}kg
                                  </span>
                                )}
                              </div>
                              <ActionBtn color="#e65100" onClick={async () => {
                                if (!dryerObj) { setActionMsg('❌ Select a dryer first'); return; }
                                if (row.pair_code_weight > dryerObj.capacity_kg) { setActionMsg(`❌ Weight ${row.pair_code_weight}kg exceeds dryer capacity ${dryerObj.capacity_kg}kg`); return; }
                                const result = await act(`/api/batch-process/${row.id}/assign-dryer`, 'PUT', {
                                  dryer: dryerObj.dryer_name,
                                  dryer_cap: +dryerObj.capacity_kg,
                                  drying_dur_min: +dryerObj.drying_duration_min,
                                });
                                if (result) setRowSel(row.id, 'dryer', '');
                              }}>Assign Dryer</ActionBtn>
                            </>
                          )}
                          {row.status === 'DRYER_QUEUED' && (
                            <span style={{ fontSize:'0.72rem', color:'#b8860b', fontWeight:700, background:'#fff8e1', padding:'3px 8px', borderRadius:4, border:'1px solid #f0c040' }}>
                              ⏳ In Queue — will start drying automatically when dryer is free
                            </span>
                          )}
                          {row.status === 'PROCESSED' && row.dryer && !busyDryers[row.dryer]?.batch_no && (
                            <ActionBtn color="#1a5faa" onClick={() => act(`/api/batch-process/${row.id}/start-drying`)}>
                              ▶ Start Drying
                            </ActionBtn>
                          )}
                          {row.status === 'DRYING' && (
                            <ActionBtn color="#28a745" onClick={() => act(`/api/batch-process/${row.id}/complete-drying`)}>
                              ✓ Complete Drying
                            </ActionBtn>
                          )}
                          {['DRIED','HYDRO_QUEUED','HYDRO_RUNNING','COMPLETED'].includes(row.status) && (
                            <span style={{ fontSize:'0.72rem', color:'#888' }}>Drying done</span>
                          )}
                        </div>
                      </Section>

                      <Divider />

                      {/* ── HYDRO SECTION ── */}
                      <Section title="💧 Hydro (Optional)" color="#6a1b9a"
                        dimmed={!['DRIED','HYDRO_QUEUED','HYDRO_RUNNING','COMPLETED'].includes(row.status)}>
                        {row.hydro_name
                          ? <>
                              <Field label="Hydro"     value={row.hydro_name} />
                              <Field label="Cap (kg)"  value={row.hydro_cap} />
                              <Field label="CT (min)"  value={row.hydro_ct_min} />
                              <Field label="SAM/kg"    value={row.hydro_sam ? (+row.hydro_sam).toFixed(4) : '—'} />
                              <Field label="Started"   value={fmtTime(row.hydro_start)} />
                              <Field label="Completed" value={fmtTime(row.hydro_end)} />
                            </>
                          : <span style={{ fontSize:'0.72rem', color:'#aaa' }}>
                              {row.status === 'DRIED' ? 'Assign if required' : 'Not used / not yet'}
                            </span>
                        }
                        <div style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
                          {row.status === 'DRIED' && (
                            <>
                              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                                <select style={{ fontSize:'0.75rem', padding:'3px 6px', border:'1px solid #ccc', borderRadius:3 }}
                                  value={selHydro}
                                  onChange={e => setRowSel(row.id, 'hydro', e.target.value)}>
                                  <option value="">— assign hydro —</option>
                                  {hydroList.map(h => {
                                    const busy = busyHydros[h.hydro_name];
                                    const overCap = h.capacity_kg > 0 && row.pair_code_weight > h.capacity_kg;
                                    const qc = busy?.queue_count || 0;
                                    return (
                                      <option key={h.id} value={h.hydro_name} disabled={overCap}>
                                        {busy && busy.batch_no
                                          ? `🟡 ${h.hydro_name} [BUSY – B${busy.batch_no}${qc > 0 ? ` +${qc} queued` : ''}]`
                                          : overCap
                                            ? `⚠ ${h.hydro_name} (${h.capacity_kg}kg – UNDER CAPACITY)`
                                            : `${h.hydro_name} (${h.capacity_kg}kg / ${h.cycle_time_min}min)`
                                        }
                                      </option>
                                    );
                                  })}
                                </select>
                                {selHydro && busyHydros[selHydro]?.batch_no && (
                                  <span style={{ fontSize:'0.65rem', color:'#b8860b', fontWeight:700 }}>
                                    ⏳ Busy — will be queued after B{busyHydros[selHydro].batch_no}
                                  </span>
                                )}
                                {selHydro && hydroObj && row.pair_code_weight > hydroObj.capacity_kg && (
                                  <span style={{ fontSize:'0.65rem', color:'#c0392b', fontWeight:700 }}>
                                    ⚠ Weight {row.pair_code_weight}kg exceeds hydro capacity {hydroObj.capacity_kg}kg
                                  </span>
                                )}
                              </div>
                              {selHydro && (
                                <ActionBtn color="#6a1b9a" onClick={async () => {
                                  if (!hydroObj) return;
                                  if (row.pair_code_weight > hydroObj.capacity_kg) { setActionMsg(`❌ Weight ${row.pair_code_weight}kg exceeds hydro capacity ${hydroObj.capacity_kg}kg`); return; }
                                  const result = await act(`/api/batch-process/${row.id}/assign-hydro`, 'PUT', {
                                    hydro_name:   hydroObj.hydro_name,
                                    hydro_cap:    +hydroObj.capacity_kg,
                                    hydro_ct_min: +hydroObj.cycle_time_min,
                                  });
                                  if (result) setRowSel(row.id, 'hydro', '');
                                }}>Assign Hydro</ActionBtn>
                              )}
                            </>
                          )}
                          {row.status === 'HYDRO_QUEUED' && (
                            <span style={{ fontSize:'0.72rem', color:'#b8860b', fontWeight:700, background:'#fff8e1', padding:'3px 8px', borderRadius:4, border:'1px solid #f0c040' }}>
                              ⏳ In Queue — will start hydro automatically when extractor is free
                            </span>
                          )}
                          {row.status === 'DRIED' && row.hydro_name && !busyHydros[row.hydro_name]?.batch_no && (
                            <ActionBtn color="#6a1b9a" onClick={() => act(`/api/batch-process/${row.id}/start-hydro`)}>
                              ▶ Start Hydro
                            </ActionBtn>
                          )}
                          {row.status === 'HYDRO_RUNNING' && (
                            <ActionBtn color="#28a745" onClick={() => act(`/api/batch-process/${row.id}/complete-hydro`)}>
                              ✓ Complete Hydro
                            </ActionBtn>
                          )}
                        </div>
                      </Section>

                      <Divider />

                      {/* ── COMPLETION SECTION ── */}
                      <Section title="✅ Completion" color="#2e7d32"
                        dimmed={!['DRIED','HYDRO_QUEUED','HYDRO_RUNNING','COMPLETED'].includes(row.status)}>
                        {row.produced_min !== null && row.produced_min !== undefined && +row.produced_min > 0
                          ? <>
                              <Field label="Total SAM" value={row.total_sam ? (+row.total_sam).toFixed(4) : '—'} />
                              <Field label="Weight (kg)" value={row.pair_code_weight} />
                              <div style={{ marginTop:6, padding:'6px 10px', background:'#e8f5e9', border:'1px solid #4caf50', borderRadius:4 }}>
                                <div style={{ fontSize:'0.68rem', color:'#555' }}>Produced Minutes</div>
                                <div style={{ fontWeight:700, fontSize:'1.1rem', color:'#1b5e20' }}>
                                  {(+row.produced_min).toFixed(2)}
                                </div>
                              </div>
                            </>
                          : <span style={{ fontSize:'0.72rem', color:'#aaa' }}>Calculated on completion</span>
                        }
                        {row.status === 'DRIED' && !row.hydro_name && (
                          <div style={{ marginTop:8 }}>
                            <ActionBtn color="#2e7d32" onClick={() => act(`/api/batch-process/${row.id}/mark-complete`)}>
                              ✅ Mark Complete (No Hydro)
                            </ActionBtn>
                          </div>
                        )}
                        {row.status === 'COMPLETED' && (
                          <div style={{ marginTop:6, fontSize:'0.7rem', color:'#2e7d32', fontWeight:600 }}>
                            ✅ Logged to Processing Log
                          </div>
                        )}
                      </Section>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Small layout helpers ──────────────────────────────────────────────────────

function Section({ title, color, dimmed, children }) {
  return (
    <div style={{
      flex:'1 1 200px', minWidth:190, padding:'6px 12px',
      opacity: dimmed ? 0.4 : 1,
      borderRight:'1px dashed #d0d8e4',
    }}>
      <div style={{ fontSize:'0.72rem', fontWeight:700, color, marginBottom:6, borderBottom:`2px solid ${color}`, paddingBottom:3 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ width:1, background:'#d0d8e4', margin:'0 4px', alignSelf:'stretch' }}></div>;
}

function Field({ label, value }) {
  return (
    <div style={{ display:'flex', gap:4, marginBottom:2 }}>
      <span style={{ fontSize:'0.68rem', color:'#888', minWidth:72 }}>{label}:</span>
      <span style={{ fontSize:'0.72rem', fontWeight:600, color:'#222' }}>{value ?? '—'}</span>
    </div>
  );
}

function ActionBtn({ color, onClick, children }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontSize:'0.72rem', padding:'4px 10px', cursor:'pointer', fontWeight:700, borderRadius:4,
        background: hover ? color : '#fff',
        color:      hover ? '#fff' : color,
        border:`1.5px solid ${color}`,
        transition:'all 0.15s',
      }}>
      {children}
    </button>
  );
}
