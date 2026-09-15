# Phase 3 — Assessment signing keys (O12)

Ed25519 detached signatures over a canonical JSON payload. Private keys live only in the deployment secret store; public keys are published at `GET /api/signing-keys`.

## Environment variables

| Variable | Purpose |
|---|---|
| `LABPATH_SIGNING_ACTIVE_KEY_ID` | Key id used for new signatures |
| `LABPATH_SIGNING_PRIVATE_KEY` | Active private key, PKCS#8 DER, base64 |
| `LABPATH_SIGNING_PUBLIC_KEYS` | JSON map of `key_id → SPKI DER base64` for all published keys (active + retired) |

Development: when all three are unset and `NODE_ENV !== production`, the API generates an ephemeral dev keyring at startup.

## Rotation procedure

1. Generate a new Ed25519 pair and assign a new `key_id` (e.g. `labpath-2027-01`).
2. Add the new public key to `LABPATH_SIGNING_PUBLIC_KEYS` **before** switching the active key.
3. Set `LABPATH_SIGNING_ACTIVE_KEY_ID` and `LABPATH_SIGNING_PRIVATE_KEY` to the new pair; redeploy.
4. Keep retired public keys in `LABPATH_SIGNING_PUBLIC_KEYS` indefinitely — old results verify by stored `key_id`.
5. Run the rotation test in `result-signer.spec.ts` after any keyring format change.

Corrections never edit a signed row: issue a new result and revoke the old one with a human reason code.

## Revocation

`POST /api/assessments/results/:resultId/revoke` (admin) sets `revoked_at` and `revoke_reason_code`. The signature remains valid; verification returns status `revoked`.

## Offline verification

1. Fetch public keys from `GET /api/signing-keys` (no auth).
2. Fetch verification JSON from `GET /api/assessments/results/:resultId/verify` (no auth).
3. Confirm `status` is `valid` or `revoked` and `result.signatureValid` is true.
4. Canonicalise `result.payload` with the same stable field order as `canonical-json.ts`.
5. Verify the detached Ed25519 signature with the public key matching `result.keyId`.

Human-readable verification lives at `/verify/:resultId` on the web app; the API endpoints above are the machine-checkable source of truth.
