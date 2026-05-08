# Normalized Requirement Template

This file is a schema-like template for normalized requirement artifacts.
Replace all placeholder values.
Do not leave example content in this file.

uiObjectDefinitions:
  <uiObjectName>:
    meaning: <semantic meaning of the UI-domain object>

locatorMappings:
  <uiObjectName>:
    strategy: <locator strategy or null>
    confidence: <confirmed | inferred | unresolved>

requirements:
  - id: <FR-ID>
    title: <Requirement title>

    designEvidence:
      - <FIGMA_EVIDENCE_ID>

    actors:
      - <actor>

    uiObjects:
      - <uiObjectName>

    preconditions:
      - <precondition>

    trigger:
      - <trigger condition>

    mainFlow:
      - <system or user-visible flow step>

    roleBehavior:
      <actor>:
        <uiObjectName>: <editable | readOnly | enabled | disabled | visible | hidden | inactive>

    acceptanceCriteria:
      - <given/when/then acceptance criterion>

    openQuestions:
      - <question or empty list>
