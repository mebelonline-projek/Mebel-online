import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const sourceLogo = path.join(projectRoot, 'public', 'logo', 'ChatGPT Image 14 Jun 2026, 09.45.59.png');
const publicDir = path.join(projectRoot, 'public');

async function generateFavicons() {
  if (!fs.existsSync(sourceLogo)) {
    console.error('Source logo not found:', sourceLogo);
    process.exit(1);
  }

  console.log('Generating favicons from:', sourceLogo);

  // Read the source image
  const image = sharp(sourceLogo);
  const metadata = await image.metadata();
  console.log('Source image metadata:', metadata);

  // 1. favicon.ico (multi-size ICO: 16x16, 32x32, 48x48)
  const ico16 = await sharp(sourceLogo).resize(16, 16).png().toBuffer();
  const ico32 = await sharp(sourceLogo).resize(32, 32).png().toBuffer();
  const ico48 = await sharp(sourceLogo).resize(48, 48).png().toBuffer();

  // Create ICO file (simple concatenation with ICO header)
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Type: ICO
  icoHeader.writeUInt16LE(3, 4); // Number of images

  const icoDirEntry = (width, height, data, offset) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width === 256 ? 0 : width, 0);
    entry.writeUInt8(height === 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(data.length, 8); // Size of data
    entry.writeUInt32LE(offset, 12); // Offset of data
    return entry;
  };

  const dataOffset = 6 + 16 * 3;
  const icoDir = Buffer.concat([
    icoDirEntry(16, 16, ico16, dataOffset),
    icoDirEntry(32, 32, ico32, dataOffset + ico16.length),
    icoDirEntry(48, 48, ico48, dataOffset + ico16.length + ico32.length),
  ]);

  const icoFile = Buffer.concat([icoHeader, icoDir, ico16, ico32, ico48]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoFile);
  console.log('Created: favicon.ico');

  // 2. favicon-32x32.png
  await sharp(sourceLogo).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('Created: favicon-32x32.png');

  // 3. favicon-16x16.png
  await sharp(sourceLogo).resize(16, 16).png().toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('Created: favicon-16x16.png');

  // 4. apple-touch-icon.png (180x180)
  await sharp(sourceLogo).resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created: apple-touch-icon.png');

  // 5. android-chrome-192x192.png
  await sharp(sourceLogo).resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).png().toFile(path.join(publicDir, 'android-chrome-192x192.png'));
  console.log('Created: android-chrome-192x192.png');

  // 6. android-chrome-512x512.png
  await sharp(sourceLogo).resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).png().toFile(path.join(publicDir, 'android-chrome-512x512.png'));
  console.log('Created: android-chrome-512x512.png');

  console.log('\nAll favicons generated successfully!');
}

generateFavicons().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});