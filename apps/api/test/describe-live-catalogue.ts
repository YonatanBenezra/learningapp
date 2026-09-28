import { CATALOGUE_LIVE } from '../src/modules/catalogue/exercises/exercises.constants';

/** E2E suites that need at least one published exercise in the DB. */
export const describeLiveCatalogue = CATALOGUE_LIVE ? describe : describe.skip;
