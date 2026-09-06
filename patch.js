const fs = require('fs');
const files = [
  'src/components/PerangkatAjarKBCView.tsx',
  'src/components/GeneratorSoalAIView.tsx',
  'src/components/GeneratorPerangkatAjarAIView.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  const targetRegex = /const defaultLogoTag = `<img src="\$\{config\.Logo_Kiri.*?;/g;
  
  const replacement = `const fallbackLogo = "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU";
    const logoKiri = config.Logo_Kiri || (config.Logo_Kanan ? "" : fallbackLogo);
    const logoKanan = config.Logo_Kanan;
    let defaultLogoTag = "";
    if (logoKiri) {
      defaultLogoTag += \\\`<img src="\\\${logoKiri}" alt="Logo Kiri" class="logo-sekolah" style="max-height: 75px; width: auto; float: left; margin-right: 15px; object-fit: contain; -webkit-print-color-adjust: exact; print-color-adjust: exact;" />\\\`;
    }
    if (logoKanan) {
      defaultLogoTag += \\\`<img src="\\\${logoKanan}" alt="Logo Kanan" class="logo-sekolah" style="max-height: 75px; width: auto; float: right; margin-left: 15px; object-fit: contain; -webkit-print-color-adjust: exact; print-color-adjust: exact;" />\\\`;
    }`;

  content = content.replace(targetRegex, replacement);
  fs.writeFileSync(file, content, 'utf8');
}
console.log("Patched!");
