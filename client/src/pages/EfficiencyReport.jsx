import { useState } from 'react';

const fmtDt = iso => iso
  ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  : '—';

const fmtMin = v => (v == null ? '—' : `${parseFloat(v).toFixed(2)} min`);
const fmtHrs = v => (v == null ? '—' : `${parseFloat(v).toFixed(4)} hrs`);

function effColor(pct) {
  if (pct == null) return { bg: '#f8f9fa', text: '#888', border: '#dee2e6' };
  if (pct >= 100)  return { bg: '#d4edda', text: '#155724', border: '#28a745' };
  if (pct >= 90)   return { bg: '#e8f5e9', text: '#2e7d32', border: '#66bb6a' };
  if (pct >= 75)   return { bg: '#fff3cd', text: '#856404', border: '#ffc107' };
  return              { bg: '#f8d7da', text: '#721c24', border: '#dc3545' };
}

function EffBadge({ pct }) {
  const c = effColor(pct);
  if (pct == null) return <span style={{ color: '#aaa', fontSize: '0.78rem' }}>—</span>;
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      padding: '2px 10px', borderRadius: 4, fontWeight: 700, fontSize: '0.82rem',
    }}>
      {parseFloat(pct).toFixed(1)}%
    </span>
  );
}

function EffBar({ pct }) {
  if (pct == null) return null;
  const capped = Math.min(pct, 150);
  const c = effColor(pct);
  return (
    <div style={{ width: '100%', background: '#e9ecef', borderRadius: 4, height: 8, marginTop: 3 }}>
      <div style={{
        width: `${(capped / 150) * 100}%`, height: '100%',
        background: c.border, borderRadius: 4, transition: 'width 0.4s',
      }} />
    </div>
  );
}

