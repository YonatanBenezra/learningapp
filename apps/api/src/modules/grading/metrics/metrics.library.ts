import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsLibrary {
  recallAtK(hits: number, total: number): number {
    if (total <= 0) {
      return 0;
    }
    return hits / total;
  }

  ndcgAtK(relevances: number[], k = relevances.length): number {
    const actual = relevances.slice(0, k);
    const dcg = actual.reduce(
      (sum, gain, index) => sum + gain / Math.log2(index + 2),
      0,
    );
    const ideal = [...relevances]
      .sort((left, right) => right - left)
      .slice(0, k);
    const idcg = ideal.reduce(
      (sum, gain, index) => sum + gain / Math.log2(index + 2),
      0,
    );
    return idcg === 0 ? 0 : dcg / idcg;
  }

  f1(precision: number, recall: number): number {
    if (precision + recall === 0) {
      return 0;
    }
    return (2 * precision * recall) / (precision + recall);
  }

  cohenKappa(a: boolean[], b: boolean[]): number {
    const n = Math.min(a.length, b.length);
    if (n === 0) {
      return 0;
    }
    let agree = 0;
    let aTrue = 0;
    let bTrue = 0;
    for (let i = 0; i < n; i += 1) {
      if (a[i]) {
        aTrue += 1;
      }
      if (b[i]) {
        bTrue += 1;
      }
      if (Boolean(a[i]) === Boolean(b[i])) {
        agree += 1;
      }
    }
    const po = agree / n;
    const pe = (aTrue / n) * (bTrue / n) + ((n - aTrue) / n) * ((n - bTrue) / n);
    if (pe === 1) {
      return 1;
    }
    return (po - pe) / (1 - pe);
  }
}
