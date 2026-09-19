<script lang="ts">
  let {name, size = 18}: {name: string; size?: number} = $props();
  const paths: Record<string,string> = {
    grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    globe:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z',
    layers:'m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5',
    terminal:'m5 7 5 5-5 5m8 0h6M3 3h18v18H3z',
    history:'M3 11a9 9 0 1 1 2 7M3 4v7h7m2-4v5l3 2',
    scan:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 12h10m-5-5v10',
    settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2-5h4l1 3 3 1 3 3v4l-3 3-3 1-1 3h-4l-1-3-3-1-3-3v-4l3-3 3-1 1-3Z',
    plus:'M12 5v14M5 12h14', close:'m6 6 12 12M6 18 18 6', arrow:'m9 5 7 7-7 7', back:'m15 5-7 7 7 7',
    refresh:'M20 7a8 8 0 1 0 1 8M20 3v5h-5', copy:'M9 9h12v12H9zM15 9V3H3v12h6',
    shield:'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6',
    key:'M14 7a4 4 0 1 1-2 7l-8 7H1v-3l8-8a4 4 0 0 1 5-3Z',
    search:'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 6 6',
    pause:'M8 5v14M16 5v14', stop:'M5 5h14v14H5z', check:'m5 12 4 4L19 6',
    panel:'M3 3h18v18H3zM9 3v18', bolt:'m13 2-9 12h7l-1 8 10-13h-7l1-7Z',
  };
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={paths[name] ?? paths.grid}/></svg>
