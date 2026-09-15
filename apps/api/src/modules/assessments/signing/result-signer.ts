import { sign, verify } from 'node:crypto';
import { canonicalJson } from './canonical-json';
import type { SignedAssessmentPayload } from './signed-payload';
import type { SigningKeyring } from './signing-keys';

export function signAssessmentPayload(
  keyring: SigningKeyring,
  payload: SignedAssessmentPayload,
): { signature: string; keyId: string; canonical: string } {
  const canonical = canonicalJson(payload);
  const signature = sign(null, Buffer.from(canonical, 'utf8'), keyring.privateKey);
  return {
    signature: signature.toString('base64'),
    keyId: keyring.activeKeyId,
    canonical,
  };
}

export function verifyAssessmentSignature(input: {
  payload: SignedAssessmentPayload;
  signatureBase64: string;
  keyId: string;
  publicKeys: SigningKeyring['publicKeys'];
}): boolean {
  const publicKey = input.publicKeys.get(input.keyId);
  if (!publicKey) {
    return false;
  }
  const canonical = canonicalJson(input.payload);
  return verify(
    null,
    Buffer.from(canonical, 'utf8'),
    publicKey,
    Buffer.from(input.signatureBase64, 'base64'),
  );
}
