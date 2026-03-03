'use client';

import type { PublicWebsiteData, HeroContent, TeamMembersContent, EventsContent, ContactContent, AboutContent, GalleryContent, TextBlockContent, FanVotingContent, LastMatchContent, WebsiteSectionType } from '@/lib/db-website';
import { HeroSection } from './HeroSection';
import { TeamSection } from './TeamSection';
import { EventsSection } from './EventsSection';
import { ContactSection } from './ContactSection';
import { AboutSection } from './AboutSection';
import { GallerySection } from './GallerySection';
import { TextBlockSection } from './TextBlockSection';
import { FanVotingSection } from './FanVotingSection';
import { LastMatchSection } from './LastMatchSection';

interface Props {
  data: PublicWebsiteData;
  slug?: string;
}

export function TeamWebsite({ data, slug: slugProp }: Props) {
  const { team, website, sections, events, players, slug: dataSlug, lastMatch } = data;
  const slug = slugProp || dataSlug;
  const sectionMap = new Map(sections.map((s) => [s.sectionType, s]));

  const renderSection = (type: WebsiteSectionType) => {
    const section = sectionMap.get(type);
    if (!section) return null;

    switch (type) {
      case 'hero':
        return (
          <HeroSection
            key="hero"
            content={section.content as HeroContent}
            teamName={team.teamName}
            logo={team.logo}
            primaryColor={website.primaryColor}
          />
        );
      case 'team':
        return (
          <TeamSection
            key="team"
            content={section.content as TeamMembersContent}
            players={players}
            primaryColor={website.primaryColor}
          />
        );
      case 'events':
        return (
          <EventsSection
            key="events"
            content={section.content as EventsContent}
            events={events}
            primaryColor={website.primaryColor}
          />
        );
      case 'contact':
        return (
          <ContactSection
            key="contact"
            content={section.content as ContactContent}
            primaryColor={website.primaryColor}
          />
        );
      case 'about':
        return (
          <AboutSection
            key="about"
            content={section.content as AboutContent}
            primaryColor={website.primaryColor}
          />
        );
      case 'gallery':
        return (
          <GallerySection
            key="gallery"
            content={section.content as GalleryContent}
            primaryColor={website.primaryColor}
          />
        );
      case 'textblock':
        return (
          <TextBlockSection
            key="textblock"
            content={section.content as TextBlockContent}
            primaryColor={website.primaryColor}
          />
        );
      case 'fan-voting':
        return (
          <FanVotingSection
            key="fan-voting"
            content={section.content as FanVotingContent}
            lastMatch={data.lastMatch ?? undefined}
            players={players}
            primaryColor={website.primaryColor}
            teamName={team.teamName}
            slug={slug}
          />
        );
      case 'lastMatch':
        return (
          <LastMatchSection
            key="lastMatch"
            content={section.content as LastMatchContent}
            lastMatch={lastMatch ?? null}
            players={players}
            primaryColor={website.primaryColor}
            slug={slug}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', 'Manrope', sans-serif" }}>
      {website.sectionOrder.map(renderSection)}

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-100">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-slate-400 text-sm">
            {team.teamName} &middot; Vytvořeno na{' '}
            <a
              href="/"
              className="hover:underline"
              style={{ color: website.primaryColor }}
            >
              MyPitch
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