export default function EfficiencyReport() {
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [generated, setGenerated] = useState(false);

  const [detailBatch, setDetailBatch] = useState(null);
  const [detailRows,  setDetailRows]  = useState([]);
  const [detailLoad,  setDetailLoad]  = useState(false);

  const generate = async () => {
    setLoading(true); setGenerated(false); setDetailBatch(null);
    let url = '/api/reports/efficiency-summary?';
    if (fromDate) url += `from_date=${fromDate}&`;
    if (toDate)   url += `to_date=${toDate}`;
    const data = await fetch(url).then(r => r.json());
    setRows(Array.isArray(data) ? data : []);
    setGenerated(true); setLoading(false);
  };

  const openDetail = async (batchNo) => {
    if (detailBatch === batchNo) { setDetailBatch(null); return; }
    setDetailLoad(true); setDetailBatch(batchNo);
    const data = await fetch(`/api/reports/efficiency-detail/${encodeURIComponent(batchNo)}`).then(r => r.json());
    setDetailRows(Array.isArray(data) ? data : []);
    setDetailLoad(false);
  };

  const avgEff = rows.length
    ? rows.filter(r => r.avg_efficiency_pct != null).reduce((s, r) => s + parseFloat(r.avg_efficiency_pct), 0) /
      Math.max(1, rows.filter(r => r.avg_efficiency_pct != null).length)
    : null;

  const thS = {
    background: '#1a3a5c', color: '#fff', fontSize: '0.72rem',
    padding: '5px 8px', border: '1px solid #2d5a8e', textAlign: 'center', whiteSpace: 'nowrap',
  };
  const tdS = { fontSize: '0.78rem', padding: '5px 8px', border: '1px solid #dee2e6', verticalAlign: 'middle' };

  return (
    <div style={{ fontFamily: 'Tahoma, Arial, sans-serif', maxWidth: 1500, margin: '0 auto' }}>

      {/* Title */}
      <div style={{
        background: 'linear-gradient(to right, #1a3a5c, #2d6aa0, #1a3a5c)',
        padding: '10px 18px', borderRadius: '4px 4px 0 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>
          ⚡ Machine Efficiency Report
        </span>
        <span style={{ color: '#90c8f0', fontSize: '0.78rem' }}>
          Standard Cycle Time vs Actual Processing Time
        </span>
      </div>

      {/* Filter bar */}
      <div style={{ background: '#f0f4f8', border: '1px solid #b0c4de', borderTop: 'none', padding: '10px 16px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#333' }}>From Date</label>
          <input type="date" style={{ fontSize: '0.8rem', padding: '3px 8px', border: '1px solid #ccc', borderRadius: 3, height: 28 }}
            value={fromDate} onChange={e => setFromDate(e.target.value)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#333' }}>To Date</label>
          <input type="date" style={{ fontSize: '0.8rem', padding: '3px 8px', border: '1px solid #ccc', borderRadius: 3, height: 28 }}
            value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>
        <button
          style={{ fontSize: '0.82rem', padding: '5px 20px', background: 'linear-gradient(to bottom,#1a5faa,#0d3a6e)', color: '#fff', border: '1px solid #0d3a6e', borderRadius: 3, cursor: 'pointer', fontWeight: 600, height: 28 }}
          onClick={generate} disabled={loading}>
          {loading ? 'Loading…' : '▶ Generate Report'}
        </button>
        <span style={{ fontSize: '0.72rem', color: '#888', marginLeft: 8 }}>
          Leave dates blank to show all records
        </span>
      </div>

      {generated && (
        <>
          {/* KPI cards */}
          <div style={{ display: 'flex', gap: 12, padding: '12px 0 8px', flexWrap: 'wrap' }}>
            {[
              { label: 'Batches', value: rows.length, color: '#1a3a5c' },
              { label: 'Avg Efficiency', value: avgEff != null ? `${avgEff.toFixed(1)}%` : '—', color: effColor(avgEff).text, bg: effColor(avgEff).bg },
              { label: 'Completed Assignments', value: rows.reduce((s, r) => s + (r.completed_assignments || 0), 0), color: '#155724' },
              { label: 'Pending Assignments', value: rows.reduce((s, r) => s + ((r.assignments || 0) - (r.completed_assignments || 0)), 0), color: '#856404' },
            ].map(kpi => (
              <div key={kpi.label} style={{
                flex: '1 1 160px', background: kpi.bg || '#fff', border: '1px solid #d0dcea',
                borderRadius: 4, padding: '10px 16px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: 2 }}>{kpi.label}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
              </div>
            ))}

            {/* Efficiency legend */}
            <div style={{ flex: '2 1 300px', background: '#fff', border: '1px solid #d0dcea', borderRadius: 4, padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#333', marginRight: 4 }}>Efficiency Scale:</span>
              {[
                { label: '≥ 100%', ...effColor(100) },
                { label: '90–99%', ...effColor(95) },
                { label: '75–89%', ...effColor(82) },
                { label: '< 75%',  ...effColor(50) },
              ].map(s => (
                <span key={s.label} style={{
                  background: s.bg, color: s.text, border: `1px solid ${s.border}`,
                  padding: '2px 10px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700,
                }}>{s.label}</span>
              ))}
            </div>
          </div>

          {/* Summary table */}
          <div style={{ border: '1px solid #b0c4de', overflowX: 'auto', marginBottom: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
              <thead>
                <tr>
                  <th style={thS}>Date</th>
                  <th style={thS}>Batch No</th>
                  <th style={thS}>Order No</th>
                  <th style={thS}>Pair Codes</th>
                  <th style={thS}>Machine(s)</th>
                  <th style={thS}>Recipe</th>
                  <th style={thS}>Std CT (hrs)</th>
                  <th style={thS}>Std CT (min)</th>
                  <th style={thS}>Batch Start</th>
                  <th style={thS}>Batch End</th>
                  <th style={thS}>Assignments</th>
                  <th style={thS}>Completed</th>
                  <th style={thS}>Avg Actual CT (min)</th>
                  <th style={{ ...thS, background: '#1a5c3a', minWidth: 120 }}>Avg Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={14} style={{ ...tdS, textAlign: 'center', color: '#888', padding: 24 }}>
                      No data found for the selected date range.
                    </td>
                  </tr>
                )}
                {rows.map((r, i) => {
                  const c = effColor(r.avg_efficiency_pct);
                  const isOpen = detailBatch === r.batch_no;
                  return (
                    <>
                      <tr key={r.batch_no + i} style={{ background: isOpen ? '#eef4ff' : (i % 2 === 0 ? '#fff' : '#f7fbff') }}>
                        <td style={{ ...tdS, textAlign: 'center' }}>{r.proc_date || '—'}</td>
                        <td style={{ ...tdS, textAlign: 'center' }}>
                          <span
                            style={{ background: '#1a3a5c', color: '#fff', padding: '2px 10px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                            title="Click to view pair-code detail"
                            onClick={() => openDetail(r.batch_no)}>
                            {r.batch_no} {isOpen ? '▲' : '▼'}
                          </span>
                        </td>
                        <td style={tdS}>{r.order_no || '—'}</td>
                        <td style={{ ...tdS, fontSize: '0.72rem', color: '#555' }}>{r.all_pair_codes}</td>
                        <td style={{ ...tdS, fontWeight: 600, color: '#1a5faa' }}>{r.machines}</td>
                        <td style={{ ...tdS, fontSize: '0.72rem' }}>{r.recipes}</td>
                        <td style={{ ...tdS, textAlign: 'right' }}>{fmtHrs(r.std_ct_min / 60)}</td>
                        <td style={{ ...tdS, textAlign: 'right' }}>{fmtMin(r.std_ct_min)}</td>
                        <td style={{ ...tdS, fontSize: '0.72rem' }}>{fmtDt(r.batch_start)}</td>
                        <td style={{ ...tdS, fontSize: '0.72rem' }}>{fmtDt(r.batch_end)}</td>
                        <td style={{ ...tdS, textAlign: 'center' }}>{r.assignments}</td>
                        <td style={{ ...tdS, textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: r.completed_assignments === r.assignments ? '#155724' : '#856404' }}>
                            {r.completed_assignments}/{r.assignments}
                          </span>
                        </td>
                        <td style={{ ...tdS, textAlign: 'right' }}>{fmtMin(r.avg_actual_ct_min)}</td>
                        <td style={{ ...tdS, textAlign: 'center', background: c.bg }}>
                          <EffBadge pct={r.avg_efficiency_pct} />
                          <EffBar pct={r.avg_efficiency_pct} />
                        </td>
                      </tr>

                      {/* Detail rows (expanded inline) */}
                      {isOpen && (
                        <tr key={`detail-${r.batch_no}`}>
                          <td colSpan={14} style={{ padding: 0, background: '#f0f4ff', borderBottom: '2px solid #4a90d9' }}>
                            {detailLoad
                              ? <div style={{ padding: 16, textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>Loading…</div>
                              : (
                                <div style={{ padding: '10px 16px' }}>
                                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1a3a5c', marginBottom: 8 }}>
                                    Batch {r.batch_no} — Assignment Detail
                                  </div>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                    <thead>
                                      <tr style={{ background: '#2d5a8e', color: '#fff' }}>
                                        <th style={{ padding: '4px 8px', border: '1px solid #4a7ab5', textAlign: 'center' }}>#</th>
                                        <th style={{ padding: '4px 8px', border: '1px solid #4a7ab5' }}>Pair Codes</th>
                                        <th style={{ padding: '4px 8px', border: '1px solid #4a7ab5' }}>Club</th>
                                        <th style={{ padding: '4px 8px', border: '1px solid #4a7ab5', textAlign: 'right' }}>Weight (kg)</th>
                                        <th style={{ padding: '4px 8px', border: '1px solid #4a7ab5' }}>Machine</th>
                                        <th style={{ padding: '4px 8px', border: '1px solid #4a7ab5' }}>Recipe</th>
                                        <th style={{ padding: '4px 8px', border: '1px solid #4a7ab5', textAlign: 'right' }}>Std CT (min)</th>
                                        <th style={{ padding: '4px 8px', border: '1px solid #4a7ab5' }}>Process Start</th>
                                        <th style={{ padding: '4px 8px', border: '1px solid #4a7ab5' }}>Process End</th>
                                        <th style={{ padding: '4px 8px', border: '1px solid #4a7ab5', textAlign: 'right' }}>Actual CT (min)</th>
                                        <th style={{ padding: '4px 8px', border: '1px solid #4a7ab5', textAlign: 'center', background: '#1a5c3a' }}>Efficiency</th>
                                        <th style={{ padding: '4px 8px', border: '1px solid #4a7ab5', textAlign: 'center' }}>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {detailRows.length === 0 && (
                                        <tr>
                                          <td colSpan={12} style={{ padding: 12, textAlign: 'center', color: '#888' }}>
                                            No completed processing records found.
                                          </td>
                                        </tr>
                                      )}
                                      {detailRows.map((d, di) => {
                                        const dc = effColor(d.efficiency_pct);
                                        return (
                                          <tr key={d.id} style={{ background: di % 2 === 0 ? '#fff' : '#f0f4ff' }}>
                                            <td style={{ padding: '4px 8px', border: '1px solid #dde', textAlign: 'center', color: '#888' }}>{di + 1}</td>
                                            <td style={{ padding: '4px 8px', border: '1px solid #dde', fontWeight: 700, color: '#1a3a5c' }}>{d.pair_codes_str}</td>
                                            <td style={{ padding: '4px 8px', border: '1px solid #dde', textAlign: 'center' }}>
                                              {d.club_group
                                                ? <span style={{ background: '#1a3a5c', color: '#fff', padding: '1px 7px', borderRadius: 10, fontSize: '0.68rem' }}>{d.club_group}</span>
                                                : <span style={{ color: '#bbb' }}>—</span>}
                                            </td>
                                            <td style={{ padding: '4px 8px', border: '1px solid #dde', textAlign: 'right' }}>{parseFloat(d.pair_code_weight || 0).toFixed(2)}</td>
                                            <td style={{ padding: '4px 8px', border: '1px solid #dde', fontWeight: 600, color: '#1a5faa' }}>{d.machine}</td>
                                            <td style={{ padding: '4px 8px', border: '1px solid #dde' }}>
                                              {d.recipe}
                                              <div style={{ color: '#888', fontSize: '0.68rem' }}>{d.recipe_ct_hrs} hrs</div>
                                            </td>
                                            <td style={{ padding: '4px 8px', border: '1px solid #dde', textAlign: 'right' }}>{fmtMin(d.std_ct_min)}</td>
                                            <td style={{ padding: '4px 8px', border: '1px solid #dde', color: '#555' }}>{fmtDt(d.process_start)}</td>
                                            <td style={{ padding: '4px 8px', border: '1px solid #dde', color: '#555' }}>{fmtDt(d.process_end)}</td>
                                            <td style={{ padding: '4px 8px', border: '1px solid #dde', textAlign: 'right', fontWeight: 600 }}>{fmtMin(d.actual_ct_min)}</td>
                                            <td style={{ padding: '4px 8px', border: '1px solid #dde', textAlign: 'center', background: dc.bg }}>
                                              <EffBadge pct={d.efficiency_pct} />
                                              <EffBar pct={d.efficiency_pct} />
                                            </td>
                                            <td style={{ padding: '4px 8px', border: '1px solid #dde', textAlign: 'center' }}>
                                              <span style={{
                                                fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                                                background: d.status === 'COMPLETED' ? '#d4edda' : '#fff3cd',
                                                color: d.status === 'COMPLETED' ? '#155724' : '#856404',
                                              }}>{d.status}</span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )
                            }
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
