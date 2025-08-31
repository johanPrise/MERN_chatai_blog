export interface User {
  _id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  profilePicture?: string
  bio?: string
  role: "user" | "author" | "admin" | "editor"
  isVerified: boolean
  createdAt: string
  updatedAt?: string
  lastLogin?: string
}