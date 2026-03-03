import { supabaseAdmin } from './supabase-server';
import { supabase } from './supabase';

const client = supabaseAdmin ?? supabase;

// ── Types ────────────────────────────────────────────────────────────

export type WebsiteSectionType = 'hero' | 'team' | 'events' | 'contact' | 'about' | 'gallery' | 'textblock' | 'lastMatch';

export interface TeamWebsite {
  id: string;
  teamId: string;
  published: boolean;
  primaryColor: string;
  secondaryColor: string;
  sectionOrder: WebsiteSectionType[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamWebsiteSection {
  id: string;
  teamId: string;
  sectionType: WebsiteSectionType;
  content: HeroContent | TeamMembersContent | EventsContent | ContactContent | AboutContent | GalleryContent | TextBlockContent | LastMatchContent;
  createdAt: string;
  updatedAt: string;
}

export interface HeroContent {
  headline: string;
  subtitle: string;
  backgroundImage?: string;
  backgroundOverlayOpacity: number;
  backgroundColor?: string;
  showLogo?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  headlineSize?: 'sm' | 'md' | 'lg' | 'xl';
  logoShape?: 'circle' | 'free';
  logoZoom?: number;
  logoOffsetX?: number;
  logoOffsetY?: number;
  // Vertical positioning (drag up/down)
  freePosition?: boolean;
  logoPositionY?: number;
  textPositionY?: number;
  // Element sizes
  logoSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export type SectionVariant = 'light' | 'dark';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  number?: string;
  photoUrl?: string;
  email?: string;
  phone?: string;
}

export interface TeamMembersContent {
  title: string;
  description: string;
  members: TeamMember[];
  showFromRoster: boolean;
  variant?: SectionVariant;
  viewMode?: 'grid' | 'gallery';
}

export interface EventsContent {
  title: string;
  maxEvents: number;
  showTrainings: boolean;
  showMatches: boolean;
  variant?: SectionVariant;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  web?: string;
}

export interface ContactPerson {
  name: string;
  role: string;
  phone?: string;
  email?: string;
}

export interface ContactContent {
  title: string;
  address: string;
  phone: string;
  email: string;
  socialLinks: SocialLinks;
  mapEmbedUrl?: string;
  people?: ContactPerson[];
  variant?: SectionVariant;
}

export interface AboutContent {
  title: string;
  text: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  variant?: SectionVariant;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
}

export interface GalleryContent {
  title: string;
  images: GalleryImage[];
  columns?: 2 | 3 | 4;
  variant?: SectionVariant;
}

export interface TextBlockContent {
  text: string;
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
  lineHeight?: number;
  letterSpacing?: number;
  paddingY?: number;
  variant?: SectionVariant;
}

export interface LastMatchContent {
  title: string;
  showScorers: boolean;
  showVoting: boolean;
  variant?: SectionVariant;
}

export interface PublicMatchData {
  id: string;
  date: string;
  opponent?: string;
  name?: string;
  result?: string;
  goalsFor?: number;
  goalsAgainst?: number;
  scorers: { goalOrder: number; playerName: string }[];
  assists: { assistOrder: number; playerName: string }[];
  fanVotes: { playerId: string; playerName: string; voteCount: number }[];
  totalVotes: number;
}

export interface PublicWebsiteData {
  slug: string;
  team: { id: string; teamName: string; logo?: string };
  website: TeamWebsite;
  sections: TeamWebsiteSection[];
  events: { id: string; date: string; eventType: string; location?: string; opponent?: string; startTime?: string; note?: string }[];
  players: { id: string; name: string; jerseyNumber?: number; photoUrl?: string }[];
  lastMatch?: PublicMatchData | null;
}

// ── Mappers ──────────────────────────────────────────────────────────

const mapWebsite = (row: Record<string, unknown>): TeamWebsite => ({
  id: row.id as string,
  teamId: row.team_id as string,
  published: row.published as boolean,
  primaryColor: (row.primary_color as string) || '#3B82F6',
  secondaryColor: (row.secondary_color as string) || '#1E293B',
  sectionOrder: (row.section_order as WebsiteSectionType[]) || ['hero', 'team', 'events', 'contact'],
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

const mapSection = (row: Record<string, unknown>): TeamWebsiteSection => ({
  id: row.id as string,
  teamId: row.team_id as string,
  sectionType: row.section_type as WebsiteSectionType,
  content: row.content as TeamWebsiteSection['content'],
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

// ── Default section content ──────────────────────────────────────────

export const DEFAULT_SECTION_CONTENT: Record<WebsiteSectionType, unknown> = {
  hero: {
    headline: '',
    subtitle: '',
    backgroundImage: '',
    backgroundOverlayOpacity: 0.5,
  } as HeroContent,
  team: {
    title: 'Náš tým',
    description: '',
    members: [],
    showFromRoster: true,
  } as TeamMembersContent,
  events: {
    title: 'Nadcházející akce',
    maxEvents: 5,
    showTrainings: true,
    showMatches: true,
  } as EventsContent,
  contact: {
    title: 'Kontakt',
    address: '',
    phone: '',
    email: '',
    socialLinks: {},
    mapEmbedUrl: '',
  } as ContactContent,
  about: {
    title: 'O nás',
    text: '',
    textAlign: 'center',
    lineHeight: 1.7,
  } as AboutContent,
  gallery: {
    title: 'Galerie',
    images: [],
    columns: 3,
  } as GalleryContent,
  textblock: {
    text: '',
    textAlign: 'left',
    fontSize: 'md',
    lineHeight: 1.6,
    letterSpacing: 0,
    paddingY: 48,
  } as TextBlockContent,
  lastMatch: {
    title: 'Poslední zápas',
    showScorers: true,
    showVoting: true,
  } as LastMatchContent,
};

// ── Slug helpers ─────────────────────────────────────────────────────

export function generateSlug(teamName: string): string {
  return teamName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')    // remove special chars
    .replace(/\s+/g, '-')            // spaces to hyphens
    .replace(/-+/g, '-')             // collapse hyphens
    .replace(/^-|-$/g, '')           // trim hyphens
    .substring(0, 50);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$/.test(slug) || /^[a-z0-9]{1,2}$/.test(slug);
}

// ── Data access ──────────────────────────────────────────────────────

export const dbWebsite = {
  website: {
    getByTeamId: async (teamId: string): Promise<TeamWebsite | null> => {
      const { data, error } = await client!
        .from('team_websites')
        .select('*')
        .eq('team_id', teamId)
        .single();
      if (error || !data) return null;
      return mapWebsite(data);
    },

    upsert: async (teamId: string, updates: Partial<Omit<TeamWebsite, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>>): Promise<TeamWebsite> => {
      const row: Record<string, unknown> = { team_id: teamId, updated_at: new Date().toISOString() };
      if (updates.published !== undefined) row.published = updates.published;
      if (updates.primaryColor !== undefined) row.primary_color = updates.primaryColor;
      if (updates.secondaryColor !== undefined) row.secondary_color = updates.secondaryColor;
      if (updates.sectionOrder !== undefined) row.section_order = updates.sectionOrder;

      const { data, error } = await client!
        .from('team_websites')
        .upsert(row, { onConflict: 'team_id' })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapWebsite(data);
    },

    setPublished: async (teamId: string, published: boolean): Promise<void> => {
      const { error } = await client!
        .from('team_websites')
        .update({ published, updated_at: new Date().toISOString() })
        .eq('team_id', teamId);
      if (error) throw new Error(error.message);
    },
  },

  sections: {
    getAllByTeamId: async (teamId: string): Promise<TeamWebsiteSection[]> => {
      const { data, error } = await client!
        .from('team_website_sections')
        .select('*')
        .eq('team_id', teamId);
      if (error) throw new Error(error.message);
      return (data || []).map(mapSection);
    },

    getByType: async (teamId: string, sectionType: WebsiteSectionType): Promise<TeamWebsiteSection | null> => {
      const { data, error } = await client!
        .from('team_website_sections')
        .select('*')
        .eq('team_id', teamId)
        .eq('section_type', sectionType)
        .single();
      if (error || !data) return null;
      return mapSection(data);
    },

    upsert: async (teamId: string, sectionType: WebsiteSectionType, content: object): Promise<TeamWebsiteSection> => {
      const { data, error } = await client!
        .from('team_website_sections')
        .upsert(
          {
            team_id: teamId,
            section_type: sectionType,
            content,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'team_id,section_type' }
        )
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapSection(data);
    },

    delete: async (teamId: string, sectionType: WebsiteSectionType): Promise<void> => {
      const { error } = await client!
        .from('team_website_sections')
        .delete()
        .eq('team_id', teamId)
        .eq('section_type', sectionType);
      if (error) throw new Error(error.message);
    },
  },

  slug: {
    getTeamIdBySlug: async (slug: string): Promise<string | null> => {
      const { data, error } = await client!
        .from('teams')
        .select('id')
        .eq('website_slug', slug)
        .single();
      if (error || !data) return null;
      return data.id as string;
    },

    setSlug: async (teamId: string, slug: string): Promise<void> => {
      const { error } = await client!
        .from('teams')
        .update({ website_slug: slug })
        .eq('id', teamId);
      if (error) {
        if (error.message?.includes('unique') || error.code === '23505') {
          throw new Error('Tento slug je už obsazený. Zvolte jiný.');
        }
        throw new Error(error.message);
      }
    },

    isSlugAvailable: async (slug: string, excludeTeamId?: string): Promise<boolean> => {
      let query = client!
        .from('teams')
        .select('id')
        .eq('website_slug', slug);
      if (excludeTeamId) {
        query = query.neq('id', excludeTeamId);
      }
      const { data } = await query;
      return !data || data.length === 0;
    },
  },

  // Composite fetch for the public page
  getPublicWebsite: async (slug: string): Promise<PublicWebsiteData | null> => {
    // 1. Find team by slug
    const { data: teamData, error: teamError } = await client!
      .from('teams')
      .select('id, teamname, logo')
      .eq('website_slug', slug)
      .single();
    if (teamError || !teamData) return null;

    const teamId = teamData.id as string;

    // 2. Get website config
    const { data: websiteData, error: websiteError } = await client!
      .from('team_websites')
      .select('*')
      .eq('team_id', teamId)
      .single();
    if (websiteError || !websiteData) return null;

    const website = mapWebsite(websiteData);
    if (!website.published) return null;

    // 3. Get sections + upcoming events + players + last match in parallel
    const today = new Date().toISOString().split('T')[0];
    const [sectionsRes, eventsRes, playersRes, lastMatchRes] = await Promise.all([
      client!.from('team_website_sections').select('*').eq('team_id', teamId),
      client!.from('events').select('id, date, event_type, location, opponent, start_time, note')
        .eq('team_id', teamId)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(10),
      client!.from('players').select('id, name, jersey_number, photo_url').eq('team_id', teamId),
      client!.from('matches').select('*')
        .eq('team_id', teamId)
        .order('date', { ascending: false })
        .limit(1),
    ]);

    const sections = (sectionsRes.data || []).map(mapSection);
    const events = (eventsRes.data || []).map((e: Record<string, unknown>) => ({
      id: e.id as string,
      date: e.date as string,
      eventType: e.event_type as string,
      location: (e.location as string) || undefined,
      opponent: (e.opponent as string) || undefined,
      startTime: (e.start_time as string) || undefined,
      note: (e.note as string) || undefined,
    }));
    const players = (playersRes.data || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      name: p.name as string,
      jerseyNumber: (p.jersey_number as number | null) ?? undefined,
      photoUrl: (p.photo_url as string) || undefined,
    }));

    // Build lastMatch data
    let lastMatch: PublicMatchData | null = null;
    const matchRow = lastMatchRes.data?.[0] as Record<string, unknown> | undefined;
    if (matchRow) {
      const matchId = matchRow.id as string;
      const playerMap = new Map(players.map(p => [p.id, p.name]));

      // Fetch scorers, assists, and fan votes for this match
      const [scorersRes, assistsRes, votesRes] = await Promise.all([
        client!.from('match_goal_scorers').select('goal_order, player_id')
          .eq('match_id', matchId).order('goal_order'),
        client!.from('match_assists').select('assist_order, player_id')
          .eq('match_id', matchId).order('assist_order'),
        client!.from('match_fan_votes').select('player_id')
          .eq('match_id', matchId),
      ]);

      // Aggregate fan votes
      const voteCounts: Record<string, number> = {};
      for (const v of (votesRes.data || []) as { player_id: string }[]) {
        voteCounts[v.player_id] = (voteCounts[v.player_id] || 0) + 1;
      }
      const totalVotes = (votesRes.data || []).length;
      const fanVotes = Object.entries(voteCounts)
        .map(([playerId, voteCount]) => ({
          playerId,
          playerName: playerMap.get(playerId) || 'Neznámý',
          voteCount,
        }))
        .sort((a, b) => b.voteCount - a.voteCount);

      lastMatch = {
        id: matchId,
        date: matchRow.date as string,
        opponent: (matchRow.opponent as string) || undefined,
        name: (matchRow.name as string) || undefined,
        result: (matchRow.result as string) || undefined,
        goalsFor: (matchRow.goals_for as number | null) ?? undefined,
        goalsAgainst: (matchRow.goals_against as number | null) ?? undefined,
        scorers: ((scorersRes.data || []) as { goal_order: number; player_id: string }[]).map(s => ({
          goalOrder: s.goal_order,
          playerName: playerMap.get(s.player_id) || 'Neznámý',
        })),
        assists: ((assistsRes.data || []) as { assist_order: number; player_id: string }[]).map(a => ({
          assistOrder: a.assist_order,
          playerName: playerMap.get(a.player_id) || 'Neznámý',
        })),
        fanVotes,
        totalVotes,
      };
    }

    return {
      slug,
      team: {
        id: teamId,
        teamName: teamData.teamname as string,
        logo: (teamData.logo as string) || undefined,
      },
      website,
      sections,
      events,
      players,
      lastMatch,
    };
  },
};
