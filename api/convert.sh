#!/bin/bash
for file in $(find . -name "*.js" ! -path "./node_modules/*" ! -path "./dist/*"); do
  mv "$file" "${file%.js}.ts"
done
