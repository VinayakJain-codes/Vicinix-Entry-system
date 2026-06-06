const sharp = require('sharp');
const qrcode = require('qrcode');
const path = require('path');

async function test() {
  const qrBuffer = await qrcode.toBuffer('https://example.com/scan?token=123', { 
    type: 'png', 
    width: 540, 
    margin: 1, 
    color: { dark: '#000000', light: '#ffffff' } 
  });
  
  const eventName = "Tech Summit 2026";
  const studentName = "John Doe";
  const rollNo = "ENR-12345";
  
  const svgOverlay = Buffer.from(`
<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <text x="1030" y="65" font-family="Arial" font-size="52" font-weight="900" fill="#000000" text-anchor="end">${studentName}</text>
  <text x="1030" y="125" font-family="Arial" font-size="40" font-weight="700" fill="#000000" text-anchor="end">${rollNo}</text>
</svg>
  `);

  await sharp(path.join(__dirname, 'public', 'template.png'))
    .composite([
      { input: svgOverlay, top: 0, left: 0 },
      { input: qrBuffer, top: 310, left: 270 } 
    ])
    .png()
    .toFile(path.join(__dirname, 'public', 'test_output.png'));
    
  console.log("Done");
}

test();
