export type HintList = {
  unlocked: { index: number; text: string }[];
  remaining: number;
  /** Points each hint costs once the problem is solved, in order. */
  costs?: number[];
  /** Points the unlocked hints cost so far (capped per problem). */
  spent?: number;
};
