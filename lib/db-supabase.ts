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

// Fallback na file-based DB pokud Supabase není nakonfigurován
const useSupabase = supabase !== null;

export const db = {
  teams: {
    getAll: async (): Promise<Team[]> => {
      if (!useSupabase) {
        return fileDb.teams.getAll();
      }

      try {
        const { data, error } = await supabase!
          .from('teams')
          .select('*')
          .order('createdAt', { ascending: false });

        if (error) {
          console.error('Error fetching teams:', error);
          return fileDb.teams.getAll();
        }

        return data || [];
      } catch (error) {
        console.error('Error fetching teams:', error);
        return fileDb.teams.getAll();
      }
    },

    getById: async (id: string): Promise<Team | undefined> => {
      if (!useSupabase) {
        return fileDb.teams.getById(id);
      }

      try {
        const { data, error } = await supabase!
          .from('teams')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching team:', error);
          return fileDb.teams.getById(id);
        }

        return data || undefined;
      } catch (error) {
        console.error('Error fetching team:', error);
        return fileDb.teams.getById(id);
      }
    },

    getByUsername: async (username: string): Promise<Team | undefined> => {
      if (!useSupabase) {
        return fileDb.teams.getByUsername(username);
      }

      try {
        const { data, error } = await supabase!
          .from('teams')
          .select('*')
          .eq('username', username)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error fetching team by username:', error);
          return fileDb.teams.getByUsername(username);
        }

        return data || undefined;
      } catch (error) {
        console.error('Error fetching team by username:', error);
        return fileDb.teams.getByUsername(username);
      }
    },

    create: async (team: Omit<Team, 'id' | 'createdAt'>): Promise<Team> => {
      if (!useSupabase) {
        return fileDb.teams.create(team);
      }

      try {
        const newTeam: Team = {
          ...team,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };

        // Zajištění, že všechny údaje jsou přítomny
        const teamToInsert = {
          id: newTeam.id,
          teamName: newTeam.teamName,
          contactPerson: newTeam.contactPerson,
          phone: newTeam.phone,
          email: newTeam.email,
          leagues: newTeam.leagues,
          username: newTeam.username,
          password: newTeam.password,
          createdAt: newTeam.createdAt,
          logo: newTeam.logo || null,
          referrerId: newTeam.referrerId || null,
          status: newTeam.status || 'nekontaktováno',
          numberOfJerseys: newTeam.numberOfJerseys || null,
          numberOfTariffs: newTeam.numberOfTariffs || null,
          deadline: newTeam.deadline || null,
          tariffValidUntil: newTeam.tariffValidUntil || null,
          jerseyUrl: newTeam.jerseyUrl || null,
          shortsUrl: newTeam.shortsUrl || null,
          socksUrl: newTeam.socksUrl || null,
          deliveryAddress: newTeam.deliveryAddress || null,
          ico: newTeam.ico || null,
          meetingNote: newTeam.meetingNote || null,
        };

        console.log('Ukládám tým do Supabase:', JSON.stringify(teamToInsert, null, 2));

        const { data, error } = await supabase!
          .from('teams')
          .insert(teamToInsert)
          .select()
          .single();

        if (error) {
          console.error('Error creating team in Supabase:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          console.log('Používám fallback na file-based DB');
          return fileDb.teams.create(team);
        }

        console.log('Tým úspěšně uložen do Supabase:', data);
        return data;
      } catch (error) {
        console.error('Error creating team:', error);
        return fileDb.teams.create(team);
      }
    },

    update: async (id: string, updates: Partial<Team>): Promise<Team | null> => {
      if (!useSupabase) {
        return fileDb.teams.update(id, updates);
      }

      try {
        const { data, error } = await supabase!
          .from('teams')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error updating team:', error);
          return fileDb.teams.update(id, updates);
        }

        return data || null;
      } catch (error) {
        console.error('Error updating team:', error);
        return fileDb.teams.update(id, updates);
      }
    },

    delete: async (id: string): Promise<boolean> => {
      if (!useSupabase) {
        return fileDb.teams.delete(id);
      }

      try {
        const { error } = await supabase!
          .from('teams')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting team:', error);
          return fileDb.teams.delete(id);
        }

        return true;
      } catch (error) {
        console.error('Error deleting team:', error);
        return fileDb.teams.delete(id);
      }
    },
  },

  admin: {
    get: async (): Promise<Admin> => {
      if (!useSupabase) {
        return fileDb.admin.get();
      }

      try {
        const { data, error } = await supabase!
          .from('admin')
          .select('*')
          .single();

        if (error) {
          console.error('Error fetching admin:', error);
          return fileDb.admin.get();
        }

        return data || fileDb.admin.get();
      } catch (error) {
        console.error('Error fetching admin:', error);
        return fileDb.admin.get();
      }
    },

    update: async (admin: Admin): Promise<void> => {
      if (!useSupabase) {
        fileDb.admin.update(admin);
        return;
      }

      try {
        const { error } = await supabase!
          .from('admin')
          .upsert(admin, { onConflict: 'username' });

        if (error) {
          console.error('Error updating admin:', error);
          fileDb.admin.update(admin);
        }
      } catch (error) {
        console.error('Error updating admin:', error);
        fileDb.admin.update(admin);
      }
    },
  },
};

