# Source recovery

The ZIP contains the working source, compiled Svelte frontend, screenshots and evidence. `RECOVERY.bundle` contains the local Git history through this Codemax implementation revision. No remote push is claimed.

```bash
git clone RECOVERY.bundle codemax
cd codemax
```

The ZIP uses the top-level folder `desktop-ai-bridge/` to preserve the existing build paths and profile identifier. The product displayed to users is Codemax. From that unpacked folder, verify all included files:

```bash
sha256sum -c MANIFEST.sha256
```

`PACKAGE_METADATA.json` and `docs/LOCAL_COMMIT.txt` identify the local source commit. `RECOVERY.bundle`, package metadata and the manifest are delivery wrappers outside the commit; the manifest excludes only itself. The external receipt/checksum records the outer ZIP hash, size and member count. The bundle is verified with `git bundle verify` during packaging.

Checksums establish byte integrity, not native compilation or live interoperability. Native Zag and Tauri builds remain unverified; consult EXECUTION_REPORT.md before treating this package as a release.
