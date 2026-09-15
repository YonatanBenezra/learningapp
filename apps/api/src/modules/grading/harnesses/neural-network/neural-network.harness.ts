import { Injectable } from '@nestjs/common';
import { isNeuralNetworkSlug } from '../../../catalogue/exercises/exercises.constants';
import { gradeNeuralNetwork } from './neural-network.grade';
import type { NeuralNetworkGradeResult } from './neural-network.types';

export type NeuralNetworkExecuteInput = {
  slug: string;
  runId: string;
  payload: unknown;
  hidden: unknown;
  publicItems?: { question: string }[];
};

@Injectable()
export class NeuralNetworkHarness {
  execute(input: NeuralNetworkExecuteInput): Promise<NeuralNetworkGradeResult> {
    const publicItems = input.publicItems ?? [];
    if (isNeuralNetworkSlug(input.slug)) {
      return Promise.resolve(
        gradeNeuralNetwork(input.payload, input.hidden, publicItems),
      );
    }
    return Promise.reject(
      new Error(`Unsupported neural network exercise: ${input.slug}`),
    );
  }
}
