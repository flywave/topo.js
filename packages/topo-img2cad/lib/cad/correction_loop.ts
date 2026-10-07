/**
 * The bounded correction loop (roadmap T2.3) — the stop/escalate policy the
 * repair rounds are governed by, ported from img2threejs's
 * `forge/stage4_review/correction_loop.py` and made deterministic.
 *
 * The pipeline's `acceptRepair` judges ONE candidate against ITS predecessor.
 * That is not enough: a repair can be "not worse" three times in a row while the
 * model never gets right, which is exactly the loop img2threejs built this to
 * stop. This module keeps the ROUND HISTORY and answers two questions per round:
 *
 *   - does the next round run at all? (halt-and-ask semantics)
 *   - does it run ESCALATED — i.e. the prompt stops asking for dimension
 *     tweaks and asks for the tree's structure to be re-examined?
 *
 * Priorities, in order (a halt is never weakened by anything below it):
 *
 *   1. Hard ceiling — `rounds >= maxRounds` halts before running anything.
 *      Module-invariant of the original: "the single most important property;
 *      do not weaken it".
 *   2. Plateau — the last two rounds (reverted or not) failed to move the
 *      accepted-best score by `plateauDelta`: two rounds without measurable
 *      progress is the model telling us it cannot fix this; halt and ask.
 *   3. Oscillation — two consecutive reverted rounds: the model is thrashing,
 *      the next attempt runs escalated (re-examine topology, not values).
 *   4. Same-defect survival — the same fixable defect code survived two
 *      consecutive rounds: parameter-level fixing has failed twice on it, so
 *      the next attempt runs escalated.
 *   5. Otherwise the next round runs normally.
 *
 * Scoring is monotonic by construction: `bestAcceptedScore` only moves when a
 * round is accepted AND measures better; a round that measures below the best
 * already accepted is marked `reverted` even if its immediate predecessor was
 * worse — "only better counts".
 */

export interface CorrectionRound {
  /** Open fixable defect codes measured after this round's candidate was built. */
  codes: string[];
  errorCount: number;
  /** Aggregate measured score (higher is better); null when nothing was measured. */
  score: number | null;
  /** Whether acceptRepair admitted the candidate over its predecessor. */
  accepted: boolean;
}

export interface RecordedRound extends CorrectionRound {
  index: number;
  /**
   * True when this round did not earn its place: rejected outright, or it
   * measured below the best already-accepted score.
   */
  reverted: boolean;
}

export interface RoundIntent {
  continueRefining: boolean;
  escalate: boolean;
  /** Why — goes into the log/warning when halting, into the prompt when escalating. */
  reason: string;
}

const SCORE_EPSILON = 1e-4;

export class CorrectionLoop {
  readonly rounds: RecordedRound[] = [];
  private bestAcceptedScore: number | null = null;

  constructor(
    private readonly opts: { maxRounds: number; plateauDelta?: number },
  ) {}

  get plateauDelta(): number {
    return this.opts.plateauDelta ?? 1e-3;
  }

  /** Record a finished round. `accepted` is acceptRepair's verdict for it. */
  addRound(round: CorrectionRound): RecordedRound {
    let reverted = !round.accepted;
    if (
      !reverted &&
      round.score !== null &&
      this.bestAcceptedScore !== null &&
      round.score < this.bestAcceptedScore - SCORE_EPSILON
    ) {
      // Accepted over its predecessor, yet below the best ever accepted — the
      // monotonic guard marks it: "only better counts".
      reverted = true;
    }
    const recorded: RecordedRound = { ...round, index: this.rounds.length, reverted };
    this.rounds.push(recorded);
    if (!reverted && round.score !== null) {
      this.bestAcceptedScore =
        this.bestAcceptedScore === null ? round.score : Math.max(this.bestAcceptedScore, round.score);
    }
    return recorded;
  }

  /** What the next round should do, from the history so far. */
  nextIntent(): RoundIntent {
    // 1. Hard ceiling — checked first and unconditionally. Two prior rounds of
    //    oscillation cannot talk the loop into a fourth.
    if (this.rounds.length >= this.opts.maxRounds) {
      return {
        continueRefining: false,
        escalate: false,
        reason:
          `refinement hard ceiling reached (${this.opts.maxRounds} rounds) — halting for human input rather than burning more of the budget on a tree the model could not fix`,
      };
    }

    // 2. Plateau — two rounds without measurable movement of the accepted best.
    if (this.rounds.length >= 2) {
      const [a, b] = this.rounds.slice(-2);
      if (
        a.score !== null &&
        b.score !== null &&
        Math.abs(b.score - a.score) < this.plateauDelta &&
        b.codes.length > 0
      ) {
        return {
          continueRefining: false,
          escalate: false,
          reason:
            `plateau: two rounds of repair moved the measured score by less than ${this.plateauDelta} ` +
            `(${fmt(a.score)} -> ${fmt(b.score)}) with defects still open — halting and asking rather than guessing further`,
        };
      }
    }

    // 3. Oscillation — two consecutive reverted rounds.
    if (this.rounds.length >= 2) {
      const [a, b] = this.rounds.slice(-2);
      if (a.reverted && b.reverted) {
        return {
          continueRefining: true,
          escalate: true,
          reason:
            `two consecutive repairs were reverted (oscillation) — the next attempt re-examines the tree's structure instead of adjusting dimension values`,
        };
      }
    }

    // 4. Same-defect survival — the same fixable defect survived two rounds.
    if (this.rounds.length >= 2) {
      const [a, b] = this.rounds.slice(-2);
      const survived = b.codes.filter((c) => a.codes.includes(c));
      if (survived.length > 0) {
        return {
          continueRefining: true,
          escalate: true,
          reason:
            `defect(s) ${survived.join(", ")} survived two repair rounds — dimension-level fixing has failed on them, ` +
            `so the next attempt re-examines the tree's topology (feature order, construction approach, sketch decomposition)`,
        };
      }
    }

    return { continueRefining: true, escalate: false, reason: "repair budget remains" };
  }
}

function fmt(v: number): string {
  return Number(v.toFixed(4)).toString();
}
