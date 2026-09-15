import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  type KeyObject,
} from 'node:crypto';

export type SigningKeyring = {
  activeKeyId: string;
  privateKey: KeyObject;
  publicKeys: Map<string, KeyObject>;
};

export type SigningKeyringConfig = {
  activeKeyId: string;
  privateKeyDerBase64: string;
  publicKeysJson: string;
};

export function generateDevSigningKeyring(keyId = 'labpath-dev-01'): {
  activeKeyId: string;
  privateKeyDerBase64: string;
  publicKeysJson: string;
} {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return {
    activeKeyId: keyId,
    privateKeyDerBase64: privateKey
      .export({ type: 'pkcs8', format: 'der' })
      .toString('base64'),
    publicKeysJson: JSON.stringify({
      [keyId]: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
    }),
  };
}

export function loadSigningKeyring(config: SigningKeyringConfig): SigningKeyring {
  const publicKeys = parsePublicKeys(config.publicKeysJson);
  if (!publicKeys.has(config.activeKeyId)) {
    throw new Error(
      `Active signing key ${config.activeKeyId} is missing from LABPATH_SIGNING_PUBLIC_KEYS`,
    );
  }

  const privateKey = createPrivateKey({
    key: Buffer.from(config.privateKeyDerBase64, 'base64'),
    format: 'der',
    type: 'pkcs8',
  });

  return {
    activeKeyId: config.activeKeyId,
    privateKey,
    publicKeys,
  };
}

export function parsePublicKeys(json: string): Map<string, KeyObject> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('LABPATH_SIGNING_PUBLIC_KEYS must be valid JSON');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('LABPATH_SIGNING_PUBLIC_KEYS must be a JSON object');
  }

  const map = new Map<string, KeyObject>();
  for (const [keyId, value] of Object.entries(parsed)) {
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(`Public key for ${keyId} must be a base64 string`);
    }
    map.set(
      keyId,
      createPublicKey({
        key: Buffer.from(value, 'base64'),
        format: 'der',
        type: 'spki',
      }),
    );
  }
  return map;
}

export function exportPublicKeysJson(keyring: SigningKeyring): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [keyId, publicKey] of keyring.publicKeys.entries()) {
    out[keyId] = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  }
  return out;
}
