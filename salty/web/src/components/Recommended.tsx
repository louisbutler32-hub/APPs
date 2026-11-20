import items from "@/lib/recommended.json";

type Item = { title: string; body: string; href: string; label: string };

/**
 * Tools worth recommending after a pay check (a CV builder, a course, a job board). The list lives
 * in src/lib/recommended.json and is empty until there are real partners, so nothing shows today.
 * Every entry is a paid recommendation and the block says so.
 */
export function Recommended() {
  const list = items as Item[];
  if (list.length === 0) return null;
  return (
    <section className="mt-8 rounded-box border border-ink/15 bg-paper p-6 sm:p-9">
      <h2 className="display text-2xl">Worth a look</h2>
      <ul className="mt-4 border-t-2 border-ink">
        {list.map((item) => (
          <li key={item.href} className="border-b border-ink/15 py-4">
            <p className="font-semibold">{item.title}</p>
            <p className="mt-1 text-sm text-ink-soft">{item.body}</p>
            <a href={item.href} rel="sponsored noopener" target="_blank" className="mt-2 inline-block py-1 text-sm font-semibold text-brine underline">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-ink-soft">We may earn a commission if you sign up through these links. We only list things we would use ourselves.</p>
    </section>
  );
}
