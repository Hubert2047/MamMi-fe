export type UserRole = 'SuperAdmin' | 'Admin' | 'Employee' | 'Guest'

export interface AuthUser {
  id: string | number
  name: string
  role: UserRole
  [key: string]: string | number
}
