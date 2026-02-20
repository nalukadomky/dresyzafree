'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CircleDollarSign, Rocket, Sparkles, Target } from 'lucide-react';

const menuItems = ['Produkt', 'Pro kluby', 'Jak to funguje', 'Komunita', 'Podpora', 'Pro admina', 'Zdarma'];
const features = [
  {
    title: 'Registrace klubu',
    description: 'Rychlý onboarding týmu, kontakty, liga a přístup do klubové zóny v jednom flow.',
  },
  {
    title: 'Kádr hráčů',
    description: 'Spravuj soupisku, role i připravenost hráčů na zápasy a tréninky.',
  },
  {
    title: 'Match Rating (0–10)',
    description: 'Po utkání hráči hodnotí spoluhráče férově a bez možnosti dodatečné úpravy.',
  },
  {
    title: 'Leaderboard',
    description: 'Automatický žebříček formy podle hlasů týmu a výkonu napříč zápasy.',
  },
  {
    title: 'Canadian Points',
    description: 'Góly + asistence na jednom místě, sezónní přehled i porovnání hráčů.',
  },
  {
    title: 'Event Calendar',
    description: 'Plánuj tréninky i zápasy, sdílej události a drž tým v rytmu.',
  },
  {
    title: 'Attendance Flow',
    description: 'Hráči potvrdí účast předem, po události trenér uzavře finální docházku.',
  },
  {
    title: 'Tactics Board',
    description: 'Přetahuj hráče na hřiště a připrav taktiku pro další zápas.',
  },
];

