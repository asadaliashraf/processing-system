const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Helper: build WHERE condition for batch_no that may be combined ('82487+82488')
function batchLikeCond(batchNos, alias = 'batch_no') {
  const parts = batchNos.map(() =>
    `(${alias} = ? OR ${alias} LIKE ? OR ${alias} LIKE ? OR ${alias} LIKE ?)`
  ).join(' OR ');
  const params = batchNos.flatMap(bn => [bn, bn + '+%', '%+' + bn, '%+' + bn + '+%']);
  return { cond: `(${parts})`, params };
}

// ── ROUTES ───────────────────────────────────────────────────────────────────

// Batches
app.get('/api/batches', (req, res) => {
  try {
    const rows = getDb().prepare('SELECT * FROM batches ORDER BY batch_no').all();
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/batches', (req, res) => {
  try {
    const { batch_no, order_no, issue_doc, receive_doc, weight_kg, dzns, pcs, cost_code } = req.body;
    getDb().prepare(`INSERT INTO batches (batch_no,order_no,issue_doc,receive_doc,weight_kg,dzns,pcs,cost_code)
                     VALUES (?,?,?,?,?,?,?,?)`)
      .run(batch_no, order_no||'', issue_doc||'', receive_doc||'', weight_kg||0, dzns||0, pcs||0, cost_code||'');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/batches/:id', (req, res) => {
  try {
    const { batch_no, order_no, issue_doc, receive_doc, weight_kg, dzns, pcs, cost_code } = req.body;
    getDb().prepare(`UPDATE batches SET batch_no=?,order_no=?,issue_doc=?,receive_doc=?,weight_kg=?,dzns=?,pcs=?,cost_code=? WHERE id=?`)
      .run(batch_no, order_no||'', issue_doc||'', receive_doc||'', weight_kg||0, dzns||0, pcs||0, cost_code||'', req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/batches/:id', (req, res) => {
  try {
    getDb().prepare('DELETE FROM batches WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Pair Codes
app.get('/api/pair-codes', (req, res) => {
  try {
    const db = getDb();
    const batchNo = req.query.batch_no;
    const rows = batchNo
      ? db.prepare('SELECT * FROM pair_codes WHERE batch_no=? ORDER BY seq_no').all(batchNo)
      : db.prepare('SELECT * FROM pair_codes ORDER BY seq_no').all();
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/pair-codes', (req, res) => {
  try {
    const { batch_no, pair_code, weight_kg, seq_no, recipe } = req.body;
    getDb().prepare('INSERT INTO pair_codes (batch_no,pair_code,weight_kg,seq_no,recipe) VALUES (?,?,?,?,?)')
      .run(batch_no, pair_code, weight_kg, seq_no||1, recipe||null);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/pair-codes/:id', (req, res) => {
  try {
    const { batch_no, pair_code, weight_kg, seq_no, recipe } = req.body;
    getDb().prepare('UPDATE pair_codes SET batch_no=?,pair_code=?,weight_kg=?,seq_no=?,recipe=? WHERE id=?')
      .run(batch_no, pair_code, weight_kg, seq_no||1, recipe||null, req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/pair-codes/:id', (req, res) => {
  try {
    getDb().prepare('DELETE FROM pair_codes WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Machines
app.get('/api/machines', (req, res) => {
  try {
    res.json(getDb().prepare('SELECT * FROM machines ORDER BY machine_name').all());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/machines', (req, res) => {
  try {
    const { machine_name, capacity_kg } = req.body;
    getDb().prepare('INSERT INTO machines (machine_name,capacity_kg) VALUES (?,?)').run(machine_name, capacity_kg);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/machines/:id', (req, res) => {
  try {
    const { machine_name, capacity_kg } = req.body;
    getDb().prepare('UPDATE machines SET machine_name=?,capacity_kg=? WHERE id=?').run(machine_name, capacity_kg, req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/machines/:id', (req, res) => {
  try {
    getDb().prepare('DELETE FROM machines WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Recipes
app.get('/api/recipes', (req, res) => {
  try {
    res.json(getDb().prepare('SELECT * FROM recipes ORDER BY recipe_name').all());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/recipes', (req, res) => {
  try {
    const { recipe_name, cycle_time_hours } = req.body;
    getDb().prepare('INSERT INTO recipes (recipe_name,cycle_time_hours) VALUES (?,?)').run(recipe_name, cycle_time_hours);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/recipes/:id', (req, res) => {
  try {
    const { recipe_name, cycle_time_hours } = req.body;
    getDb().prepare('UPDATE recipes SET recipe_name=?,cycle_time_hours=? WHERE id=?').run(recipe_name, cycle_time_hours, req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/recipes/:id', (req, res) => {
  try {
    getDb().prepare('DELETE FROM recipes WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Dryers
app.get('/api/dryers', (req, res) => {
  try {
    res.json(getDb().prepare('SELECT * FROM dryers ORDER BY dryer_name').all());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/dryers', (req, res) => {
  try {
    const { dryer_name, capacity_kg, drying_duration_min } = req.body;
    getDb().prepare('INSERT INTO dryers (dryer_name,capacity_kg,drying_duration_min) VALUES (?,?,?)').run(dryer_name, capacity_kg, drying_duration_min);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/dryers/:id', (req, res) => {
  try {
    const { dryer_name, capacity_kg, drying_duration_min } = req.body;
    getDb().prepare('UPDATE dryers SET dryer_name=?,capacity_kg=?,drying_duration_min=? WHERE id=?').run(dryer_name, capacity_kg, drying_duration_min, req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/dryers/:id', (req, res) => {
  try {
    getDb().prepare('DELETE FROM dryers WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Hydro
app.get('/api/hydro', (req, res) => {
  try {
    res.json(getDb().prepare('SELECT * FROM hydro ORDER BY hydro_name').all());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hydro', (req, res) => {
  try {
    const { hydro_name, capacity_kg, cycle_time_min } = req.body;
    getDb().prepare('INSERT INTO hydro (hydro_name,capacity_kg,cycle_time_min) VALUES (?,?,?)').run(hydro_name, capacity_kg, cycle_time_min);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/hydro/:id', (req, res) => {
  try {
    const { hydro_name, capacity_kg, cycle_time_min } = req.body;
    getDb().prepare('UPDATE hydro SET hydro_name=?,capacity_kg=?,cycle_time_min=? WHERE id=?').run(hydro_name, capacity_kg, cycle_time_min, req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/hydro/:id', (req, res) => {
  try {
    getDb().prepare('DELETE FROM hydro WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PROCESSING LOG ────────────────────────────────────────────────────────────
app.get('/api/processing-log', (req, res) => {
  try {
    const { from_date, to_date, batch_no } = req.query;
    let q = 'SELECT * FROM processing_log WHERE 1=1';
    const params = [];
    if (from_date) { q += ' AND log_date >= ?'; params.push(from_date); }
    if (to_date)   { q += ' AND log_date <= ?'; params.push(to_date); }
    if (batch_no)  { q += ' AND batch_no = ?';  params.push(batch_no); }
    q += ' ORDER BY created_at DESC';
    res.json(getDb().prepare(q).all(...params));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/processing-log/:id', (req, res) => {
  try {
    getDb().prepare('DELETE FROM processing_log WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── REPORTS ───────────────────────────────────────────────────────────────────
app.get('/api/reports/summary', (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    let where = '1=1';
    const params = [];
    if (from_date) { where += ' AND log_date >= ?'; params.push(from_date); }
    if (to_date)   { where += ' AND log_date <= ?'; params.push(to_date); }

    const q = `
      SELECT
        pl.log_date, pl.batch_no, pl.order_no, pl.issue_doc, pl.receive_doc,
        MAX(pl.batch_weight) AS batch_weight,
        MAX(pl.dzns)         AS dzns,
        MAX(pl.pcs)          AS pcs,
        MAX(pl.cost_code)    AS cost_code,
        (SELECT GROUP_CONCAT(DISTINCT x.machine) FROM processing_log x
         WHERE x.batch_no=pl.batch_no AND x.log_date=pl.log_date
           AND x.machine IS NOT NULL AND x.machine != '') AS machines,
        (SELECT GROUP_CONCAT(DISTINCT x.dryer) FROM processing_log x
         WHERE x.batch_no=pl.batch_no AND x.log_date=pl.log_date
           AND x.dryer IS NOT NULL AND x.dryer != '') AS dryers,
        SUM(pl.cycles)       AS total_cycles,
        SUM(pl.produced_min) AS total_produced_min
      FROM processing_log pl
      WHERE ${where}
      GROUP BY pl.log_date, pl.batch_no, pl.order_no, pl.issue_doc, pl.receive_doc
      ORDER BY pl.log_date DESC, pl.batch_no
    `;
    res.json(getDb().prepare(q).all(...params));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/reports/detail/:batchNo', (req, res) => {
  try {
    res.json(getDb().prepare('SELECT * FROM processing_log WHERE batch_no=? ORDER BY id').all(req.params.batchNo));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── QUEUES ────────────────────────────────────────────────────────────────────
app.get('/api/queues/machines', (req, res) => {
  try {
    const db = getDb();
    const machines = db.prepare('SELECT * FROM machines ORDER BY machine_name').all();
    const active   = db.prepare(`
      SELECT id, machine, batch_no, pair_codes_str, pair_code_weight, recipe, status, process_start, created_at
      FROM batch_process WHERE status IN ('PROCESSING','QUEUED')
      ORDER BY machine, CASE status WHEN 'PROCESSING' THEN 0 ELSE 1 END, created_at ASC
    `).all();

    const machineMap = {};
    for (const row of active) {
      if (!machineMap[row.machine]) machineMap[row.machine] = { running: null, queue: [] };
      if (row.status === 'PROCESSING') machineMap[row.machine].running = row;
      else machineMap[row.machine].queue.push(row);
    }
    res.json(machines.map(m => ({
      ...m,
      status:  machineMap[m.machine_name]?.running ? 'RUNNING' : 'IDLE',
      running: machineMap[m.machine_name]?.running || null,
      queue:   machineMap[m.machine_name]?.queue   || [],
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/queues/dryers', (req, res) => {
  try {
    const db = getDb();
    const dryers = db.prepare('SELECT * FROM dryers ORDER BY dryer_name').all();
    const hydros = db.prepare('SELECT * FROM hydro ORDER BY hydro_name').all();

    const dryerActive = db.prepare(`
      SELECT id, dryer AS name, batch_no, pair_codes_str, pair_code_weight, status, dryer_start, created_at
      FROM batch_process WHERE status IN ('DRYING','DRYER_QUEUED')
      ORDER BY dryer, CASE status WHEN 'DRYING' THEN 0 ELSE 1 END, created_at ASC
    `).all();
    const hydroActive = db.prepare(`
      SELECT id, hydro_name AS name, batch_no, pair_codes_str, pair_code_weight, status, hydro_start, created_at
      FROM batch_process WHERE status IN ('HYDRO_RUNNING','HYDRO_QUEUED')
      ORDER BY hydro_name, CASE status WHEN 'HYDRO_RUNNING' THEN 0 ELSE 1 END, created_at ASC
    `).all();

    const dryerMap = {};
    for (const row of dryerActive) {
      if (!dryerMap[row.name]) dryerMap[row.name] = { running: null, queue: [] };
      if (row.status === 'DRYING') dryerMap[row.name].running = row;
      else dryerMap[row.name].queue.push(row);
    }
    const hydroMap = {};
    for (const row of hydroActive) {
      if (!hydroMap[row.name]) hydroMap[row.name] = { running: null, queue: [] };
      if (row.status === 'HYDRO_RUNNING') hydroMap[row.name].running = row;
      else hydroMap[row.name].queue.push(row);
    }

    const dryerResult = dryers.map(d => ({
      name: d.dryer_name, type: 'Dryer', capacity_kg: d.capacity_kg, duration_min: d.drying_duration_min,
      status:  dryerMap[d.dryer_name]?.running ? 'RUNNING' : 'IDLE',
      running: dryerMap[d.dryer_name]?.running || null,
      queue:   dryerMap[d.dryer_name]?.queue   || [],
    }));
    const hydroResult = hydros.map(h => ({
      name: h.hydro_name, type: 'Hydro', capacity_kg: h.capacity_kg, duration_min: h.cycle_time_min,
      status:  hydroMap[h.hydro_name]?.running ? 'RUNNING' : 'IDLE',
      running: hydroMap[h.hydro_name]?.running || null,
      queue:   hydroMap[h.hydro_name]?.queue   || [],
    }));
    res.json([...dryerResult, ...hydroResult]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
app.get('/api/dashboard', (req, res) => {
  try {
    const db    = getDb();
    const today = new Date().toISOString().split('T')[0];
    const totalBatches   = db.prepare('SELECT COUNT(*) AS cnt FROM batches').get().cnt;
    const totalMachines  = db.prepare('SELECT COUNT(*) AS cnt FROM machines').get().cnt;
    const batchesToday   = db.prepare(`SELECT COUNT(DISTINCT batch_no) AS cnt FROM processing_log WHERE log_date=?`).get(today).cnt;
    const producedToday  = db.prepare(`SELECT IFNULL(SUM(produced_min),0) AS total FROM processing_log WHERE log_date=?`).get(today).total;
    const recentLog      = db.prepare(`SELECT log_date, batch_no, order_no, pair_codes_str, machine, produced_min FROM processing_log ORDER BY created_at DESC LIMIT 10`).all();
    res.json({ totalBatches, totalMachines, batchesToday, producedMinToday: producedToday, recentLog });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── AVAILABILITY ──────────────────────────────────────────────────────────────
app.get('/api/availability', (req, res) => {
  try {
    const db = getDb();
    const busyMachines   = db.prepare(`SELECT machine, pair_codes_str, batch_no, machine_cap, SUM(pair_code_weight) AS loaded_weight FROM batch_process WHERE status='PROCESSING' GROUP BY machine, pair_codes_str, batch_no, machine_cap`).all();
    const queuedMachines = db.prepare(`SELECT machine, COUNT(*) AS queue_count FROM batch_process WHERE status='QUEUED' GROUP BY machine`).all();
    const busyDryers     = db.prepare(`SELECT dryer, pair_codes_str, batch_no, dryer_cap, SUM(pair_code_weight) AS loaded_weight FROM batch_process WHERE status='DRYING' GROUP BY dryer, pair_codes_str, batch_no, dryer_cap`).all();
    const queuedDryers   = db.prepare(`SELECT dryer, COUNT(*) AS queue_count FROM batch_process WHERE status='DRYER_QUEUED' GROUP BY dryer`).all();
    const busyHydros     = db.prepare(`SELECT hydro_name, pair_codes_str, batch_no, hydro_cap, SUM(pair_code_weight) AS loaded_weight FROM batch_process WHERE status='HYDRO_RUNNING' GROUP BY hydro_name, pair_codes_str, batch_no, hydro_cap`).all();
    const queuedHydros   = db.prepare(`SELECT hydro_name, COUNT(*) AS queue_count FROM batch_process WHERE status='HYDRO_QUEUED' GROUP BY hydro_name`).all();
    res.json({ busyMachines, queuedMachines, busyDryers, queuedDryers, busyHydros, queuedHydros });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── BATCH FORM v2 ─────────────────────────────────────────────────────────────
app.get('/api/batch-form-v2/:batchNo', (req, res) => {
  try {
    const db = getDb();
    const batchNo = req.params.batchNo;

    const batch = db.prepare('SELECT * FROM batches WHERE batch_no=?').get(batchNo);
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const pairCodes = db.prepare(`
      SELECT pc.*, r.cycle_time_hours AS recipe_ct_hrs
      FROM pair_codes pc
      LEFT JOIN recipes r ON r.recipe_name = pc.recipe
      WHERE pc.batch_no=? ORDER BY pc.seq_no
    `).all(batchNo);

    const { cond, params } = batchLikeCond([batchNo]);
    const plans = db.prepare(`SELECT * FROM batch_process WHERE ${cond} ORDER BY id`).all(...params);

    res.json({ batch, pairCodes, plans });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/batch-form-v2/save', (req, res) => {
  try {
    const { loadedBatchNos, assignments } = req.body;
    const db = getDb();

    const { cond, params: batchParams } = batchLikeCond(loadedBatchNos);

    // Find existing PLANNED entries
    const existing = db.prepare(`SELECT * FROM batch_process WHERE ${cond} AND status='PLANNED'`).all(...batchParams);

    // Delete PLANNED entries no longer in incoming assignments
    const incomingPcSets = assignments.map(a => a.pair_codes.slice().sort().join('+'));
    for (const ex of existing) {
      const exKey = ex.pair_codes_str.split('+').sort().join('+');
      if (!incomingPcSets.includes(exKey)) {
        db.prepare('DELETE FROM batch_process WHERE id=?').run(ex.id);
      }
    }

    // Next club ID
    const allClubs = db.prepare(`SELECT club_group FROM batch_process WHERE ${cond} AND club_group IS NOT NULL AND club_group != ''`).all(...batchParams);
    const usedNums = allClubs.map(r => parseInt((r.club_group||'').replace('C',''))).filter(n => !isNaN(n));
    let nextClubNum = usedNums.length ? Math.max(...usedNums) + 1 : 1;

    // Locked (non-PLANNED) pair codes — never touch these
    const activeRows = db.prepare(`SELECT pair_codes_str FROM batch_process WHERE ${cond} AND status != 'PLANNED'`).all(...batchParams);
    const lockedPcs = new Set();
    activeRows.forEach(r => r.pair_codes_str.split('+').forEach(pc => lockedPcs.add(pc.trim())));

    // Currently busy machines
    const busyMachines = db.prepare(`SELECT machine, batch_no, SUM(pair_code_weight) AS loaded_weight, MAX(machine_cap) AS machine_cap FROM batch_process WHERE status='PROCESSING' GROUP BY machine, batch_no`).all();
    const busyMachineMap = {};
    for (const r of busyMachines) busyMachineMap[r.machine] = r;

    for (const a of assignments) {
      if (a.pair_codes.some(pc => lockedPcs.has(pc))) continue;
      if (a.machine_cap > 0 && a.pair_code_weight > a.machine_cap) {
        return res.status(400).json({ error: `Weight ${a.pair_code_weight}kg exceeds machine ${a.machine} capacity of ${a.machine_cap}kg.` });
      }

      const isBusy   = !!busyMachineMap[a.machine];
      const newStatus = isBusy ? 'QUEUED' : 'PLANNED';
      const pcsStr   = a.pair_codes.join('+');
      const macSam   = a.machine_cap > 0 ? (a.recipe_ct_hrs * 60) / a.machine_cap : 0;
      const aBatchNo = a.batch_no;

      const exEntry = existing.find(ex => ex.pair_codes_str.split('+').sort().join('+') === a.pair_codes.slice().sort().join('+'));

      if (exEntry) {
        db.prepare(`UPDATE batch_process SET batch_no=?,machine=?,machine_cap=?,recipe=?,recipe_ct_hrs=?,machine_sam=?,status=?
                    WHERE id=? AND status IN ('PLANNED','QUEUED')`)
          .run(aBatchNo, a.machine, a.machine_cap, a.recipe, a.recipe_ct_hrs, macSam, newStatus, exEntry.id);
      } else {
        const clubGroup = (a.pair_codes.length > 1 || aBatchNo.includes('+')) ? 'C' + nextClubNum++ : '';
        db.prepare(`INSERT INTO batch_process (batch_no,order_no,pair_codes_str,pair_code_weight,club_group,machine,machine_cap,recipe,recipe_ct_hrs,machine_sam,status)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
          .run(aBatchNo, a.order_no||'', pcsStr, a.pair_code_weight, clubGroup, a.machine, a.machine_cap, a.recipe, a.recipe_ct_hrs, macSam, newStatus);
      }
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── BATCH PROCESS TRACKING ────────────────────────────────────────────────────
app.get('/api/batch-process', (req, res) => {
  try {
    const { batch_no, status } = req.query;
    let q = 'SELECT * FROM batch_process WHERE 1=1';
    const params = [];
    if (batch_no) {
      const { cond, params: bp } = batchLikeCond([batch_no]);
      q += ` AND ${cond}`;
      params.push(...bp);
    }
    if (status) { q += ' AND status=?'; params.push(status); }
    q += ' ORDER BY created_at DESC';
    res.json(getDb().prepare(q).all(...params));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/batch-process/:id/start-processing', (req, res) => {
  try {
    getDb().prepare(`UPDATE batch_process SET status='PROCESSING', process_start=datetime('now') WHERE id=? AND status='PLANNED'`).run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/batch-process/:id/complete-processing', (req, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const row = db.prepare(`SELECT machine FROM batch_process WHERE id=? AND status='PROCESSING'`).get(id);
    db.prepare(`UPDATE batch_process SET status='PROCESSED', process_end=datetime('now') WHERE id=? AND status='PROCESSING'`).run(id);
    if (row?.machine) {
      const next = db.prepare(`SELECT id FROM batch_process WHERE machine=? AND status='QUEUED' ORDER BY created_at ASC LIMIT 1`).get(row.machine);
      if (next) db.prepare(`UPDATE batch_process SET status='PROCESSING', process_start=datetime('now') WHERE id=?`).run(next.id);
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/batch-process/:id/assign-dryer', (req, res) => {
  try {
    const { dryer, dryer_cap, drying_dur_min } = req.body;
    const db  = getDb();
    const rec = db.prepare('SELECT * FROM batch_process WHERE id=?').get(req.params.id);
    if (!rec) return res.status(404).json({ error: 'Record not found' });
    if (dryer_cap > 0 && rec.pair_code_weight > dryer_cap)
      return res.status(400).json({ error: `Weight ${rec.pair_code_weight}kg exceeds dryer ${dryer} capacity of ${dryer_cap}kg.` });

    const isDryerBusy = !!db.prepare(`SELECT id FROM batch_process WHERE dryer=? AND status='DRYING'`).get(dryer);
    const dryer_sam   = dryer_cap > 0 ? drying_dur_min / dryer_cap : 0;
    const dryerStatus = isDryerBusy ? 'DRYER_QUEUED' : 'PROCESSED';

    db.prepare(`UPDATE batch_process SET dryer=?,dryer_cap=?,drying_dur_min=?,dryer_sam=?,status=? WHERE id=? AND status='PROCESSED'`)
      .run(dryer, dryer_cap, drying_dur_min, dryer_sam, dryerStatus, req.params.id);
    res.json({ success: true, queued: isDryerBusy });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/batch-process/:id/start-drying', (req, res) => {
  try {
    getDb().prepare(`UPDATE batch_process SET status='DRYING', dryer_start=datetime('now') WHERE id=? AND status='PROCESSED' AND dryer IS NOT NULL`).run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/batch-process/:id/complete-drying', (req, res) => {
  try {
    const db  = getDb();
    const id  = req.params.id;
    const r   = db.prepare('SELECT * FROM batch_process WHERE id=?').get(id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    const totalSam = parseFloat(r.machine_sam||0) + parseFloat(r.dryer_sam||0);
    db.prepare(`UPDATE batch_process SET status='DRIED', dryer_end=datetime('now'), total_sam=? WHERE id=? AND status='DRYING'`).run(totalSam, id);
    if (r.dryer) {
      const next = db.prepare(`SELECT id FROM batch_process WHERE dryer=? AND status='DRYER_QUEUED' ORDER BY created_at ASC LIMIT 1`).get(r.dryer);
      if (next) db.prepare(`UPDATE batch_process SET status='DRYING', dryer_start=datetime('now') WHERE id=?`).run(next.id);
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/batch-process/:id/assign-hydro', (req, res) => {
  try {
    const { hydro_name, hydro_cap, hydro_ct_min } = req.body;
    const db  = getDb();
    const rec = db.prepare('SELECT * FROM batch_process WHERE id=?').get(req.params.id);
    if (!rec) return res.status(404).json({ error: 'Record not found' });
    if (hydro_cap > 0 && rec.pair_code_weight > hydro_cap)
      return res.status(400).json({ error: `Weight ${rec.pair_code_weight}kg exceeds hydro ${hydro_name} capacity of ${hydro_cap}kg.` });

    const isHydroBusy = !!db.prepare(`SELECT id FROM batch_process WHERE hydro_name=? AND status='HYDRO_RUNNING'`).get(hydro_name);
    const hydro_sam   = hydro_cap > 0 ? hydro_ct_min / hydro_cap : 0;
    const hydroStatus = isHydroBusy ? 'HYDRO_QUEUED' : 'DRIED';

    db.prepare(`UPDATE batch_process SET hydro_name=?,hydro_cap=?,hydro_ct_min=?,hydro_sam=?,status=? WHERE id=? AND status='DRIED'`)
      .run(hydro_name, hydro_cap, hydro_ct_min, hydro_sam, hydroStatus, req.params.id);
    res.json({ success: true, queued: isHydroBusy });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/batch-process/:id/start-hydro', (req, res) => {
  try {
    getDb().prepare(`UPDATE batch_process SET status='HYDRO_RUNNING', hydro_start=datetime('now') WHERE id=? AND status='DRIED' AND hydro_name IS NOT NULL AND hydro_name != ''`).run(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/batch-process/:id/complete-hydro', (req, res) => {
  try {
    const db  = getDb();
    const id  = req.params.id;
    const r   = db.prepare('SELECT * FROM batch_process WHERE id=?').get(id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    const totalSam = parseFloat(r.machine_sam||0) + parseFloat(r.dryer_sam||0) + parseFloat(r.hydro_sam||0);
    const produced = totalSam * parseFloat(r.pair_code_weight||0);

    db.prepare(`UPDATE batch_process SET status='COMPLETED', hydro_end=datetime('now'), total_sam=?, produced_min=? WHERE id=? AND status='HYDRO_RUNNING'`)
      .run(totalSam, produced, id);

    if (r.hydro_name) {
      const next = db.prepare(`SELECT id FROM batch_process WHERE hydro_name=? AND status='HYDRO_QUEUED' ORDER BY created_at ASC LIMIT 1`).get(r.hydro_name);
      if (next) db.prepare(`UPDATE batch_process SET status='HYDRO_RUNNING', hydro_start=datetime('now') WHERE id=?`).run(next.id);
    }

    writeToProcessingLog(db, r, totalSam, produced);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/batch-process/:id/mark-complete', (req, res) => {
  try {
    const db  = getDb();
    const id  = req.params.id;
    const r   = db.prepare('SELECT * FROM batch_process WHERE id=?').get(id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    const totalSam = parseFloat(r.machine_sam||0) + parseFloat(r.dryer_sam||0);
    const produced = totalSam * parseFloat(r.pair_code_weight||0);

    db.prepare(`UPDATE batch_process SET status='COMPLETED', total_sam=?, produced_min=? WHERE id=? AND status='DRIED'`)
      .run(totalSam, produced, id);

    writeToProcessingLog(db, r, totalSam, produced);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Helper: write completed record to processing_log
function writeToProcessingLog(db, r, totalSam, produced) {
  const today = new Date().toISOString().split('T')[0];
  const batch = db.prepare('SELECT * FROM batches WHERE batch_no=?').get(r.batch_no) || {};
  db.prepare(`INSERT INTO processing_log
    (log_date,batch_no,order_no,issue_doc,receive_doc,batch_weight,dzns,pcs,cost_code,
     pair_codes_str,pair_code_weight,club_group,machine,machine_cap,recipe,recipe_ct_hrs,
     dryer,dryer_cap,drying_dur_min,hydro_name,hydro_cap,hydro_ct_min,
     dryer_sam,machine_sam,hydro_sam,total_sam,cycles,produced_min)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(
      today, r.batch_no, r.order_no||batch.order_no||'', batch.issue_doc||'', batch.receive_doc||'',
      batch.weight_kg||0, batch.dzns||0, batch.pcs||0, batch.cost_code||'',
      r.pair_codes_str, r.pair_code_weight, r.club_group||'',
      r.machine||'', r.machine_cap||0, r.recipe||'', r.recipe_ct_hrs||0,
      r.dryer||'', r.dryer_cap||0, r.drying_dur_min||0,
      r.hydro_name||'', r.hydro_cap||0, r.hydro_ct_min||0,
      r.dryer_sam||0, r.machine_sam||0, r.hydro_sam||0,
      totalSam, 1, produced
    );
}

// ── SERVE FRONTEND (production) ───────────────────────────────────────────────
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));

// ── START ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
