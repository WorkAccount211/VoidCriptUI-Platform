import Link from 'next/link';
import { ArrowUpRight, BookOpen, Code2, FileCode2, Layers3, ShieldCheck, Zap, type LucideIcon } from 'lucide-react';

type DocCard = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  meta: string;
};

const cards: DocCard[] = [
  { title: 'Getting Started', description: 'Go from the first loader call to a working interface with source-backed examples.', href: '/getting-started', icon: BookOpen, meta: 'Beginner path' },
  { title: 'API Reference', description: 'Search the public surface, configuration contracts and verified implementation details.', href: '/api', icon: Code2, meta: 'Reference' },
  { title: 'Source Explorer', description: 'Inspect the repository with file context, line-level links and implementation evidence.', href: '/source', icon: FileCode2, meta: 'Codebase' },
  { title: 'Architecture', description: 'Understand module boundaries, dependency flow and runtime composition.', href: '/architecture', icon: Layers3, meta: 'System design' },
  { title: 'QA & Health', description: 'Separate static evidence from runtime reports and review release readiness.', href: '/qa', icon: ShieldCheck, meta: 'Verification' },
  { title: 'Performance', description: 'Review measured samples and static performance signals without invented benchmarks.', href: '/qa', icon: Zap, meta: 'Observability' },
];

export default function Docs() {
  return (
    <main className='container py-10 md:py-14'>
      <div className='page-head max-w-4xl'>
        <div className='eyebrow'>Documentation</div>
        <h1>Technical knowledge, organized for humans.</h1>
        <p>Everything is grouped around the way a developer actually works: learn the library, find the exact API, inspect the source, validate behavior, then ship.</p>
      </div>

      <section className='mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href} className='data-card surface group block transition-transform duration-200 hover:-translate-y-1'>
              <div className='flex items-start justify-between gap-4'>
                <div className='area-icon'><Icon size={18} aria-hidden='true' /></div>
                <span className='badge'>{card.meta}</span>
              </div>
              <h2 className='mt-5 text-[18px] font-semibold tracking-tight'>{card.title}</h2>
              <p className='mt-2 text-[13px] leading-6 muted'>{card.description}</p>
              <span className='mt-5 inline-flex items-center gap-1.5 text-[12px] font-medium text-cyan-200'>Open <ArrowUpRight size={14} aria-hidden='true' /></span>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
