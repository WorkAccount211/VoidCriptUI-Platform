'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Activity, ArrowUpRight, BookOpen, Boxes, Code2, Github, GitBranch, LockKeyhole, MessageCircle, ShieldCheck, Sparkles, Terminal, Users, Zap, Database, Bot, Mail, ChevronRight } from 'lucide-react';

const areas = [
  { title: 'Documentation', desc: 'Practical, source-backed guides that explain the library from first load to advanced APIs.', href: '/docs', icon: BookOpen },
  { title: 'Source Explorer', desc: 'Inspect repository files, modules and implementation details without leaving the platform.', href: '/source', icon: Terminal },
  { title: 'QA & Health', desc: 'Understand what static analysis proves, what runtime tests verify and what still needs attention.', href: '/qa', icon: Activity },
  { title: 'Community', desc: 'Issues, Questions and Suggestions with moderation, status tracking and account-aware workflows.', href: '/community', icon: MessageCircle },
];

const architecture = [
  ['Web', 'Next.js on :4080', Code2],
  ['API', 'Fastify on :8100', Zap],
  ['Identity', 'Sessions + MFA', LockKeyhole],
  ['Data', 'PostgreSQL + Prisma', Database],
];

const services = [
  ['Telegram', 'Security bot for account linking and MFA approval.', Bot],
  ['Discord', 'OAuth linking, slash commands and security workflows.', MessageCircle],
  ['Gmail', 'Gmail API OAuth for verification and recovery mail.', Mail],
];

export default function Home() {
  return <div className="home-wrap">
    <section className="hero container">
      <div className="hero-copy">
        <div className="eyebrow-row"><span className="status-chip"><span className="live-dot"/> Repository-connected</span><span className="hero-kicker">Developer portal</span></div>
        <h1>Understand the code.<br/><span className="accent-text">Ship with clarity.</span></h1>
        <p className="hero-lead">VoidCriptUI Platform combines documentation, API discovery, source inspection, QA, releases, community and account security in one focused workspace.</p>
        <div className="hero-actions"><Link href="/docs" className="btn-primary">Explore documentation <ArrowUpRight size={16}/></Link><Link href="/getting-started" className="btn-secondary">Start in five minutes</Link><a href="https://github.com/WorkAccount211/VoidCriptUI_lib-Final-" target="_blank" rel="noreferrer" className="btn-secondary"><Github size={16}/> Repository</a></div>
        <div className="hero-meta"><span><GitBranch size={14}/> WorkAccount211 / VoidCriptUI_lib-Final-</span><span><ShieldCheck size={14}/> Evidence-first</span><span><Sparkles size={14}/> Dark-first UX</span></div>
      </div>
      <motion.div className="hero-console surface" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }}>
        <div className="console-top"><div className="console-title"><span className="brand-mark small"><Sparkles size={13}/></span><div><strong>Platform overview</strong><span>connected architecture</span></div></div><span className="console-state"><span className="live-dot"/> Operational model</span></div>
        <div className="console-grid">{architecture.map(([title, sub, Icon]) => <div className="metric-card" key={title as string}><div className="metric-label">{title as string}</div><div className="metric-main"><Icon size={18} /> <span>{sub as string}</span></div><div className="metric-sub">Separated concerns</div></div>)}</div>
        <div className="console-flow"><div className="flow-node active"><Code2 size={15}/><span>Web</span></div><div className="flow-line"/><div className="flow-node"><Zap size={15}/><span>API</span></div><div className="flow-line"/><div className="flow-node"><LockKeyhole size={15}/><span>Identity</span></div><div className="flow-line"/><div className="flow-node"><Database size={15}/><span>DB</span></div></div>
        <div className="console-foot"><span>Services</span><span className="mono">Telegram · Discord · Gmail · GitHub</span></div>
      </motion.div>
    </section>

    <section className="container section-block">
      <div className="section-heading"><div><div className="eyebrow">Platform surfaces</div><h2>Every workflow has a home.</h2></div><Link href="/docs" className="text-link">Browse all <ArrowUpRight size={15}/></Link></div>
      <div className="area-grid">{areas.map(({ title, desc, href, icon: Icon }, i) => <motion.div key={title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .3 }} transition={{ duration: .35, delay: i * .05 }} className="area-card surface"><div className="area-icon"><Icon size={18}/></div><div className="area-copy"><h3>{title}</h3><p>{desc}</p><Link href={href}>Open section <ChevronRight size={14}/></Link></div></motion.div>)}</div>
    </section>

    <section className="container section-block"><div className="section-heading"><div><div className="eyebrow">Integrated services</div><h2>Security lives outside the browser.</h2></div></div><div className="service-grid">{services.map(([title, desc, Icon], i) => <motion.div key={title as string} className="service-card surface" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .06 }}><div className="area-icon"><Icon size={18}/></div><div><h3>{title as string}</h3><p>{desc as string}</p></div></motion.div>)}</div></section>

    <section className="container section-block"><div className="principles-grid">{[['Source-backed','Documentation is written from repository evidence, not guesses.'],['Server-authoritative','Roles, sessions and MFA are enforced by the API.'],['No Docker requirement','Local and VPS workflows use native Node.js, PostgreSQL and reverse proxy tooling.'],['Human-scale UI','Dense enough for developers, calm enough for everyday use.']].map(([t,d],i)=><div key={t} className="principle"><span className="principle-num">0{i+1}</span><div><h3>{t}</h3><p>{d}</p></div></div>)}</div></section>

    <section className="container section-block final-cta"><div className="cta-surface surface"><div><div className="eyebrow">Next step</div><h2>Configure the real stack, not a demo.</h2><p>Use the setup guide to connect PostgreSQL, Cloudflare Turnstile, Telegram, Discord, Gmail and your backend without Docker.</p></div><div className="cta-actions"><Link href="/setup" className="btn-primary">Open setup <ArrowUpRight size={16}/></Link><Link href="/community" className="btn-secondary"><Users size={16}/> Community</Link></div></div></section>
  </div>;
}
