
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Activity, BookOpen, Boxes, Code2, FileCog, Github, LifeBuoy, ListChecks, MessageCircle, Package, PanelLeft, Route, Rocket, Search, Settings2, Shield, Terminal, Wrench, X, Home, UserRound, Bell, Gauge, PlugZap } from 'lucide-react';

const groups = [
  { title: 'Explore', items: [['Overview','/'],['Documentation','/docs'],['Getting Started','/getting-started'],['Installation Guide','/setup']] },
  { title: 'Developer', items: [['API Explorer','/api'],['Source Explorer','/source'],['Examples','/examples'],['Architecture','/architecture'],['Performance','/docs'],['Releases','/releases'],['Roadmap','/roadmap'],['QA & Health','/qa'],['Plugins','/plugins']] },
  { title: 'Community', items: [['Community','/community'],['Issues','/community/issues'],['Questions','/community/questions'],['Suggestions','/community/suggestions']] },
];

const icons: Record<string, any> = {
  Overview: Home, Documentation: BookOpen, 'Getting Started': Rocket, 'Installation Guide': ListChecks,
  'API Explorer': Code2, 'Source Explorer': Terminal, Examples: Boxes, Architecture: Route, Performance: Gauge,
  Releases: Package, Roadmap: ListChecks, 'QA & Health': Activity, Plugins: PlugZap, Community: MessageCircle,
  Issues: LifeBuoy, Questions: MessageCircle, Suggestions: Shield
};

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (<>
    <div className="sidebar-brand-row">
      <div><div className="sidebar-title">VoidCriptUI</div><div className="sidebar-subtitle">Developer platform</div></div>
      <span className="sidebar-version">v1</span>
    </div>
    <Link href="/docs" className="sidebar-search"><Search size={14}/><span>Jump to…</span><kbd>⌘K</kbd></Link>
    {groups.map((group) => (
      <div key={group.title} className="sidebar-group">
        <div className="sidebar-group-title">{group.title}</div>
        {group.items.map(([label, href]) => {
          const Icon = icons[label] || FileCog;
          const active = pathname === href || (href !== '/' && pathname.startsWith(href + '/'));
          return <Link onClick={onNavigate} key={href + label} href={href} className={`sidebar-link ${active ? 'active' : ''}`}><Icon size={15}/><span>{label}</span>{label === 'QA & Health' && <span className="sidebar-status"><span/></span>}</Link>;
        })}
      </div>
    ))}
    <div className="sidebar-group sidebar-account">
      <div className="sidebar-group-title">Account</div>
      <Link onClick={onNavigate} href="/dashboard" className="sidebar-link"><UserRound size={15}/><span>Personal Dashboard</span></Link>
      <Link onClick={onNavigate} href="/notifications" className="sidebar-link"><Bell size={15}/><span>Notifications</span></Link>
      <Link onClick={onNavigate} href="/profile" className="sidebar-link"><Settings2 size={15}/><span>Profile</span></Link>
      <Link onClick={onNavigate} href="/settings/security" className="sidebar-link"><Shield size={15}/><span>Security</span></Link>
    </div>
    <div className="sidebar-bottom">
      <a className="sidebar-link" href="https://github.com/WorkAccount211/VoidCriptUI_lib-Final-" target="_blank" rel="noreferrer"><Github size={15}/><span>GitHub</span><span className="external-arrow">↗</span></a>
      <a className="sidebar-link" href="https://discord.gg/u4Xpdaahxd" target="_blank" rel="noreferrer"><MessageCircle size={15}/><span>Discord</span><span className="external-arrow">↗</span></a>
    </div>
  </>);
}

export default function ClientNav() {
  const [open, setOpen] = useState(false);
  useEffect(() => { const fn = () => setOpen(false); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn); }, []);
  return <>
    <button className="mobile-nav-trigger" onClick={() => setOpen(true)} aria-label="Open navigation"><PanelLeft size={18}/></button>
    <aside className="docs-sidebar desktop-sidebar"><NavContent /></aside>
    {open && <div className="mobile-nav-overlay" onClick={() => setOpen(false)}><aside className="mobile-sidebar" onClick={(e) => e.stopPropagation()}><div className="mobile-sidebar-top"><span className="eyebrow">Navigation</span><button className="icon-button" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={18}/></button></div><NavContent onNavigate={() => setOpen(false)} /></aside></div>}
  </>;
}
