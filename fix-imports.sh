#!/bin/bash

# Find all TypeScript and TSX files in the src directory
find src -type f -name "*.ts" -o -name "*.tsx" | while read -r file; do
  # Replace @/lib/utils with relative path
  sed -i '' 's|@/lib/utils|../../lib/utils|g' "$file"
  
  # Replace @/components/ui with relative path
  sed -i '' 's|@/components/ui|../ui|g' "$file"
  
  echo "Fixed imports in $file"
done

echo "All imports fixed!"
