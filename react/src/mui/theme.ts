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
      lightest: '#e2f5eb'
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
