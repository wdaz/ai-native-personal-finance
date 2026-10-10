/**
 * SPEC-reset-and-test-support §2.7: the seed variants. Their pure rules live in
 * `src/domain/variants.ts` since T-23 (SPEC-budgets §4, H15 (2)); the server keeps calling them
 * from here.
 */
export {
  applyVariant,
  FEW_TRANSACTIONS,
  isSeedVariant,
  SEED_VARIANTS,
  type SeedVariant,
} from "@/src/domain/variants";
