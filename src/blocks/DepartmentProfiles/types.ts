export type DepartmentProfilesAlignment = 'center' | 'left' | 'right'
export type DepartmentProfilesCardLayout = 'inline' | 'overlay'
export type DepartmentProfilesCardSize = 'lg' | 'md' | 'sm'
export type DepartmentProfilesCardFrame = 'boxed' | 'framed' | 'open'
export type DepartmentProfilesColumns = '2' | '3' | '4' | '5' | '6' | '7' | '8'
export type DepartmentProfilesFilterPresentation = 'dropdown' | 'tabs'
export type DepartmentProfilesTabWidth = 'centered' | 'content' | 'equal'
export type DepartmentProfileImagePosition = 'bottom' | 'center' | 'left' | 'right' | 'top'
export type DepartmentProfilesPerLoad = 12 | 16 | 20 | 24

export type ResolvedProfileDepartment = {
  id: string
  name: string
}

export type ResolvedDepartmentProfile = {
  departmentId: string
  departmentName: string
  designation?: string
  featured: boolean
  id: number | string
  image?: {
    alt: string
    height?: number
    src: string
    width?: number
  }
  imagePosition: DepartmentProfileImagePosition
  name: string
}
