export type LeadershipProfilesAlignment = 'center' | 'left' | 'right'
export type LeadershipProfilesCardLayout = 'imageOverlay' | 'standard'
export type LeadershipProfilesColumns = '2' | '3' | '4'
export type LeadershipProfileImagePosition = 'bottom' | 'center' | 'left' | 'right' | 'top'

export type ResolvedLeadershipProfile = {
  designation?: string
  expertise: string[]
  id: number | string
  image: {
    alt: string
    height?: number
    src: string
    width?: number
  }
  imagePosition: LeadershipProfileImagePosition
  leadershipLabel?: string
  name: string
  qualification?: string
}
