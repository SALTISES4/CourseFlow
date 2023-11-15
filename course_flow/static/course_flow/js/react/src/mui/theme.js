import { createTheme } from '@mui/material/styles'

export default createTheme({
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
    other: {
      divider: '#CFD8DC'
    }
  },
  typography: {
    fontFamily: ['"Open Sans"', 'Helvetica', 'Arial', 'sans-serif'].join(',')
  }
})
