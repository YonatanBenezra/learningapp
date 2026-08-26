const BACKREF = /\\[1-9]/;
const LOOKAROUND = /\(\?/;

export function compileRe2(pattern: string): RegExp {
  if (pattern.length > 512) {
    throw new Error('RE2 pattern exceeds 512 characters');
  }
  if (BACKREF.test(pattern) || LOOKAROUND.test(pattern)) {
    throw new Error('RE2 subset forbids backreferences and lookaround');
  }
  return new RegExp(pattern);
}

export function re2Test(pattern: string, text: string): boolean {
  return compileRe2(pattern).test(text);
}
