import { Theme, createTheme } from '@mui/material/styles'

const theme: Theme = createTheme({
  palette: {
    primary: {
      main: '#04BA74',
      light: '#52C68C',
      dark: '#009E52',
      contrastText: '#fff'
    },
    secondary: {
      main: '#78909C',
      light: '#90A4AE',
      dark: '#607D8B'
    },
    courseflow: {
      lightest: '#e2f5eb',
      favouriteActive: 'rgba(255, 180, 0, 1)',
      favouriteInactive: 'rgba(0, 0, 0, 0.23)',
      project: 'rgba(245, 127, 23, 1)',
      program: 'rgba(0, 105, 92, 1)',
      course: 'rgba(183, 28, 28, 1)',
      activity: 'rgba(41, 98, 255, 1)',
      template: 'rgba(255, 64, 129, 1)'
    },
    divider: '#CFD8DC',
    action: {
      hover: 'rgba(4, 186, 116, 0.08)'
    }
  },
  typography: {
    fontFamily: ['"Open Sans"', 'Helvetica', 'Arial', 'sans-serif'].join(',')
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600
        }
      }
    }
  }
})

export default theme
