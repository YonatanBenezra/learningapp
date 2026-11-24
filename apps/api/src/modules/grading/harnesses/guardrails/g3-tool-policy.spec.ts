import { decideToolCall, parseToolPolicy } from './g3-tool-policy';

describe('G3 tool policy', () => {
  const email = (to: string, body = 'hello') => ({
    tool: 'send_email',
    args: { to, subject: 's', body },
  });

  it('runs everything when the policy is empty', () => {
    expect(
      decideToolCall(parseToolPolicy(''), email('x@evil.test')).allowed,
    ).toBe(true);
  });

  it('allows, denies and falls back to the default', () => {
    const policy = parseToolPolicy(
      'version: 1\ndefault: deny\ntools:\n  book_room: allow\n  send_email: deny\n',
    );
    expect(
      decideToolCall(policy, { tool: 'book_room', args: {} }).allowed,
    ).toBe(true);
    expect(decideToolCall(policy, email('a@hotel.test')).reason).toBe(
      'tool denied',
    );
    expect(
      decideToolCall(policy, { tool: 'delete_all', args: {} }).reason,
    ).toBe('tool not listed');
  });

  it('checks every recipient and the arguments, decoded', () => {
    const policy = parseToolPolicy(
      "version: 1\ntools:\n  send_email:\n    recipients: ['*@hotel.test']\n    normalize: [decode_hex]\n    args_must_not_match: ['OVERRIDE-[A-Z]{2}-[0-9]{4}']\n",
    );
    expect(decideToolCall(policy, email('desk@hotel.test')).allowed).toBe(true);
    expect(
      decideToolCall(policy, email('desk@hotel.test, x@evil.test')).allowed,
    ).toBe(false);
    const hex = Buffer.from('OVERRIDE-QF-3816').toString('hex');
    expect(
      decideToolCall(policy, email('desk@hotel.test', `code ${hex}`)).reason,
    ).toBe('arguments matched a blocked pattern');
  });

  it('rejects malformed policies', () => {
    expect(() => parseToolPolicy('version: 1\ndefault: maybe\n')).toThrow(
      /default/,
    );
    expect(() =>
      parseToolPolicy(
        'version: 1\ntools:\n  send_email:\n    normalize: [rot13]\n',
      ),
    ).toThrow(/normalize/);
  });

  it('strips arguments before the call runs and limits recipients', () => {
    const strip = parseToolPolicy(
      'version: 1\ntools:\n  send_email:\n    strip_args: [cc, bcc]\n',
    );
    const call = {
      tool: 'send_email',
      args: { to: 'a@mail.test', bcc: 'x@evil.test' },
    };
    const decision = decideToolCall(strip, call);
    expect(decision.allowed).toBe(true);
    expect(decision.call.args).toEqual({ to: 'a@mail.test' });
    expect(decision.stripped).toEqual(['bcc']);
    const limit = parseToolPolicy(
      'version: 1\ntools:\n  send_email:\n    max_recipients: 1\n',
    );
    expect(decideToolCall(limit, call).reason).toBe('too many recipients');
  });
});
