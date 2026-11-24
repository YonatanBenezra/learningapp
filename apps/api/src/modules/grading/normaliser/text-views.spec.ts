import { normalize, redactRanges } from './text-views';

describe('text views', () => {
  const secret = 'OVERRIDE-QF-3816';

  it('decodes hex and base64 blobs into their own views', () => {
    const hex = Buffer.from(secret).toString('hex');
    const b64 = Buffer.from(secret).toString('base64');
    const text = `first ${hex} then ${b64}.`;
    expect(normalize(text).text).not.toContain(secret);
    const out = normalize(text, ['decode_hex', 'decode_base64']);
    expect(out.views.map((view) => view.text)).toEqual([text, secret, secret]);
    // A match in a decoded view maps back to the whole blob.
    expect(out.views[1].toRaw(0, 4)).toEqual([6, 6 + hex.length]);
  });

  it('folds look-alike letters and joins spaced-out text', () => {
    const disguised = 'ОVЕRRIDE'; // Cyrillic О and Е
    expect(normalize(disguised, ['unicode']).text).toBe('OVERRIDE');
    const spaced = `code: ${[...secret].join(' ')} ok`;
    const view = normalize(spaced, ['join_spaced']).views[0];
    expect(view.text).toBe(`code: ${secret} ok`);
    const start = view.text.indexOf(secret);
    const [from, to] = view.toRaw(start, start + secret.length);
    expect(spaced.slice(from, to)).toBe([...secret].join(' '));
  });

  it('leaves ordinary words and numbers alone', () => {
    const text = 'Confirmation 1001. Instructions for 2 nights.';
    const out = normalize(text, ['decode_hex', 'decode_base64', 'join_spaced']);
    expect(out.views).toHaveLength(1);
    expect(out.text).toBe(text);
  });

  it('redacts merged ranges', () => {
    expect(
      redactRanges(
        'abcdefgh',
        [
          [1, 3],
          [2, 5],
        ],
        '#',
      ),
    ).toBe('a#fgh');
  });
});
