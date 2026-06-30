const fs = require('fs');
const path = require('path');

const targetFiles = [
  "src/components/games/AjedrezNewMatch.tsx",
  "src/components/games/BlackjackNewMatch.tsx",
  "src/components/games/ChanchoNewMatch.tsx",
  "src/components/games/ChinNewMatch.tsx",
  "src/components/games/CustomNewMatch.tsx",
  "src/components/games/EsquinadosNewMatch.tsx",
  "src/components/games/GeneralaNewMatch.tsx",
  "src/components/games/GenericNewMatch.tsx",
  "src/components/games/PokerNewMatch.tsx",
  "src/components/games/PorcionNewMatch.tsx",
  "src/components/games/RachaPerdidaNewMatch.tsx",
  "src/components/games/SushiDoNewMatch.tsx",
  "src/components/games/UnoNewMatch.tsx",
  "src/components/ui/AppLayout.tsx",
  "src/pages/GameDetail.tsx"
];

for (const relPath of targetFiles) {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Remove the local LinkedPlayer interface
  const regex = /\n*interface\s+LinkedPlayer\s*\{[\s\S]*?\n\}\n*/;
  content = content.replace(regex, '\n\n');
  
  // Add LinkedPlayer to the imports
  if (relPath.includes('games/')) {
    content = content.replace(/import\s+(?:type\s+)?\{\s*(.*?)\s*\}\s+from\s+"(?:..\/..\/types|\.\.\/types)";/, (match, p1) => {
      const imports = p1.split(',').map(s => s.trim()).filter(Boolean);
      if (!imports.includes('LinkedPlayer')) {
        imports.push('LinkedPlayer');
        imports.sort();
      }
      return `import type { ${imports.join(', ')} } from "../../types";`;
    });
  } else {
    // AppLayout and GameDetail import from '../types' or '../../types'
    content = content.replace(/import\s+(?:type\s+)?\{\s*(.*?)\s*\}\s+from\s+"\.\.\/types";/, (match, p1) => {
      const imports = p1.split(',').map(s => s.trim()).filter(Boolean);
      if (!imports.includes('LinkedPlayer')) {
        imports.push('LinkedPlayer');
        imports.sort();
      }
      return `import type { ${imports.join(', ')} } from "../types";`;
    });
  }
  
  fs.writeFileSync(fullPath, content);
  console.log('Updated ' + relPath);
}
