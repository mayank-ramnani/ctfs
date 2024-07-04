const crypto = require('crypto');

// function to generate md5 hash with different digest formats
const md5 = (data, encoding, format) => {
  return crypto.createHash('md5').update(data, encoding).digest(format);
};

const headerKid = '129581926211651571912466741651878684928';

const hashHex = md5(headerKid, 'utf8', 'hex');
const hashLatin1 = md5(headerKid, 'utf8', 'latin1');

console.log(`hex: ${hashHex}`);         // md5 hash in hex format
console.log(`latin1: ${hashLatin1}`);   // md5 hash in latin-1 format
