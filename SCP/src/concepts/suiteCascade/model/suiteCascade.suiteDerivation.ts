function colorNameToSuite(color: string): string {
  const map: Record<string, string> = {
    red: 'red',
    maroon: 'maroon',
    orange: 'orange',
    yellow: 'yellow',
    ochre: 'yellow',
    green: 'green',
    viridian: 'viridian',
    blue: 'blue',
    cobalt: 'cobalt',
    purple: 'purple',
    amethyst: 'amethyst',
    fuchsia: 'fuchsia',
    rose: 'fuchsia',
  };
  return map[color] ?? 'base';
}

export function suiteFromCascadeFilePath(filePath: string): string {
  const fileName = filePath.split('/').at(-1) ?? '';

  if (/ONYX-TIER/i.test(fileName)) return 'onyx';
  if (/DIAMOND-TIER|MASTER-DIAMOND/i.test(fileName)) return 'diamond';

  const suiteColorMatch = fileName.match(
    /[-_](RED|MAROON|ORANGE|YELLOW|OCHRE|GREEN|VIRIDIAN|BLUE|COBALT|PURPLE|AMETHYST|FUCHSIA|ROSE)[-_]/i,
  );
  if (suiteColorMatch) {
    return colorNameToSuite(suiteColorMatch[1].toLowerCase());
  }

  return 'base';
}