const meetupCards = [
  {
    day: 'Krok 1',
    time: '~3 min',
    title: 'Registrace týmu a vytvoření klubové zóny',
    place: 'Onboarding bez složitostí',
  },
  {
    day: 'Krok 2',
    time: 'Po každém zápase',
    title: 'Hodnocení hráčů + leaderboard + kanadské body',
    place: 'Výkon týmu pod kontrolou',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <main className="bg-black text-white min-h-screen">
      <div className="max-w-[1480px] mx-auto px-6 md:px-10">
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="h-20 flex items-center justify-between"
        >
          <div className="w-8 h-8 relative">
            <div className="absolute top-0 left-0 w-4 h-2.5 bg-white skew-x-[-25deg]" />
            <div className="absolute top-3 left-2.5 w-4 h-2.5 bg-white skew-x-[-25deg]" />
            <div className="absolute top-6 left-0 w-2.5 h-2.5 bg-white skew-x-[-25deg]" />
          </div>
          <div className="hidden lg:flex items-center gap-9 text-[34px] scale-[0.35] origin-center font-semibold text-white/65">
            {menuItems.map((item, i) => (
              <button key={item} className={i === 0 ? 'text-white' : 'hover:text-white transition-colors'}>
                {item}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login/team" className="text-white/70 hover:text-white text-3xl scale-50 origin-right font-medium">
              Log in
            </Link>
            <Link href="/register" className="px-6 py-2.5 rounded-full bg-white text-black text-xl font-semibold">
              Sign up
            </Link>
          </div>
        </motion.nav>

        <section className="pt-16 md:pt-28 pb-20">
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.7 }}
            className="text-[56px] sm:text-[78px] md:text-[112px] leading-[0.95] font-semibold max-w-[1100px] tracking-[-0.04em]"
          >
            Zvol hráče utkání.
            <br />
            Měj tréninky pod kontrolou.
            <br />
            Docházka tréninků.
          </motion.h1>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-14 flex flex-wrap items-center gap-4"
          >
            <Link href="/register" className="px-10 py-4 rounded-full bg-white text-black font-semibold text-3xl scale-50 origin-left">
              Registrovat tým zdarma
            </Link>
            <Link href="/login/team" className="px-10 py-4 rounded-full bg-white/12 hover:bg-white/20 text-white font-semibold text-3xl scale-50 origin-left transition-colors">
              Přihlásit existující tým
            </Link>
          </motion.div>
        </section>

        <section className="py-20 border-t border-white/10 grid lg:grid-cols-[0.85fr_1.15fr] gap-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="space-y-1"
          >
            {features.map((feature, index) => (
              <button
                key={feature.title}
                onClick={() => setActiveFeature(index)}
                className={`block text-left text-[50px] leading-[1.05] tracking-[-0.03em] font-semibold transition-colors ${
                  activeFeature === index ? 'text-white' : 'text-white/55 hover:text-white/90'
                }`}
              >
                {feature.title}
              </button>
            ))}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="rounded-3xl border border-white/10 bg-black p-8 min-h-[210px]">
              <p className="text-[40px] scale-50 origin-top-left font-semibold text-white mb-2">
                {features[activeFeature].title}
              </p>
              <p className="text-[38px] scale-50 origin-top-left text-white/70 max-w-[620px]">
                {features[activeFeature].description}
              </p>
            </div>
          </motion.div>
        </section>

        <section className="py-20 border-t border-white/10">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-8"
          >
            {[
              { icon: Rocket, title: 'Rychlý start', desc: 'Založení týmu a první nastavení zvládneš během pár minut.' },
              { icon: Target, title: 'Jasný přehled týmu', desc: 'Vše od soupisky po události držíš v jednom systému.' },
              { icon: Sparkles, title: 'Lepší rozhodování trenéra', desc: 'Výkon hráčů máš podložený daty po každém utkání.' },
              { icon: CircleDollarSign, title: '0 Kč za platformu', desc: 'Silný týmový nástroj bez vstupních nákladů pro klub.' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
              <motion.div
                key={i}
                whileHover={{ y: -8, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                className="aspect-square rounded-3xl border border-white/10 bg-gradient-to-b from-[#07112a] via-[#0a1438] to-black flex flex-col items-center justify-center text-center relative overflow-hidden p-8"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(24,150,255,0.35),transparent_55%)]" />
                <div className="absolute inset-x-[35%] bottom-[-10%] top-[32%] blur-2xl bg-gradient-to-b from-[#21a7ff44] to-transparent" />
                <div className="relative w-44 h-44 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center shadow-[0_0_90px_rgba(24,150,255,0.28)]">
                  <Icon className="w-16 h-16 text-[#9bd2ff]" />
                </div>
                <h3 className="relative mt-5 text-2xl font-semibold">{item.title}</h3>
                <p className="relative mt-2 text-white/60 text-lg max-w-[430px]">{item.desc}</p>
              </motion.div>
              );
            })}
          </motion.div>
        </section>

        <section className="py-20 border-t border-white/10">
          <div className="flex items-end justify-between gap-6 mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
            className="text-[58px] md:text-[86px] leading-[0.95] tracking-[-0.03em] font-semibold max-w-[1000px]"
          >
            Z týmu udělej systém,
            <br />
            který funguje každý týden
          </motion.h2>
            <Link href="/register" className="hidden md:inline-flex px-7 py-3 rounded-full bg-white/12 hover:bg-white/20 text-white font-semibold transition-colors">
              Registrovat tým
            </Link>
          </div>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              { title: 'Jedno místo pro celý tým', desc: 'Kádr, události, docházka i hodnocení bez chaosu v chatech.', icon: '$' },
              { title: 'Data po každém zápase', desc: 'Výkon hráčů uvidíš hned: rating, žebříček i kanadské body.', icon: '✦' },
              { title: 'Jednoduché pro hráče', desc: 'Rychlé potvrzení účasti přes sdílený odkaz, minimum administrativy.', icon: '▶' },
            ].map((card, i) => (
              <motion.article
                key={i}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="rounded-3xl border border-white/10 bg-[#05090f] p-6"
              >
                <div className="aspect-[4/3] rounded-2xl border border-white/10 bg-gradient-to-b from-[#0d173b] to-black flex items-center justify-center text-6xl text-white/90">
                  {card.icon}
                </div>
                <h3 className="text-2xl font-semibold mt-6">{card.title}</h3>
                <p className="text-white/60 mt-2 text-lg">{card.desc}</p>
              </motion.article>
            ))}
          </motion.div>
        </section>


        <section className="py-20 border-t border-white/10">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-[56px] md:text-[92px] leading-[0.95] font-semibold tracking-[-0.03em] mb-12 text-center"
          >
            Jak to funguje
            <br />
            v praxi
          </motion.h2>
          <div className="max-w-[1200px] mx-auto relative pl-8 md:pl-14">
            <div className="absolute left-2 md:left-6 top-4 bottom-4 border-l border-dashed border-white/15" />
            <div className="space-y-8">
              {meetupCards.map((meetup, i) => (
                <motion.article
                  key={meetup.title}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                >
                  <p className="text-white/70 text-2xl mb-3">{meetup.day}</p>
                  <div className="rounded-2xl border border-[#1d2a39] bg-[#060c14] px-6 py-6 flex flex-col md:flex-row md:items-center gap-6 justify-between">
                    <div>
                      <p className="text-2xl text-white/70">{meetup.time}</p>
                      <h3 className="text-[40px] scale-50 origin-top-left font-semibold mt-1">{meetup.title}</h3>
                      <p className="text-[36px] scale-50 origin-top-left text-white/55 -mt-2">{meetup.place}</p>
                    </div>
                    <div className="w-36 h-36 rounded-xl bg-gradient-to-br from-amber-200 via-zinc-500 to-black" />
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
