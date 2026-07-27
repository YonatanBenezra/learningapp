export type FlowSeverity = 'normal' | 'elevated' | 'critical';

export interface ParsedNetworkFlow {
  id: string;
  index: number;
  timestamp: string;
  source: string;
  destination: string;
  port: string | null;
  protocol: string;
  flags: string | null;
  info: string;
  severity: FlowSeverity;
  raw: string;
}

function inferSeverity(raw: string, annotation: string | null, flags: string | null): FlowSeverity {
  const blob = `${raw} ${annotation ?? ''} ${flags ?? ''}`.toLowerCase();
  if (
    blob.includes('1000+') ||
    blob.includes('exfil') ||
    blob.includes('480 unique') ||
    blob.includes('flood') ||
    blob.includes('beacon')
  ) {
    return 'critical';
  }
  if (blob.includes('syn') && (blob.includes('scan') || annotation)) return 'elevated';
  if (flags?.includes('SYN')) return 'elevated';
  return 'normal';
}

function formatTimestamp(baseMs: number, index: number): string {
  const d = new Date(baseMs + index * 320);
  return d.toISOString().slice(11, 23);
}

export function parseNetworkFlowLines(lines: string[], baseTimeMs = Date.now() - 12_000): ParsedNetworkFlow[] {
  return lines.map((line, index) => {
    const trimmed = line.trim();
    const paren = trimmed.match(/^(.+?)\s+\((.+)\)$/);
    const main = paren ? paren[1].trim() : trimmed;
    const annotation = paren?.[2] ?? null;

    const [source, destPart = ''] = main.split(' -> ').map((part) => part.trim());
    let destination = destPart;
    let port: string | null = null;
    let protocol = 'TCP';
    let flags: string | null = null;
    let info = annotation ?? '';

    const hostPortMatch = destPart.match(/^([\d.]+|[\da-f:]+):(\d+)\s*(.*)$/i);
    if (hostPortMatch) {
      destination = hostPortMatch[1];
      port = hostPortMatch[2];
      flags = hostPortMatch[3]?.trim() || null;
      info = [flags, annotation].filter(Boolean).join(' · ') || `Port ${port}`;
    } else {
      const tokens = destPart.split(/\s+/);
      destination = tokens[0] ?? destPart;
      if (tokens[1] && /^[A-Z]{2,}$/.test(tokens[1])) {
        protocol = tokens[1];
        info = tokens.slice(2).join(' ') || annotation || protocol;
      } else {
        info = tokens.slice(1).join(' ') || annotation || 'Flow record';
      }
      if (protocol === 'TXT' || protocol === 'DNS') protocol = 'DNS';
    }

    return {
      id: `flow-${index}`,
      index: index + 1,
      timestamp: formatTimestamp(baseTimeMs, index),
      source: source || '—',
      destination: destination || '—',
      port,
      protocol,
      flags,
      info: info || trimmed,
      severity: inferSeverity(trimmed, annotation, flags),
      raw: trimmed,
    };
  });
}

export function collectHosts(flows: ParsedNetworkFlow[]): string[] {
  const hosts = new Set<string>();
  for (const flow of flows) {
    if (flow.source !== '—') hosts.add(flow.source);
    if (flow.destination !== '—') hosts.add(flow.destination);
  }
  return [...hosts].sort();
}

export function filterNetworkFlows(
  flows: ParsedNetworkFlow[],
  query: string,
): ParsedNetworkFlow[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return flows;

  const hostMatch = trimmed.match(/^host\s+(\S+)/);
  if (hostMatch) {
    const host = hostMatch[1];
    return flows.filter((f) => f.source.includes(host) || f.destination.includes(host));
  }

  const portMatch = trimmed.match(/^port\s+(\d+)/);
  if (portMatch) {
    const port = portMatch[1];
    return flows.filter((f) => f.port === port);
  }

  const protoMatch = trimmed.match(/^proto\s+(\S+)/);
  if (protoMatch) {
    const proto = protoMatch[1];
    return flows.filter((f) => f.protocol.toLowerCase().includes(proto));
  }

  return flows.filter((f) =>
    [f.source, f.destination, f.port, f.protocol, f.flags, f.info, f.raw]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(trimmed)),
  );
}
