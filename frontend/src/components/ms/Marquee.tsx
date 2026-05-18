export function Marquee({ items }: { items: string[] }) {
  const content = [...items, ...items, ...items];
  return (
    <div className="marquee bg-lime text-black py-3 border-y border-black">
      <div className="marquee-track font-display tracking-widest text-sm">
        {content.map((it, i) => (
          <span key={i} className="flex items-center gap-12">
            {it} <span className="opacity-50">●</span>
          </span>
        ))}
      </div>
    </div>
  );
}
