const fs = require('fs');
let data = fs.readFileSync('d:\\Echo Lab\\src\\data\\interviewData.js', 'utf8');

data = data.replace(/category:\s*'Technical\/Role-Specific',\s*question:\s*"([^"]+)"/g, (match, q) => {
   if (/LLM|ML|AI|pipeline/i.test(q)) {
       return `category: 'AI & ML',\n    question: "${q}"`;
   }
   return `category: 'Tech Writing',\n    question: "${q}"`;
});

data = data.replace(/category:\s*'Behavioral',\s*question:\s*"([^"]+)"/g, (match, q) => {
   if (/disagreements|deadline|challenge|delayed/i.test(q)) {
       return `category: 'HR',\n    question: "${q}"`;
   }
   return match;
});

fs.writeFileSync('d:\\Echo Lab\\src\\data\\interviewData.js', data, 'utf8');
console.log('Done mapping categories');
