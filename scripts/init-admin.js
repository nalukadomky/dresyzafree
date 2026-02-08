const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const adminFile = path.join(dataDir, 'admin.json');

// Výchozí heslo: admin123
const defaultPassword = 'admin123';

async function initAdmin() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  const admin = {
    username: 'admin',
    password: hashedPassword,
  };

  fs.writeFileSync(adminFile, JSON.stringify(admin, null, 2));
  console.log('Admin účet byl vytvořen:');
  console.log('Uživatelské jméno: admin');
  console.log('Heslo: admin123');
}

initAdmin().catch(console.error);

