const { getDb } = require('./db');

function setup() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS machines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_name TEXT UNIQUE NOT NULL,
      capacity_kg REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_name TEXT UNIQUE NOT NULL,
      cycle_time_hours REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS dryers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dryer_name TEXT UNIQUE NOT NULL,
      capacity_kg REAL NOT NULL,
      drying_duration_min REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS hydro (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hydro_name TEXT UNIQUE NOT NULL,
      capacity_kg REAL NOT NULL,
      cycle_time_min REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_no TEXT UNIQUE NOT NULL,
      order_no TEXT,
      issue_doc TEXT,
      receive_doc TEXT,
      weight_kg REAL DEFAULT 0,
      dzns INTEGER DEFAULT 0,
      pcs INTEGER DEFAULT 0,
      cost_code TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS pair_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_no TEXT NOT NULL,
      pair_code TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      seq_no INTEGER DEFAULT 1,
      recipe TEXT
    );
    CREATE TABLE IF NOT EXISTS processing_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_date TEXT,
      batch_no TEXT,
      order_no TEXT,
      issue_doc TEXT,
      receive_doc TEXT,
      batch_weight REAL,
      dzns INTEGER DEFAULT 0,
      pcs INTEGER DEFAULT 0,
      cost_code TEXT,
      pair_codes_str TEXT,
      pair_code_weight REAL,
      club_group TEXT,
      machine TEXT,
      machine_cap REAL,
      recipe TEXT,
      recipe_ct_hrs REAL,
      dryer TEXT,
      dryer_cap REAL,
      drying_dur_min REAL,
      hydro_name TEXT,
      hydro_cap REAL,
      hydro_ct_min REAL,
      dryer_sam REAL,
      machine_sam REAL,
      hydro_sam REAL,
      total_sam REAL,
      cycles INTEGER DEFAULT 1,
      produced_min REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS batch_process (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_no TEXT NOT NULL,
      order_no TEXT,
      pair_codes_str TEXT,
      pair_code_weight REAL,
      club_group TEXT,
      machine TEXT,
      machine_cap REAL,
      recipe TEXT,
      recipe_ct_hrs REAL,
      machine_sam REAL,
      status TEXT DEFAULT 'PLANNED',
      process_start TEXT,
      process_end TEXT,
      dryer TEXT,
      dryer_cap REAL,
      drying_dur_min REAL,
      dryer_sam REAL,
      dryer_start TEXT,
      dryer_end TEXT,
      hydro_name TEXT,
      hydro_cap REAL,
      hydro_ct_min REAL,
      hydro_sam REAL,
      hydro_start TEXT,
      hydro_end TEXT,
      total_sam REAL,
      produced_min REAL,
      cycles INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  console.log('Tables ready.');

  // ── SEED MACHINES ────────────────────────────────────────────────────────────
  const insertMachine = db.prepare(`INSERT OR IGNORE INTO machines (machine_name, capacity_kg) VALUES (?, ?)`);
  const machines = [
    ['PMB-1',240],['PMB-2',240],['PMB-3',180],['PMB-4',180],['PMB-5',300],
    ['PMB-6',150],['PMB-7',200],['PMB-8',200],['PMB-9',250],['PMB-10',250],
    ['PMB-11',180],['PMB-12',180],
  ];
  for (const [name, cap] of machines) insertMachine.run(name, cap);
  console.log('Machines seeded.');

  // ── SEED RECIPES ─────────────────────────────────────────────────────────────
  const insertRecipe = db.prepare(`INSERT OR IGNORE INTO recipes (recipe_name, cycle_time_hours) VALUES (?, ?)`);
  const recipes = [
    ['EWSH-6106',4],['EWSH-6107',3.5],['EWSH-6108',5],
    ['EWSH-6109',2],['EWSH-6110',6],['EWSH-6111',4.5],['EWSH-6112',4.5],
  ];
  for (const [name, ct] of recipes) insertRecipe.run(name, ct);
  console.log('Recipes seeded.');

  // ── SEED DRYERS ──────────────────────────────────────────────────────────────
  const insertDryer = db.prepare(`INSERT OR IGNORE INTO dryers (dryer_name, capacity_kg, drying_duration_min) VALUES (?, ?, ?)`);
  const dryers = [
    ['Traiventa-1',240,40],['Traiventa-2',240,40],['Traiventa-3',180,40],
    ['Traiventa-4',180,40],['Traiventa-5',300,45],['Traiventa-6',150,35],
    ['Traiventa-7',200,38],['Traiventa-8',200,38],['Traiventa-9',250,42],
    ['Traiventa-10',250,42],
  ];
  for (const [name, cap, dur] of dryers) insertDryer.run(name, cap, dur);
  console.log('Dryers seeded.');

  // ── SEED HYDRO ───────────────────────────────────────────────────────────────
  const insertHydro = db.prepare(`INSERT OR IGNORE INTO hydro (hydro_name, capacity_kg, cycle_time_min) VALUES (?, ?, ?)`);
  const hydros = [
    ['Hydro-1',120,8],['Hydro-2',120,8],['Hydro-3',100,7],['Hydro-4',100,7],
    ['Hydro-5',150,10],['Hydro-6',150,10],['Hydro-7',80,6],['Hydro-8',80,6],
  ];
  for (const [name, cap, ct] of hydros) insertHydro.run(name, cap, ct);
  console.log('Hydro seeded.');

  // ── SEED BATCHES ─────────────────────────────────────────────────────────────
  const insertBatch = db.prepare(`INSERT OR IGNORE INTO batches (batch_no,order_no,issue_doc,receive_doc,weight_kg,dzns,pcs,cost_code) VALUES (?,?,?,?,?,?,?,?)`);
  const batches = [
    ['82484','ORD-001','ISS-001','REC-001',180,150,1800,'CC-101'],
    ['82485','ORD-002','ISS-002','REC-002',240,200,2400,'CC-102'],
    ['82486','ORD-003','ISS-003','REC-003',360,300,3600,'CC-103'],
    ['82487','ORD-004','ISS-004','REC-004',150,125,1500,'CC-104'],
    ['82488','ORD-005','ISS-005','REC-005',200,166,1992,'CC-105'],
    ['82489','ORD-006','ISS-006','REC-006',300,250,3000,'CC-106'],
    ['82490','ORD-007','ISS-007','REC-007',420,350,4200,'CC-107'],
    ['82491','ORD-008','ISS-008','REC-008',180,150,1800,'CC-108'],
    ['82492','ORD-009','ISS-009','REC-009',360,300,3600,'CC-109'],
    ['82493','ORD-010','ISS-010','REC-010',360,300,3600,'CC-110'],
  ];
  for (const b of batches) insertBatch.run(...b);
  console.log('Batches seeded.');

  // ── SEED PAIR CODES ──────────────────────────────────────────────────────────
  const insertPc = db.prepare(`INSERT OR IGNORE INTO pair_codes (batch_no,pair_code,weight_kg,seq_no,recipe) VALUES (?,?,?,?,?)`);
  const pairCodes = [
    ['82484','1001',180,1,'EWSH-6106'],
    ['82485','2002',60,1,'EWSH-6106'],['82485','3003',60,2,'EWSH-6106'],['82485','4004',60,3,'EWSH-6107'],['82485','5005',60,4,'EWSH-6107'],
    ['82486','1001',90,1,'EWSH-6106'],['82486','2002',90,2,'EWSH-6106'],['82486','3003',90,3,'EWSH-6107'],['82486','4004',90,4,'EWSH-6107'],
    ['82487','6006',75,1,'EWSH-6108'],['82487','7007',75,2,'EWSH-6108'],
    ['82488','8008',100,1,'EWSH-6109'],['82488','9009',100,2,'EWSH-6109'],
    ['82489','5005',100,1,'EWSH-6106'],['82489','6006',100,2,'EWSH-6108'],['82489','7007',100,3,'EWSH-6108'],
    ['82490','1101',70,1,'EWSH-6110'],['82490','1102',70,2,'EWSH-6110'],['82490','1103',70,3,'EWSH-6110'],
    ['82490','1104',70,4,'EWSH-6110'],['82490','1105',70,5,'EWSH-6111'],['82490','1106',70,6,'EWSH-6111'],
    ['82491','2201',90,1,'EWSH-6111'],['82491','2202',90,2,'EWSH-6111'],
    ['82492','3301',90,1,'EWSH-6112'],['82492','3302',90,2,'EWSH-6112'],['82492','3303',90,3,'EWSH-6112'],['82492','3304',90,4,'EWSH-6112'],
    ['82493','4401',90,1,'EWSH-6107'],['82493','4402',90,2,'EWSH-6107'],['82493','4403',90,3,'EWSH-6107'],['82493','4404',90,4,'EWSH-6107'],
  ];
  for (const p of pairCodes) insertPc.run(...p);
  console.log('Pair codes seeded.');

  console.log('Database setup complete.');
}

setup();
