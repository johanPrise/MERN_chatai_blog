#!/bin/bash

# Script to fix TypeScript errors in controllers

echo "Fixing TypeScript errors in controllers..."

# Fix auth.controller.ts - logger errors and request.user._id
sed -i '' 's/logger\.error(\([^,]*\), error)/logger.error(\1, error instanceof Error ? error : new Error(String(error)))/g' src/controllers/auth.controller.ts
sed -i '' 's/logger\.warn(\([^,]*\), error)/logger.warn(\1, error instanceof Error ? error : new Error(String(error)))/g' src/controllers/auth.controller.ts
sed -i '' 's/logger\.info(\([^,]*\), error)/logger.info(\1, error instanceof Error ? error : new Error(String(error)))/g' src/controllers/auth.controller.ts

# Fix user.controller.ts
sed -i '' 's/logger\.error(\([^,]*\), error)/logger.error(\1, error instanceof Error ? error : new Error(String(error)))/g' src/controllers/user.controller.ts
sed -i '' 's/logger\.warn(\([^,]*\), error)/logger.warn(\1, error instanceof Error ? error : new Error(String(error)))/g' src/controllers/user.controller.ts

# Fix post.controller.ts
sed -i '' 's/logger\.error(\([^,]*\), error)/logger.error(\1, error instanceof Error ? error : new Error(String(error)))/g' src/controllers/post.controller.ts

# Fix comment.controller.ts
sed -i '' 's/logger\.error(\([^,]*\), error)/logger.error(\1, error instanceof Error ? error : new Error(String(error)))/g' src/controllers/comment.controller.ts

# Fix category.controller.ts
sed -i '' 's/logger\.error(\([^,]*\), error)/logger.error(\1, error instanceof Error ? error : new Error(String(error)))/g' src/controllers/category.controller.ts

# Fix content.controller.ts
sed -i '' 's/logger\.error(\([^,]*\), error)/logger.error(\1, error instanceof Error ? error : new Error(String(error)))/g' src/controllers/content.controller.ts

# Fix upload.controller.ts
sed -i '' 's/logger\.error(\([^,]*\), error)/logger.error(\1, error instanceof Error ? error : new Error(String(error)))/g' src/controllers/upload.controller.ts

# Fix ai.controller.ts
sed -i '' 's/logger\.error(\([^,]*\), error)/logger.error(\1, error instanceof Error ? error : new Error(String(error)))/g' src/controllers/ai.controller.ts

# Fix notification.controller.ts
sed -i '' 's/logger\.error(\([^,]*\), error)/logger.error(\1, error instanceof Error ? error : new Error(String(error)))/g' src/controllers/notification.controller.ts

echo "TypeScript errors fixed!"
