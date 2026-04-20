const express = require('express');
const cors = require('cors');
const { getPool, sql } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// ── ROUTES ───────────────────────────────────────────────────────────────────

// Batches
app.get('/api/batches', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM batches ORDER BY batch_no');
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/batches', async (req, res) => {
  try {
    const { batch_no, order_no, issue_doc, receive_doc, weight_kg, dzns, pcs, cost_code } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('batch_no', sql.NVarChar, batch_no)
      .input('order_no', sql.NVarChar, order_no || '')
      .input('issue_doc', sql.NVarChar, issue_doc || '')
      .input('receive_doc', sql.NVarChar, receive_doc || '')
      .input('weight_kg', sql.Decimal(10,2), weight_kg || 0)
      .input('dzns', sql.Int, dzns || 0)
      .input('pcs', sql.Int, pcs || 0)
      .input('cost_code', sql.NVarChar, cost_code || '')
      .query(`INSERT INTO batches (batch_no,order_no,issue_doc,receive_doc,weight_kg,dzns,pcs,cost_code)
              VALUES (@batch_no,@order_no,@issue_doc,@receive_doc,@weight_kg,@dzns,@pcs,@cost_code)`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/batches/:id', async (req, res) => {
  try {
    const { batch_no, order_no, issue_doc, receive_doc, weight_kg, dzns, pcs, cost_code } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('batch_no', sql.NVarChar, batch_no)
      .input('order_no', sql.NVarChar, order_no || '')
      .input('issue_doc', sql.NVarChar, issue_doc || '')
      .input('receive_doc', sql.NVarChar, receive_doc || '')
      .input('weight_kg', sql.Decimal(10,2), weight_kg || 0)
      .input('dzns', sql.Int, dzns || 0)
      .input('pcs', sql.Int, pcs || 0)
      .input('cost_code', sql.NVarChar, cost_code || '')
      .query(`UPDATE batches SET batch_no=@batch_no,order_no=@order_no,issue_doc=@issue_doc,
              receive_doc=@receive_doc,weight_kg=@weight_kg,dzns=@dzns,pcs=@pcs,cost_code=@cost_code
              WHERE id=@id`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/batches/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, req.params.id)
      .query('DELETE FROM batches WHERE id=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Pair Codes
app.get('/api/pair-codes', async (req, res) => {
  try {
    const pool = await getPool();
    const batchNo = req.query.batch_no;
    let q = 'SELECT * FROM pair_codes';
    if (batchNo) q += ` WHERE batch_no='${batchNo}'`;
    q += ' ORDER BY seq_no';
    const result = await pool.request().query(q);
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/pair-codes', async (req, res) => {
  try {
    const { batch_no, pair_code, weight_kg, seq_no, recipe } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('batch_no', sql.NVarChar, batch_no)
      .input('pair_code', sql.NVarChar, pair_code)
      .input('weight_kg', sql.Decimal(10,2), weight_kg)
      .input('seq_no', sql.Int, seq_no || 1)
      .input('recipe', sql.NVarChar, recipe || null)
      .query('INSERT INTO pair_codes (batch_no,pair_code,weight_kg,seq_no,recipe) VALUES (@batch_no,@pair_code,@weight_kg,@seq_no,@recipe)');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/pair-codes/:id', async (req, res) => {
  try {
    const { batch_no, pair_code, weight_kg, seq_no, recipe } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('batch_no', sql.NVarChar, batch_no)
      .input('pair_code', sql.NVarChar, pair_code)
      .input('weight_kg', sql.Decimal(10,2), weight_kg)
      .input('seq_no', sql.Int, seq_no || 1)
      .input('recipe', sql.NVarChar, recipe || null)
      .query('UPDATE pair_codes SET batch_no=@batch_no,pair_code=@pair_code,weight_kg=@weight_kg,seq_no=@seq_no,recipe=@recipe WHERE id=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/pair-codes/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, req.params.id)
      .query('DELETE FROM pair_codes WHERE id=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Machines
app.get('/api/machines', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM machines ORDER BY machine_name');
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/machines', async (req, res) => {
  try {
    const { machine_name, capacity_kg } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('machine_name', sql.NVarChar, machine_name)
      .input('capacity_kg', sql.Decimal(10,2), capacity_kg)
      .query('INSERT INTO machines (machine_name,capacity_kg) VALUES (@machine_name,@capacity_kg)');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/machines/:id', async (req, res) => {
  try {
    const { machine_name, capacity_kg } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('machine_name', sql.NVarChar, machine_name)
      .input('capacity_kg', sql.Decimal(10,2), capacity_kg)
      .query('UPDATE machines SET machine_name=@machine_name,capacity_kg=@capacity_kg WHERE id=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/machines/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, req.params.id)
      .query('DELETE FROM machines WHERE id=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Recipes
app.get('/api/recipes', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM recipes ORDER BY recipe_name');
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/recipes', async (req, res) => {
  try {
    const { recipe_name, cycle_time_hours } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('recipe_name', sql.NVarChar, recipe_name)
      .input('cycle_time_hours', sql.Decimal(10,2), cycle_time_hours)
      .query('INSERT INTO recipes (recipe_name,cycle_time_hours) VALUES (@recipe_name,@cycle_time_hours)');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/recipes/:id', async (req, res) => {
  try {
    const { recipe_name, cycle_time_hours } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('recipe_name', sql.NVarChar, recipe_name)
      .input('cycle_time_hours', sql.Decimal(10,2), cycle_time_hours)
      .query('UPDATE recipes SET recipe_name=@recipe_name,cycle_time_hours=@cycle_time_hours WHERE id=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/recipes/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, req.params.id)
      .query('DELETE FROM recipes WHERE id=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Dryers
app.get('/api/dryers', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM dryers ORDER BY dryer_name');
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/dryers', async (req, res) => {
  try {
    const { dryer_name, capacity_kg, drying_duration_min } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('dryer_name', sql.NVarChar, dryer_name)
      .input('capacity_kg', sql.Decimal(10,2), capacity_kg)
      .input('drying_duration_min', sql.Decimal(10,2), drying_duration_min)
      .query('INSERT INTO dryers (dryer_name,capacity_kg,drying_duration_min) VALUES (@dryer_name,@capacity_kg,@drying_duration_min)');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/dryers/:id', async (req, res) => {
  try {
    const { dryer_name, capacity_kg, drying_duration_min } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('dryer_name', sql.NVarChar, dryer_name)
      .input('capacity_kg', sql.Decimal(10,2), capacity_kg)
      .input('drying_duration_min', sql.Decimal(10,2), drying_duration_min)
      .query('UPDATE dryers SET dryer_name=@dryer_name,capacity_kg=@capacity_kg,drying_duration_min=@drying_duration_min WHERE id=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/dryers/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, req.params.id)
      .query('DELETE FROM dryers WHERE id=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Hydro
app.get('/api/hydro', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM hydro ORDER BY hydro_name');
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hydro', async (req, res) => {
  try {
    const { hydro_name, capacity_kg, cycle_time_min } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('hydro_name', sql.NVarChar, hydro_name)
      .input('capacity_kg', sql.Decimal(10,2), capacity_kg)
      .input('cycle_time_min', sql.Decimal(10,2), cycle_time_min)
      .query('INSERT INTO hydro (hydro_name,capacity_kg,cycle_time_min) VALUES (@hydro_name,@capacity_kg,@cycle_time_min)');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/hydro/:id', async (req, res) => {
  try {
    const { hydro_name, capacity_kg, cycle_time_min } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('hydro_name', sql.NVarChar, hydro_name)
      .input('capacity_kg', sql.Decimal(10,2), capacity_kg)
      .input('cycle_time_min', sql.Decimal(10,2), cycle_time_min)
      .query('UPDATE hydro SET hydro_name=@hydro_name,capacity_kg=@capacity_kg,cycle_time_min=@cycle_time_min WHERE id=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/hydro/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, req.params.id)
      .query('DELETE FROM hydro WHERE id=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── BATCH FORM ────────────────────────────────────────────────────────────────

// Load batch details + pair codes for the form
app.get('/api/batch-form/:batchNo', async (req, res) => {
  try {
    const pool = await getPool();
    const batchNo = req.params.batchNo;

    const batchRes = await pool.request()
      .input('bno', sql.NVarChar, batchNo)
      .query('SELECT * FROM batches WHERE batch_no=@bno');

    if (!batchRes.recordset.length) return res.status(404).json({ error: 'Batch not found' });

    const pairRes = await pool.request()
      .input('bno', sql.NVarChar, batchNo)
      .query('SELECT * FROM pair_codes WHERE batch_no=@bno ORDER BY seq_no');

    // Check which pair codes already submitted in log
    const logRes = await pool.request()
      .input('bno', sql.NVarChar, batchNo)
      .query('SELECT pair_codes_str, club_group, machine, machine_cap, recipe, recipe_ct_hrs, dryer, dryer_cap, drying_dur_min, hydro_name, hydro_cap, hydro_ct_min, cycles, produced_min FROM processing_log WHERE batch_no=@bno');

    res.json({
      batch: batchRes.recordset[0],
      pairCodes: pairRes.recordset,
      existingLog: logRes.recordset,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Submit batch processing assignments
app.post('/api/batch-form/submit', async (req, res) => {
  try {
    const { batch, assignments } = req.body;
    // assignments: array of club-level objects
    const pool = await getPool();
    const today = new Date().toISOString().split('T')[0];

    for (const a of assignments) {
      // Dryer SAM = drying_dur / dryer_cap
      const dryerSam = a.dryer_cap > 0 ? a.drying_dur_min / a.dryer_cap : 0;
      // Machine SAM = (recipe_ct_hrs * 60) / machine_cap
      const machineSam = a.machine_cap > 0 ? (a.recipe_ct_hrs * 60) / a.machine_cap : 0;
      // Hydro SAM = hydro_ct / hydro_cap
      const hydroSam = (a.hydro_cap > 0 && a.hydro_ct_min > 0) ? a.hydro_ct_min / a.hydro_cap : 0;
      const totalSam = machineSam + dryerSam + hydroSam;
      const producedMin = totalSam * a.pair_code_weight * a.cycles;

      await pool.request()
        .input('log_date', sql.Date, today)
        .input('batch_no', sql.NVarChar, batch.batch_no)
        .input('order_no', sql.NVarChar, batch.order_no || '')
        .input('issue_doc', sql.NVarChar, batch.issue_doc || '')
        .input('receive_doc', sql.NVarChar, batch.receive_doc || '')
        .input('batch_weight', sql.Decimal(10,2), batch.weight_kg || 0)
        .input('dzns', sql.Int, batch.dzns || 0)
        .input('pcs', sql.Int, batch.pcs || 0)
        .input('cost_code', sql.NVarChar, batch.cost_code || '')
        .input('pair_codes_str', sql.NVarChar, a.pair_codes_str)
        .input('pair_code_weight', sql.Decimal(10,2), a.pair_code_weight)
        .input('club_group', sql.NVarChar, a.club_group || '')
        .input('machine', sql.NVarChar, a.machine || '')
        .input('machine_cap', sql.Decimal(10,2), a.machine_cap || 0)
        .input('recipe', sql.NVarChar, a.recipe || '')
        .input('recipe_ct_hrs', sql.Decimal(10,2), a.recipe_ct_hrs || 0)
        .input('dryer', sql.NVarChar, a.dryer || '')
        .input('dryer_cap', sql.Decimal(10,2), a.dryer_cap || 0)
        .input('drying_dur_min', sql.Decimal(10,2), a.drying_dur_min || 0)
        .input('hydro_name', sql.NVarChar, a.hydro_name || '')
        .input('hydro_cap', sql.Decimal(10,2), a.hydro_cap || 0)
        .input('hydro_ct_min', sql.Decimal(10,2), a.hydro_ct_min || 0)
        .input('dryer_sam', sql.Decimal(10,6), dryerSam)
        .input('machine_sam', sql.Decimal(10,6), machineSam)
        .input('hydro_sam', sql.Decimal(10,6), hydroSam)
        .input('total_sam', sql.Decimal(10,6), totalSam)
        .input('cycles', sql.Int, a.cycles || 1)
        .input('produced_min', sql.Decimal(10,2), producedMin)
        .query(`INSERT INTO processing_log
          (log_date,batch_no,order_no,issue_doc,receive_doc,batch_weight,dzns,pcs,cost_code,
           pair_codes_str,pair_code_weight,club_group,machine,machine_cap,recipe,recipe_ct_hrs,
           dryer,dryer_cap,drying_dur_min,hydro_name,hydro_cap,hydro_ct_min,
           dryer_sam,machine_sam,hydro_sam,total_sam,cycles,produced_min)
          VALUES
          (@log_date,@batch_no,@order_no,@issue_doc,@receive_doc,@batch_weight,@dzns,@pcs,@cost_code,
           @pair_codes_str,@pair_code_weight,@club_group,@machine,@machine_cap,@recipe,@recipe_ct_hrs,
           @dryer,@dryer_cap,@drying_dur_min,@hydro_name,@hydro_cap,@hydro_ct_min,
           @dryer_sam,@machine_sam,@hydro_sam,@total_sam,@cycles,@produced_min)`);
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PROCESSING LOG ────────────────────────────────────────────────────────────

app.get('/api/processing-log', async (req, res) => {
  try {
    const pool = await getPool();
    const { from_date, to_date, batch_no } = req.query;
    let q = 'SELECT * FROM processing_log WHERE 1=1';
    if (from_date) q += ` AND log_date >= '${from_date}'`;
    if (to_date)   q += ` AND log_date <= '${to_date}'`;
    if (batch_no)  q += ` AND batch_no = '${batch_no}'`;
    q += ' ORDER BY created_at DESC';
    const result = await pool.request().query(q);
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/processing-log/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, req.params.id)
      .query('DELETE FROM processing_log WHERE id=@id');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── REPORTS ───────────────────────────────────────────────────────────────────

// Summary: batch-level totals
app.get('/api/reports/summary', async (req, res) => {
  try {
    const pool = await getPool();
    const { from_date, to_date } = req.query;
    let dateWhere = '1=1';
    if (from_date) dateWhere += ` AND log_date >= '${from_date}'`;
    if (to_date)   dateWhere += ` AND log_date <= '${to_date}'`;

    // STRING_AGG does not support DISTINCT in T-SQL — use subqueries for distinct machine/dryer lists
    const q = `
      SELECT
        pl.log_date, pl.batch_no, pl.order_no, pl.issue_doc, pl.receive_doc,
        MAX(pl.batch_weight)   AS batch_weight,
        MAX(pl.dzns)           AS dzns,
        MAX(pl.pcs)            AS pcs,
        MAX(pl.cost_code)      AS cost_code,
        (SELECT STRING_AGG(m.machine, ', ')
           FROM (SELECT DISTINCT machine FROM processing_log x
                 WHERE x.batch_no=pl.batch_no AND x.log_date=pl.log_date
                   AND x.machine IS NOT NULL AND x.machine <> '') m
        ) AS machines,
        (SELECT STRING_AGG(d.dryer, ', ')
           FROM (SELECT DISTINCT dryer FROM processing_log x
                 WHERE x.batch_no=pl.batch_no AND x.log_date=pl.log_date
                   AND x.dryer IS NOT NULL AND x.dryer <> '') d
        ) AS dryers,
        SUM(pl.cycles)         AS total_cycles,
        SUM(pl.produced_min)   AS total_produced_min
      FROM processing_log pl
      WHERE ${dateWhere}
      GROUP BY pl.log_date, pl.batch_no, pl.order_no, pl.issue_doc, pl.receive_doc
      ORDER BY pl.log_date DESC, pl.batch_no
    `;
    const result = await pool.request().query(q);
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Detail: pair-code level for one batch
app.get('/api/reports/detail/:batchNo', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('bno', sql.NVarChar, req.params.batchNo)
      .query('SELECT * FROM processing_log WHERE batch_no=@bno ORDER BY id');
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── QUEUES ────────────────────────────────────────────────────────────────────

// Machine queue — live view from batch_process
app.get('/api/queues/machines', async (req, res) => {
  try {
    const pool = await getPool();
    const machinesRes = await pool.request().query('SELECT * FROM machines ORDER BY machine_name');
    const activeRes   = await pool.request().query(`
      SELECT id, machine, batch_no, pair_codes_str, pair_code_weight, recipe, status, process_start, created_at
      FROM batch_process
      WHERE status IN ('PROCESSING','QUEUED')
      ORDER BY machine, CASE status WHEN 'PROCESSING' THEN 0 ELSE 1 END, created_at ASC
    `);

    const machineMap = {};
    for (const row of activeRes.recordset) {
      if (!machineMap[row.machine]) machineMap[row.machine] = { running: null, queue: [] };
      if (row.status === 'PROCESSING') machineMap[row.machine].running = row;
      else machineMap[row.machine].queue.push(row);
    }

    const result = machinesRes.recordset.map(m => ({
      ...m,
      status:  machineMap[m.machine_name]?.running ? 'RUNNING' : 'IDLE',
      running: machineMap[m.machine_name]?.running  || null,
      queue:   machineMap[m.machine_name]?.queue    || [],
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Dryer/hydro queue — live view from batch_process
app.get('/api/queues/dryers', async (req, res) => {
  try {
    const pool = await getPool();
    const dryersRes = await pool.request().query('SELECT * FROM dryers ORDER BY dryer_name');
    const hydroRes  = await pool.request().query('SELECT * FROM hydro ORDER BY hydro_name');

    const dryerActiveRes = await pool.request().query(`
      SELECT id, dryer AS name, batch_no, pair_codes_str, pair_code_weight, status, dryer_start, created_at
      FROM batch_process WHERE status IN ('DRYING','DRYER_QUEUED')
      ORDER BY dryer, CASE status WHEN 'DRYING' THEN 0 ELSE 1 END, created_at ASC
    `);
    const hydroActiveRes = await pool.request().query(`
      SELECT id, hydro_name AS name, batch_no, pair_codes_str, pair_code_weight, status, hydro_start, created_at
      FROM batch_process WHERE status IN ('HYDRO_RUNNING','HYDRO_QUEUED')
      ORDER BY hydro_name, CASE status WHEN 'HYDRO_RUNNING' THEN 0 ELSE 1 END, created_at ASC
    `);

    const dryerMap = {};
    for (const row of dryerActiveRes.recordset) {
      if (!dryerMap[row.name]) dryerMap[row.name] = { running: null, queue: [] };
      if (row.status === 'DRYING') dryerMap[row.name].running = row;
      else dryerMap[row.name].queue.push(row);
    }
    const hydroMap = {};
    for (const row of hydroActiveRes.recordset) {
      if (!hydroMap[row.name]) hydroMap[row.name] = { running: null, queue: [] };
      if (row.status === 'HYDRO_RUNNING') hydroMap[row.name].running = row;
      else hydroMap[row.name].queue.push(row);
    }

    const dryers = dryersRes.recordset.map(d => ({
      name: d.dryer_name, type: 'Dryer', capacity_kg: d.capacity_kg, duration_min: d.drying_duration_min,
      status:  dryerMap[d.dryer_name]?.running ? 'RUNNING' : 'IDLE',
      running: dryerMap[d.dryer_name]?.running || null,
      queue:   dryerMap[d.dryer_name]?.queue   || [],
    }));
    const hydros = hydroRes.recordset.map(h => ({
      name: h.hydro_name, type: 'Hydro', capacity_kg: h.capacity_kg, duration_min: h.cycle_time_min,
      status:  hydroMap[h.hydro_name]?.running ? 'RUNNING' : 'IDLE',
      running: hydroMap[h.hydro_name]?.running || null,
      queue:   hydroMap[h.hydro_name]?.queue   || [],
    }));

    res.json([...dryers, ...hydros]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
app.get('/api/dashboard', async (req, res) => {
  try {
    const pool = await getPool();
    const today = new Date().toISOString().split('T')[0];

    const [totalBatches, totalMachines, todayLog, totalProduced] = await Promise.all([
      pool.request().query('SELECT COUNT(*) AS cnt FROM batches'),
      pool.request().query('SELECT COUNT(*) AS cnt FROM machines'),
      pool.request().query(`SELECT COUNT(DISTINCT batch_no) AS cnt FROM processing_log WHERE log_date='${today}'`),
      pool.request().query(`SELECT ISNULL(SUM(produced_min),0) AS total FROM processing_log WHERE log_date='${today}'`),
    ]);

    const recentLog = await pool.request().query(
      `SELECT TOP 10 log_date, batch_no, order_no, pair_codes_str, machine, produced_min
       FROM processing_log ORDER BY created_at DESC`
    );

    res.json({
      totalBatches: totalBatches.recordset[0].cnt,
      totalMachines: totalMachines.recordset[0].cnt,
      batchesToday: todayLog.recordset[0].cnt,
      producedMinToday: totalProduced.recordset[0].total,
      recentLog: recentLog.recordset,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── AVAILABILITY ──────────────────────────────────────────────────────────────
// Returns which machines are PROCESSING, which dryers are DRYING,
// which hydros are HYDRO_RUNNING — so front-end and save routes can block them.
app.get('/api/availability', async (req, res) => {
  try {
    const pool = await getPool();

    const busyMachines = await pool.request().query(`
      SELECT machine, pair_codes_str, batch_no, machine_cap, SUM(pair_code_weight) AS loaded_weight
      FROM batch_process WHERE status='PROCESSING'
      GROUP BY machine, pair_codes_str, batch_no, machine_cap
    `);
    const queuedMachines = await pool.request().query(`
      SELECT machine, COUNT(*) AS queue_count FROM batch_process WHERE status='QUEUED' GROUP BY machine
    `);
    const busyDryers = await pool.request().query(`
      SELECT dryer, pair_codes_str, batch_no, dryer_cap, SUM(pair_code_weight) AS loaded_weight
      FROM batch_process WHERE status='DRYING'
      GROUP BY dryer, pair_codes_str, batch_no, dryer_cap
    `);
    const queuedDryers = await pool.request().query(`
      SELECT dryer, COUNT(*) AS queue_count FROM batch_process WHERE status='DRYER_QUEUED' GROUP BY dryer
    `);
    const busyHydros = await pool.request().query(`
      SELECT hydro_name, pair_codes_str, batch_no, hydro_cap, SUM(pair_code_weight) AS loaded_weight
      FROM batch_process WHERE status='HYDRO_RUNNING'
      GROUP BY hydro_name, pair_codes_str, batch_no, hydro_cap
    `);
    const queuedHydros = await pool.request().query(`
      SELECT hydro_name, COUNT(*) AS queue_count FROM batch_process WHERE status='HYDRO_QUEUED' GROUP BY hydro_name
    `);
    res.json({
      busyMachines:   busyMachines.recordset,
      queuedMachines: queuedMachines.recordset,
      busyDryers:     busyDryers.recordset,
      queuedDryers:   queuedDryers.recordset,
      busyHydros:     busyHydros.recordset,
      queuedHydros:   queuedHydros.recordset,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── BATCH FORM v2 ─────────────────────────────────────────────────────────────

// Load batch with current planned state
// Also finds inter-batch club records where batch_no contains this batch_no
app.get('/api/batch-form-v2/:batchNo', async (req, res) => {
  try {
    const pool    = await getPool();
    const batchNo = req.params.batchNo;

    const batchRes = await pool.request()
      .input('bno', sql.NVarChar, batchNo)
      .query('SELECT * FROM batches WHERE batch_no=@bno');
    if (!batchRes.recordset.length) return res.status(404).json({ error: 'Batch not found' });

    const pairRes = await pool.request()
      .input('bno', sql.NVarChar, batchNo)
      .query(`SELECT pc.*, r.cycle_time_hours AS recipe_ct_hrs
              FROM pair_codes pc
              LEFT JOIN recipes r ON r.recipe_name = pc.recipe
              WHERE pc.batch_no=@bno ORDER BY pc.seq_no`);

    // Find plans for this batch — including inter-batch club records (batch_no may be '82487+82488')
    const planRes = await pool.request()
      .input('bno',  sql.NVarChar, batchNo)
      .input('bno1', sql.NVarChar, batchNo + '+%')
      .input('bno2', sql.NVarChar, '%+' + batchNo)
      .input('bno3', sql.NVarChar, '%+' + batchNo + '+%')
      .query(`SELECT * FROM batch_process
              WHERE batch_no=@bno OR batch_no LIKE @bno1
                 OR batch_no LIKE @bno2 OR batch_no LIKE @bno3
              ORDER BY id`);

    res.json({
      batch:     batchRes.recordset[0],
      pairCodes: pairRes.recordset,
      plans:     planRes.recordset,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Save batch assignments from batch form
// Supports inter-batch clubbing: assignments carry their own batch_no (may be '82487+82488')
// loadedBatchNos: all batch numbers currently open in the form
app.post('/api/batch-form-v2/save', async (req, res) => {
  try {
    const { loadedBatchNos, assignments } = req.body;
    // assignments: [{ batch_no, order_no, pair_codes, pair_code_weight, machine, machine_cap, recipe, recipe_ct_hrs }]
    const pool = await getPool();

    // Build LIKE patterns to find ALL batch_process records belonging to any loaded batch
    // (handles combined batch_no like '82487+82488')
    const buildBatchCondition = (alias) => {
      return loadedBatchNos.map((_, i) =>
        `${alias} = @bno${i} OR ${alias} LIKE @bno${i}a OR ${alias} LIKE @bno${i}b OR ${alias} LIKE @bno${i}c`
      ).join(' OR ');
    };
    const addBatchInputs = (req2) => {
      loadedBatchNos.forEach((bn, i) => {
        req2.input(`bno${i}`,  sql.NVarChar, bn);
        req2.input(`bno${i}a`, sql.NVarChar, bn + '+%');
        req2.input(`bno${i}b`, sql.NVarChar, '%+' + bn);
        req2.input(`bno${i}c`, sql.NVarChar, '%+' + bn + '+%');
      });
      return req2;
    };

    // Find existing PLANNED entries for all loaded batches
    const existingReq = pool.request();
    addBatchInputs(existingReq);
    const existingRes = await existingReq.query(
      `SELECT * FROM batch_process WHERE (${buildBatchCondition('batch_no')}) AND status='PLANNED'`
    );
    const existing = existingRes.recordset;

    // Delete PLANNED entries whose pair codes are no longer in any incoming assignment
    const incomingPcSets = assignments.map(a => a.pair_codes.slice().sort().join('+'));
    for (const ex of existing) {
      const exKey = ex.pair_codes_str.split('+').sort().join('+');
      if (!incomingPcSets.includes(exKey)) {
        await pool.request().input('id', sql.Int, ex.id)
          .query('DELETE FROM batch_process WHERE id=@id');
      }
    }

    // Determine next available club ID across all loaded batches
    const allClubsReq = pool.request();
    addBatchInputs(allClubsReq);
    const allClubsRes = await allClubsReq.query(
      `SELECT club_group FROM batch_process WHERE (${buildBatchCondition('batch_no')}) AND club_group IS NOT NULL AND club_group != ''`
    );
    const usedNums = allClubsRes.recordset
      .map(r => parseInt((r.club_group || '').replace('C', '')))
      .filter(n => !isNaN(n));
    let nextClubNum = usedNums.length ? Math.max(...usedNums) + 1 : 1;

    // Collect pair codes already in a non-PLANNED state across all loaded batches — never touch these
    const activeReq = pool.request();
    addBatchInputs(activeReq);
    const activeRes = await activeReq.query(
      `SELECT pair_codes_str FROM batch_process WHERE (${buildBatchCondition('batch_no')}) AND status <> 'PLANNED'`
    );
    const lockedPcs = new Set();
    activeRes.recordset.forEach(r =>
      r.pair_codes_str.split('+').forEach(pc => lockedPcs.add(pc.trim()))
    );

    // Get currently busy machines (PROCESSING)
    const busyMachineRes = await pool.request().query(`
      SELECT machine, batch_no, pair_codes_str,
             SUM(pair_code_weight) AS loaded_weight, MAX(machine_cap) AS machine_cap
      FROM batch_process WHERE status = 'PROCESSING'
      GROUP BY machine, batch_no, pair_codes_str
    `);
    const busyMachineMap = {};
    for (const r of busyMachineRes.recordset) {
      busyMachineMap[r.machine] = r;
    }

    for (const a of assignments) {
      // Skip any assignment containing a pair code already active/completed
      const hasLockedPc = a.pair_codes.some(pc => lockedPcs.has(pc));
      if (hasLockedPc) continue;

      // Capacity check (still enforced even when queuing)
      if (a.machine_cap > 0 && a.pair_code_weight > a.machine_cap) {
        return res.status(400).json({
          error: `Total weight ${a.pair_code_weight}kg of pair codes [${a.pair_codes.join(', ')}] exceeds machine ${a.machine} capacity of ${a.machine_cap}kg.`
        });
      }

      // If machine is busy → save as QUEUED instead of blocking
      const isMachineBusy = !!busyMachineMap[a.machine];

      const pcsStr  = a.pair_codes.join('+');
      const totalWt = a.pair_code_weight;
      const macSam  = a.machine_cap > 0 ? (a.recipe_ct_hrs * 60) / a.machine_cap : 0;
      // assignment's batch_no may be a combined string like '82487+82488'
      const aBatchNo = a.batch_no;

      // Check if this exact pair-code group already exists as PLANNED
      const exEntry = existing.find(ex => {
        const exKey = ex.pair_codes_str.split('+').sort().join('+');
        const inKey = a.pair_codes.slice().sort().join('+');
        return exKey === inKey;
      });

      // Status: QUEUED if machine is busy, otherwise PLANNED
      const newStatus = isMachineBusy ? 'QUEUED' : 'PLANNED';

      if (exEntry) {
        await pool.request()
          .input('id',         sql.Int,          exEntry.id)
          .input('batch_no',   sql.NVarChar,     aBatchNo)
          .input('machine',    sql.NVarChar,     a.machine)
          .input('machine_cap',sql.Decimal(10,2),a.machine_cap)
          .input('recipe',     sql.NVarChar,     a.recipe)
          .input('recipe_ct',  sql.Decimal(10,2),a.recipe_ct_hrs)
          .input('mach_sam',   sql.Decimal(10,6),macSam)
          .input('status',     sql.NVarChar,     newStatus)
          .query(`UPDATE batch_process SET batch_no=@batch_no, machine=@machine,
                  machine_cap=@machine_cap, recipe=@recipe, recipe_ct_hrs=@recipe_ct,
                  machine_sam=@mach_sam, status=@status WHERE id=@id AND status IN ('PLANNED','QUEUED')`);
      } else {
        let clubGroup = '';
        if (a.pair_codes.length > 1 || aBatchNo.includes('+')) {
          clubGroup = 'C' + nextClubNum++;
        }
        await pool.request()
          .input('batch_no',         sql.NVarChar,    aBatchNo)
          .input('order_no',         sql.NVarChar,    a.order_no || '')
          .input('pair_codes_str',   sql.NVarChar,    pcsStr)
          .input('pair_code_weight', sql.Decimal(10,2), totalWt)
          .input('club_group',       sql.NVarChar,    clubGroup)
          .input('machine',          sql.NVarChar,    a.machine)
          .input('machine_cap',      sql.Decimal(10,2), a.machine_cap)
          .input('recipe',           sql.NVarChar,    a.recipe)
          .input('recipe_ct_hrs',    sql.Decimal(10,2), a.recipe_ct_hrs)
          .input('machine_sam',      sql.Decimal(10,6), macSam)
          .input('status',           sql.NVarChar,    newStatus)
          .query(`INSERT INTO batch_process
            (batch_no,order_no,pair_codes_str,pair_code_weight,club_group,machine,machine_cap,recipe,recipe_ct_hrs,machine_sam,status)
            VALUES (@batch_no,@order_no,@pair_codes_str,@pair_code_weight,@club_group,@machine,@machine_cap,@recipe,@recipe_ct_hrs,@machine_sam,@status)`);
      }
    }

    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── BATCH PROCESS TRACKING ────────────────────────────────────────────────────

// Get all active assignments (optionally filtered)
app.get('/api/batch-process', async (req, res) => {
  try {
    const pool   = await getPool();
    const { batch_no, status } = req.query;
    const req2 = pool.request();
    let q = 'SELECT * FROM batch_process WHERE 1=1';
    if (batch_no) {
      // Match exact, or any combined batch_no containing this batch
      req2.input('bno',  sql.NVarChar, batch_no);
      req2.input('bno1', sql.NVarChar, batch_no + '+%');
      req2.input('bno2', sql.NVarChar, '%+' + batch_no);
      req2.input('bno3', sql.NVarChar, '%+' + batch_no + '+%');
      q += ' AND (batch_no=@bno OR batch_no LIKE @bno1 OR batch_no LIKE @bno2 OR batch_no LIKE @bno3)';
    }
    if (status) {
      req2.input('status', sql.NVarChar, status);
      q += ' AND status=@status';
    }
    q += ' ORDER BY created_at DESC';
    const result = await req2.query(q);
    res.json(result.recordset);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Start processing
app.put('/api/batch-process/:id/start-processing', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, req.params.id)
      .query(`UPDATE batch_process SET status='PROCESSING', process_start=GETDATE() WHERE id=@id AND status='PLANNED'`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Complete processing → auto-promote next QUEUED item for same machine
app.put('/api/batch-process/:id/complete-processing', async (req, res) => {
  try {
    const pool = await getPool();
    const rec = await pool.request().input('id', sql.Int, req.params.id)
      .query(`UPDATE batch_process SET status='PROCESSED', process_end=GETDATE()
              OUTPUT INSERTED.machine
              WHERE id=@id AND status='PROCESSING'`);
    const machine = rec.recordset[0]?.machine;
    if (machine) {
      // Promote the oldest QUEUED item for this machine
      await pool.request().input('machine', sql.NVarChar, machine).query(`
        UPDATE batch_process SET status='PROCESSING', process_start=GETDATE()
        WHERE id = (
          SELECT TOP 1 id FROM batch_process
          WHERE machine=@machine AND status='QUEUED'
          ORDER BY created_at ASC
        )
      `);
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Assign dryer (after processing complete)
app.put('/api/batch-process/:id/assign-dryer', async (req, res) => {
  try {
    const { dryer, dryer_cap, drying_dur_min } = req.body;
    const pool = await getPool();

    // Get the record being assigned
    const recRes = await pool.request().input('id', sql.Int, req.params.id)
      .query('SELECT * FROM batch_process WHERE id=@id');
    if (!recRes.recordset.length) return res.status(404).json({ error: 'Record not found' });
    const rec = recRes.recordset[0];

    // Capacity check
    if (dryer_cap > 0 && rec.pair_code_weight > dryer_cap) {
      return res.status(400).json({
        error: `Weight ${rec.pair_code_weight}kg of [${rec.pair_codes_str}] exceeds dryer ${dryer} capacity of ${dryer_cap}kg.`
      });
    }

    // Check if dryer is busy → queue if so
    const busyRes = await pool.request()
      .input('dryer', sql.NVarChar, dryer)
      .query("SELECT id FROM batch_process WHERE dryer=@dryer AND status='DRYING'");
    const isDryerBusy = busyRes.recordset.length > 0;
    const dryer_sam   = dryer_cap > 0 ? drying_dur_min / dryer_cap : 0;
    const dryerStatus = isDryerBusy ? 'DRYER_QUEUED' : 'PROCESSED'; // stays PROCESSED when free; start-drying will kick off

    await pool.request()
      .input('id',             sql.Int,           req.params.id)
      .input('dryer',          sql.NVarChar,      dryer)
      .input('dryer_cap',      sql.Decimal(10,2), dryer_cap)
      .input('drying_dur_min', sql.Decimal(10,2), drying_dur_min)
      .input('dryer_sam',      sql.Decimal(10,6), dryer_sam)
      .input('status',         sql.NVarChar,      dryerStatus)
      .query(`UPDATE batch_process SET dryer=@dryer, dryer_cap=@dryer_cap,
              drying_dur_min=@drying_dur_min, dryer_sam=@dryer_sam, status=@status
              WHERE id=@id AND status='PROCESSED'`);
    res.json({ success: true, queued: isDryerBusy });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Start drying
app.put('/api/batch-process/:id/start-drying', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, req.params.id)
      .query(`UPDATE batch_process SET status='DRYING', dryer_start=GETDATE()
              WHERE id=@id AND status='PROCESSED' AND dryer IS NOT NULL`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Complete drying → auto-promote next DRYER_QUEUED for same dryer
app.put('/api/batch-process/:id/complete-drying', async (req, res) => {
  try {
    const pool = await getPool();
    const rec = await pool.request().input('id', sql.Int, req.params.id)
      .query('SELECT * FROM batch_process WHERE id=@id');
    if (!rec.recordset.length) return res.status(404).json({ error: 'Not found' });
    const r        = rec.recordset[0];
    const totalSam = parseFloat(r.machine_sam||0) + parseFloat(r.dryer_sam||0);
    await pool.request()
      .input('id',       sql.Int,          req.params.id)
      .input('totalSam', sql.Decimal(10,6), totalSam)
      .query(`UPDATE batch_process SET status='DRIED', dryer_end=GETDATE(), total_sam=@totalSam WHERE id=@id AND status='DRYING'`);
    // Promote next DRYER_QUEUED for the same dryer
    if (r.dryer) {
      await pool.request().input('dryer', sql.NVarChar, r.dryer).query(`
        UPDATE batch_process SET status='DRYING', dryer_start=GETDATE()
        WHERE id = (
          SELECT TOP 1 id FROM batch_process
          WHERE dryer=@dryer AND status='DRYER_QUEUED'
          ORDER BY created_at ASC
        )
      `);
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Mark complete (no hydro — finalise produced min after drying)
app.put('/api/batch-process/:id/mark-complete', async (req, res) => {
  try {
    const pool = await getPool();
    const rec  = await pool.request().input('id', sql.Int, req.params.id)
      .query('SELECT * FROM batch_process WHERE id=@id');
    if (!rec.recordset.length) return res.status(404).json({ error: 'Not found' });
    const r         = rec.recordset[0];
    const totalSam  = parseFloat(r.machine_sam||0) + parseFloat(r.dryer_sam||0);
    const produced  = totalSam * parseFloat(r.pair_code_weight||0);

    await pool.request()
      .input('id',        sql.Int,          req.params.id)
      .input('totalSam',  sql.Decimal(10,6), totalSam)
      .input('produced',  sql.Decimal(10,2), produced)
      .query(`UPDATE batch_process SET status='COMPLETED', total_sam=@totalSam, produced_min=@produced
              WHERE id=@id AND status='DRIED'`);

    // Write to processing_log
    const today = new Date().toISOString().split('T')[0];
    const batchRes = await pool.request().input('bno', sql.NVarChar, r.batch_no)
      .query('SELECT * FROM batches WHERE batch_no=@bno');
    const batch = batchRes.recordset[0] || {};
    await pool.request()
      .input('log_date',        sql.Date,         today)
      .input('batch_no',        sql.NVarChar,     r.batch_no)
      .input('order_no',        sql.NVarChar,     r.order_no||batch.order_no||'')
      .input('issue_doc',       sql.NVarChar,     batch.issue_doc||'')
      .input('receive_doc',     sql.NVarChar,     batch.receive_doc||'')
      .input('batch_weight',    sql.Decimal(10,2), batch.weight_kg||0)
      .input('dzns',            sql.Int,           batch.dzns||0)
      .input('pcs',             sql.Int,           batch.pcs||0)
      .input('cost_code',       sql.NVarChar,     batch.cost_code||'')
      .input('pair_codes_str',  sql.NVarChar,     r.pair_codes_str)
      .input('pair_code_weight',sql.Decimal(10,2), r.pair_code_weight)
      .input('club_group',      sql.NVarChar,     r.club_group||'')
      .input('machine',         sql.NVarChar,     r.machine||'')
      .input('machine_cap',     sql.Decimal(10,2), r.machine_cap||0)
      .input('recipe',          sql.NVarChar,     r.recipe||'')
      .input('recipe_ct_hrs',   sql.Decimal(10,2), r.recipe_ct_hrs||0)
      .input('dryer',           sql.NVarChar,     r.dryer||'')
      .input('dryer_cap',       sql.Decimal(10,2), r.dryer_cap||0)
      .input('drying_dur_min',  sql.Decimal(10,2), r.drying_dur_min||0)
      .input('hydro_name',      sql.NVarChar,     '')
      .input('hydro_cap',       sql.Decimal(10,2), 0)
      .input('hydro_ct_min',    sql.Decimal(10,2), 0)
      .input('dryer_sam',       sql.Decimal(10,6), r.dryer_sam||0)
      .input('machine_sam',     sql.Decimal(10,6), r.machine_sam||0)
      .input('hydro_sam',       sql.Decimal(10,6), 0)
      .input('total_sam',       sql.Decimal(10,6), totalSam)
      .input('cycles',          sql.Int,           1)
      .input('produced_min',    sql.Decimal(10,2), produced)
      .query(`INSERT INTO processing_log
        (log_date,batch_no,order_no,issue_doc,receive_doc,batch_weight,dzns,pcs,cost_code,
         pair_codes_str,pair_code_weight,club_group,machine,machine_cap,recipe,recipe_ct_hrs,
         dryer,dryer_cap,drying_dur_min,hydro_name,hydro_cap,hydro_ct_min,
         dryer_sam,machine_sam,hydro_sam,total_sam,cycles,produced_min)
        VALUES
        (@log_date,@batch_no,@order_no,@issue_doc,@receive_doc,@batch_weight,@dzns,@pcs,@cost_code,
         @pair_codes_str,@pair_code_weight,@club_group,@machine,@machine_cap,@recipe,@recipe_ct_hrs,
         @dryer,@dryer_cap,@drying_dur_min,@hydro_name,@hydro_cap,@hydro_ct_min,
         @dryer_sam,@machine_sam,@hydro_sam,@total_sam,@cycles,@produced_min)`);

    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Assign hydro (after drying complete)
app.put('/api/batch-process/:id/assign-hydro', async (req, res) => {
  try {
    const { hydro_name, hydro_cap, hydro_ct_min } = req.body;
    const pool = await getPool();

    // Get the record being assigned
    const recRes = await pool.request().input('id', sql.Int, req.params.id)
      .query('SELECT * FROM batch_process WHERE id=@id');
    if (!recRes.recordset.length) return res.status(404).json({ error: 'Record not found' });
    const rec = recRes.recordset[0];

    // Capacity check
    if (hydro_cap > 0 && rec.pair_code_weight > hydro_cap) {
      return res.status(400).json({
        error: `Weight ${rec.pair_code_weight}kg of [${rec.pair_codes_str}] exceeds hydro ${hydro_name} capacity of ${hydro_cap}kg.`
      });
    }

    // Check if hydro is busy → queue if so
    const busyRes = await pool.request()
      .input('hydro', sql.NVarChar, hydro_name)
      .query("SELECT id FROM batch_process WHERE hydro_name=@hydro AND status='HYDRO_RUNNING'");
    const isHydroBusy = busyRes.recordset.length > 0;
    const hydro_sam   = hydro_cap > 0 ? hydro_ct_min / hydro_cap : 0;
    const hydroStatus = isHydroBusy ? 'HYDRO_QUEUED' : 'DRIED'; // stays DRIED when free; start-hydro will kick off

    await pool.request()
      .input('id',           sql.Int,           req.params.id)
      .input('hydro_name',   sql.NVarChar,      hydro_name)
      .input('hydro_cap',    sql.Decimal(10,2), hydro_cap)
      .input('hydro_ct_min', sql.Decimal(10,2), hydro_ct_min)
      .input('hydro_sam',    sql.Decimal(10,6), hydro_sam)
      .input('status',       sql.NVarChar,      hydroStatus)
      .query(`UPDATE batch_process SET hydro_name=@hydro_name, hydro_cap=@hydro_cap,
              hydro_ct_min=@hydro_ct_min, hydro_sam=@hydro_sam, status=@status
              WHERE id=@id AND status='DRIED'`);
    res.json({ success: true, queued: isHydroBusy });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Start hydro
app.put('/api/batch-process/:id/start-hydro', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().input('id', sql.Int, req.params.id)
      .query(`UPDATE batch_process SET status='HYDRO_RUNNING', hydro_start=GETDATE()
              WHERE id=@id AND status='DRIED' AND hydro_name IS NOT NULL AND hydro_name != ''`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Complete hydro → finalise produced min
app.put('/api/batch-process/:id/complete-hydro', async (req, res) => {
  try {
    const pool = await getPool();
    const rec  = await pool.request().input('id', sql.Int, req.params.id)
      .query('SELECT * FROM batch_process WHERE id=@id');
    if (!rec.recordset.length) return res.status(404).json({ error: 'Not found' });
    const r        = rec.recordset[0];
    const totalSam = parseFloat(r.machine_sam||0) + parseFloat(r.dryer_sam||0) + parseFloat(r.hydro_sam||0);
    const produced = totalSam * parseFloat(r.pair_code_weight||0);

    await pool.request()
      .input('id',       sql.Int,          req.params.id)
      .input('totalSam', sql.Decimal(10,6), totalSam)
      .input('produced', sql.Decimal(10,2), produced)
      .query(`UPDATE batch_process SET status='COMPLETED', hydro_end=GETDATE(), total_sam=@totalSam, produced_min=@produced
              WHERE id=@id AND status='HYDRO_RUNNING'`);

    // Promote next HYDRO_QUEUED for same hydro
    if (r.hydro_name) {
      await pool.request().input('hydro', sql.NVarChar, r.hydro_name).query(`
        UPDATE batch_process SET status='HYDRO_RUNNING', hydro_start=GETDATE()
        WHERE id = (
          SELECT TOP 1 id FROM batch_process
          WHERE hydro_name=@hydro AND status='HYDRO_QUEUED'
          ORDER BY created_at ASC
        )
      `);
    }

    // Write to processing_log
    const today    = new Date().toISOString().split('T')[0];
    const batchRes = await pool.request().input('bno', sql.NVarChar, r.batch_no)
      .query('SELECT * FROM batches WHERE batch_no=@bno');
    const batch    = batchRes.recordset[0] || {};
    await pool.request()
      .input('log_date',        sql.Date,         today)
      .input('batch_no',        sql.NVarChar,     r.batch_no)
      .input('order_no',        sql.NVarChar,     r.order_no||batch.order_no||'')
      .input('issue_doc',       sql.NVarChar,     batch.issue_doc||'')
      .input('receive_doc',     sql.NVarChar,     batch.receive_doc||'')
      .input('batch_weight',    sql.Decimal(10,2), batch.weight_kg||0)
      .input('dzns',            sql.Int,           batch.dzns||0)
      .input('pcs',             sql.Int,           batch.pcs||0)
      .input('cost_code',       sql.NVarChar,     batch.cost_code||'')
      .input('pair_codes_str',  sql.NVarChar,     r.pair_codes_str)
      .input('pair_code_weight',sql.Decimal(10,2), r.pair_code_weight)
      .input('club_group',      sql.NVarChar,     r.club_group||'')
      .input('machine',         sql.NVarChar,     r.machine||'')
      .input('machine_cap',     sql.Decimal(10,2), r.machine_cap||0)
      .input('recipe',          sql.NVarChar,     r.recipe||'')
      .input('recipe_ct_hrs',   sql.Decimal(10,2), r.recipe_ct_hrs||0)
      .input('dryer',           sql.NVarChar,     r.dryer||'')
      .input('dryer_cap',       sql.Decimal(10,2), r.dryer_cap||0)
      .input('drying_dur_min',  sql.Decimal(10,2), r.drying_dur_min||0)
      .input('hydro_name',      sql.NVarChar,     r.hydro_name||'')
      .input('hydro_cap',       sql.Decimal(10,2), r.hydro_cap||0)
      .input('hydro_ct_min',    sql.Decimal(10,2), r.hydro_ct_min||0)
      .input('dryer_sam',       sql.Decimal(10,6), r.dryer_sam||0)
      .input('machine_sam',     sql.Decimal(10,6), r.machine_sam||0)
      .input('hydro_sam',       sql.Decimal(10,6), r.hydro_sam||0)
      .input('total_sam',       sql.Decimal(10,6), totalSam)
      .input('cycles',          sql.Int,           1)
      .input('produced_min',    sql.Decimal(10,2), produced)
      .query(`INSERT INTO processing_log
        (log_date,batch_no,order_no,issue_doc,receive_doc,batch_weight,dzns,pcs,cost_code,
         pair_codes_str,pair_code_weight,club_group,machine,machine_cap,recipe,recipe_ct_hrs,
         dryer,dryer_cap,drying_dur_min,hydro_name,hydro_cap,hydro_ct_min,
         dryer_sam,machine_sam,hydro_sam,total_sam,cycles,produced_min)
        VALUES
        (@log_date,@batch_no,@order_no,@issue_doc,@receive_doc,@batch_weight,@dzns,@pcs,@cost_code,
         @pair_codes_str,@pair_code_weight,@club_group,@machine,@machine_cap,@recipe,@recipe_ct_hrs,
         @dryer,@dryer_cap,@drying_dur_min,@hydro_name,@hydro_cap,@hydro_ct_min,
         @dryer_sam,@machine_sam,@hydro_sam,@total_sam,@cycles,@produced_min)`);

    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── START ─────────────────────────────────────────────────────────────────────
async function runMigrations() {
  try {
    const pool = await getPool();
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='pair_codes' AND COLUMN_NAME='recipe')
      ALTER TABLE pair_codes ADD recipe NVARCHAR(100)
    `);
    // Assign default recipe to existing pair codes that have no recipe set
    await pool.request().query(`
      UPDATE pair_codes SET recipe='EWSH-6106' WHERE recipe IS NULL OR recipe=''
    `);
  } catch (e) { console.warn('Migration warning:', e.message); }
}

const PORT = 5000;
app.listen(PORT, async () => {
  await runMigrations();
  console.log(`Server running on http://localhost:${PORT}`);
});
