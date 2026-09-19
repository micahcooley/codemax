# Detector research handoff

There is no trained TNN detector in this package. `backend/detector/tnn_bridge.zag` validates a minimal shadow prediction, and `schemas/tnn-shadow.schema.json` describes it. This is a boundary, not a running neural inference engine.

Preserve the TNN project's existing canonical/experimental distinctions. Do not change its research claims or default branch on the strength of this package. No TNN repository writes or research metrics were produced here.

Proposed experiment: collect only consented synthetic/structural observations from the bundled fixture, partition by website-layout family rather than individual event, preregister holdout controls, and compare a learned predictor against the symbolic baseline. Track exact control identity, abstention, sensitive-action false positives, calibration, stale-document rejection and redesign robustness. Do not convert model-name recognition into tokenizer/context-window claims.

Shadow predictions must carry evidence version and bounded node/confidence data, remain non-authoritative, and never call the OS/browser directly. A future research runner must attach model hash, dataset manifest and held-out results separately. Production remains symbolic unless both reproducible research evidence and product safety gates are admitted. No accuracy threshold or research success is invented here.
