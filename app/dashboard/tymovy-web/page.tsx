'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/toast';
import type {
  TeamWebsite,
  TeamWebsiteSection,
  WebsiteSectionType,
  HeroContent,
  TeamMembersContent,
  EventsContent,
  ContactContent,
  AboutContent,
  GalleryContent,
  TextBlockContent,
} from '@/lib/db-website';
import { generateSlug, DEFAULT_SECTION_CONTENT } from '@/lib/db-website';
import { EditableSection } from '@/components/website-builder/EditableSection';
import { SectionDrawer } from '@/components/website-builder/SectionDrawer';
import { HeroEditor } from '@/components/website-builder/HeroEditor';
import { TeamEditor } from '@/components/website-builder/TeamEditor';
import { EventsEditor } from '@/components/website-builder/EventsEditor';
import { ContactEditor } from '@/components/website-builder/ContactEditor';
import { AboutEditor } from '@/components/website-builder/AboutEditor';
import { GalleryEditor } from '@/components/website-builder/GalleryEditor';
import { TextBlockEditor } from '@/components/website-builder/TextBlockEditor';
import { HeroSection } from '@/components/team-website/HeroSection';
import { TeamSection } from '@/components/team-website/TeamSection';
import { EventsSection } from '@/components/team-website/EventsSection';
import { ContactSection } from '@/components/team-website/ContactSection';
import { AboutSection } from '@/components/team-website/AboutSection';
import { GallerySection } from '@/components/team-website/GallerySection';
import { TextBlockSection } from '@/components/team-website/TextBlockSection';

// ── Types ────────────────────────────────────────────────────────────

interface TeamInfo {
  id: string;
  teamName: string;
  logo?: string;
  websiteSlug?: string;
}

interface EventData {
  id: string;
  date: string;
  eventType: string;
  location?: string;
  opponent?: string;
  startTime?: string;
  note?: string;
}

interface PlayerData {
  id: string;
  name: string;
  jerseyNumber?: number;
  photoUrl?: string;
}

const ALL_SECTION_TYPES: WebsiteSectionType[] = ['hero', 'team', 'events', 'contact', 'about', 'gallery', 'textblock'];

const SECTION_LABELS: Record<WebsiteSectionType, string> = {
  hero: 'Úvod',
  team: 'Náš tým',
  events: 'Akce',
  contact: 'Kontakt',
  about: 'O nás',
  gallery: 'Galerie',
  textblock: 'Textové pole',
};

const SECTION_ICONS: Record<WebsiteSectionType, string> = {
  hero: '🏠',
  team: '👥',
  events: '📅',
  contact: '📞',
  about: '📝',
  gallery: '🖼️',
  textblock: '📄',
};

const SECTION_DESCRIPTIONS: Record<WebsiteSectionType, string> = {
  hero: 'Hlavní banner s názvem týmu, logem a pozadím',
  team: 'Hráči a členové týmu s fotkami, čísly dresů a rolemi',
  events: 'Nadcházející tréninky a zápasy z vaší aplikace',
  contact: 'Kontaktní údaje, adresa a sociální sítě',
  about: 'Sekce s textem o vašem týmu, historii a hodnotách',
  gallery: 'Fotogalerie s lightboxem a volitelným popiskem',
  textblock: 'Volný textový blok s nastavením řádkování a mezer',
};

const DEFAULTS: Record<WebsiteSectionType, unknown> = {
  hero: { headline: '', subtitle: '', backgroundImage: '', backgroundOverlayOpacity: 0.5, showLogo: true, textAlign: 'center', headlineSize: 'lg' },
  team: { title: 'Náš tým', description: '', members: [], showFromRoster: true, variant: 'light', viewMode: 'grid' },
  events: { title: 'Nadcházející akce', maxEvents: 5, showTrainings: true, showMatches: true, variant: 'light' },
  contact: { title: 'Kontakt', address: '', phone: '', email: '', socialLinks: {}, mapEmbedUrl: '', variant: 'light' },
  about: DEFAULT_SECTION_CONTENT.about,
  gallery: DEFAULT_SECTION_CONTENT.gallery,
  textblock: DEFAULT_SECTION_CONTENT.textblock,
};

