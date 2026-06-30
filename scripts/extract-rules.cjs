const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'src', 'data', 'rules.ts');
let content = fs.readFileSync(srcPath, 'utf8');

const regex = /const RULES_DATA:\s*RuleEntry\[\]\s*=\s*(\[[\s\S]*?\])\s*function/m;
const match = content.match(regex);
if (!match) {
  console.error("Could not find RULES_DATA array");
  process.exit(1);
}

let arrayString = match[1];

const jsCode = `module.exports = ${arrayString};`;

const tempFile = path.join(__dirname, 'temp-rules.cjs');
fs.writeFileSync(tempFile, jsCode);

try {
  const data = require('./temp-rules.cjs');
  const jsonStr = JSON.stringify(data, null, 2);
  const destPath = path.join(__dirname, '..', 'src', 'data', 'rules.json');
  fs.writeFileSync(destPath, jsonStr);
  console.log('Successfully wrote rules.json');
} catch (e) {
  console.error(e);
} finally {
  if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
}
