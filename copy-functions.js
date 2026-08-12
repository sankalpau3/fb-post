const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'netlify', 'functions');
const destDir = path.join(__dirname, 'build', 'netlify', 'functions');

// Create destination directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'build', 'netlify'))) {
  fs.mkdirSync(path.join(__dirname, 'build', 'netlify'), { recursive: true });
}

// Copy all files from source to destination
fs.cpSync(srcDir, destDir, { recursive: true });
console.log('✓ Netlify functions copied to build folder');