// ── Templates ─────────────────────────────────────────────────────────

interface Template {
  name: string;
  description: string;
  sectionOrder: WebsiteSectionType[];
  sectionContents: Partial<Record<WebsiteSectionType, unknown>>;
}

const TEMPLATES: Template[] = [
  {
    name: 'Klasický',
    description: 'Hero s barvou, tým v gridu, události a kontakt',
    sectionOrder: ['hero', 'team', 'events', 'contact'],
    sectionContents: {
      hero: { headline: 'Vítejte na stránkách našeho týmu!', subtitle: 'Jsme parta, která miluje sport', backgroundOverlayOpacity: 0.5, showLogo: true, textAlign: 'center', headlineSize: 'lg' } as HeroContent,
      team: { title: 'Náš tým', description: 'Seznamte se s našimi hráči a realizačním týmem.', members: [], showFromRoster: true, variant: 'light', viewMode: 'grid' } as TeamMembersContent,
      events: { title: 'Nadcházející akce', maxEvents: 5, showTrainings: true, showMatches: true, variant: 'light' } as EventsContent,
      contact: { title: 'Kontakt', address: 'Sportovní 123, Praha', phone: '', email: '', socialLinks: {}, variant: 'light' } as ContactContent,
    },
  },
  {
    name: 'Moderní',
    description: 'Hero s fotkou, o nás, galerie, tým v galerii',
    sectionOrder: ['hero', 'about', 'gallery', 'team', 'contact'],
    sectionContents: {
      hero: { headline: 'Náš příběh začíná tady', subtitle: 'Připojte se k nám a zažijte sportovní vášeň', backgroundOverlayOpacity: 0.6, showLogo: true, textAlign: 'left', headlineSize: 'xl' } as HeroContent,
      about: { title: 'O nás', text: 'Jsme tým se srdcem a vášní pro sport. Naší filozofií je fair play a týmový duch.', textAlign: 'center', lineHeight: 1.7 } as AboutContent,
      gallery: { title: 'Galerie', images: [], columns: 3 } as GalleryContent,
      team: { title: 'Náš tým', description: '', members: [], showFromRoster: true, variant: 'dark', viewMode: 'gallery' } as TeamMembersContent,
      contact: { title: 'Kontakt', address: '', phone: '', email: '', socialLinks: {}, variant: 'dark' } as ContactContent,
    },
  },
  {
    name: 'Minimální',
    description: 'Hero, motto, tým v gridu a kontakt',
    sectionOrder: ['hero', 'textblock', 'team', 'contact'],
    sectionContents: {
      hero: { headline: '', subtitle: '', backgroundOverlayOpacity: 0.5, showLogo: true, textAlign: 'center', headlineSize: 'lg' } as HeroContent,
      textblock: { text: '„Sport nás spojuje. Každý trénink je krok vpřed."', textAlign: 'center', fontSize: 'lg', lineHeight: 2.0, letterSpacing: 1, paddingY: 64, variant: 'light' } as TextBlockContent,
      team: { title: 'Náš tým', description: '', members: [], showFromRoster: true, variant: 'light', viewMode: 'grid' } as TeamMembersContent,
      contact: { title: 'Kontakt', address: '', phone: '', email: '', socialLinks: {}, variant: 'light' } as ContactContent,
    },
  },
];

// ── Main Component ───────────────────────────────────────────────────

