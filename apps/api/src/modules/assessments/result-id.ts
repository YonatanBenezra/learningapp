const RESULT_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isResultId(value: string): boolean {
  return RESULT_ID_RE.test(value);
}
