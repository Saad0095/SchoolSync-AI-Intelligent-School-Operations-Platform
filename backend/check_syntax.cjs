const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules')) results = results.concat(walk(file));
    } else if (file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('.');
let hasError = false;

files.forEach(f => {
  try {
    execSync(`node -c "${f}"`, { stdio: 'ignore' });
  } catch(e) {
    console.error('Syntax Error in:', f);
    hasError = true;
  }
});

if (!hasError) console.log('All backend files have valid syntax!');
