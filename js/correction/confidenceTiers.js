export const TIER = {
  AUTO: "auto",
  NEEDS_REVIEW: "needs-review",
  MUST_REVIEW: "must-review",
};

export const TIER_LABEL = {
  [TIER.AUTO]: "Auto-suggested",
  [TIER.NEEDS_REVIEW]: "Needs review",
  [TIER.MUST_REVIEW]: "Must review",
};

const TIER_RANK = {
  [TIER.AUTO]: 0,
  [TIER.NEEDS_REVIEW]: 1,
  [TIER.MUST_REVIEW]: 2,
};

const HIGH_CONFIDENCE_SOURCES = new Set(["crossref-doi", "local-titlecase"]);

export function tierForField({ source, risk }) {
  if (risk && risk.length > 0) return TIER.MUST_REVIEW;
  if (HIGH_CONFIDENCE_SOURCES.has(source)) return TIER.AUTO;
  return TIER.NEEDS_REVIEW;
}

// The most severe tier across a document's changed fields, used for the badge
// in the review table.
export function documentTier(diff) {
  let worst = TIER.AUTO;
  for (const info of Object.values(diff.fields)) {
    if (TIER_RANK[info.tier] > TIER_RANK[worst]) worst = info.tier;
  }
  return worst;
}
