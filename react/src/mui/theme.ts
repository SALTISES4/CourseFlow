import { createTheme } from '@mui/material/styles'

export default createTheme({
  palette: {
    primary: {
      main: '#04BA74',
      light: '#52C68C',
      // @ts-ignore
      lightest: '#e2f5eb', // lightest doesn't seen to be defined
      dark: '#009E52',
      contrastText: '#fff'
    },
    secondary: {
      main: '#78909C',
      light: '#90A4AE',
      dark: '#607D8B'
    },
    divider: '#CFD8DC',
    action: {
      hover: 'rgba(4, 186, 116, 0.08)'
    }
  },
  typography: {
    fontFamily: ['"Open Sans"', 'Helvetica', 'Arial', 'sans-serif'].join(',')
  }
})
