import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { g3StagesFor } from '../../grading/harnesses/guardrails/g3-stages';
import {
  ALL_TOOLS,
  lockedToolsIn,
  toolById,
  TOOL_LADDERS,
  TOOL_UNLOCK_POINTS,
  toolsShownIn,
  toolStateIn,
  toolsUsedBy,
  trackOf,
  TRACK_TITLES,
  type LadderExercise,
  type ToolDef,
  type ToolState,
  type ToolTrack,
} from './tool-ladder';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ToolVia = 'solved' | 'bought' | 'level';

type ExerciseRef = { slug: string; title: string };

export type ToolView = {
  id: string;
  step: number;
  title: string;
  blurb: string;
  fields: string[];
  features: string[];
  /** The exercise that teaches it. */
  teachesIn: ExerciseRef;
  /** The staged level of that exercise that opens it, if any. */
  level: number | null;
};

export type LadderTool = ToolView & {
  unlocked: boolean;
  via: ToolVia | null;
};

/** A G1 or G2 attack exercise: three levels, each a badge once beaten. */
export type AttackExercise = ExerciseRef & {
  /** Most levels one submission won. */
  levelsWon: number;
  levels: number;
  solved: boolean;
};

export type AttackTrack = {
  id: 'g1' | 'g2';
  title: string;
  exercises: AttackExercise[];
};

export type ToolLadders = {
  /** Rating points to unlock a tool early. */
  cost: number;
  /** Rating points this learner spent unlocking tools early. */
  spent: number;
  tracks: { id: ToolTrack; title: string; tools: LadderTool[] }[];
  /** G1 and G2 keep their levels; each level beaten is a badge. */
  attacks: AttackTrack[];
};

const ATTACK_TRACKS: { id: 'g1' | 'g2'; title: string; field: string }[] = [
  { id: 'g1', title: 'Direct injection', field: 'attackPrompt' },
  { id: 'g2', title: 'Indirect injection', field: 'pageContent' },
];

const ATTACK_LEVELS = 3;

export type ExerciseTool = ToolView & {
  state: ToolState;
  /** How a locked tool opens here, when it is not "solve another exercise". */
  lockNote: string | null;
};

export type StageView = {
  level: number;
  title: string;
  goal: string;
  teaches: string;
  unlocks: string | null;
  cases: { id: string; kind: 'attack' | 'guest'; text: string }[];
  /** done once the tool it unlocks is held; the first open one is current. */
  state: 'done' | 'current' | 'locked';
};

export type ExerciseTools = {
  track: ToolTrack | null;
  cost: number;
  tools: ExerciseTool[];
  /** Staged levels inside this exercise (G3 grd-013); empty elsewhere. */
  stages: StageView[];
};

