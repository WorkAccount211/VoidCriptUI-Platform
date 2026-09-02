import './globals.css';
import Link from 'next/link';
import { Bell, Github, MessageCircle, Search, Sparkles, Command } from 'lucide-react';
import ClientNav from '@/components/ClientNav';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata = {
  title: 'VoidCriptUI Platform',
  description: 'A source-backed developer platform for documentation, API reference, source intelligence, QA, community and account security.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <header className="topbar">
          <div className="topbar-inner container">
            <Link href="/" className="brand" aria-label="VoidCriptUI Platform home">
              <span className="brand-mark"><Sparkles size={16} /></span>
              <span>VoidCriptUI</span>
              <span className="brand-beta">PLATFORM</span>
            </Link>
            <Link href="/docs" className="global-search" aria-label="Search documentation">
              <Search size={16} />
              <span>Search documentation, API, source &amp; community</span>
              <span className="search-command"><Command size={11} />K</span>
            </Link>
            <div className="top-actions">
              <ThemeToggle />
              <Link href="/notifications" className="icon-button" title="Notifications" aria-label="Notifications"><Bell size={18} /></Link>
              <a href="https://github.com/WorkAccount211/VoidCriptUI_lib-Final-" target="_blank" rel="noreferrer" className="icon-button" title="GitHub" aria-label="GitHub"><Github size={18} /></a>
              <a href="https://discord.gg/u4Xpdaahxd" target="_blank" rel="noreferrer" className="icon-button" title="Discord" aria-label="Discord"><MessageCircle size={18} /></a>
              <Link href="/sign-in" className="signin">Sign in</Link>
            </div>
          </div>
        </header>
        <div className="app-shell"><ClientNav /><main className="content-pane">{children}</main></div>
        <footer className="footer">
          <div className="container footer-inner">
            <div className="muted flex items-center gap-2"><span className="footer-dot" /> Source-backed developer platform</div>
            <div className="footer-links"><Link href="/legal/terms">Terms</Link><Link href="/legal/privacy">Privacy</Link><Link href="/legal/community">Community Rules</Link><Link href="/legal/disclaimer">Disclaimer</Link></div>
          </div>
        </footer>
      </body>
    </html>
  );
}
