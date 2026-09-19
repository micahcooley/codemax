# Source recovery

The attached archive contains the working source, compiled frontend, screenshots and evidence. `RECOVERY.bundle` contains the local Git commits, including the supplied alpha import and this implementation round. There is no claimed remote push.

```bash
git clone RECOVERY.bundle desktop-ai-bridge
cd desktop-ai-bridge
```

The unpacked ZIP also contains `MANIFEST.sha256`. From the unpacked `desktop-ai-bridge` folder, `sha256sum -c MANIFEST.sha256` verifies included files. The outer ZIP has its own adjacent checksum file. Neither checksums nor Git history imply a native build passed.
