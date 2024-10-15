import { styled } from '@mui/material'
import { MuiColorInput } from 'mui-color-input'

// .MuiColorInput-TextField   Styles applied to the root element.
// .MuiColorInput-Button	    Styles applied to the Button component
// .MuiColorInput-Popover	    Styles applied to the Popover component
// .MuiColorInput-ColorSpace	Styles applied to the ColorSpace component
// .MuiColorInput-HueSlider	  Styles applied to the Hue Slider
// .MuiColorInput-AlphaSlider	Styles applied to the Alpha Slider
export const StyledColorPicker = styled(MuiColorInput)(() => ({
  '& .MuiColorInput-Button': {
    width: '20px',
    height: '20px'
  }
}))
