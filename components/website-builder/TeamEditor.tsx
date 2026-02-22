'use client';

import type { TeamMembersContent, TeamMember, SectionVariant } from '@/lib/db-website';
import { ImageUploader } from './ImageUploader';

interface Props {
  content: TeamMembersContent;
  onChange: (c: TeamMembersContent) => void;
  teamId: string;
  players?: { id: string; name: string; jerseyNumber?: number; photoUrl?: string }[];
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-surface">
      <div>
        <p className="text-foreground text-sm font-medium">{label}</p>
        <p className="text-foreground/40 text-xs">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-500' : 'bg-foreground/20'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function VariantPicker({ value, onChange }: { value: SectionVariant | undefined; onChange: (v: SectionVariant) => void }) {
  const variant = value || 'light';
  return (
    <div>
      <label className="block text-foreground/70 text-sm font-medium mb-2">Varianta pozadí</label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange('light')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
            variant === 'light'
              ? 'border-blue-500 bg-blue-500/10 text-blue-500'
              : 'border-border bg-surface text-foreground/50 hover:border-foreground/20'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white border border-slate-200 shrink-0" />
          Light
        </button>
        <button
          type="button"
          onClick={() => onChange('dark')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
            variant === 'dark'
              ? 'border-blue-500 bg-blue-500/10 text-blue-500'
              : 'border-border bg-surface text-foreground/50 hover:border-foreground/20'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-600 shrink-0" />
          Dark
        </button>
      </div>
    </div>
  );
}

function ViewModePicker({ value, onChange }: { value: 'grid' | 'gallery' | undefined; onChange: (v: 'grid' | 'gallery') => void }) {
  const mode = value || 'grid';
  return (
    <div>
      <label className="block text-foreground/70 text-sm font-medium mb-2">Zobrazení</label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange('grid')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
            mode === 'grid'
              ? 'border-blue-500 bg-blue-500/10 text-blue-500'
              : 'border-border bg-surface text-foreground/50 hover:border-foreground/20'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Grid
        </button>
        <button
          type="button"
          onClick={() => onChange('gallery')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
            mode === 'gallery'
              ? 'border-blue-500 bg-blue-500/10 text-blue-500'
              : 'border-border bg-surface text-foreground/50 hover:border-foreground/20'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Galerie
        </button>
      </div>
    </div>
  );
}

/** Shared member editing card */
function MemberCard({
  member,
  onUpdate,
  onRemove,
  teamId,
  rosterName,
}: {
  member: TeamMember;
  onUpdate: (updated: TeamMember) => void;
  onRemove?: () => void;
  teamId: string;
  rosterName?: string;
}) {
  return (
    <div className="flex gap-3 items-start p-3 rounded-xl bg-surface">
      <ImageUploader
        currentUrl={member.photoUrl}
        onUpload={(url) => onUpdate({ ...member, photoUrl: url })}
        teamId={teamId}
        type={`member-${member.id}`}
        compact
      />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex gap-2">
          {rosterName ? (
            <div className="flex-1 glass-input rounded-lg px-3 py-1.5 text-foreground text-sm opacity-60 cursor-default">
              {rosterName}
            </div>
          ) : (
            <input
              type="text"
              value={member.name}
              onChange={(e) => onUpdate({ ...member, name: e.target.value })}
              placeholder="Jméno"
              className="flex-1 glass-input rounded-lg px-3 py-1.5 text-foreground text-sm"
            />
          )}
          <input
            type="text"
            value={member.number || ''}
            onChange={(e) => onUpdate({ ...member, number: e.target.value })}
            placeholder="#"
            className="w-14 glass-input rounded-lg px-2 py-1.5 text-foreground text-sm text-center"
          />
        </div>
        <input
          type="text"
          value={member.role}
          onChange={(e) => onUpdate({ ...member, role: e.target.value })}
          placeholder="Role (trenér, vedoucí...)"
          className="w-full glass-input rounded-lg px-3 py-1.5 text-foreground text-sm"
        />
        <div className="flex gap-2">
          <input
            type="email"
            value={member.email || ''}
            onChange={(e) => onUpdate({ ...member, email: e.target.value })}
            placeholder="Email"
            className="flex-1 glass-input rounded-lg px-3 py-1.5 text-foreground text-sm"
          />
          <input
            type="tel"
            value={member.phone || ''}
            onChange={(e) => onUpdate({ ...member, phone: e.target.value })}
            placeholder="Telefon"
            className="flex-1 glass-input rounded-lg px-3 py-1.5 text-foreground text-sm"
          />
        </div>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-foreground/20 hover:text-red-400 text-xs p-1 mt-1"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function TeamEditor({ content, onChange, teamId, players = [] }: Props) {
  // Helper: get override for a roster player from content.members
  const getOverride = (playerId: string): TeamMember | undefined =>
    content.members.find((m) => m.id === playerId);

  // Helper: update or create override for a roster player
  const updateRosterOverride = (playerId: string, playerName: string, updated: TeamMember) => {
    const existing = content.members.findIndex((m) => m.id === playerId);
    const newMembers = [...content.members];
    if (existing >= 0) {
      newMembers[existing] = updated;
    } else {
      newMembers.push(updated);
    }
    onChange({ ...content, members: newMembers });
  };

  // Manual-only members (IDs not in roster)
  const rosterIds = new Set(players.map((p) => p.id));
  const manualMembers = content.members.filter((m) => !rosterIds.has(m.id));

  return (
    <div className="space-y-4">
      <VariantPicker
        value={content.variant}
        onChange={(v) => onChange({ ...content, variant: v })}
      />
      <ViewModePicker
        value={content.viewMode}
        onChange={(v) => onChange({ ...content, viewMode: v })}
      />
      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-1">Nadpis sekce</label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="Náš tým"
          className="w-full glass-input rounded-xl px-4 py-2.5 text-foreground"
        />
      </div>
      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-1">Popis</label>
        <textarea
          value={content.description}
          onChange={(e) => onChange({ ...content, description: e.target.value })}
          placeholder="Krátký popis o vašem týmu..."
          rows={2}
          className="w-full glass-input rounded-xl px-4 py-2.5 text-foreground resize-none"
        />
      </div>
      <ToggleRow
        label="Automaticky ze soupisky"
        description="Zobrazit hráče z vaší aplikace"
        checked={content.showFromRoster}
        onChange={(v) => onChange({ ...content, showFromRoster: v })}
      />

      {/* Roster players (editable overrides) */}
      {content.showFromRoster && players.length > 0 && (
        <div>
          <label className="text-foreground/70 text-sm font-medium mb-2 block">
            Hráči ze soupisky ({players.length})
          </label>
          <div className="space-y-2">
            {players.map((player) => {
              const override = getOverride(player.id);
              const memberData: TeamMember = {
                id: player.id,
                name: player.name,
                role: override?.role || '',
                number: override?.number || (player.jerseyNumber != null ? String(player.jerseyNumber) : ''),
                photoUrl: override?.photoUrl || player.photoUrl || '',
                email: override?.email || '',
                phone: override?.phone || '',
              };

              return (
                <MemberCard
                  key={player.id}
                  member={memberData}
                  rosterName={player.name}
                  onUpdate={(updated) => updateRosterOverride(player.id, player.name, updated)}
                  teamId={teamId}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Manual members */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-foreground/70 text-sm font-medium">
            {content.showFromRoster ? 'Další členové (vedení, staff...)' : 'Členové týmu'}
          </label>
          <button
            type="button"
            onClick={() => {
              const id = crypto.randomUUID();
              onChange({
                ...content,
                members: [...content.members, { id, name: '', role: '', number: '', photoUrl: '', email: '', phone: '' }],
              });
            }}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            + Přidat
          </button>
        </div>
        <div className="space-y-2">
          {manualMembers.length === 0 && (
            <p className="text-foreground/30 text-xs text-center py-4">
              Zatím žádní další členové
            </p>
          )}
          {manualMembers.map((member) => {
            const idx = content.members.findIndex((m) => m.id === member.id);
            return (
              <MemberCard
                key={member.id}
                member={member}
                onUpdate={(updated) => {
                  const newMembers = [...content.members];
                  newMembers[idx] = updated;
                  onChange({ ...content, members: newMembers });
                }}
                onRemove={() => {
                  onChange({ ...content, members: content.members.filter((m) => m.id !== member.id) });
                }}
                teamId={teamId}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
