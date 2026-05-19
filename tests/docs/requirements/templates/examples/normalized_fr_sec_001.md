# Example: Normalized FR-SEC-001

This file is an example of a normalized requirement artifact.
It is illustrative and should not be edited as a reusable template.

uiObjectDefinitions:
  workflowView:
    meaning: primary workflow editing surface
  workflowSectionContainer:
    meaning: Container for one section (ordered segment of the workflow); a workflow may list many sections; sections can be empty or contain one or many workflowNodes; nodes in section are ordered horizontally based on workflowChannels and vertically by workflowSectionRow.
  workflowSectionRow:
    meaning: Horizontal layout band inside a workflowSectionContainer spanning all workflowChannels; workflowSectionRows stack top-to-bottom; at most one workflowNode per workflowChannel occupies a given row at that vertical level; Row insert mode uses full-width row hit targets (upper and lower halves) for vertical insertion relative to existing nodes.
  workflowSectionHeader:
    meaning: clickable header region within workflowSectionContainer
  workflowRightSidebar:
    meaning: contextual sidebar panel
  workflowEditSectionForm:
    meaning: sidebar form for editing a selected workflowSectionContainer
  workflowEditSectionFormHeading:
    meaning: title text shown at the top of workflowEditSectionForm (e.g. 'Edit section')

locatorMappings:
  workflowView:
    strategy: null
    confidence: unresolved
  workflowSectionContainer:
    strategy: "[data-week-id]"
    confidence: confirmed
  workflowSectionRow:
    strategy: null
    confidence: unresolved
  workflowSectionHeader:
    strategy: "{workflowSectionContainer} header region including week title row"
    confidence: inferred
  workflowRightSidebar:
    strategy: "[data-test-id='sidebar']"
    confidence: confirmed
  workflowEditSectionForm:
    strategy: null
    confidence: unresolved
  workflowEditSectionFormHeading:
    strategy: null
    confidence: unresolved

requirements:
  - id: FR-SEC-001
    title: Open Edit Section Form

    designEvidence:
      - FIGMA_SEC_OE_EDIT
      - FIGMA_SEC_CV_EDIT

    actors:
      - owner
      - editor
      - viewer
      - commenter

    uiObjects:
      - workflowView
      - workflowSectionContainer
      - workflowSectionHeader
      - workflowRightSidebar
      - workflowEditSectionForm
      - workflowEditSectionFormHeading

    preconditions:
      - workflowView is open
      - at least one workflowSectionContainer exists
      - user has workflow access
      - workflowRightSidebar may be open or closed

    trigger:
      - user clicks workflowSectionHeader while workflowRightSidebar is closed
      - user clicks workflowSectionHeader while workflowRightSidebar is already open

    mainFlow:
      - system identifies the selected workflowSectionContainer from the clicked workflowSectionHeader
      - if workflowRightSidebar is closed, system opens workflowRightSidebar
      - system renders workflowEditSectionForm in workflowRightSidebar
      - system binds workflowEditSectionForm to the selected workflowSectionContainer
      - system renders workflowEditSectionFormHeading with value 'Edit section'

    roleBehavior:
      owner:
        workflowEditSectionForm: editable
      editor:
        workflowEditSectionForm: editable
      viewer:
        workflowEditSectionForm: readOnly
      commenter:
        workflowEditSectionForm: readOnly

    acceptanceCriteria:
      - given workflowRightSidebar is closed, when user clicks workflowSectionHeader, then workflowRightSidebar opens and renders workflowEditSectionForm for the selected workflowSectionContainer
      - given workflowRightSidebar is already open, when user clicks workflowSectionHeader, then workflowRightSidebar updates to render workflowEditSectionForm for the selected workflowSectionContainer
      - given actor is owner or editor, when workflowEditSectionForm is rendered, then editable controls are enabled
      - given actor is viewer or commenter, when workflowEditSectionForm is rendered, then editable controls are disabled
      - when workflowEditSectionForm is rendered, workflowEditSectionFormHeading equals 'Edit section'

    openQuestions: []
