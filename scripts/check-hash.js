const bcrypt = require('bcryptjs');
const hash = '$2b$10$aW418tm3mgBZGskQqB5xpuYSXPzzRdHHec/2kNpmDv6NzGKN4uOuq';
console.log('hash length:', hash.length);
console.log('hash:', hash);
console.log('compare:', bcrypt.compareSync('Pass1234!', hash));
