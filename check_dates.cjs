const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.png'));
const stats = files.map(f => ({ name: f, time: fs.statSync(f).mtime.getTime() }));
stats.sort((a,b) => b.time - a.time);
console.log('Root pngs:', stats);

const pubFiles = fs.readdirSync('./public').filter(f => f.endsWith('.png'));
const pubStats = pubFiles.map(f => ({ name: './public/' + f, time: fs.statSync('./public/' + f).mtime.getTime() }));
pubStats.sort((a,b) => b.time - a.time);
console.log('Public pngs:', pubStats);
