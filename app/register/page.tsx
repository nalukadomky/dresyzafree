'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LEAGUES = [
  'Česká fotbalová liga',
  'Česká hokejová liga',
  '1. fotbalová liga',
  '2. fotbalová liga',
  'Extraliga',
  '1. liga',
  'Jiná liga',
];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    teamName: '',
    contactPerson: '',
    phone: '',
    email: '',
    leagues: [] as string[],
    username: '',
    password: '',
    confirmPassword: '',
    referrerId: '', // ID týmu, který doporučil
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLeagueToggle = (league: string) => {
    setFormData(prev => ({
      ...prev,
      leagues: prev.leagues.includes(league)
        ? prev.leagues.filter(l => l !== league)
        : [...prev.leagues, league],
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validace typu souboru
      if (!file.type.startsWith('image/')) {
        setError('Soubor musí být obrázek');
        return;
      }
      // Validace velikosti (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Obrázek musí být menší než 5MB');
        return;
      }
      setLogoFile(file);
      // Vytvoření preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validace
    if (!formData.teamName || !formData.contactPerson || !formData.phone || 
        !formData.email || formData.leagues.length === 0 || 
        !formData.username || !formData.password) {
      setError('Vyplňte prosím všechna povinná pole');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Hesla se neshodují');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Heslo musí mít alespoň 6 znaků');
      setLoading(false);
      return;
    }

    try {
      // Nejdřív nahrát logo, pokud je vybráno
      let logoPath = '';
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('logo', logoFile);
        const logoResponse = await fetch('/api/upload-logo', {
          method: 'POST',
          body: logoFormData,
        });
        const logoData = await logoResponse.json();
        if (!logoResponse.ok) {
          setError(logoData.error || 'Chyba při nahrávání loga');
          setLoading(false);
          return;
        }
        logoPath = logoData.logoPath;
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamName: formData.teamName,
          contactPerson: formData.contactPerson,
          phone: formData.phone,
          email: formData.email,
          leagues: formData.leagues,
          username: formData.username,
          password: formData.password,
          logo: logoPath,
          referrerId: formData.referrerId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Chyba při registraci');
        setLoading(false);
        return;
      }

      // Úspěšná registrace - přesměrování na přihlášení
      router.push('/login/team?registered=true');
    } catch (err) {
      setError('Chyba při komunikaci se serverem');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-background flex items-center justify-center py-12 px-4">
      {/* Tlačítko zpět */}
      <Link
        href="/"
        className="fixed top-4 left-4 px-4 py-2 glass-card text-white rounded-xl border border-white/20 transition-all duration-300 hover:scale-105 hover:border-white/40 flex items-center space-x-2 z-10 shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Zpět</span>
      </Link>

      <div className="max-w-2xl w-full glass-card rounded-3xl shadow-2xl p-8 md:p-12 relative z-10 fade-in-up">
        <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">
          Registrace týmu
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo týmu */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Logo týmu (volitelné)
            </label>
            <div className="space-y-3">
              {logoPreview && (
                <div className="flex justify-center">
                  <img
                    src={logoPreview}
                    alt="Náhled loga"
                    className="w-32 h-32 object-cover rounded-full border-4 border-white/30"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="w-full px-4 py-3 rounded-lg bg-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <p className="text-white/60 text-sm">Maximální velikost: 5MB</p>
            </div>
          </div>

          {/* Název týmu */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Název týmu *
            </label>
            <input
              type="text"
              value={formData.teamName}
              onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-white/50 focus:outline-none"
              placeholder="Název vašeho týmu"
              required
            />
          </div>

          {/* Kontaktní osoba */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Kontaktní osoba *
            </label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-white/50 focus:outline-none"
              placeholder="Jméno kontaktní osoby"
              required
            />
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Telefon *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-white/50 focus:outline-none"
              placeholder="+420 123 456 789"
              required
            />
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-white font-semibold mb-2">
              E-mail *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-white/50 focus:outline-none"
              placeholder="email@example.com"
              required
            />
          </div>

          {/* Ligy */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Sledované ligy * (vyberte alespoň jednu)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {LEAGUES.map((league) => (
                <label
                  key={league}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.leagues.includes(league)}
                    onChange={() => handleLeagueToggle(league)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-white">{league}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Uživatelské jméno */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Přihlašovací jméno *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-white/50 focus:outline-none"
              placeholder="Vyberte si uživatelské jméno"
              required
            />
          </div>

          {/* Heslo */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Heslo *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-white/50 focus:outline-none"
              placeholder="Minimálně 6 znaků"
              required
            />
          </div>

          {/* Potvrzení hesla */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Potvrzení hesla *
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-white/50 focus:outline-none"
              placeholder="Zadejte heslo znovu"
              required
            />
          </div>

          {/* ID doporučujícího týmu */}
          <div>
            <label className="block text-white font-semibold mb-2">
              ID doporučujícího týmu (volitelné)
            </label>
            <input
              type="text"
              value={formData.referrerId}
              onChange={(e) => setFormData({ ...formData, referrerId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-white/50 focus:outline-none"
              placeholder="Zadejte ID týmu, který vás doporučil"
            />
            <p className="text-white/60 text-sm mt-1">
              Pokud vás doporučil jiný tým, zadejte jeho ID
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-lg rounded-2xl shadow-[0_0_25px_rgba(59,130,246,0.4)] transform transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(59,130,246,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 modern-button relative overflow-hidden"
          >
            <span className="relative z-10">{loading ? 'Registruji...' : 'Registrovat tým'}</span>
          </button>

        </form>
      </div>
    </div>
  );
}