@Injectable()
export class ToolsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Every tool this learner holds, and how they got it. */
  async unlocked(userId: string): Promise<Map<string, ToolVia>> {
    const [passes, rows] = await Promise.all([
      this.prisma.grade.findMany({
        where: {
          verdict: 'pass',
          run: { submission: { attempt: { userId } } },
        },
        select: {
          run: {
            select: {
              submission: {
                select: {
                  attempt: {
                    select: {
                      exercise: {
                        select: {
                          slug: true,
                          simulator: true,
                          submissionSchema: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.toolUnlock.findMany({
        where: { userId },
        select: { toolId: true, source: true },
      }),
    ]);
    const held = new Map<string, ToolVia>();
    const seen = new Set<string>();
    for (const pass of passes) {
      const exercise = pass.run.submission.attempt.exercise;
      if (seen.has(exercise.slug)) {
        continue;
      }
      seen.add(exercise.slug);
      for (const tool of toolsUsedBy(exercise)) {
        held.set(tool.id, 'solved');
      }
    }
    for (const row of rows) {
      if (!held.has(row.toolId)) {
        held.set(row.toolId, row.source === 'level' ? 'level' : 'bought');
      }
    }
    return held;
  }

  async ladders(userId: string): Promise<ToolLadders> {
    const [held, titles, spent, attacks] = await Promise.all([
      this.unlocked(userId),
      this.titles(),
      toolPointsByUser(this.prisma, [userId]),
      this.attacks(userId),
    ]);
    return {
      cost: TOOL_UNLOCK_POINTS,
      spent: spent.get(userId) ?? 0,
      attacks,
      tracks: (Object.keys(TOOL_LADDERS) as ToolTrack[]).map((track) => ({
        id: track,
        title: TRACK_TITLES[track],
        tools: TOOL_LADDERS[track].map((tool) => ({
          ...view(tool, titles),
          unlocked: held.has(tool.id),
          via: held.get(tool.id) ?? null,
        })),
      })),
    };
  }

  async forExercise(userId: string, slug: string): Promise<ExerciseTools> {
    const exercise = await this.published(slug);
    const track = trackOf(exercise);
    if (!track) {
      return { track: null, cost: TOOL_UNLOCK_POINTS, tools: [], stages: [] };
    }
    const [held, titles] = await Promise.all([
      this.unlocked(userId),
      this.titles(),
    ]);
    const ids = new Set(held.keys());
    return {
      track,
      cost: TOOL_UNLOCK_POINTS,
      tools: toolsShownIn(exercise).map((tool) => {
        const state = toolStateIn(tool, slug, ids);
        return {
          ...view(tool, titles),
          state,
          lockNote:
            state === 'locked' && tool.teachesIn === slug && tool.level
              ? `Win level ${tool.level - 1} above to unlock it.`
              : null,
        };
      }),
      stages: stageViews(slug, ids),
    };
  }

  /**
   * A staged level was won: open the tool it unlocks. Returns the tool's id
   * when it was not held before, otherwise null.
   */
  async grantLevel(userId: string, toolId: string): Promise<string | null> {
    if (!toolById(toolId)) {
      return null;
    }
    const held = await this.unlocked(userId);
    if (held.has(toolId)) {
      return null;
    }
    try {
      await this.prisma.toolUnlock.create({
        data: { userId, toolId, source: 'level', points: 0 },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return null;
      }
      throw error;
    }
    return toolId;
  }

  /** assertPracticePayload for a published exercise named by its slug. */
  async assertPracticePayloadFor(
    userId: string,
    slug: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.assertPracticePayload(
      userId,
      await this.published(slug),
      payload,
    );
  }

  /** Unlock a tool early for rating points. Holding it already is a no-op. */
  async buy(userId: string, toolId: string): Promise<ToolLadders> {
    const tool = toolById(toolId);
    if (!tool) {
      throw new NotFoundException('Tool not found');
    }
    const held = await this.unlocked(userId);
    if (!held.has(tool.id)) {
      try {
        await this.prisma.toolUnlock.create({
          data: {
            userId,
            toolId: tool.id,
            source: 'bought',
            points: TOOL_UNLOCK_POINTS,
          },
        });
      } catch (error) {
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== 'P2002'
        ) {
          throw error;
        }
      }
    }
    return this.ladders(userId);
  }

  /**
   * Practice submissions may only set tools the learner holds, plus the
   * ones the exercise teaches. Contest attempts are not checked.
   */
  async assertPracticePayload(
    userId: string,
    exercise: LadderExercise,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!trackOf(exercise)) {
      return;
    }
    const held = await this.unlocked(userId);
    const locked = lockedToolsIn(exercise, payload, new Set(held.keys()));
    if (locked.length === 0) {
      return;
    }
    const titles = await this.titles();
    const first = locked[0].tool;
    const teacher = titles.get(first.teachesIn) ?? first.teachesIn;
    throw new BadRequestException({
      message: `${first.title} is locked. Solve "${teacher}" to earn it, or unlock it for ${TOOL_UNLOCK_POINTS} points.`,
      code: 'tool_locked',
      tools: locked.map((row) => ({ id: row.tool.id, what: row.what })),
    });
  }

  /** G1 and G2 exercises, with the most levels one submission won. */
  private async attacks(userId: string): Promise<AttackTrack[]> {
    const [exercises, grades] = await Promise.all([
      this.prisma.exercise.findMany({
        where: { simulator: 'guardrails', isPublished: true },
        orderBy: [{ slug: 'asc' }, { version: 'desc' }],
        select: { slug: true, title: true, submissionSchema: true },
      }),
      this.prisma.grade.findMany({
        where: {
          run: {
            submission: {
              attempt: { userId, exercise: { simulator: 'guardrails' } },
            },
          },
        },
        select: {
          verdict: true,
          metrics: true,
          run: {
            select: {
              submission: {
                select: {
                  attempt: {
                    select: { exercise: { select: { slug: true } } },
                  },
                },
              },
            },
          },
        },
      }),
    ]);
    const best = new Map<string, { won: number; solved: boolean }>();
    for (const grade of grades) {
      const slug = grade.run.submission.attempt.exercise.slug;
      const row = best.get(slug) ?? { won: 0, solved: false };
      row.won = Math.max(row.won, levelsWon(grade.metrics));
      row.solved ||= grade.verdict === 'pass';
      if (row.solved) {
        row.won = ATTACK_LEVELS;
      }
      best.set(slug, row);
    }
    const seen = new Set<string>();
    return ATTACK_TRACKS.map((track) => ({
      id: track.id,
      title: track.title,
      exercises: exercises
        .filter((exercise) => {
          const keys = Object.keys(
            (exercise.submissionSchema as { properties?: object } | null)
              ?.properties ?? {},
          );
          if (!keys.includes(track.field) || seen.has(exercise.slug)) {
            return false;
          }
          seen.add(exercise.slug);
          return true;
        })
        .map((exercise) => ({
          slug: exercise.slug,
          title: exercise.title,
          levels: ATTACK_LEVELS,
          levelsWon: best.get(exercise.slug)?.won ?? 0,
          solved: best.get(exercise.slug)?.solved ?? false,
        })),
    }));
  }

  private async published(slug: string) {
    if (!SLUG.test(slug)) {
      throw new NotFoundException('Exercise not found');
    }
    const exercise = await this.prisma.exercise.findFirst({
      where: { slug, isPublished: true },
      orderBy: { version: 'desc' },
      select: { slug: true, simulator: true, submissionSchema: true },
    });
    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }
    return exercise;
  }

  /** Titles of the exercises that teach a tool. */
  private async titles(): Promise<Map<string, string>> {
    const slugs = [...new Set(ALL_TOOLS.map((tool) => tool.teachesIn))];
    const rows = await this.prisma.exercise.findMany({
      where: { slug: { in: slugs }, isPublished: true },
      orderBy: { version: 'desc' },
      select: { slug: true, title: true },
    });
    const out = new Map<string, string>();
    for (const row of rows) {
      if (!out.has(row.slug)) {
        out.set(row.slug, row.title);
      }
    }
    return out;
  }
}

/** levels_won from a G1 or G2 grade's metrics. */
function levelsWon(metrics: unknown): number {
  const value = (metrics as { levels_won?: { value?: unknown } } | null)
    ?.levels_won?.value;
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(ATTACK_LEVELS, value))
    : 0;
}

/** The exercise's staged levels and how far this learner got. */
function stageViews(slug: string, held: ReadonlySet<string>): StageView[] {
  let open = true;
  return g3StagesFor(slug).map((stage) => {
    const done = stage.unlocks !== null && held.has(stage.unlocks);
    const state = done ? 'done' : open ? 'current' : 'locked';
    if (!done) {
      open = false;
    }
    return {
      level: stage.level,
      title: stage.title,
      goal: stage.goal,
      teaches: stage.teaches,
      unlocks: stage.unlocks,
      cases: stage.cases.map(({ id, kind, text }) => ({ id, kind, text })),
      state,
    };
  });
}

function view(tool: ToolDef, titles: Map<string, string>): ToolView {
  return {
    id: tool.id,
    step: tool.step,
    title: tool.title,
    blurb: tool.blurb,
    fields: tool.fields,
    features: tool.features,
    teachesIn: {
      slug: tool.teachesIn,
      title: titles.get(tool.teachesIn) ?? tool.teachesIn,
    },
    level: tool.level ?? null,
  };
}

/** Rating points a learner spent unlocking tools early. */
export async function toolPointsByUser(
  prisma: PrismaService,
  userIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (userIds.length === 0) {
    return out;
  }
  const rows = await prisma.toolUnlock.groupBy({
    by: ['userId'],
    where: { userId: { in: userIds }, source: 'bought' },
    _sum: { points: true },
  });
  for (const row of rows) {
    out.set(row.userId, row._sum.points ?? 0);
  }
  return out;
}
