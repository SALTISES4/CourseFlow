import '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Palette {
    courseflow: {
      lightest?: string
    }
  }

  interface PaletteOptions {
    courseflow?: {
      lightest?: string
    }
  }
}
