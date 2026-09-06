const fs = require('fs');
const files = [
  'src/components/PerangkatAjarKBCView.tsx',
  'src/components/GeneratorSoalAIView.tsx',
  'src/components/GeneratorPerangkatAjarAIView.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/width: auto; float: left; margin-right: 15px; object-fit: contain;" \/>`;/g, "");
  fs.writeFileSync(file, content, 'utf8');
}
console.log("Fixed!");
