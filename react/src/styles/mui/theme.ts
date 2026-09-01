import { Theme, alpha, createTheme } from '@mui/material/styles'

declare module '@mui/material' {
  interface ButtonPropsColorOverrides {
    template: true
  }
}

const palette = {
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
  workflow: {
    highlighted: 'rgb(253, 216, 53)',
    selected: 'rgba(4, 186, 116, 0.5)'
  },
  template: {
    main: 'rgba(255, 64, 129, 1)',
    contrastText: '#fff'
  },
  workspaceBlocks: {
    courseAssessment: '#ad1d35',
    courseProject: '#ed4a28',
    courseLesson: '#ed8934',
    coursePreparation: '#f7b92a',
    reusableBlocks: '#b388ff',
    strategies: '#651fff',
    activityOOCInstr: '#08118a',
    activityOOCStud: '#114bd4',
    activityICInstr: '#268ae5',
    activityICStud: '#8bc8ff',
    background: '#eef2fd'
  },
  divider: '#cfd8dc',
  action: {
    hover: 'rgba(4, 186, 116, 0.08)'
  }
}

const theme: Theme = createTheme({
  palette,
  typography: {
    fontFamily: ['"Open Sans"', 'Helvetica', 'Arial', 'sans-serif'].join(',')
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.MuiInputBase-readOnly': {
            backgroundColor: alpha(theme.palette.text.primary, 0.04),
            cursor: 'default',
            '& .MuiOutlinedInput-input': {
              cursor: 'default',
              caretColor: 'transparent'
            },
            '& .MuiOutlinedInput-notchedOutline, &:hover .MuiOutlinedInput-notchedOutline, &.Mui-focused .MuiOutlinedInput-notchedOutline':
              {
                borderColor: theme.palette.divider,
                borderWidth: 1
              }
          }
        })
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&:has(.MuiInputBase-readOnly) .MuiInputLabel-root.Mui-focused': {
            color: theme.palette.text.secondary
          }
        })
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: '600'
        }
      }
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            color: 'currentColor',
            backgroundColor: 'rgba(4, 186, 116, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(4, 186, 116, 0.12)'
            }
          }
        }
      }
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: 'rgba(0, 0, 0, 0.12)'
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: palette.secondary.dark
        },
        arrow: {
          color: palette.secondary.dark
        },
        tooltipPlacementTop: {
          marginBottom: '2px !important'
        }
      }
    }
  }
})

export default theme
