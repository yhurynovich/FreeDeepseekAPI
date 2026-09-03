const server = require('./server.js');
const { solvePOW } = server.__test || {};

// We need to access the internal solvePOW - it's exported at the end of server.js
// Let me just check what's available

console.log('Available exports:', Object.keys(server.__test || {}));