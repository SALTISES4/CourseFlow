# Example: Normalized FR-SEC-001

This file is an example of a normalized requirement artifact.
It is illustrative and should not be edited as a reusable template.

uiObjectDefinitions:
  workflowView:
    meaning: primary workflow editing surface
  sectionContainer:
    meaning: top-level visual container representing one section instance in workflowView
  sectionHeader:
    meaning: clickable header region within sectionContainer
  rightSidebar:
    meaning: contextual sidebar panel
  editSectionForm:
    meaning: sidebar form for editing a selected sectionContainer
  sidebarTitle:
    meaning: title text shown at the top of rightSidebar

locatorMappings:
  workflowView:
    strategy: null
    confidence: unresolved
  sectionContainer:
    strategy: "[data-week-id]"
    confidence: confirmed
  sectionHeader:
    strategy: "{sectionContainer} > header"
    confidence: inferred
  rightSidebar:
    strategy: "[data-test-id='sidebar']"
    confidence: confirmed
  editSectionForm:
    strategy: null
    confidence: unresolved
  sidebarTitle:
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
      - sectionContainer
      - sectionHeader
      - rightSidebar
      - editSectionForm
      - sidebarTitle

    preconditions:
      - workflowView is open
      - at least one sectionContainer exists
      - user has workflow access
      - rightSidebar may be open or closed

    trigger:
      - user clicks sectionHeader while rightSidebar is closed
      - user clicks sectionHeader while rightSidebar is already open

    mainFlow:
      - system identifies the selected sectionContainer from the clicked sectionHeader
      - if rightSidebar is closed, system opens rightSidebar
      - system renders editSectionForm in rightSidebar
      - system binds editSectionForm to the selected sectionContainer
      - system renders sidebarTitle with value "Edit section"

    roleBehavior:
      owner:
        editSectionForm: editable
      editor:
        editSectionForm: editable
      viewer:
        editSectionForm: readOnly
      commenter:
        editSectionForm: readOnly

    acceptanceCriteria:
      - given rightSidebar is closed, when user clicks sectionHeader, then rightSidebar opens and renders editSectionForm for the selected sectionContainer
      - given rightSidebar is already open, when user clicks sectionHeader, then rightSidebar updates to render editSectionForm for the selected sectionContainer
      - given actor is owner or editor, when editSectionForm is rendered, then editable controls are enabled
      - given actor is viewer or commenter, when editSectionForm is rendered, then editable controls are disabled
      - when editSectionForm is rendered, sidebarTitle equals "Edit section"

    openQuestions: []
