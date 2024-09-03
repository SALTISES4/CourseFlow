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

    workspaceBlocks: {
      courseAssessment?: string
      courseProject?: string
      courseLesson?: string
      coursePreparation?: string
      reusableBlocks?: string
      strategies?: string
      activityOOCInstr?: string
      activityOOCStud?: string
      activityICInstr?: string
      activityICStud?: string
      background?: string
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

    workspaceBlocks: {
      courseAssessment?: string
      courseProject?: string
      courseLesson?: string
      coursePreparation?: string
      reusableBlocks?: string
      strategies?: string
      activityOOCInstr?: string
      activityOOCStud?: string
      activityICInstr?: string
      activityICStud?: string
      background?: string
    }
  }
}
