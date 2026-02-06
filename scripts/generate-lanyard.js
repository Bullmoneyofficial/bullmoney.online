const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Lanyard dimensions - long and thin like a real lanyard strap
const width = 512;
const height = 64;

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Create gradient background (black to blue to white)
const gradient = ctx.createLinearGradient(0, 0, width, 0);
gradient.addColorStop(0, '#0a0a0a');      // Near black
gradient.addColorStop(0.3, '#1a1a2e');    // Dark blue-black
gradient.addColorStop(0.5, '#16213e');    // Deep blue  
gradient.addColorStop(0.7, '#0f3460');    // Medium blue
gradient.addColorStop(1, '#e8e8e8');      // Off-white

ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);

// Add subtle diagonal stripes pattern
ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
ctx.lineWidth = 2;

for (let i = -height; i < width + height; i += 12) {
  ctx.beginPath();
  ctx.moveTo(i, 0);
  ctx.lineTo(i + height, height);
  ctx.stroke();
}

// Add center line highlight
const centerGradient = ctx.createLinearGradient(0, height/2 - 4, 0, height/2 + 4);
centerGradient.addColorStop(0, 'rgba(100, 149, 237, 0)');
centerGradient.addColorStop(0.5, 'rgba(100, 149, 237, 0.3)');
centerGradient.addColorStop(1, 'rgba(100, 149, 237, 0)');

ctx.fillStyle = centerGradient;
ctx.fillRect(0, height/2 - 4, width, 8);

// Add edge highlights for 3D effect
ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(0, 1);
ctx.lineTo(width, 1);
ctx.stroke();

ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
ctx.beginPath();
ctx.moveTo(0, height - 1);
ctx.lineTo(width, height - 1);
ctx.stroke();

// Add "BULLMONEY" text repeating along the lanyard
ctx.font = 'bold 18px Arial, sans-serif';
ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

const text = 'BULLMONEY';
const textWidth = ctx.measureText(text + '   ').width;
const spacing = textWidth + 40;

for (let x = 0; x < width + spacing; x += spacing) {
  ctx.fillText(text, x, height / 2);
}

// Save the image
const outputPath = path.join(__dirname, '..', 'public', 'lanyard.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outputPath, buffer);

console.log(`✅ Lanyard texture saved to: ${outputPath}`);
console.log(`   Dimensions: ${width}x${height}px`);
console.log(`   Colors: Black → Blue → White gradient with diagonal stripes`);
