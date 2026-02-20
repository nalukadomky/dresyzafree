'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import LoadingSpinner from '@/components/LoadingSpinner';
import { MotionItem, MotionPage } from '@/components/Motion';
import { CZECH_FOOTBALL_CLUBS } from '@/lib/czech-football-clubs';

const PRE_DEFINED_LEAGUES = [
  'Chance liga',
  'Premier League',
  'Bundesliga',
  'Tipsport Extraliga',
  'NBA',
  'NFL',
];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    teamName: '',
    contactPerson: '',
    phone: '',
    email: '',
    leagues: [] as string[],
    otherLeague: '', // Pro jinou ligu
    username: '',
    password: '',
    confirmPassword: '',
    referrerId: '', // ID týmu, který doporučil
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [clubSuggestions, setClubSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLeagueToggle = (league: string) => {
    setFormData(prev => ({
      ...prev,
      leagues: prev.leagues.includes(league)
        ? prev.leagues.filter(l => l !== league)
        : [...prev.leagues, league],
    }));
  };

  // Funkce pro filtrování klubů podle zadaného textu
  const filterClubs = (query: string) => {
    if (!query || query.length < 2) {
      setClubSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = CZECH_FOOTBALL_CLUBS.filter(club =>
      club.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10); // Maximálně 10 návrhů

    setClubSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  // Zavření suggestions při kliknutí mimo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTeamNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, teamName: value });
    
    // Filtrování klubů
    filterClubs(value);
    
    // Odstranění chyby, pokud byla opravena
    if (fieldErrors.teamName) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.teamName;
        return newErrors;
      });
    }
  };

  const handleSuggestionClick = (clubName: string) => {
    setFormData({ ...formData, teamName: clubName });
    setClubSuggestions([]);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validace jednotlivých polí
    if (!formData.teamName.trim()) {
      errors.teamName = 'Název týmu je povinný';
    }
    
    if (!formData.contactPerson.trim()) {
      errors.contactPerson = 'Kontaktní osoba je povinná';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Telefon je povinný';
    } else if (!/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
      errors.phone = 'Telefon obsahuje neplatné znaky';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'E-mail je povinný';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Neplatný formát e-mailu';
    }
    
    // Kontrola, zda je vybrána alespoň jedna liga (buď předdefinovaná, nebo jiná)
    const hasSelectedLeague = formData.leagues.length > 0 || formData.otherLeague.trim().length > 0;
    if (!hasSelectedLeague) {
      errors.leagues = 'Vyberte alespoň jednu ligu nebo zadejte jinou ligu';
    }
    
    if (!formData.username.trim()) {
      errors.username = 'Uživatelské jméno je povinné';
    } else if (formData.username.length < 3) {
      errors.username = 'Uživatelské jméno musí mít alespoň 3 znaky';
    }
    
    if (!formData.password) {
      errors.password = 'Heslo je povinné';
    } else if (formData.password.length < 6) {
      errors.password = 'Heslo musí mít alespoň 6 znaků';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Potvrzení hesla je povinné';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Hesla se neshodují';
    }
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors);
      setError(errorMessages.length === 1 ? errorMessages[0] : `Chyby v ${errorMessages.length} polích: ${errorMessages.join(', ')}`);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    // Validace formuláře
    if (!validateForm()) {
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
        // Zobrazíme konkrétní chybovou zprávu z API
        const errorMessage = data.error || 'Chyba při registraci';
        console.error('Registration error:', errorMessage);
        
        // Pokud API vrátilo fieldErrors, použijeme je
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        } else {
          // Jinak zkusíme identifikovat pole z chybové zprávy
          if (errorMessage.includes('Uživatelské jméno je již obsazené')) {
            setFieldErrors({ username: errorMessage });
          } else if (errorMessage.includes('Neplatné ID doporučujícího týmu')) {
            setFieldErrors({ referrerId: errorMessage });
          } else if (errorMessage.includes('email') || errorMessage.includes('E-mail')) {
            setFieldErrors({ email: errorMessage });
          }
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Auto-login po registraci - bez nutnosti znovu zadávat údaje
      const loginRes = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username, password: formData.password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok && loginData.token) {
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('userType', 'team');
        if (loginData.team) localStorage.setItem('teamId', loginData.team.id);
        router.push('/dashboard');
        return;
      }
      router.push('/login/team?registered=true');
    } catch (err: any) {
      // Zobrazíme konkrétní chybovou zprávu
      const errorMessage = err?.message || 'Chyba při komunikaci se serverem';
      console.error('Registration catch error:', err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-background flex items-center justify-center py-12 px-4">
      {/* Tlačítko zpět */}
      <motion.div className="fixed top-4 left-4 z-10" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
        <Link
          href="/"
          className="px-4 py-2.5 glass-card text-foreground/90 rounded-xl border border-border transition-all duration-200 hover:bg-surface hover:text-foreground flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Zpět</span>
        </Link>
      </motion.div>

      <MotionPage className="max-w-2xl w-full glass-card rounded-2xl p-8 md:p-12 relative z-10">
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground text-center mb-8 tracking-tight">
          Registrace týmu
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Název týmu */}
          <div className="relative">
            <label className="block text-foreground font-semibold mb-2">
              Název týmu *
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={formData.teamName}
                onChange={handleTeamNameChange}
                onFocus={() => {
                  if (formData.teamName.length >= 2) {
                    filterClubs(formData.teamName);
                  }
                }}
                className={`w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder-muted-foreground focus:outline-none ${
                  fieldErrors.teamName ? 'border-2 border-red-500 bg-red-500/10' : ''
                }`}
                placeholder="Začněte psát název klubu..."
                required
                autoComplete="off"
              />
              
              {/* Dropdown s návrhy */}
              {showSuggestions && clubSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 glass-card rounded-xl border border-border max-h-60 overflow-y-auto"
                >
                  {clubSuggestions.map((club, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(club)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-600/20 dark:hover:bg-blue-600/30 transition-colors text-foreground dark:text-white first:rounded-t-xl last:rounded-b-xl border-b border-border last:border-b-0"
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium text-foreground dark:text-white">{club}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {fieldErrors.teamName && (
              <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{fieldErrors.teamName}</span>
              </p>
            )}
            {formData.teamName.length > 0 && formData.teamName.length < 2 && (
              <p className="text-foreground/50 text-xs mt-1">
                Zadejte alespoň 2 znaky pro zobrazení návrhů
              </p>
            )}
          </div>

          {/* Kontaktní osoba */}
          <div>
            <label className="block text-foreground font-semibold mb-2">
              Kontaktní osoba *
            </label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={(e) => {
                setFormData({ ...formData, contactPerson: e.target.value });
                if (fieldErrors.contactPerson) {
                  setFieldErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.contactPerson;
                    return newErrors;
                  });
                }
              }}
              className={`w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder-muted-foreground focus:outline-none ${
                fieldErrors.contactPerson ? 'border-2 border-red-500 bg-red-500/10' : ''
              }`}
              placeholder="Jméno kontaktní osoby"
              required
            />
            {fieldErrors.contactPerson && (
              <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{fieldErrors.contactPerson}</span>
              </p>
            )}
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-foreground font-semibold mb-2">
              Telefon *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value });
                if (fieldErrors.phone) {
                  setFieldErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.phone;
                    return newErrors;
                  });
                }
              }}
              className={`w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder-muted-foreground focus:outline-none ${
                fieldErrors.phone ? 'border-2 border-red-500 bg-red-500/10' : ''
              }`}
              placeholder="+420 123 456 789"
              required
            />
            {fieldErrors.phone && (
              <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{fieldErrors.phone}</span>
              </p>
            )}
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-foreground font-medium mb-2">
              E-mail *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                const email = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  email,
                  username: !prev.username || prev.username === prev.email ? email : prev.username,
                }));
                if (fieldErrors.email) {
                  setFieldErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.email;
                    return newErrors;
                  });
                }
              }}
              className={`w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder-muted-foreground focus:outline-none ${
                fieldErrors.email ? 'border-2 border-red-500 bg-red-500/10' : ''
              }`}
              placeholder="vas@email.cz"
              required
            />
            {fieldErrors.email && (
              <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{fieldErrors.email}</span>
              </p>
            )}
          </div>

          {/* Ligy - kompaktní chips */}
          <div>
            <label className="block text-foreground font-medium mb-2">
              Liga týmu * (vyberte nebo zadejte)
            </label>
            <div className={`space-y-2 ${fieldErrors.leagues ? 'ring-2 ring-red-500/50 rounded-xl p-2' : ''}`}>
              <div className="flex flex-wrap gap-2">
                {PRE_DEFINED_LEAGUES.map((league) => (
                  <button
                    key={league}
                    type="button"
                    onClick={() => {
                      handleLeagueToggle(league);
                      if (fieldErrors.leagues) {
                        setFieldErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.leagues;
                          return newErrors;
                        });
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      formData.leagues.includes(league)
                        ? 'bg-blue-500/30 text-white border border-blue-400/50'
                        : 'bg-surface text-foreground/70 hover:bg-surface-hover border border-border'
                    }`}
                  >
                    {league}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={formData.otherLeague}
                onChange={(e) => {
                  const newOtherLeague = e.target.value;
                  const trimmedOtherLeague = newOtherLeague.trim();
                  const currentPreDefinedLeagues = formData.leagues.filter(l => PRE_DEFINED_LEAGUES.includes(l));
                  if (trimmedOtherLeague) {
                    setFormData(prev => ({
                      ...prev,
                      otherLeague: newOtherLeague,
                      leagues: [...currentPreDefinedLeagues, trimmedOtherLeague]
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      otherLeague: newOtherLeague,
                      leagues: currentPreDefinedLeagues
                    }));
                  }
                  if (fieldErrors.leagues) {
                    setFieldErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.leagues;
                      return newErrors;
                    });
                  }
                }}
                className="w-full px-3 py-2 rounded-lg glass-input text-foreground placeholder-muted-foreground text-sm focus:outline-none"
                placeholder="Nebo zadejte jinou ligu"
              />
            </div>
            {fieldErrors.leagues && (
              <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{fieldErrors.leagues}</span>
              </p>
            )}
          </div>

          {/* Uživatelské jméno - předvyplní se z e-mailu */}
          <div>
            <label className="block text-foreground font-medium mb-2">
              Přihlašovací jméno *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => {
                setFormData({ ...formData, username: e.target.value });
                if (fieldErrors.username) {
                  setFieldErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.username;
                    return newErrors;
                  });
                }
              }}
              className={`w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder-muted-foreground focus:outline-none ${
                fieldErrors.username ? 'border-2 border-red-500 bg-red-500/10' : ''
              }`}
              placeholder="Můžete použít e-mail"
              required
            />
            {fieldErrors.username && (
              <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{fieldErrors.username}</span>
              </p>
            )}
          </div>

          {/* Heslo */}
          <div>
            <label className="block text-foreground font-semibold mb-2">
              Heslo *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => {
                const newPassword = e.target.value;
                setFormData({ ...formData, password: newPassword });
                
                // Odstranění chyby hesla, pokud byla opravena
                if (fieldErrors.password) {
                  setFieldErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.password;
                    return newErrors;
                  });
                }
                
                // Kontrola shody s confirmPassword v reálném čase
                if (formData.confirmPassword) {
                  if (newPassword !== formData.confirmPassword) {
                    // Hesla se neshodují - přidáme chybu
                    setFieldErrors(prev => ({
                      ...prev,
                      confirmPassword: 'Hesla se neshodují'
                    }));
                  } else {
                    // Hesla se shodují - odstraníme chybu
                    setFieldErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.confirmPassword;
                      return newErrors;
                    });
                  }
                }
              }}
              className={`w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder-muted-foreground focus:outline-none ${
                fieldErrors.password ? 'border-2 border-red-500 bg-red-500/10' : ''
              }`}
              placeholder="Minimálně 6 znaků"
              autoComplete="new-password"
              required
            />
            {fieldErrors.password && (
              <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{fieldErrors.password}</span>
              </p>
            )}
          </div>

          {/* Potvrzení hesla */}
          <div>
            <label className="block text-foreground font-semibold mb-2">
              Potvrzení hesla *
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => {
                const newConfirmPassword = e.target.value;
                setFormData({ ...formData, confirmPassword: newConfirmPassword });
                
                // Validace shody hesel v reálném čase
                if (formData.password) {
                  if (newConfirmPassword !== formData.password) {
                    // Hesla se neshodují - přidáme chybu
                    setFieldErrors(prev => ({
                      ...prev,
                      confirmPassword: 'Hesla se neshodují'
                    }));
                  } else {
                    // Hesla se shodují - odstraníme chybu
                    setFieldErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.confirmPassword;
                      return newErrors;
                    });
                  }
                } else if (!newConfirmPassword) {
                  // Pokud je confirmPassword prázdný, odstraníme chybu
                  setFieldErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.confirmPassword;
                    return newErrors;
                  });
                }
              }}
              className={`w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder-muted-foreground focus:outline-none ${
                fieldErrors.confirmPassword ? 'border-2 border-red-500 bg-red-500/10' : ''
              }`}
              placeholder="Zadejte heslo znovu"
              autoComplete="new-password"
              required
            />
            {fieldErrors.confirmPassword && (
              <p className="text-red-400 text-sm mt-1 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{fieldErrors.confirmPassword}</span>
              </p>
            )}
          </div>

          {/* Volitelné - Logo a doporučující kód */}
          <div className="border-t border-border pt-5">
            <button
              type="button"
              onClick={() => setShowOptional(!showOptional)}
              className="text-foreground/60 hover:text-foreground text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <svg className={`w-4 h-4 transition-transform ${showOptional ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showOptional ? 'Skrýt volitelné' : 'Logo a doporučující kód'}
            </button>
            {showOptional && (
              <div className="mt-4 space-y-4 slide-in">
                <div>
                  <label className="block text-foreground/80 font-medium mb-2">Logo týmu</label>
                  <div className="space-y-2">
                    {logoPreview && (
                      <img src={logoPreview} alt="Náhled" className="w-20 h-20 object-cover rounded-full border-2 border-border" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="w-full px-3 py-2 rounded-lg glass-input text-foreground file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-600 file:text-white file:cursor-pointer text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-foreground/80 font-medium mb-2">Doporučující kód</label>
                  <input
                    type="text"
                    value={formData.referrerId}
                    onChange={(e) => {
                      setFormData({ ...formData, referrerId: e.target.value });
                      if (fieldErrors.referrerId) {
                        setFieldErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.referrerId;
                          return newErrors;
                        });
                      }
                    }}
                    className={`w-full px-4 py-2 rounded-lg glass-input text-foreground placeholder-muted-foreground text-sm ${
                      fieldErrors.referrerId ? 'border-2 border-red-500 bg-red-500/10' : ''
                    }`}
                    placeholder="ID týmu, který vás doporučil"
                  />
                  {fieldErrors.referrerId && (
                    <p className="text-red-400 text-xs mt-1">{fieldErrors.referrerId}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && (
            <motion.div
              className="bg-red-500/20 border border-red-500 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-red-700 dark:text-red-300 mb-1">Chyba</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-lg rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 modern-button relative overflow-hidden flex items-center justify-center space-x-2"
            whileHover={loading ? undefined : { y: -1.5, scale: 1.01 }}
            whileTap={loading ? undefined : { scale: 0.98 }}
          >
            {loading && <LoadingSpinner size="sm" />}
            <span className="relative z-10">{loading ? 'Registruji...' : 'Registrovat tým'}</span>
          </motion.button>

          <MotionItem delay={0.08}>
            <p className="text-center text-xs text-foreground/60">
              Formulář odešlete až po kontrole všech povinných polí.
            </p>
          </MotionItem>
        </form>
      </MotionPage>
    </div>
  );
}
