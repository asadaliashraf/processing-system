const sql = require('mssql');

const baseConfig = {
  server: 'DESKTOP-KKB5HLJ\\SQLEXPRESS',
  user: 'ProcessingUser',
  password: 'Processing@2024',
  options: { trustServerCertificate: true, enableArithAbort: true },
};

async function setup() {
  // ── STEP 1: Connect to master and create ProcessingSystem DB ──────────────
  console.log('Connecting to master to create database...');
  const masterPool = new sql.ConnectionPool({ ...baseConfig, database: 'master' });
  await masterPool.connect();

  await masterPool.request().query(`
    IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ProcessingSystem')
    BEGIN
      CREATE DATABASE ProcessingSystem;
      PRINT 'Database ProcessingSystem created.';
    END
  `);
  await masterPool.close();
  console.log('Database ready.');

  // ── STEP 2: Connect directly to ProcessingSystem for everything else ───────
  console.log('Connecting to ProcessingSystem...');
  const pool = new sql.ConnectionPool({ ...baseConfig, database: 'ProcessingSystem' });
  await pool.connect();

  // ── TABLES ────────────────────────────────────────────────────────────────

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='machines' AND xtype='U')
    CREATE TABLE machines (
      id INT IDENTITY PRIMARY KEY,
      machine_name NVARCHAR(50) UNIQUE NOT NULL,
      capacity_kg DECIMAL(10,2) NOT NULL
    )
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='recipes' AND xtype='U')
    CREATE TABLE recipes (
      id INT IDENTITY PRIMARY KEY,
      recipe_name NVARCHAR(100) UNIQUE NOT NULL,
      cycle_time_hours DECIMAL(10,2) NOT NULL
    )
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='dryers' AND xtype='U')
    CREATE TABLE dryers (
      id INT IDENTITY PRIMARY KEY,
      dryer_name NVARCHAR(50) UNIQUE NOT NULL,
      capacity_kg DECIMAL(10,2) NOT NULL,
      drying_duration_min DECIMAL(10,2) NOT NULL
    )
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hydro' AND xtype='U')
    CREATE TABLE hydro (
      id INT IDENTITY PRIMARY KEY,
      hydro_name NVARCHAR(50) UNIQUE NOT NULL,
      capacity_kg DECIMAL(10,2) NOT NULL,
      cycle_time_min DECIMAL(10,2) NOT NULL
    )
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='batches' AND xtype='U')
    CREATE TABLE batches (
      id INT IDENTITY PRIMARY KEY,
      batch_no NVARCHAR(20) UNIQUE NOT NULL,
      order_no NVARCHAR(20),
      issue_doc NVARCHAR(30),
      receive_doc NVARCHAR(30),
      weight_kg DECIMAL(10,2),
      dzns INT DEFAULT 0,
      pcs INT DEFAULT 0,
      cost_code NVARCHAR(100),
      created_at DATETIME DEFAULT GETDATE()
    )
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='pair_codes' AND xtype='U')
    CREATE TABLE pair_codes (
      id INT IDENTITY PRIMARY KEY,
      batch_no NVARCHAR(20) NOT NULL,
      pair_code NVARCHAR(20) NOT NULL,
      weight_kg DECIMAL(10,2) NOT NULL,
      seq_no INT DEFAULT 1,
      recipe NVARCHAR(100)
    )
  `);
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='pair_codes' AND COLUMN_NAME='recipe')
    ALTER TABLE pair_codes ADD recipe NVARCHAR(100)
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='processing_log' AND xtype='U')
    CREATE TABLE processing_log (
      id INT IDENTITY PRIMARY KEY,
      log_date DATE NOT NULL,
      batch_no NVARCHAR(50) NOT NULL,
      order_no NVARCHAR(100),
      issue_doc NVARCHAR(30),
      receive_doc NVARCHAR(30),
      batch_weight DECIMAL(10,2),
      dzns INT DEFAULT 0,
      pcs INT DEFAULT 0,
      cost_code NVARCHAR(100),
      pair_codes_str NVARCHAR(500),
      pair_code_weight DECIMAL(10,2),
      club_group NVARCHAR(10),
      machine NVARCHAR(50),
      machine_cap DECIMAL(10,2),
      recipe NVARCHAR(100),
      recipe_ct_hrs DECIMAL(10,2),
      dryer NVARCHAR(50),
      dryer_cap DECIMAL(10,2),
      drying_dur_min DECIMAL(10,2),
      hydro_name NVARCHAR(50),
      hydro_cap DECIMAL(10,2),
      hydro_ct_min DECIMAL(10,2),
      dryer_sam DECIMAL(10,6),
      machine_sam DECIMAL(10,6),
      hydro_sam DECIMAL(10,6),
      total_sam DECIMAL(10,6),
      cycles INT DEFAULT 1,
      produced_min DECIMAL(10,2),
      created_at DATETIME DEFAULT GETDATE()
    )
  `);

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='batch_process' AND xtype='U')
    CREATE TABLE batch_process (
      id INT IDENTITY PRIMARY KEY,
      batch_no NVARCHAR(100) NOT NULL,
      order_no NVARCHAR(100),
      pair_codes_str NVARCHAR(500),
      pair_code_weight DECIMAL(10,2),
      club_group NVARCHAR(10),
      machine NVARCHAR(50),
      machine_cap DECIMAL(10,2),
      recipe NVARCHAR(100),
      recipe_ct_hrs DECIMAL(10,2),
      machine_sam DECIMAL(10,6),
      status NVARCHAR(20) DEFAULT 'PLANNED',
      process_start DATETIME,
      process_end DATETIME,
      dryer NVARCHAR(50),
      dryer_cap DECIMAL(10,2),
      drying_dur_min DECIMAL(10,2),
      dryer_sam DECIMAL(10,6),
      dryer_start DATETIME,
      dryer_end DATETIME,
      hydro_name NVARCHAR(50),
      hydro_cap DECIMAL(10,2),
      hydro_ct_min DECIMAL(10,2),
      hydro_sam DECIMAL(10,6),
      hydro_start DATETIME,
      hydro_end DATETIME,
      total_sam DECIMAL(10,6),
      produced_min DECIMAL(10,2),
      created_at DATETIME DEFAULT GETDATE()
    )
  `);

  console.log('All tables ready.');

  // ── SEED MASTER DATA ──────────────────────────────────────────────────────

  // Machines
  const machines = [
    ['PMB-1', 240], ['PMB-2', 180], ['PMB-3', 90], ['PMB-4', 90],
    ['PMB-5', 300], ['PMB-6', 150], ['PMB-7', 120], ['PMB-8', 200],
    ['PMB-9', 350], ['PMB-10', 400], ['PMB-11', 200], ['PMB-12', 280],
  ];
  for (const [name, cap] of machines) {
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM machines WHERE machine_name='${name}')
      INSERT INTO machines (machine_name, capacity_kg) VALUES ('${name}', ${cap})
    `);
  }
  console.log('Machines seeded.');

  // Recipes
  const recipes = [
    ['EWSH-6106', 4], ['EWSH-6107', 3.5], ['EWSH-6108', 5],
    ['EWSH-6109', 2], ['EWSH-6110', 6], ['EWSH-6111', 4.5], ['EWSH-6112', 4.5],
  ];
  for (const [name, ct] of recipes) {
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM recipes WHERE recipe_name='${name}')
      INSERT INTO recipes (recipe_name, cycle_time_hours) VALUES ('${name}', ${ct})
    `);
  }
  console.log('Recipes seeded.');

  // Dryers
  const dryers = [
    ['Traiventa-1', 240, 40], ['Traiventa-2', 240, 40], ['Traiventa-3', 180, 40],
    ['Traiventa-4', 180, 40], ['Traiventa-5', 300, 45], ['Traiventa-6', 150, 35],
    ['Traiventa-7', 300, 45], ['Traiventa-8', 350, 50], ['Traiventa-9', 200, 35],
    ['Traiventa-10', 400, 55],
  ];
  for (const [name, cap, dur] of dryers) {
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM dryers WHERE dryer_name='${name}')
      INSERT INTO dryers (dryer_name, capacity_kg, drying_duration_min) VALUES ('${name}', ${cap}, ${dur})
    `);
  }
  console.log('Dryers seeded.');

  // Hydro
  const hydroList = [
    ['Hydro-1', 200, 15], ['Hydro-2', 150, 20], ['Hydro-3', 300, 10],
    ['Hydro-4', 100, 25], ['Hydro-5', 250, 18], ['Hydro-6', 300, 20],
    ['Hydro-7', 180, 15], ['Hydro-8', 400, 25],
  ];
  for (const [name, cap, ct] of hydroList) {
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM hydro WHERE hydro_name='${name}')
      INSERT INTO hydro (hydro_name, capacity_kg, cycle_time_min) VALUES ('${name}', ${cap}, ${ct})
    `);
  }
  console.log('Hydro seeded.');

  // Batches
  const batches = [
    ['82484', '231618', '23295445', '23295446', 180, 180, 0],
    ['82485', '231619', '23295447', '23295448', 240, 200, 0],
    ['82486', '231620', '23295449', '23295450', 360, 300, 0],
    ['82487', '231621', '23295451', '23295452', 150, 125, 0],
    ['82488', '231622', '23295453', '23295454', 200, 166, 0],
    ['82489', '231623', '23295455', '23295456', 300, 250, 0],
    ['82490', '231624', '23295457', '23295458', 420, 350, 0],
    ['82491', '231625', '23295459', '23295460', 180, 150, 0],
    ['82492', '231626', '23295461', '23295462', 540, 450, 0],
    ['82493', '231627', '23295463', '23295464', 360, 300, 0],
  ];
  for (const [bno, ono, idoc, rdoc, wt, dzns, pcs] of batches) {
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM batches WHERE batch_no='${bno}')
      INSERT INTO batches (batch_no, order_no, issue_doc, receive_doc, weight_kg, dzns, pcs)
      VALUES ('${bno}', '${ono}', '${idoc}', '${rdoc}', ${wt}, ${dzns}, ${pcs})
    `);
  }
  console.log('Batches seeded.');

  // Pair codes
  const pairCodes = [
    ['82484', '1001', 180, 1, 'EWSH-6106'],
    ['82485', '2002', 60, 1, 'EWSH-6106'], ['82485', '3003', 60, 2, 'EWSH-6106'], ['82485', '4004', 60, 3, 'EWSH-6107'], ['82485', '5005', 60, 4, 'EWSH-6107'],
    ['82486', '1001', 90, 1, 'EWSH-6106'], ['82486', '2002', 90, 2, 'EWSH-6106'], ['82486', '3003', 90, 3, 'EWSH-6107'], ['82486', '4004', 90, 4, 'EWSH-6107'],
    ['82487', '6006', 75, 1, 'EWSH-6108'], ['82487', '7007', 75, 2, 'EWSH-6108'],
    ['82488', '8008', 100, 1, 'EWSH-6109'], ['82488', '9009', 100, 2, 'EWSH-6109'],
    ['82489', '5005', 100, 1, 'EWSH-6106'], ['82489', '6006', 100, 2, 'EWSH-6108'], ['82489', '7007', 100, 3, 'EWSH-6108'],
    ['82490', '1101', 70, 1, 'EWSH-6110'], ['82490', '1102', 70, 2, 'EWSH-6110'], ['82490', '1103', 70, 3, 'EWSH-6110'],
    ['82490', '1104', 70, 4, 'EWSH-6110'], ['82490', '1105', 70, 5, 'EWSH-6111'], ['82490', '1106', 70, 6, 'EWSH-6111'],
    ['82491', '2201', 90, 1, 'EWSH-6111'], ['82491', '2202', 90, 2, 'EWSH-6111'],
    ['82492', '3301', 90, 1, 'EWSH-6112'], ['82492', '3302', 90, 2, 'EWSH-6112'], ['82492', '3303', 90, 3, 'EWSH-6112'], ['82492', '3304', 90, 4, 'EWSH-6112'],
    ['82493', '4401', 90, 1, 'EWSH-6107'], ['82493', '4402', 90, 2, 'EWSH-6107'], ['82493', '4403', 90, 3, 'EWSH-6107'], ['82493', '4404', 90, 4, 'EWSH-6107'],
  ];
  for (const [bno, pc, wt, seq, recipe] of pairCodes) {
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM pair_codes WHERE batch_no='${bno}' AND pair_code='${pc}')
      INSERT INTO pair_codes (batch_no, pair_code, weight_kg, seq_no, recipe)
      VALUES ('${bno}', '${pc}', ${wt}, ${seq}, '${recipe}')
    `);
  }
  console.log('Pair codes seeded.');

  await pool.close();
  console.log('\n✅ Database setup complete! All tables created and data seeded in ProcessingSystem.');
}

setup().catch(err => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
