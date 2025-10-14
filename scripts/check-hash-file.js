const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const routePath = path.join(__dirname, '..', 'app', 'api', 'login', 'route.js');
const content = fs.readFileSync(routePath, 'utf8');

// Buscar primer hash bcrypt típico ($2a|$2b|$2y$10$ + 53 chars)
const m = content.match(/\$2[aby]\$10\$[A-Za-z0-9\.\/]{53}/);
if (!m) {
  console.error('No se encontró un hash bcrypt en route.js');
  process.exit(1);
}
const hash = m[0];
console.log('HASH ENCONTRADO:', hash);
console.log('LENGTH:', hash.length);
console.log('COMPARE:', bcrypt.compareSync('Pass1234!', hash));
