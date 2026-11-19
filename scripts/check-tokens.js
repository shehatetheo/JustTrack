#!/usr/bin/env node
/**
 * Fails if a colour is written by hand in a screen or component. Colours
 * live in constants/theme.ts; everything else asks the theme for them. Run
 * as part of `npm run lint`.
 *
 * A file that genuinely needs a literal (artwork with fixed inks, say) is
 * listed in ALLOWED with the reason.
 */
const fs = require('fs');
const path = require('path');

const ROOTS = ['app', 'components'];
const ALLOWED = {
  // "relative/path.tsx": "why this file may hold a colour literal".
  'components/food/BuildPreview.tsx': 'The order drawing was made in full colour. Every literal is passed through mono(), which keeps its lightness and maps it onto ink, lavender and white; none reaches the screen as written.',
  'components/layout/PhoneFrame.web.tsx': 'Draws an iPhone around the app on a desktop browser (bezel, island, status bar). It is the picture frame, not the app, and never ships in the iOS build.',
  'components/layout/StorybookStage.tsx': 'The desktop website\'s stage around that phone: scrims and glows mixed from ink and lavender at set strengths, painted over the engraving. Web only.',
};

const COLOUR = /#[0-9a-fA-F]{3,8}\b|rgba?\(/g;
const failures = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) check(full);
  }
}

function check(file) {
  const relative = file.split(path.sep).join('/');
  if (ALLOWED[relative]) return;
  fs.readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      const code = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
      // `#` inside a URL fragment or an id reference such as url(#fade) is not a colour.
      const matches = (code.match(COLOUR) || []).filter((match) => !code.includes(`url(${match}`) && !code.includes(`"${match}`.replace('"#', '"#grid')));
      if (matches.length > 0) failures.push(`${relative}:${index + 1}  ${matches.join(' ')}`);
    });
}

ROOTS.forEach((root) => fs.existsSync(root) && walk(root));

if (failures.length > 0) {
  console.error(`Colour literals outside the theme (${failures.length}):\n` + failures.join('\n'));
  console.error('\nUse a token from constants/theme.ts via useAppTheme(), or add the file to ALLOWED in scripts/check-tokens.js with a reason.');
  process.exit(1);
}
console.log('Colour tokens: no literals in app/ or components/.');
