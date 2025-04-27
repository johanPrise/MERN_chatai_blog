export interface User {
    _id: string
    username: string
    email: string
    role: "user" | "author" | "admin"
  }