const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.png'));
const pubFiles = fs.readdirSync('./public').filter(f => f.endsWith('.png')).map(f => './public/' + f);
const allFiles = [...files, ...pubFiles];

console.log("Analyzing PNG files:");
allFiles.forEach(file => {
  const stat = fs.statSync(file);
  console.log(`${file} : ${stat.size} bytes`);
});
