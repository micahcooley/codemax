# Optional tool library

The six recipes are setup conveniences, not bundled tools. Selecting a recipe populates a reviewable executable/argv draft. Saving does not run it. Connecting separately asks for process consent; catalog tools start disabled, and calls require exact approval or an explicit broader per-tool task grant. A trusted executable runs as the user, not in an OS sandbox.

| Recipe | Published version pin | Prerequisites and boundary |
|---|---|---|
| Local project tools | builtin (`builtin:local-tools`, version 0.2.0, no download) | Bundled native process; file operations stay inside the chosen project without following links. Writes and trusted shell commands must be enabled explicitly. |
|---|---|---|
| Project files | `@modelcontextprotocol/server-filesystem@2026.8.31` | Node/npm; specific user-selected folder; server-owned file access controls. |
| Git repositories | `mcp-server-git==2026.8.18` | uv/uvx, Python environment and Git; chosen repository is a starting location, not a Codemax confinement promise. |
| Read web pages | `mcp-server-fetch==2026.8.18` | uv/uvx; fetches a supplied URL, not search-engine results. Can reach local/internal addresses; review the destination. |
| Working notes | `@modelcontextprotocol/server-memory@2026.8.31` | Node/npm; server-persisted knowledge graph, separate from Codemax settings. Notes returned to a website leave the local machine. |
| Browser tools | `@playwright/mcp@0.0.82 --isolated` | Node/npm and supported browser binaries; a separate isolated browser, not Codemax's signed-in provider tabs. Searching through an interactive website is possible; no search-engine API is bundled. |

No provider inference API key is required by these definitions. Tool operations still require the server and its runtime to be installed or downloaded when the approved package-manager process runs. Network restrictions, missing programs, package resolution, startup errors and missing browser binaries are surfaced as connection failures. The user can edit the draft or provide an already provisioned executable; the app does not silently substitute another server.

Folder paths remain one argument, including spaces/quotes. The basic library rejects root (also `/./` and `////`), parent traversal, relative paths and control characters. It does not resolve or audit every symlink in the chosen path: server behavior and separate sandboxing remain part of the trust decision. Advanced custom definitions are reviewed as arbitrary user-trusted commands, not misleadingly called folder-constrained.

The source audit initially considered repository manifest versions 0.6.2/0.6.3. Publication verification showed those manifest fields did not identify the current published builds; Fetch 0.6.3 was absent from the displayed release history. They are not used in this package. Official release notes and PyPI records determine the corrected pins below. No external server package was installed/executed for this revision. Direct version pins do not pin transitive dependencies or establish a vulnerability-free guarantee.

## Primary sources checked

- Published filesystem/memory releases: https://github.com/modelcontextprotocol/servers/releases/tag/2026.8.31
- Published Git/Fetch releases: https://github.com/modelcontextprotocol/servers/releases/tag/2026.8.18
- Git artifact and usage: https://pypi.org/project/mcp-server-git/2026.8.18/
- Fetch artifact, usage and internal-network warning: https://pypi.org/project/mcp-server-fetch/2026.8.18/
- Playwright publication: https://www.npmjs.com/package/%40playwright/mcp?activeTab=versions
- Playwright configuration and isolated browser: https://github.com/microsoft/playwright-mcp
- Reference-server caution (not production security certification): https://github.com/modelcontextprotocol/servers

The source contracts were inspected through GitHub. PyPI/npm publication pages were also checked; direct npm page/registry opens were partially blocked, so the official GitHub release declaration is the filesystem/memory publication evidence. Runtime compatibility remains a separate native gate.
