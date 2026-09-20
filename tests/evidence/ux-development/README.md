# Development-only captures

These captures are from earlier iterations of the current UX audit, not final acceptance runs. Existing UI test selectors needed migration after technical panels moved under details and Stop actions acquired confirmations. Three initial fault-injection tests accidentally returned the assigned function from Playwright evaluate, causing Playwright to invoke it immediately instead of just installing the test fault; the fixture setup now ends with a non-function expression. The first audit execution was also stopped by its outer command timeout and was rerun to completion.

The final results are ../ux-audit.json, ../ui-browser.json, ../codemax-ui.json, and ../single-tab-ui.json. No assertion was removed to turn a failing product behavior into a pass. These historical images do not depict remaining accepted failures.
