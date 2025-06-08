/**
 * @deprecated This component has been replaced by the new post management system
 * Located at: src/features/posts/pages/CreatePost.tsx
 *
 * This file is kept temporarily for reference and will be removed once
 * the migration is complete and tested.
 */

// This component is deprecated - redirecting to new system
import React from "react"
import { Navigate } from "react-router-dom"

const CreatePost: React.FC = () => {
  // Redirect to the new post creation system
  return <Navigate to="/posts/create" replace />
}

export default CreatePost
