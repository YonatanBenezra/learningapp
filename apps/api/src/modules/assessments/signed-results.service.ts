import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContestKind } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { buildAssessmentResult } from './assessment-result';
import { isResultId } from './result-id';
import { itemScoreFromGrade } from '../contests/contest-score';
import { signAssessmentPayload, verifyAssessmentSignature } from './signing/result-signer';
import { toSignedPayload, type SignedAssessmentPayload } from './signing/signed-payload';
import {
  exportPublicKeysJson,
  generateDevSigningKeyring,
  loadSigningKeyring,
  type SigningKeyring,
} from './signing/signing-keys';

export type SignedResultView = {
  id: string;
  assessmentSlug: string;
  keyId: string;
  issuedAt: string;
  revokedAt: string | null;
  revokeReasonCode: string | null;
  signatureValid: boolean;
  payload: SignedAssessmentPayload;
};

export type VerifySignedResultStatus = 'valid' | 'revoked' | 'invalid';

export type OwnedSignedResult = {
  id: string;
  assessmentSlug: string;
  bandLabel: string;
  issuedAt: string;
  shared: boolean;
  revoked: boolean;
};

@Injectable()
export class SignedResultsService implements OnModuleInit {
  private keyring: SigningKeyring | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    this.keyring = this.loadKeyring();
  }

  getPublicKeys(): Record<string, string> {
    const keyring = this.requireKeyring();
    return exportPublicKeysJson(keyring);
  }

  async issueForEntry(entryId: string): Promise<SignedResultView | null> {
    const keyring = this.requireKeyring();
    const existing = await this.prisma.signedAssessmentResult.findUnique({
      where: { contestEntryId: entryId },
    });
    if (existing) {
      return this.toView(existing);
    }

    const entry = await this.prisma.contestEntry.findUnique({
      where: { id: entryId },
      include: {
        contest: true,
        attempts: {
          include: {
            exercise: { select: { slug: true, title: true } },
            submissions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                runs: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  include: { grade: true },
                },
              },
            },
          },
        },
      },
    });
    if (!entry || entry.contest.kind !== ContestKind.assessment) {
      return null;
    }
    if (entry.status !== 'finished' && entry.status !== 'expired') {
      return null;
    }

    const gradeBySlug = new Map<string, { score: number; verdict: string }>();
    for (const attempt of entry.attempts) {
      const grade = attempt.submissions[0]?.runs[0]?.grade;
      if (!grade) {
        continue;
      }
      gradeBySlug.set(attempt.exercise.slug, {
        score: itemScoreFromGrade(grade),
        verdict: grade.verdict,
      });
    }

    const exercises = await this.prisma.exercise.findMany({
      where: { slug: { in: entry.sampledSlugs } },
      select: {
        slug: true,
        title: true,
        skills: { select: { skill: { select: { slug: true, name: true } } } },
      },
      orderBy: { version: 'desc' },
    });
    const latestExercise = new Map<string, (typeof exercises)[number]>();
    for (const row of exercises) {
      if (!latestExercise.has(row.slug)) {
        latestExercise.set(row.slug, row);
      }
    }

    const problems = entry.sampledSlugs.flatMap((slug) => {
      const exercise = latestExercise.get(slug);
      if (!exercise) {
        return [];
      }
      const scored = gradeBySlug.get(slug);
      return [
        {
          slug,
          title: exercise.title,
          score: scored?.score ?? 0,
          verdict: scored?.verdict ?? 'fail',
        },
      ];
    });

    const skillsByProblem = new Map<string, { slug: string; name: string }[]>();
    for (const exercise of latestExercise.values()) {
      skillsByProblem.set(
        exercise.slug,
        exercise.skills.map((link) => ({
          slug: link.skill.slug,
          name: link.skill.name,
        })),
      );
    }

    const assessmentResult = buildAssessmentResult({
      kind: ContestKind.assessment,
      seasonKey: entry.contest.seasonKey,
      startsAt: entry.contest.startsAt,
      endsAt: entry.contest.endsAt,
      timeBoxMinutes: entry.contest.timeBoxMinutes,
      sampleSeed: entry.sampleSeed,
      elapsedMs: entry.elapsedMs ?? 0,
      problems,
      skillsByProblem,
    });
    if (!assessmentResult) {
      return null;
    }

    const issuedAt = entry.finishedAt ?? new Date();
    const resultId = randomUUID();
    const payload = toSignedPayload({
      resultId,
      assessmentSlug: entry.contest.slug,
      issuedAt,
      result: assessmentResult,
    });
    const signed = signAssessmentPayload(keyring, payload);

    const row = await this.prisma.signedAssessmentResult.create({
      data: {
        id: resultId,
        contestEntryId: entry.id,
        userId: entry.userId,
        assessmentSlug: entry.contest.slug,
        payload,
        signature: signed.signature,
        keyId: signed.keyId,
        issuedAt,
      },
    });

    return this.toView(row);
  }

  async getForUser(resultId: string, userId: string): Promise<SignedResultView> {
    const row = await this.prisma.signedAssessmentResult.findFirst({
      where: { id: resultId, userId },
    });
    if (!row) {
      throw new NotFoundException('Signed result not found');
    }
    return this.toView(row);
  }

  async verify(resultId: string): Promise<{
    status: VerifySignedResultStatus;
    result: SignedResultView | null;
  }> {
    if (!isResultId(resultId)) {
      return { status: 'invalid', result: null };
    }

    const keyring = this.requireKeyring();
    const row = await this.prisma.signedAssessmentResult.findUnique({
      where: { id: resultId },
    });
    if (!row) {
      return { status: 'invalid', result: null };
    }

    const payload = row.payload as SignedAssessmentPayload;
    const signatureValid = verifyAssessmentSignature({
      payload,
      signatureBase64: row.signature,
      keyId: row.keyId,
      publicKeys: keyring.publicKeys,
    });
    if (!signatureValid) {
      return { status: 'invalid', result: null };
    }

    const view = this.toView(row);
    if (row.revokedAt) {
      return { status: 'revoked', result: view };
    }
    return { status: 'valid', result: view };
  }

  async revoke(resultId: string, reasonCode: string): Promise<SignedResultView> {
    if (!reasonCode.trim()) {
      throw new BadRequestException('revoke reason code is required');
    }
    const row = await this.prisma.signedAssessmentResult.findUnique({
      where: { id: resultId },
    });
    if (!row) {
      throw new NotFoundException('Signed result not found');
    }
    if (row.revokedAt) {
      return this.toView(row);
    }
    const updated = await this.prisma.signedAssessmentResult.update({
      where: { id: resultId },
      data: {
        revokedAt: new Date(),
        revokeReasonCode: reasonCode.trim(),
      },
    });
    return this.toView(updated);
  }

  async findByContestEntry(entryId: string): Promise<SignedResultView | null> {
    const row = await this.prisma.signedAssessmentResult.findUnique({
      where: { contestEntryId: entryId },
    });
    return row ? this.toView(row) : null;
  }

  async listForUser(userId: string): Promise<OwnedSignedResult[]> {
    const rows = await this.prisma.signedAssessmentResult.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
    });
    return rows.map((row) => this.toOwned(row));
  }

  async setShared(
    userId: string,
    resultId: string,
    shared: boolean,
  ): Promise<OwnedSignedResult> {
    const row = await this.prisma.signedAssessmentResult.findFirst({
      where: { id: resultId, userId },
    });
    if (!row) {
      throw new NotFoundException('Signed result not found');
    }
    if (row.revokedAt) {
      throw new BadRequestException('Revoked results cannot be shared');
    }
    const updated = await this.prisma.signedAssessmentResult.update({
      where: { id: resultId },
      data: { sharedPublicAt: shared ? new Date() : null },
    });
    return this.toOwned(updated);
  }

  private toOwned(row: {
    id: string;
    assessmentSlug: string;
    issuedAt: Date;
    sharedPublicAt: Date | null;
    revokedAt: Date | null;
    payload: unknown;
  }): OwnedSignedResult {
    const payload = row.payload as SignedAssessmentPayload;
    return {
      id: row.id,
      assessmentSlug: row.assessmentSlug,
      bandLabel: payload.bandLabel,
      issuedAt: row.issuedAt.toISOString(),
      shared: row.sharedPublicAt !== null && row.revokedAt === null,
      revoked: row.revokedAt !== null,
    };
  }

  private toView(row: {
    id: string;
    assessmentSlug: string;
    keyId: string;
    issuedAt: Date;
    revokedAt: Date | null;
    revokeReasonCode: string | null;
    payload: unknown;
    signature: string;
  }): SignedResultView {
    const keyring = this.requireKeyring();
    const payload = row.payload as SignedAssessmentPayload;
    return {
      id: row.id,
      assessmentSlug: row.assessmentSlug,
      keyId: row.keyId,
      issuedAt: row.issuedAt.toISOString(),
      revokedAt: row.revokedAt?.toISOString() ?? null,
      revokeReasonCode: row.revokeReasonCode,
      signatureValid: verifyAssessmentSignature({
        payload,
        signatureBase64: row.signature,
        keyId: row.keyId,
        publicKeys: keyring.publicKeys,
      }),
      payload,
    };
  }

  private loadKeyring(): SigningKeyring {
    const activeKeyId = this.config.get<string>('LABPATH_SIGNING_ACTIVE_KEY_ID');
    const privateKeyDerBase64 = this.config.get<string>(
      'LABPATH_SIGNING_PRIVATE_KEY',
    );
    const publicKeysJson = this.config.get<string>('LABPATH_SIGNING_PUBLIC_KEYS');

    if (activeKeyId && privateKeyDerBase64 && publicKeysJson) {
      return loadSigningKeyring({
        activeKeyId,
        privateKeyDerBase64,
        publicKeysJson,
      });
    }

    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new Error(
        'LABPATH_SIGNING_ACTIVE_KEY_ID, LABPATH_SIGNING_PRIVATE_KEY, and LABPATH_SIGNING_PUBLIC_KEYS are required in production',
      );
    }

    const dev = generateDevSigningKeyring();
    return loadSigningKeyring({
      activeKeyId: dev.activeKeyId,
      privateKeyDerBase64: dev.privateKeyDerBase64,
      publicKeysJson: dev.publicKeysJson,
    });
  }

  private requireKeyring(): SigningKeyring {
    if (!this.keyring) {
      this.keyring = this.loadKeyring();
    }
    return this.keyring;
  }
}
