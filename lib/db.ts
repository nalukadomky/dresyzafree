import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const teamsFile = path.join(dataDir, 'teams.json');
const adminFile = path.join(dataDir, 'admin.json');

// Zajistíme, že data složka existuje
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Inicializace admin účtu (defaultní přihlašovací údaje)
const defaultAdmin = {
  username: 'lasak.design@gmail.com',
  password: '$2a$10$gzOTWOCom0l8enLku2H7POu2l2JPVkI/2MbwA66ZRP281oSzcSwKC' // bcrypt hash pro "Heslo1234!"
};

export interface Team {
  id: string;
  teamName: string;
  contactPerson: string;
  phone: string;
  email: string;
  leagues?: string[];
  username: string;
  password: string; // bcrypt hash
  createdAt: string;
  logo?: string; // Cesta k logu týmu
  referrerId?: string; // ID týmu, který tento tým doporučil
  // Admin nastavení
  status?: 'nekontaktováno' | 'kontaktováno' | 'nemá zájem' | 'deal';
  numberOfJerseys?: number;
  numberOfTariffs?: number;
  deadline?: string; // ISO date string
  tariffValidUntil?: string; // ISO date string
  jerseyUrl?: string; // URL odkazu na dres
  shortsUrl?: string; // URL odkazu na trenýrky
  socksUrl?: string; // URL odkazu na štrupny
  deliveryAddress?: string; // Adresa dodání dresů
  ico?: string; // IČO osoby/týmu
  meetingNote?: string; // Poznámka z jednání
  jerseyType?: string; // Typ dresu
}

export interface Admin {
  username: string;
  password: string; // bcrypt hash
}

function readTeams(): Team[] {
  try {
    if (fs.existsSync(teamsFile)) {
      const data = fs.readFileSync(teamsFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading teams:', error);
  }
  return [];
}

function writeTeams(teams: Team[]): void {
  try {
    fs.writeFileSync(teamsFile, JSON.stringify(teams, null, 2));
  } catch (error) {
    console.error('Error writing teams:', error);
  }
}

function readAdmin(): Admin {
  try {
    if (fs.existsSync(adminFile)) {
      const data = fs.readFileSync(adminFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading admin:', error);
  }
  // Pokud admin soubor neexistuje, vytvoříme defaultní
  writeAdmin(defaultAdmin);
  return defaultAdmin;
}

function writeAdmin(admin: Admin): void {
  try {
    fs.writeFileSync(adminFile, JSON.stringify(admin, null, 2));
  } catch (error) {
    console.error('Error writing admin:', error);
  }
}

// Synchronní file-based DB (fallback)
const fileDb = {
  teams: {
    getAll: (): Team[] => readTeams(),
    getById: (id: string): Team | undefined => {
      const teams = readTeams();
      return teams.find(t => t.id === id);
    },
    getByUsername: (username: string): Team | undefined => {
      const teams = readTeams();
      return teams.find(t => t.username === username);
    },
    create: (team: Omit<Team, 'id' | 'createdAt'>): Team => {
      const teams = readTeams();
      const newTeam: Team = {
        ...team,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      teams.push(newTeam);
      writeTeams(teams);
      return newTeam;
    },
    update: (id: string, updates: Partial<Team>): Team | null => {
      const teams = readTeams();
      const index = teams.findIndex(t => t.id === id);
      if (index === -1) return null;
      teams[index] = { ...teams[index], ...updates };
      writeTeams(teams);
      return teams[index];
    },
    delete: (id: string): boolean => {
      const teams = readTeams();
      const filtered = teams.filter(t => t.id !== id);
      if (filtered.length === teams.length) return false;
      writeTeams(filtered);
      return true;
    },
  },
  admin: {
    get: (): Admin => readAdmin(),
    update: (admin: Admin): void => writeAdmin(admin),
  },
};

// Export - použije Supabase pokud je nakonfigurován, jinak file-based
// Pro async operace použijte db-supabase.ts přímo
export const db = fileDb;

