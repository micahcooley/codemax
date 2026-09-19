# Source recovery

Unzip the archive to recover all files directly. A separate Git installation is not required for that path.

`RECOVERY.bundle` also preserves the local committed source history:

```bash
git clone RECOVERY.bundle desktop-ai-bridge-recovered
```

This is a local snapshot, not a GitHub branch or CI result. The bundle is created before its own file checksum manifest, so the archive additionally contains packaging-only files outside the bundle. Runtime dependencies and the pinned compiler must be acquired separately; see README.md.
