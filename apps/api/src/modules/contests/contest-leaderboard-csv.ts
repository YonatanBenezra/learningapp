type CsvLeaderboardRow = {
  rank: number;
  displayName: string;
  totalScore: number;
  elapsedMs: number | null;
  solvedCount: number;
  totalCount: number;
  status: string;
};

export function leaderboardToCsv(
  slug: string,
  items: CsvLeaderboardRow[],
): string {
  const header = [
    'rank',
    'displayName',
    'totalScore',
    'elapsedMs',
    'solvedCount',
    'totalCount',
    'status',
  ];
  const rows = items.map((row) =>
    [
      row.rank,
      csvCell(row.displayName),
      row.totalScore,
      row.elapsedMs ?? '',
      row.solvedCount,
      row.totalCount,
      row.status,
    ].join(','),
  );
  return [`# contest ${slug}`, header.join(','), ...rows].join('\n');
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
