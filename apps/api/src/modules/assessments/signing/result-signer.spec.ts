import { generateKeyPairSync } from 'node:crypto';
import { canonicalJson } from './canonical-json';
import { signAssessmentPayload, verifyAssessmentSignature } from './result-signer';
import type { SignedAssessmentPayload } from './signed-payload';
import { loadSigningKeyring } from './signing-keys';

function testKeyring() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const keyId = 'test-key-1';
  const retiredId = 'test-key-0';
  const { publicKey: retiredPublic } = generateKeyPairSync('ed25519');
  return loadSigningKeyring({
    activeKeyId: keyId,
    privateKeyDerBase64: privateKey
      .export({ type: 'pkcs8', format: 'der' })
      .toString('base64'),
    publicKeysJson: JSON.stringify({
      [keyId]: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
      [retiredId]: retiredPublic
        .export({ type: 'spki', format: 'der' })
        .toString('base64'),
    }),
  });
}

const samplePayload: SignedAssessmentPayload = {
  v: 1,
  resultId: '11111111-1111-4111-8111-111111111111',
  assessmentSlug: 'va1-q3-2026',
  seasonKey: '2026-Q3',
  issuedAt: '2026-09-15T12:00:00.000Z',
  band: 'verified',
  bandLabel: 'Verified',
  totalScore: 400,
  maxScore: 400,
  elapsedMs: 1_800_000,
  timeBoxMinutes: 90,
  sampleCount: 4,
  sampleSeed: 'seed',
  window: {
    startsAt: '2026-07-01T00:00:00.000Z',
    endsAt: '2026-09-30T23:59:59.000Z',
  },
  items: [
    {
      slug: 'asmt-001-chunk-it-right',
      title: 'Chunk It Right',
      verdict: 'pass',
      score: 100,
    },
  ],
  skills: [{ slug: 'chunking', name: 'Chunking', score: 100, problems: 1 }],
};

describe('result-signer', () => {
  it('signs and verifies a canonical payload', () => {
    const keyring = testKeyring();
    const signed = signAssessmentPayload(keyring, samplePayload);
    expect(
      verifyAssessmentSignature({
        payload: samplePayload,
        signatureBase64: signed.signature,
        keyId: signed.keyId,
        publicKeys: keyring.publicKeys,
      }),
    ).toBe(true);
  });

  it('rejects a tampered payload', () => {
    const keyring = testKeyring();
    const signed = signAssessmentPayload(keyring, samplePayload);
    const tampered = { ...samplePayload, totalScore: 399 };
    expect(
      verifyAssessmentSignature({
        payload: tampered,
        signatureBase64: signed.signature,
        keyId: signed.keyId,
        publicKeys: keyring.publicKeys,
      }),
    ).toBe(false);
  });

  it('uses stable canonical field order', () => {
    const first = canonicalJson({ z: 1, a: { y: 2, b: 3 } });
    const second = canonicalJson({ a: { b: 3, y: 2 }, z: 1 });
    expect(first).toBe(second);
  });

  it('verifies results signed with a retired key after rotation', () => {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519');
    const retiredKeyId = 'test-key-retired';
    const keyring = loadSigningKeyring({
      activeKeyId: retiredKeyId,
      privateKeyDerBase64: privateKey
        .export({ type: 'pkcs8', format: 'der' })
        .toString('base64'),
      publicKeysJson: JSON.stringify({
        [retiredKeyId]: publicKey
          .export({ type: 'spki', format: 'der' })
          .toString('base64'),
      }),
    });
    const signed = signAssessmentPayload(keyring, samplePayload);

    const { publicKey: newPublic } = generateKeyPairSync('ed25519');
    const rotatedPublicKeys = new Map([
      [
        retiredKeyId,
        loadSigningKeyring({
          activeKeyId: 'test-key-next',
          privateKeyDerBase64: generateKeyPairSync('ed25519').privateKey
            .export({ type: 'pkcs8', format: 'der' })
            .toString('base64'),
          publicKeysJson: JSON.stringify({
            'test-key-next': newPublic
              .export({ type: 'spki', format: 'der' })
              .toString('base64'),
            [retiredKeyId]: publicKey
              .export({ type: 'spki', format: 'der' })
              .toString('base64'),
          }),
        }).publicKeys.get(retiredKeyId)!,
      ],
    ]);

    expect(
      verifyAssessmentSignature({
        payload: samplePayload,
        signatureBase64: signed.signature,
        keyId: retiredKeyId,
        publicKeys: rotatedPublicKeys,
      }),
    ).toBe(true);
  });
});
