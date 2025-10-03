const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'src', 'controllers');

// Get all TypeScript files in controllers directory
const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Split into lines for better processing
  const lines = content.split('\n');
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line contains request.user._id or request.user.role without a prior check
    if ((line.includes('request.user._id') || line.includes('request.user.role')) && 
        !line.includes('if (!request.user)') &&
        !line.includes('request.user?')) {
      
      // Look back to see if there's already a check
      let hasCheck = false;
      for (let j = Math.max(0, i - 10); j < i; j++) {
        if (newLines[j] && newLines[j].includes('if (!request.user)')) {
          hasCheck = true;
          break;
        }
      }
      
      // If no check found, add one before this line
      if (!hasCheck) {
        const indent = line.match(/^(\s*)/)[1];
        newLines.push(`${indent}if (!request.user) {`);
        newLines.push(`${indent}  return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });`);
        newLines.push(`${indent}}`);
        modified = true;
      }
    }
    
    newLines.push(line);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    console.log(`Fixed additional issues in: ${file}`);
  }
});

console.log('Additional fixes completed!');
