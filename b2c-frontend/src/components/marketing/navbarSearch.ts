export type NavbarSearchGroup = 'page' | 'category' | 'course';

export type NavbarSearchItem = {
  id: string;
  label: string;
  description?: string;
  href: string;
  group: NavbarSearchGroup;
};

export function filterSearchItems(items: NavbarSearchItem[], query: string, limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, limit);

  return items
    .map((item) => {
      const label = item.label.toLowerCase();
      const desc = (item.description ?? '').toLowerCase();
      let score = 0;
      if (label === q) score = 4;
      else if (label.startsWith(q)) score = 3;
      else if (label.includes(q)) score = 2;
      else if (desc.includes(q)) score = 1;
      return { item, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
    .slice(0, limit)
    .map((row) => row.item);
}
