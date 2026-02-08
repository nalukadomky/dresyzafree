import { supabase } from './supabase';
import { db as fileDb } from './db';

export interface Team {
  id: string;
  teamName: string;
  contactPerson: string;
  phone: string;
  email: string;
  leagues: string[];
  username: string;
  password: string; // bcrypt hash
  createdAt: string;
  logo?: string;
  referrerId?: string;
  status?: 'nekontaktováno' | 'kontaktováno' | 'nemá zájem' | 'deal';
  numberOfJerseys?: number;
  numberOfTariffs?: number;
  deadline?: string;
  tariffValidUntil?: string;
  jerseyUrl?: string;
  shortsUrl?: string;
  socksUrl?: string;
  deliveryAddress?: string;
  ico?: string;
  meetingNote?: string;
}

export interface Admin {
  username: string;
  password: string; // bcrypt hash
}

// Mapování camelCase (TypeScript interface) na lowercase (Supabase sloupce)
// Supabase automaticky převádí názvy sloupců na lowercase bez podtržítek
function toSupabaseColumn(str: string): string {
  return str.toLowerCase();
}

function fromSupabaseColumn(str: string): string {
  // Pokud je to snake_case, převedeme na camelCase
  if (str.includes('_')) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }
  // Pokud je to už lowercase bez podtržítek, převedeme první písmeno po číslici nebo na začátku slova na velké
  // Ale vlastně Supabase vrací lowercase, takže potřebujeme mapování
  return str;
}

// Mapování názvů sloupců: camelCase <-> lowercase
const columnMapping: Record<string, string> = {
  // camelCase -> lowercase
  'teamName': 'teamname',
  'contactPerson': 'contactperson',
  'createdAt': 'createdat',
  'referrerId': 'referrerid',
  'numberOfJerseys': 'numberofjerseys',
  'numberOfTariffs': 'numberoftariffs',
  'tariffValidUntil': 'tariffvaliduntil',
  'jerseyUrl': 'jerseyurl',
  'shortsUrl': 'shortsurl',
  'socksUrl': 'socksurl',
  'deliveryAddress': 'deliveryaddress',
  'meetingNote': 'meetingnote',
};

const reverseColumnMapping: Record<string, string> = Object.fromEntries(
  Object.entries(columnMapping).map(([k, v]) => [v, k])
);

// Převod Team objektu z camelCase na lowercase pro Supabase
function teamToSupabase(team: Partial<Team>): any {
  const result: any = {};
  for (const [key, value] of Object.entries(team)) {
    if (value !== undefined) {
      const supabaseKey = columnMapping[key] || key.toLowerCase();
      result[supabaseKey] = value;
    }
  }
  return result;
}

// Převod objektu z Supabase (lowercase) na Team (camelCase)
function supabaseToTeam(data: any): Team {
  const result: any = {};
  for (const [key, value] of Object.entries(data)) {
    const camelKey = reverseColumnMapping[key] || key;
    result[camelKey] = value;
  }
  return result as Team;
}

// Používáme pouze Supabase - žádný fallback na JSON
const useSupabase = supabase !== null;

if (!useSupabase) {
  throw new Error('Supabase není nakonfigurován! Nastavte NEXT_PUBLIC_SUPABASE_URL a NEXT_PUBLIC_SUPABASE_ANON_KEY v .env.local');
}

