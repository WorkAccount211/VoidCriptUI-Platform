import Link from 'next/link';

type SetupSection = readonly [string, string];

export default function SetupSidebar({ sections }: { sections: readonly SetupSection[] }) {
  return (
    <aside className='setup-sidebar surface rounded-2xl p-3 lg:sticky lg:top-24 lg:self-start'>
      <div className='px-3 py-2 text-[11px] font-semibold uppercase tracking-[.16em] muted'>On this page</div>
      <nav aria-label='Setup guide'>
        {sections.map(([id, label]) => (
          <Link key={id} href={`#${id}`} className='block rounded-xl px-3 py-2 text-[12px] muted transition hover:bg-white/[.05] hover:text-white'>
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
