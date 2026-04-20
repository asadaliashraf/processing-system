const sql = require('mssql');

const config = {
  server: 'DESKTOP-KKB5HLJ\\SQLEXPRESS',
  database: 'ProcessingSystem',
  user: 'ProcessingUser',
  password: 'Processing@2024',
  options: {
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

let pool = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

module.exports = { getPool, sql };