export const db = {
  teams: {
    getAll: async (): Promise<Team[]> => {
      if (!useSupabase) {
        throw new Error('Supabase není nakonfigurován!');
      }

      try {
        const { data, error } = await supabase!
          .from('teams')
          .select('*')
          .order('createdat', { ascending: false });

        if (error) {
          console.error('Error fetching teams:', error);
          throw new Error(`Chyba při načítání týmů z Supabase: ${error.message}`);
        }

        // Převod z snake_case na camelCase
        return (data || []).map(supabaseToTeam);
      } catch (error: any) {
        console.error('Error fetching teams:', error);
        throw error;
      }
    },

    getById: async (id: string): Promise<Team | undefined> => {
      if (!useSupabase) {
        throw new Error('Supabase není nakonfigurován!');
      }

      try {
        const { data, error } = await supabase!
          .from('teams')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          // PGRST116 = no rows returned (tým neexistuje)
          if (error.code === 'PGRST116') {
            return undefined;
          }
          console.error('Error fetching team:', error);
          throw new Error(`Chyba při načítání týmu z Supabase: ${error.message}`);
        }

        return data ? supabaseToTeam(data) : undefined;
      } catch (error: any) {
        console.error('Error fetching team:', error);
        throw error;
      }
    },

    getByUsername: async (username: string): Promise<Team | undefined> => {
      if (!useSupabase) {
        throw new Error('Supabase není nakonfigurován!');
      }

      try {
        const { data, error } = await supabase!
          .from('teams')
          .select('*')
          .eq('username', username)
          .single();

        if (error) {
          // PGRST116 = no rows returned (uživatel neexistuje)
          if (error.code === 'PGRST116') {
            return undefined;
          }
          console.error('Error fetching team by username:', error);
          throw new Error(`Chyba při načítání týmu z Supabase: ${error.message}`);
        }

        return data ? supabaseToTeam(data) : undefined;
      } catch (error: any) {
        console.error('Error fetching team by username:', error);
        throw error;
      }
    },

    getByUsernameOrEmail: async (identifier: string): Promise<Team | undefined> => {
      if (!useSupabase) {
        throw new Error('Supabase není nakonfigurován!');
      }

      try {
        // Zkusíme najít podle username
        const { data: usernameData, error: usernameError } = await supabase!
          .from('teams')
          .select('*')
          .eq('username', identifier)
          .single();

        if (!usernameError && usernameData) {
          return supabaseToTeam(usernameData);
        }

        // Pokud ne, zkusíme najít podle email
        const { data: emailData, error: emailError } = await supabase!
          .from('teams')
          .select('*')
          .eq('email', identifier)
          .single();

        if (!emailError && emailData) {
          return supabaseToTeam(emailData);
        }

        // Pokud ani jedno nefunguje, vrátíme undefined
        return undefined;
      } catch (error: any) {
        console.error('Error fetching team by username or email:', error);
        throw error;
      }
    },

    create: async (team: Omit<Team, 'id' | 'createdAt'>): Promise<Team> => {
      if (!useSupabase) {
        throw new Error('Supabase není nakonfigurován!');
      }

      try {
        const newTeam: Team = {
          ...team,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };

        // Převod na snake_case pro Supabase
        const teamToInsert = teamToSupabase(newTeam);

        console.log('Ukládám tým do Supabase (snake_case):', JSON.stringify(teamToInsert, null, 2));

        const { data, error } = await supabase!
          .from('teams')
          .insert(teamToInsert)
          .select()
          .single();

        if (error) {
          console.error('Error creating team in Supabase:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          throw new Error(`Chyba při ukládání týmu do Supabase: ${error.message}`);
        }

        console.log('✅ Tým úspěšně uložen do Supabase');
        // Převod zpět na camelCase
        return supabaseToTeam(data);
      } catch (error: any) {
        console.error('Error creating team:', error);
        throw error;
      }
    },

    update: async (id: string, updates: Partial<Team>): Promise<Team | null> => {
      if (!useSupabase) {
        throw new Error('Supabase není nakonfigurován!');
      }

      try {
        // Převod updates na snake_case
        const updatesSnake = teamToSupabase(updates);

        const { data, error } = await supabase!
          .from('teams')
          .update(updatesSnake)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error updating team:', error);
          throw new Error(`Chyba při aktualizaci týmu v Supabase: ${error.message}`);
        }

        return data ? supabaseToTeam(data) : null;
      } catch (error: any) {
        console.error('Error updating team:', error);
        throw error;
      }
    },

    delete: async (id: string): Promise<boolean> => {
      if (!useSupabase) {
        throw new Error('Supabase není nakonfigurován!');
      }

      try {
        const { error } = await supabase!
          .from('teams')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting team:', error);
          throw new Error(`Chyba při mazání týmu z Supabase: ${error.message}`);
        }

        return true;
      } catch (error: any) {
        console.error('Error deleting team:', error);
        throw error;
      }
    },
  },

  admin: {
    get: async (): Promise<Admin> => {
      if (!useSupabase) {
        throw new Error('Supabase není nakonfigurován!');
      }

      try {
        const { data, error } = await supabase!
          .from('admin')
          .select('*')
          .single();

        if (error) {
          console.error('Error fetching admin:', error);
          throw new Error(`Chyba při načítání admin účtu z Supabase: ${error.message}`);
        }

        if (!data) {
          throw new Error('Admin účet nebyl nalezen v Supabase!');
        }

        return data;
      } catch (error: any) {
        console.error('Error fetching admin:', error);
        throw error;
      }
    },

    update: async (admin: Admin): Promise<void> => {
      if (!useSupabase) {
        throw new Error('Supabase není nakonfigurován!');
      }

      try {
        const { error } = await supabase!
          .from('admin')
          .upsert(admin, { onConflict: 'username' });

        if (error) {
          console.error('Error updating admin:', error);
          throw new Error(`Chyba při aktualizaci admin účtu v Supabase: ${error.message}`);
        }
      } catch (error: any) {
        console.error('Error updating admin:', error);
        throw error;
      }
    },
  },
};

