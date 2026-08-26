export type YamlValue =
  | string
  | number
  | boolean
  | null
  | YamlValue[]
  | { [key: string]: YamlValue };

/** Indent-sensitive YAML subset: maps, lists, scalars. No tags, anchors, or merge. */
export function parseSimpleYaml(text: string): YamlValue {
  const trimmed = text.trim();
  if (!trimmed) {
    return {};
  }
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(trimmed) as YamlValue;
  }
  const lines = trimmed
    .split('\n')
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => {
      const t = line.trim();
      return t.length > 0 && !t.startsWith('#');
    });
  const [value] = parseBlock(
    lines.map((row) => row.line),
    0,
    0,
  );
  return value;
}

function parseBlock(
  lines: string[],
  start: number,
  minIndent: number,
): [YamlValue, number] {
  if (start >= lines.length) {
    return [{}, start];
  }
  const indent = leading(lines[start] as string);
  if (indent < minIndent) {
    return [{}, start];
  }
  const trimmed = (lines[start] as string).trim();
  if (trimmed.startsWith('- ')) {
    return parseList(lines, start, indent);
  }
  return parseMap(lines, start, indent);
}

function parseMap(
  lines: string[],
  start: number,
  indent: number,
): [YamlValue, number] {
  const map: Record<string, YamlValue> = {};
  let i = start;
  while (i < lines.length) {
    const line = lines[i] as string;
    const lineIndent = leading(line);
    if (lineIndent < indent) {
      break;
    }
    if (lineIndent > indent) {
      throw new Error(`Unexpected indent at line ${i + 1}`);
    }
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      break;
    }
    const sep = trimmed.indexOf(':');
    if (sep < 0) {
      throw new Error(`Expected key: value at line ${i + 1}`);
    }
    const key = trimmed.slice(0, sep).trim();
    const rest = trimmed.slice(sep + 1).trim();
    i += 1;
    if (rest.length > 0) {
      map[key] = parseScalar(rest);
      continue;
    }
    if (i >= lines.length || leading(lines[i] as string) <= indent) {
      map[key] = null;
      continue;
    }
    const [child, next] = parseBlock(lines, i, indent + 1);
    map[key] = child;
    i = next;
  }
  return [map, i];
}

function parseList(
  lines: string[],
  start: number,
  indent: number,
): [YamlValue, number] {
  const list: YamlValue[] = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i] as string;
    const lineIndent = leading(line);
    if (lineIndent < indent) {
      break;
    }
    if (lineIndent > indent) {
      throw new Error(`Unexpected indent at line ${i + 1}`);
    }
    const trimmed = line.trim();
    if (!trimmed.startsWith('- ')) {
      break;
    }
    const rest = trimmed.slice(2);
    i += 1;
    if (rest.includes(':') && !rest.startsWith('{')) {
      const sep = rest.indexOf(':');
      const key = rest.slice(0, sep).trim();
      const value = rest.slice(sep + 1).trim();
      const item: Record<string, YamlValue> = {
        [key]: value.length > 0 ? parseScalar(value) : null,
      };
      if (i < lines.length && leading(lines[i] as string) > indent) {
        const [child, next] = parseMap(lines, i, leading(lines[i] as string));
        Object.assign(item, child as Record<string, YamlValue>);
        if (value.length === 0 && item[key] === null && child && typeof child === 'object') {
          delete item[key];
        }
        i = next;
      }
      list.push(item);
      continue;
    }
    if (rest.length > 0) {
      list.push(parseScalar(rest));
      continue;
    }
    const [child, next] = parseBlock(lines, i, indent + 1);
    list.push(child);
    i = next;
  }
  return [list, i];
}

function parseScalar(raw: string): YamlValue {
  if (
    (raw.startsWith("'") && raw.endsWith("'")) ||
    (raw.startsWith('"') && raw.endsWith('"'))
  ) {
    return raw.slice(1, -1);
  }
  if (raw.startsWith('[') || raw.startsWith('{')) {
    return JSON.parse(raw) as YamlValue;
  }
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }
  if (raw === 'null' || raw === '~') {
    return null;
  }
  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    return Number(raw);
  }
  return raw;
}

function leading(line: string): number {
  const match = /^( *)/.exec(line);
  return match ? match[1].length : 0;
}
