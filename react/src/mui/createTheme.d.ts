import '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Palette {
    courseflow: {
      lightest?: string
      favouriteActive?: string
      favouriteInactive?: string

      project?: string
      program?: string
      course?: string
      activity?: string
      template?: string
    }
  }

  interface PaletteOptions {
    courseflow?: {
      lightest?: string
      favouriteActive?: string
      favouriteInactive?: string

      project?: string
      program?: string
      course?: string
      activity?: string
      template?: string
    }
  }
}
