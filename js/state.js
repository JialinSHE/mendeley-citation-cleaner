export const state = {
  documents: [],
  diffsByDocId: new Map(),
  decisionsByDocId: new Map(),
  changeLog: [],
};

export function getDecision(docId, field) {
  const docDecisions = state.decisionsByDocId.get(docId);
  return docDecisions ? docDecisions[field] : undefined;
}

export function setDecision(docId, field, decision) {
  const docDecisions = state.decisionsByDocId.get(docId) || {};
  docDecisions[field] = decision;
  state.decisionsByDocId.set(docId, docDecisions);
}
