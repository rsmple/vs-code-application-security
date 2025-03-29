export enum UserAuthMethod {
  PASSWORD = 0,
  SSO = 1,
}

export type User = {
  avatar: string | null
  date_joined: string
  id: number
  username: string
  email: string
  roles: number[]
  auth_method: UserAuthMethod
  has_password_set: boolean
  is_staff: boolean
  is_superuser: boolean
}