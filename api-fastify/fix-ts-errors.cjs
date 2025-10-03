const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'src', 'controllers');

// Get all TypeScript files in controllers directory
const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix request.log.error(error) - add proper type checking
  content = content.replace(
    /(\s+)request\.log\.error\(error\);/g,
    '$1request.log.error(error instanceof Error ? error : new Error(String(error)));'
  );
  
  // Fix request.log.error('[...] ...', { error }) patterns
  content = content.replace(
    /request\.log\.error\(([^,]+),\s*\{\s*error\s*\}\);/g,
    'request.log.error($1, { error: error instanceof Error ? error.message : String(error) });'
  );
  
  // Fix request.user._id where request.user might be undefined
  // This pattern looks for request.user._id and adds a check
  content = content.replace(
    /(\s+)(const|let)\s+(\w+)\s*=\s*request\.user\._id;/g,
    '$1if (!request.user) {\n$1  return reply.status(401).send({ message: \'Non autorisé - Veuillez vous connecter\' });\n$1}\n$1$2 $3 = request.user._id;'
  );
  
  // Fix request.user.role where request.user might be undefined
  content = content.replace(
    /(\s+)(const|let)\s+(\w+)\s*=\s*request\.user\.role;/g,
    '$1if (!request.user) {\n$1  return reply.status(401).send({ message: \'Non autorisé - Veuillez vous connecter\' });\n$1}\n$1$2 $3 = request.user.role;'
  );
  
  // Write the fixed content back
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed: ${file}`);
});

console.log('All controller files have been fixed!');
