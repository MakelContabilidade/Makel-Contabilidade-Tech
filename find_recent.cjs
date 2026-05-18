const fs = require('fs');
const path = require('path');

function walk(dir, minTime) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
      if (file === 'node_modules' || file === '.git') return;
      file = dir + '/' + file;
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) { 
        results = results.concat(walk(file, minTime));
      } else { 
        if (stat.mtime.getTime() >= minTime) {
          results.push(file);
        }
      }
    });
  } catch(e) {}
  return results;
}

const recent = walk('.', Date.now() - 5 * 60 * 1000);
console.log('Recent files:', recent);
