import type { CorpusDoc } from './chunking';
import { parseRoutingRules, routeFor, type R5Router } from './r5.grade';

const docs: CorpusDoc[] = [
  {
    id: 'faq',
    title: 'Help desk FAQ',
    text: 'The guest Wi-Fi passphrase rotates every Monday.',
    meta: { route: 'faq' },
  },
  {
    id: 'proc',
    title: 'Rotating an API key',
    text: 'Open the vault, create a key, then revoke the old one.',
    meta: { route: 'procedural' },
  },
  {
    id: 'log',
    title: 'Operations log',
    text: 'Wi-Fi Wi-Fi Wi-Fi key key key.',
  },
];

describe('R5 routing', () => {
  it('parses rules and takes the first line that matches', () => {
    const router: R5Router = {
      mode: 'rules',
      rules: parseRoutingRules(
        '# comment\nhow do i | steps => procedural\nwi-fi => faq\n* => policy',
      ),
      defaultRoute: 'faq',
    };
    expect(routeFor('How do I rotate an API key?', router, docs, null)).toBe(
      'procedural',
    );
    expect(
      routeFor('When does the Wi-Fi passphrase change?', router, docs, null),
    ).toBe('faq');
    expect(routeFor('Who approves travel?', router, docs, null)).toBe('policy');
  });

  it('rejects a rule without a known class', () => {
    expect(() => parseRoutingRules('wi-fi => helpdesk')).toThrow(/line 1/);
  });

  it('top-document routing takes the best match’s type, or the default for untyped pages', () => {
    const router: R5Router = {
      mode: 'top-document',
      rules: [],
      defaultRoute: 'policy',
    };
    expect(routeFor('rotate an API key in the vault', router, docs, null)).toBe(
      'procedural',
    );
    expect(routeFor('key key key', router, docs, null)).toBe('policy');
  });

  it('given keeps the labelled class (legacy payloads)', () => {
    const router: R5Router = {
      mode: 'given',
      rules: [],
      defaultRoute: 'policy',
    };
    expect(routeFor('anything', router, docs, 'faq')).toBe('faq');
  });
});