export default function TeamWebBuilder() {
  const router = useRouter();
  const toast = useToast();
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [website, setWebsite] = useState<TeamWebsite | null>(null);
  const [sections, setSections] = useState<TeamWebsiteSection[]>([]);
  const [sectionOrder, setSectionOrder] = useState<WebsiteSectionType[]>([]);
  const [editingSection, setEditingSection] = useState<WebsiteSectionType | null>(null);
  const [slug, setSlug] = useState('');
  const [slugSaved, setSlugSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAddSection, setShowAddSection] = useState<number | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const saveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingContentRef = useRef<Map<string, unknown>>(new Map());

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // ── Fetch data ──────────────────────────────────────────────────

  useEffect(() => {
    if (!token) { router.push('/login/team'); return; }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const teamId = payload.id;

      const minDelay = new Promise(resolve => setTimeout(resolve, 3000));

      Promise.all([
        fetch(`/api/teams/${teamId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`/api/teams/${teamId}/website`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`/api/teams/${teamId}/events`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => ({ events: [] })),
        fetch(`/api/teams/${teamId}/players`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => ({ players: [] })),
        minDelay,
      ]).then(([teamRes, webRes, eventsRes, playersRes]) => {
        const t = teamRes.team;
        setTeam({ id: t.id, teamName: t.teamName || t.teamname, logo: t.logo, websiteSlug: t.websiteSlug || t.website_slug });
        const existingSlug = t.websiteSlug || t.website_slug || '';
        setSlug(existingSlug || generateSlug(t.teamName || t.teamname || ''));

        if (webRes.website) {
          setWebsite(webRes.website);
          setSectionOrder(webRes.website.sectionOrder || ['hero', 'team', 'events', 'contact']);
        } else {
          setSectionOrder(['hero', 'team', 'events', 'contact']);
        }
        setSections(webRes.sections || []);
        setEvents(eventsRes.events || []);
        setPlayers(playersRes.players || []);
        setLoading(false);
      });
    } catch {
      router.push('/login/team');
    }
  }, []);

  // ── API helpers ─────────────────────────────────────────────────

  const apiCall = useCallback(async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  }, [token]);

  const saveWebsiteConfig = useCallback(async (updates: Partial<TeamWebsite>) => {
    if (!team) return;
    setSaving(true);
    const data = await apiCall(`/api/teams/${team.id}/website`, 'PUT', updates);
    if (data.website) setWebsite(data.website);
    setSaving(false);
  }, [team, apiCall]);

  const saveSectionContent = useCallback(async (type: WebsiteSectionType, content: unknown) => {
    if (!team) return;
    setSaving(true);
    const data = await apiCall(`/api/teams/${team.id}/website/sections/${type}`, 'PUT', { content });
    if (data.section) {
      setSections(prev => {
        const idx = prev.findIndex(s => s.sectionType === type);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = data.section;
          return next;
        }
        return [...prev, data.section];
      });
    }
    setSaving(false);
    setHasUnsavedChanges(false);
  }, [team, apiCall]);

  const debouncedSave = useCallback((type: WebsiteSectionType, content: unknown) => {
    const timers = saveTimersRef.current;
    if (timers.has(type)) clearTimeout(timers.get(type)!);
    pendingContentRef.current.set(type, content);
    timers.set(type, setTimeout(() => {
      timers.delete(type);
      pendingContentRef.current.delete(type);
      saveSectionContent(type, content);
    }, 1500));
  }, [saveSectionContent]);

  const saveAllNow = useCallback(async () => {
    // Cancel all pending debounced saves
    saveTimersRef.current.forEach(timer => clearTimeout(timer));
    saveTimersRef.current.clear();
    setSaving(true);
    for (const type of sectionOrder) {
      // Use pending (freshest) content, then fall back to state, then defaults
      const pending = pendingContentRef.current.get(type);
      const fromState = sections.find(s => s.sectionType === type)?.content;
      const content = pending || fromState || DEFAULTS[type];
      await saveSectionContent(type, content);
    }
    pendingContentRef.current.clear();
    setSaving(false);
    setHasUnsavedChanges(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  }, [sectionOrder, sections, saveSectionContent]);

  // ── Beforeunload guard ────────────────────────────────────────

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // ── Section management ──────────────────────────────────────────

  const getSectionContent = (type: WebsiteSectionType) => {
    const section = sections.find(s => s.sectionType === type);
    return section?.content || DEFAULTS[type];
  };

  const updateSectionContent = (type: WebsiteSectionType, content: unknown) => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.sectionType === type);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], content: content as TeamWebsiteSection['content'] };
        return next;
      }
      return [...prev, { id: '', teamId: team?.id || '', sectionType: type, content: content as TeamWebsiteSection['content'], createdAt: '', updatedAt: '' }];
    });
    setHasUnsavedChanges(true);
    debouncedSave(type, content);
  };

  const addSection = (type: WebsiteSectionType, atIndex?: number) => {
    if (sectionOrder.includes(type)) return;
    const newOrder = [...sectionOrder];
    if (atIndex !== undefined) {
      newOrder.splice(atIndex, 0, type);
    } else {
      newOrder.push(type);
    }
    setSectionOrder(newOrder);
    saveWebsiteConfig({ sectionOrder: newOrder } as Partial<TeamWebsite>);
    saveSectionContent(type, DEFAULTS[type]);
    setShowAddSection(null);
  };

  const removeSection = (type: WebsiteSectionType) => {
    const newOrder = sectionOrder.filter(t => t !== type);
    setSectionOrder(newOrder);
    saveWebsiteConfig({ sectionOrder: newOrder } as Partial<TeamWebsite>);
    if (editingSection === type) setEditingSection(null);
  };

  const moveSection = (type: WebsiteSectionType, direction: 'up' | 'down') => {
    const idx = sectionOrder.indexOf(type);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sectionOrder.length) return;
    const newOrder = [...sectionOrder];
    [newOrder[idx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[idx]];
    setSectionOrder(newOrder);
    saveWebsiteConfig({ sectionOrder: newOrder } as Partial<TeamWebsite>);
  };

  // ── Slug ────────────────────────────────────────────────────────

  const saveSlug = async () => {
    if (!team || !slug.trim()) return;
    setSaving(true);
    const data = await apiCall(`/api/teams/${team.id}/website/slug`, 'PUT', { slug: slug.trim() });
    if (data.error) {
      toast.error(data.error);
    } else {
      setSlugSaved(true);
      setTimeout(() => setSlugSaved(false), 2000);
    }
    setSaving(false);
  };

  // ── Publish ─────────────────────────────────────────────────────

  const togglePublish = async () => {
    if (!team || !website) return;
    if (!website.published && !slug) {
      toast.warning('Nejdřív nastavte URL adresu webu');
      return;
    }
    setPublishing(true);
    const data = await apiCall(`/api/teams/${team.id}/website/publish`, 'POST', {
      published: !website.published,
    });
    if (data.error) {
      toast.error(data.error);
    } else {
      setWebsite(prev => prev ? { ...prev, published: data.published } : prev);
    }
    setPublishing(false);
  };

  // ── Render section in preview ───────────────────────────────────

  const renderPreviewSection = (type: WebsiteSectionType) => {
    const primaryColor = website?.primaryColor || '#3B82F6';

    switch (type) {
      case 'hero':
        return (
          <HeroSection
            content={getSectionContent('hero') as HeroContent}
            teamName={team?.teamName || ''}
            logo={team?.logo}
            primaryColor={primaryColor}
            isEditing={true}
            onContentChange={(c) => updateSectionContent('hero', c)}
          />
        );
      case 'team':
        return (
          <TeamSection
            content={getSectionContent('team') as TeamMembersContent}
            players={players}
            primaryColor={primaryColor}
          />
        );
      case 'events':
        return (
          <EventsSection
            content={getSectionContent('events') as EventsContent}
            events={events}
            primaryColor={primaryColor}
          />
        );
      case 'contact':
        return (
          <ContactSection
            content={getSectionContent('contact') as ContactContent}
            primaryColor={primaryColor}
          />
        );
      case 'about':
        return (
          <AboutSection
            content={getSectionContent('about') as AboutContent}
            primaryColor={primaryColor}
          />
        );
      case 'gallery':
        return (
          <GallerySection
            content={getSectionContent('gallery') as GalleryContent}
            primaryColor={primaryColor}
          />
        );
      case 'textblock':
        return (
          <TextBlockSection
            content={getSectionContent('textblock') as TextBlockContent}
            primaryColor={primaryColor}
          />
        );
      default:
        return null;
    }
  };

  // ── Apply template ────────────────────────────────────────────────

  const applyTemplate = async (template: Template) => {
    if (!team) return;
    setSectionOrder(template.sectionOrder);
    setShowTemplates(false);

    // Save website config
    await saveWebsiteConfig({ sectionOrder: template.sectionOrder } as Partial<TeamWebsite>);

    // Save each section content
    for (const [type, content] of Object.entries(template.sectionContents)) {
      await saveSectionContent(type as WebsiteSectionType, content);
    }
  };

  // ── Render editor in drawer ─────────────────────────────────────

  const renderEditor = () => {
    if (!editingSection || !team) return null;

    switch (editingSection) {
      case 'hero':
        return (
          <HeroEditor
            content={getSectionContent('hero') as HeroContent}
            onChange={(c) => updateSectionContent('hero', c)}
            teamId={team.id}
            teamName={team.teamName}
          />
        );
      case 'team':
        return (
          <TeamEditor
            content={getSectionContent('team') as TeamMembersContent}
            onChange={(c) => updateSectionContent('team', c)}
            teamId={team.id}
            players={players}
          />
        );
      case 'events':
        return (
          <EventsEditor
            content={getSectionContent('events') as EventsContent}
            onChange={(c) => updateSectionContent('events', c)}
          />
        );
      case 'contact':
        return (
          <ContactEditor
            content={getSectionContent('contact') as ContactContent}
            onChange={(c) => updateSectionContent('contact', c)}
          />
        );
      case 'about':
        return (
          <AboutEditor
            content={getSectionContent('about') as AboutContent}
            onChange={(c) => updateSectionContent('about', c)}
          />
        );
      case 'gallery':
        return (
          <GalleryEditor
            content={getSectionContent('gallery') as GalleryContent}
            onChange={(c) => updateSectionContent('gallery', c)}
            teamId={team.id}
          />
        );
      case 'textblock':
        return (
          <TextBlockEditor
            content={getSectionContent('textblock') as TextBlockContent}
            onChange={(c) => updateSectionContent('textblock', c)}
          />
        );
      default:
        return null;
    }
  };

  // ── Loading state ───────────────────────────────────────────────

  if (loading) {
    const loaderIcons = [
      // Trophy
      <svg key="trophy" className="w-7 h-7" fill="none" stroke="#3B82F6" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0019.875 10.875 3.375 3.375 0 0016.5 7.5h0V3.75h-9V7.5h0a3.375 3.375 0 00-3.375 3.375A3.375 3.375 0 007.5 14.25v4.5m9-12.75h-9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25v4.5" />
      </svg>,
      // Rocket
      <svg key="rocket" className="w-7 h-7" fill="none" stroke="#3B82F6" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>,
      // Star
      <svg key="star" className="w-7 h-7" fill="none" stroke="#3B82F6" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>,
    ];
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          {/* Floating icons */}
          <div className="flex items-center gap-6">
            {loaderIcons.map((icon, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: [0, 1, 1, 0.3],
                  y: [20, 0, -8, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: 'easeInOut',
                }}
              >
                {icon}
              </motion.div>
            ))}
          </div>

          {/* MyPitch branding */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              My<span className="text-blue-500">Pitch</span>
            </h2>
            <p className="text-foreground/30 text-xs mt-1">Načítám builder...</p>
          </div>

          {/* Slider bar */}
          <div className="w-48 relative">
            <div className="h-2 rounded-full bg-foreground/[0.08]" />
            <motion.div
              className="absolute top-0 left-0 h-2 rounded-full"
              style={{ background: 'linear-gradient(90deg, #3B82F6, #6366F1)' }}
              initial={{ width: '0%' }}
              animate={{ width: ['0%', '70%', '40%', '100%', '100%'] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            {/* Thumb */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
              style={{
                background: '#3B82F6',
                border: '2px solid rgba(99, 102, 241, 0.8)',
                boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2), 0 2px 12px rgba(0, 0, 0, 0.3)',
              }}
              initial={{ left: '0%' }}
              animate={{ left: ['0%', '70%', '40%', '100%', '100%'] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!team) return null;

  const availableSections = ALL_SECTION_TYPES.filter(t => !sectionOrder.includes(t));
  const primaryColor = website?.primaryColor || '#3B82F6';

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-9 h-9 glass-card text-foreground/90 rounded-xl border border-border hover:bg-surface flex items-center justify-center shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold text-foreground hidden sm:block">Týmový web</h1>
            <button
              onClick={() => setShowTemplates(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface border border-border text-foreground/60 hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Šablony
            </button>
            <button
              onClick={saveAllNow}
              disabled={saving || (!hasUnsavedChanges && !saving)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                saving
                  ? 'bg-blue-500/10 text-blue-400 animate-pulse cursor-wait'
                  : justSaved
                  ? 'bg-green-500/15 text-green-500 border border-green-500/30'
                  : hasUnsavedChanges
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'
                  : 'bg-surface border border-border text-foreground/30 cursor-default'
              }`}
            >
              {saving ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Ukládám…
                </>
              ) : justSaved ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Uloženo
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Uložit verzi
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Uloženo
                </>
              )}
            </button>
          </div>

          {/* Center: Slug */}
          <div className="flex items-center gap-2 flex-1 max-w-md mx-auto">
            <div className="flex items-center glass-input rounded-lg px-3 text-sm flex-1">
              <span className="text-foreground/30 shrink-0 text-xs">/t/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                  setSlugSaved(false);
                }}
                placeholder="vas-tym"
                className="bg-transparent outline-none text-foreground w-full py-1.5 text-sm"
              />
            </div>
            <button
              onClick={saveSlug}
              disabled={saving || !slug.trim()}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                slugSaved
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
              }`}
            >
              {slugSaved ? '✓' : 'Uložit URL'}
            </button>
          </div>

          {/* Right: Color + Publish + Open */}
          <div className="flex items-center gap-2">
            {/* Color picker */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-surface transition-colors"
                title="Barva"
              >
                <div
                  className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                />
              </button>
              {showColorPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 glass-card rounded-xl p-3 border border-border shadow-xl">
                    <label className="block text-foreground/60 text-xs mb-2">Hlavní barva</label>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => {
                        setWebsite(prev => prev ? { ...prev, primaryColor: e.target.value } : prev);
                        const colorTimer = saveTimersRef.current.get('__color');
                        if (colorTimer) clearTimeout(colorTimer);
                        saveTimersRef.current.set('__color', setTimeout(() => {
                          saveTimersRef.current.delete('__color');
                          saveWebsiteConfig({ primaryColor: e.target.value } as Partial<TeamWebsite>);
                        }, 500));
                      }}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-border"
                    />
                    <span className="block text-foreground/40 text-xs font-mono mt-1 text-center">
                      {primaryColor}
                    </span>
                  </div>
                </>
              )}
            </div>

            {slug && website?.published && (
              <a
                href={`/t/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Otevřít
              </a>
            )}

            <button
              onClick={togglePublish}
              disabled={publishing}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                website?.published
                  ? 'bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {publishing ? '...' : website?.published ? '✓ Publikováno' : 'Publikovat'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Live Preview ─────────────────────────────────────── */}
      <div className="pb-8">
        <div className="max-w-5xl mx-auto mt-6 px-4">
          {/* Preview container - styled like a browser window */}
          <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white">
            {/* Browser chrome bar */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded-md px-3 py-1 text-xs text-slate-400 text-center border border-slate-200">
                  {slug ? `mypitch.cz/t/${slug}` : 'mypitch.cz/t/vas-tym'}
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="min-h-[400px]" style={{ fontFamily: "'Inter', 'Manrope', sans-serif" }}>
              {sectionOrder.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                  <div className="text-5xl mb-4 opacity-30">🌐</div>
                  <h2 className="text-xl font-semibold text-slate-300 mb-2">Prázdný web</h2>
                  <p className="text-slate-400 text-sm max-w-md mb-6">
                    Přidejte sekce kliknutím na tlačítko níže a začněte tvořit web svého týmu.
                  </p>
                  {availableSections.length > 0 && (
                    <button
                      onClick={() => setShowAddSection(0)}
                      className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      + Přidat první sekci
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* "Add section" divider before first section */}
                  {availableSections.length > 0 && (
                    <div className="flex justify-center py-1 relative z-10">
                      <button
                        onClick={() => setShowAddSection(0)}
                        className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-medium opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity shadow-lg"
                      >
                        + Přidat sekci
                      </button>
                    </div>
                  )}
                  {sectionOrder.map((type, idx) => (
                    <div key={type}>
                      <EditableSection
                        type={type}
                        isActive={editingSection === type}
                        isFirst={idx === 0}
                        isLast={idx === sectionOrder.length - 1}
                        onEdit={() => setEditingSection(editingSection === type ? null : type)}
                        onRemove={() => removeSection(type)}
                        onMoveUp={() => moveSection(type, 'up')}
                        onMoveDown={() => moveSection(type, 'down')}
                      >
                        {renderPreviewSection(type)}
                      </EditableSection>
                      {/* "Add section" divider after each section */}
                      {availableSections.length > 0 && (
                        <div className="flex justify-center py-1 relative z-10">
                          <button
                            onClick={() => setShowAddSection(idx + 1)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-medium opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity shadow-lg"
                          >
                            + Přidat sekci
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* Footer preview */}
              {sectionOrder.length > 0 && (
                <footer className="py-8 px-6 border-t border-slate-100">
                  <div className="max-w-5xl mx-auto text-center">
                    <p className="text-slate-400 text-sm">
                      {team.teamName} &middot; Vytvořeno na{' '}
                      <span style={{ color: primaryColor }}>MyPitch</span>
                    </p>
                  </div>
                </footer>
              )}
            </div>
          </div>

          {/* Add section button below preview (fallback) */}
          {availableSections.length > 0 && sectionOrder.length > 0 && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowAddSection(sectionOrder.length)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-background text-foreground/60 hover:text-blue-500 hover:border-blue-400 hover:bg-blue-500/5 transition-all text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Přidat sekci
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Section Drawer ───────────────────────────────────── */}
      <SectionDrawer
        open={editingSection !== null}
        sectionType={editingSection}
        onClose={() => setEditingSection(null)}
      >
        {renderEditor()}
      </SectionDrawer>

      {/* ── Add section modal (envelope.so style) ────────── */}
      {showAddSection !== null && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddSection(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-2xl border border-border shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-foreground">Přidat sekci</h3>
                <button onClick={() => setShowAddSection(null)} className="text-foreground/30 hover:text-foreground text-xl">✕</button>
              </div>
              <div className="space-y-2">
                {ALL_SECTION_TYPES.map(type => {
                  const isUsed = sectionOrder.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => !isUsed && addSection(type, showAddSection)}
                      disabled={isUsed}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${
                        isUsed
                          ? 'border-border/50 bg-surface/50 opacity-50 cursor-not-allowed'
                          : 'border-border bg-surface hover:border-blue-400 hover:bg-blue-500/5'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-background flex items-center justify-center text-xl shrink-0 ${
                        !isUsed ? 'group-hover:scale-110' : ''
                      } transition-transform`}>
                        {SECTION_ICONS[type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold transition-colors ${
                          isUsed ? 'text-foreground/40' : 'text-foreground group-hover:text-blue-500'
                        }`}>
                          {SECTION_LABELS[type]}
                        </p>
                        <p className="text-foreground/40 text-xs leading-relaxed">
                          {SECTION_DESCRIPTIONS[type]}
                        </p>
                      </div>
                      {isUsed && (
                        <span className="text-xs text-foreground/30 bg-foreground/5 px-2 py-1 rounded-lg shrink-0">
                          Přidáno
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Template picker modal ──────────────────────────── */}
      {showTemplates && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowTemplates(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-foreground">Vyberte šablonu</h3>
                <button onClick={() => setShowTemplates(false)} className="text-foreground/30 hover:text-foreground text-xl">✕</button>
              </div>
              <div className="space-y-3">
                {TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => applyTemplate(tpl)}
                    className="w-full text-left p-4 rounded-xl border border-border bg-surface hover:border-blue-400 hover:bg-blue-500/5 transition-all group"
                  >
                    <p className="text-foreground font-semibold group-hover:text-blue-500 transition-colors">{tpl.name}</p>
                    <p className="text-foreground/40 text-sm mt-0.5">{tpl.description}</p>
                    <div className="flex gap-1.5 mt-2">
                      {tpl.sectionOrder.map((s) => (
                        <span key={s} className="text-xs bg-foreground/5 text-foreground/50 px-2 py-0.5 rounded-md">
                          {SECTION_LABELS[s]}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-foreground/30 text-xs mt-4 text-center">
                Šablona přepíše aktuální sekce a jejich obsah
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
