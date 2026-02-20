'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Team } from '@/lib/db';
import { GhostAdmin } from '@/components/GhostLoader';
import { MotionItem, MotionPage } from '@/components/Motion';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [referrerFilter, setReferrerFilter] = useState<string>('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');

    if (!token || userType !== 'admin') {
      router.push('/login');
      return;
    }

    fetchTeams(token);
  }, [router]);

  const fetchTeams = async (token: string) => {
    try {
      const response = await fetch('/api/admin/teams', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userType');
          router.push('/login');
          return;
        }
        throw new Error('Chyba při načítání týmů');
      }

      const data = await response.json();
      setTeams(data.teams);
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (team: Team) => {
    setEditingTeam({ ...team });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingTeam) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/admin/teams/${editingTeam.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamName: editingTeam.teamName,
          contactPerson: editingTeam.contactPerson,
          phone: editingTeam.phone,
          email: editingTeam.email,
          leagues: editingTeam.leagues,
          status: editingTeam.status,
          numberOfJerseys: editingTeam.numberOfJerseys,
          numberOfTariffs: editingTeam.numberOfTariffs,
          deadline: editingTeam.deadline,
          tariffValidUntil: editingTeam.tariffValidUntil,
          jerseyUrl: editingTeam.jerseyUrl,
          shortsUrl: editingTeam.shortsUrl,
          socksUrl: editingTeam.socksUrl,
          deliveryAddress: editingTeam.deliveryAddress,
          ico: editingTeam.ico,
          meetingNote: editingTeam.meetingNote,
        }),
      });

      if (!response.ok) {
        throw new Error('Chyba při ukládání');
      }

      await fetchTeams(token!);
      setShowEditModal(false);
      setEditingTeam(null);
    } catch (err: any) {
      console.error('Error saving team:', err);
      const errorMessage = err?.message || 'Chyba při ukládání změn';
      alert(errorMessage);
    }
  };

  const handleDeleteClick = (teamId: string) => {
    setDeletingTeamId(teamId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTeamId) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/admin/teams/${deletingTeamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Chyba při mazání');
      }

      await fetchTeams(token!);
      setShowDeleteConfirm(false);
      setDeletingTeamId(null);
    } catch (err: any) {
      console.error('Error deleting team:', err);
      const errorMessage = err?.message || 'Chyba při mazání týmu';
      alert(errorMessage);
    }
  };

  const handleStatusChange = async (teamId: string, newStatus: 'nekontaktováno' | 'kontaktováno' | 'nemá zájem' | 'deal' | '') => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Chyba při změně stavu');
      }

      await fetchTeams(token!);
    } catch (err) {
      console.error('Error changing status:', err);
      alert('Chyba při změně stavu');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    router.push('/');
  };

  // Filtrování týmů
  const filteredTeams = teams.filter((team) => {
    // Filtrování podle názvu týmu
    const matchesSearch = team.teamName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filtrování podle stavu
    const matchesStatus = statusFilter === 'all' || team.status === statusFilter || 
      (statusFilter === 'none' && !team.status);
    
    // Filtrování podle doporučení
    let matchesReferrer = true;
    if (referrerFilter === 'with') {
      matchesReferrer = !!team.referrerId;
    } else if (referrerFilter === 'without') {
      matchesReferrer = !team.referrerId;
    } else if (referrerFilter !== 'all') {
      // Filtrování podle konkrétního týmu, který doporučil
      matchesReferrer = team.referrerId === referrerFilter;
    }
    
    return matchesSearch && matchesStatus && matchesReferrer;
  });

  if (loading) {
    return (
      <div className="min-h-screen animated-background py-12 px-4 flex items-start justify-center">
        <GhostAdmin />
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-background py-12 px-4">
      {/* Tlačítko zpět */}
      <motion.div className="fixed top-4 left-4 z-10" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
        <Link
          href="/"
          className="px-4 py-2.5 glass-card text-foreground/90 rounded-xl border border-border transition-all duration-200 hover:bg-surface hover:text-foreground flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Zpět</span>
        </Link>
      </motion.div>

      <MotionPage className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Správa týmů
          </h1>
          <motion.button
            onClick={handleLogout}
            className="px-6 py-2.5 bg-red-500/90 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-red-500/30"
            whileHover={{ y: -1.5, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Odhlásit se
          </motion.button>
        </div>

        {/* Filtry a vyhledávání */}
        <MotionItem delay={0.04}>
          <motion.div className="glass-card rounded-2xl shadow-2xl p-4 sm:p-6 mb-6" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Vyhledávání */}
            <div className="flex-1">
              <label className="block text-foreground font-semibold mb-2">
                Vyhledat tým
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zadejte název týmu..."
                className="w-full px-4 py-2 rounded-lg glass-input text-foreground placeholder-muted-foreground focus:outline-none"
              />
            </div>
            
            {/* Filtr podle stavu */}
            <div className="md:w-64">
              <label className="block text-foreground font-semibold mb-2">
                Filtr podle stavu
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full rounded-lg glass-input text-foreground focus:ring-2 focus:ring-blue-400">
                  <SelectValue placeholder="Filtr stavu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny stavy</SelectItem>
                  <SelectItem value="nekontaktováno">Nekontaktováno</SelectItem>
                  <SelectItem value="kontaktováno">Kontaktováno</SelectItem>
                  <SelectItem value="nemá zájem">Nemá zájem</SelectItem>
                  <SelectItem value="deal">Deal</SelectItem>
                  <SelectItem value="none">Bez stavu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Filtr podle doporučení */}
            <div className="md:w-64">
              <label className="block text-foreground font-semibold mb-2">
                Filtr podle doporučení
              </label>
              <Select value={referrerFilter} onValueChange={setReferrerFilter}>
                <SelectTrigger className="w-full rounded-lg glass-input text-foreground focus:ring-2 focus:ring-blue-400">
                  <SelectValue placeholder="Filtr doporučení" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny týmy</SelectItem>
                  <SelectItem value="with">S doporučením</SelectItem>
                  <SelectItem value="without">Bez doporučení</SelectItem>
                  {teams.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Doporučil konkrétní tým</SelectLabel>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.teamName} (ID: {team.id})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Počet výsledků */}
          <div className="mt-4 text-foreground/60 text-sm">
            Zobrazeno {filteredTeams.length} z {teams.length} týmů
          </div>
          </motion.div>
        </MotionItem>

        {/* Tabulka týmů */}
        <MotionItem delay={0.08}>
          <motion.div className="glass-card rounded-2xl shadow-2xl p-4 sm:p-6 overflow-x-auto" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <table className="w-full text-foreground">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4">ID</th>
                <th className="text-left p-4">Logo</th>
                <th className="text-left p-4">Název týmu</th>
                <th className="text-left p-4">Kontaktní osoba</th>
                <th className="text-left p-4">E-mail</th>
                <th className="text-left p-4">Telefon</th>
                <th className="text-left p-4">Ligy</th>
                <th className="text-left p-4">Doporučil</th>
                <th className="text-left p-4">Stav</th>
                <th className="text-left p-4">Počet dresů</th>
                <th className="text-left p-4">Počet tarifů</th>
                <th className="text-left p-4">Dodání dresů</th>
                <th className="text-left p-4">Tarify platné do</th>
                <th className="text-left p-4">Typ dresů</th>
                <th className="text-left p-4">Akce</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((team) => {
                const referrerTeam = team.referrerId ? teams.find(t => t.id === team.referrerId) : null;
                return (
                <motion.tr
                  key={team.id}
                  className="border-b border-border/70"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ backgroundColor: 'rgba(148, 163, 184, 0.08)' }}
                >
                  <td className="p-4">
                    <span className="text-foreground/60 text-xs font-mono">{team.id}</span>
                  </td>
                  <td className="p-4">
                    {team.logo ? (
                      <img
                        src={team.logo}
                        alt={`${team.teamName} logo`}
                        className="w-12 h-12 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-foreground/50 text-xs">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="p-4">{team.teamName}</td>
                  <td className="p-4">{team.contactPerson}</td>
                  <td className="p-4">{team.email}</td>
                  <td className="p-4">{team.phone}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {team.leagues.map((league, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-600/30 rounded text-xs"
                        >
                          {league}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    {referrerTeam ? (
                      <div className="flex flex-col">
                        <span className="text-foreground text-sm">{referrerTeam.teamName}</span>
                        <span className="text-foreground/60 text-xs font-mono">ID: {team.referrerId}</span>
                      </div>
                    ) : (
                      <span className="text-foreground/40 text-sm">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <Select
                      value={team.status || 'nekontaktováno'}
                      onValueChange={(value) => handleStatusChange(team.id, value as 'nekontaktováno' | 'kontaktováno' | 'nemá zájem' | 'deal' | '')}
                    >
                      <SelectTrigger className={`h-8 px-3 py-1.5 rounded-full text-xs font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer transition-colors ${
                        team.status === 'deal' ? 'bg-green-600/30 text-green-300 hover:bg-green-600/40' :
                        team.status === 'kontaktováno' ? 'bg-blue-600/30 text-blue-300 hover:bg-blue-600/40' :
                        team.status === 'nemá zájem' ? 'bg-red-600/30 text-red-300 hover:bg-red-600/40' :
                        team.status === 'nekontaktováno' ? 'bg-gray-600/30 text-gray-300 hover:bg-gray-600/40' :
                        'bg-gray-600/30 text-gray-300 hover:bg-gray-600/40'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nekontaktováno">Nekontaktováno</SelectItem>
                        <SelectItem value="kontaktováno">Kontaktováno</SelectItem>
                        <SelectItem value="nemá zájem">Nemá zájem</SelectItem>
                        <SelectItem value="deal">Deal</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4">{team.numberOfJerseys || '-'}</td>
                  <td className="p-4">{team.numberOfTariffs || '-'}</td>
                  <td className="p-4">
                    {team.deadline
                      ? new Date(team.deadline).toLocaleDateString('cs-CZ')
                      : '-'}
                  </td>
                  <td className="p-4">
                    {team.tariffValidUntil
                      ? new Date(team.tariffValidUntil).toLocaleDateString('cs-CZ')
                      : '-'}
                  </td>
                  <td className="p-4">{team.jerseyType || '-'}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(team)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                      >
                        Upravit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(team.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                      >
                        Smazat
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
              })}
            </tbody>
          </table>

          {filteredTeams.length === 0 && teams.length > 0 && (
            <div className="text-center text-foreground/60 py-8">
              Žádné týmy neodpovídají zadaným filtrům
            </div>
          )}
          
          {teams.length === 0 && (
            <div className="text-center text-foreground/60 py-8">
              Zatím nejsou žádné registrované týmy
            </div>
          )}
          </motion.div>
        </MotionItem>

        {/* Edit Modal */}
        {showEditModal && editingTeam && (
          <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div
              className="glass-card rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Upravit tým: {editingTeam.teamName}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-foreground font-semibold mb-2">
                    Název týmu *
                  </label>
                  <input
                    type="text"
                    value={editingTeam.teamName}
                    onChange={(e) =>
                      setEditingTeam({
                        ...editingTeam,
                        teamName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg glass-input text-foreground focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-2">
                    Kontaktní osoba *
                  </label>
                  <input
                    type="text"
                    value={editingTeam.contactPerson}
                    onChange={(e) =>
                      setEditingTeam({
                        ...editingTeam,
                        contactPerson: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg glass-input text-foreground focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-2">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    value={editingTeam.phone}
                    onChange={(e) =>
                      setEditingTeam({
                        ...editingTeam,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg glass-input text-foreground focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-2">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    value={editingTeam.email}
                    onChange={(e) =>
                      setEditingTeam({
                        ...editingTeam,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg glass-input text-foreground focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-2">
                    Ligy * (oddělte čárkou)
                  </label>
                  <input
                    type="text"
                    value={editingTeam.leagues.join(', ')}
                    onChange={(e) =>
                      setEditingTeam({
                        ...editingTeam,
                        leagues: e.target.value.split(',').map(l => l.trim()).filter(l => l),
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg glass-input text-foreground focus:outline-none"
                    placeholder="Česká fotbalová liga, Česká hokejová liga"
                    required
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-2">
                    Stav
                  </label>
                  <Select
                    value={editingTeam.status || 'nekontaktováno'}
                    onValueChange={(value) =>
                      setEditingTeam({
                        ...editingTeam,
                        status: value as 'nekontaktováno' | 'kontaktováno' | 'nemá zájem' | 'deal' | undefined,
                      })
                    }
                  >
                    <SelectTrigger className="w-full rounded-lg glass-input text-foreground focus:ring-2 focus:ring-blue-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nekontaktováno">Nekontaktováno</SelectItem>
                      <SelectItem value="kontaktováno">Kontaktováno</SelectItem>
                      <SelectItem value="nemá zájem">Nemá zájem</SelectItem>
                      <SelectItem value="deal">Deal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-2">
                    Počet dresů
                  </label>
                  <input
                    type="number"
                    value={editingTeam.numberOfJerseys || ''}
                    onChange={(e) =>
                      setEditingTeam({
                        ...editingTeam,
                        numberOfJerseys: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg glass-input text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-2">
                    Počet tarifů
                  </label>
                  <input
                    type="number"
                    value={editingTeam.numberOfTariffs || ''}
                    onChange={(e) =>
                      setEditingTeam({
                        ...editingTeam,
                        numberOfTariffs: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg glass-input text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-2">
                    Dodání dresů
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      editingTeam.deadline
                        ? new Date(editingTeam.deadline).toISOString().slice(0, 16)
                        : ''
                    }
                    onChange={(e) =>
                      setEditingTeam({
                        ...editingTeam,
                        deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg glass-input text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-2">
                    Tarify platné do
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      editingTeam.tariffValidUntil
                        ? new Date(editingTeam.tariffValidUntil).toISOString().slice(0, 16)
                        : ''
                    }
                    onChange={(e) =>
                      setEditingTeam({
                        ...editingTeam,
                        tariffValidUntil: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : undefined,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg glass-input text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-2">
                    Odkaz na dres
                  </label>
                  <input
                    type="url"
                    value={editingTeam.jerseyUrl || ''}
                    onChange={(e) =>
                      setEditingTeam({
                        ...editingTeam,
                        jerseyUrl: e.target.value || undefined,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg glass-input text-foreground focus:outline-none"
                    placeholder="https://example.com/dres"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-2">
                    Odkaz na trenýrky
                  </label>
                  <input
                    type="url"
                    value={editingTeam.shortsUrl || ''}
                    onChange={(e) =>
                      setEditingTeam({
                        ...editingTeam,
                        shortsUrl: e.target.value || undefined,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg glass-input text-foreground focus:outline-none"
                    placeholder="https://example.com/trenyrky"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-2">
                    Odkaz na štrupny
                  </label>
                  <input
                    type="url"
                    value={editingTeam.socksUrl || ''}
                    onChange={(e) =>
                      setEditingTeam({
                        ...editingTeam,
                        socksUrl: e.target.value || undefined,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg glass-input text-foreground focus:outline-none"
                    placeholder="https://example.com/strupny"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-2">
                    Adresa dodání dresů
                  </label>
                  <textarea
                    value={editingTeam.deliveryAddress || ''}
                    onChange={(e) =>
                      setEditingTeam({
                        ...editingTeam,
                        deliveryAddress: e.target.value || undefined,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg glass-input text-foreground focus:outline-none min-h-[100px]"
                    placeholder="Ulice, číslo popisné, město, PSČ"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-2">
                    IČO
                  </label>
                  <input
                    type="text"
                    value={editingTeam.ico || ''}
                    onChange={(e) =>
                      setEditingTeam({
                        ...editingTeam,
                        ico: e.target.value || undefined,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg glass-input text-foreground focus:outline-none"
                    placeholder="Zadejte IČO"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-2">
                    Poznámka z jednání
                  </label>
                  <textarea
                    value={editingTeam.meetingNote || ''}
                    onChange={(e) =>
                      setEditingTeam({
                        ...editingTeam,
                        meetingNote: e.target.value || undefined,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg glass-input text-foreground focus:outline-none min-h-[150px]"
                    placeholder="Zadejte poznámky z jednání s týmem..."
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <motion.button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Uložit
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTeam(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Zrušit
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div
              className="glass-card rounded-2xl p-8 max-w-md w-full border border-border"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Smazat tým?
              </h2>
              <p className="text-foreground/80 mb-6">
                Opravdu chcete smazat tento tým? Tato akce je nevratná.
              </p>
              <div className="flex gap-4">
                <motion.button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Ano, smazat
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingTeamId(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Zrušit
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </MotionPage>
    </div>
  );
}
