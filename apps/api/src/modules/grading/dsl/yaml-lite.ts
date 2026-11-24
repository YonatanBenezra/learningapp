export type YamlValue =
  string | number | boolean | null | YamlValue[] | { [key: string]: YamlValue };

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
  const indent = leading(lines[start]);
  if (indent < minIndent) {
    return [{}, start];
  }
  const trimmed = lines[start].trim();
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
    const line = lines[i];
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
    if (i >= lines.length || leading(lines[i]) <= indent) {
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
    const line = lines[i];
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
    const quoted = rest.startsWith("'") || rest.startsWith('"');
    if (rest.includes(':') && !rest.startsWith('{') && !quoted) {
      const sep = rest.indexOf(':');
      const key = rest.slice(0, sep).trim();
      const value = rest.slice(sep + 1).trim();
      const item: Record<string, YamlValue> = {
        [key]: value.length > 0 ? parseScalar(value) : null,
      };
      if (i < lines.length && leading(lines[i]) > indent) {
        const [child, next] = parseMap(lines, i, leading(lines[i]));
        Object.assign(item, child as Record<string, YamlValue>);
        if (
          value.length === 0 &&
          item[key] === null &&
          child &&
          typeof child === 'object'
        ) {
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
    try {
      return JSON.parse(raw) as YamlValue;
    } catch (error) {
      // Flow list of plain or quoted scalars, e.g. [decode_hex, 'a,b'].
      const items =
        raw.startsWith('[') && raw.endsWith(']')
          ? splitFlow(raw.slice(1, -1))
          : null;
      if (items) {
        return items.map((part) => parseScalar(part));
      }
      throw error;
    }
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

/** Splits a flow list body on top-level commas; null if it nests. */
function splitFlow(inner: string): string[] | null {
  const parts: string[] = [];
  let current = '';
  let quote: string | null = null;
  for (const char of inner) {
    if (quote) {
      current += char;
      if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      current += char;
    } else if (char === '[' || char === ']' || char === '{' || char === '}') {
      return null;
    } else if (char === ',') {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (quote) {
    return null;
  }
  if (current.trim() || parts.length > 0) {
    parts.push(current.trim());
  }
  return parts.filter((part) => part.length > 0);
}

function leading(line: string): number {
  const match = /^( *)/.exec(line);
  return match ? match[1].length : 0;
}
