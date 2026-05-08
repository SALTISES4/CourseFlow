# General guidelines
Assume you're working with Playwright and need to write test cases, where you also need to replace variables (marked as {<VARIABLE_NAME>}) with the actual value from the Variables section in each respective test section. Each specific test section will come with its own name, set of variables and test steps which you need to follow.

---

## TEST - FR-SEC-006 Delete Section (modal)
Test should be called "user can delete a section from the modal"

### Variables
- `WORKFLOW_URL`=http://localhost:8001/course-flow/workflow/11/workflow
- `SECTION_WRAP_LOCATOR`= [data-week-id="62"] attribute selector
- `SECTION_HEADER_LOCATOR`= {SECTION_WRAP_LOCATOR} > header (child element)
- `SECTION_DELETE_BUTTON_LOCATOR`= "Delete week" button within the header
- `SECTION_DELETE_BUTTON_CONFIRM_LOCATOR`="Delete section" button within the dialog

### Test steps:
- user visits the {WORKFLOW_URL} page
- user hovers section header locator element - {SECTION_HEADER_LOCATOR}
- a hover menu appears with buttons, from which the user then clicks the {SECTION_DELETE_BUTTON_LOCATOR} button.
- a dialog appears where the user clicks the {SECTION_DELETE_BUTTON_CONFIRM_LOCATOR} button
- the original section - {SECTION_WRAP_LOCATOR} element doesn't exist anymore on the page.

---

## TEST - FR-SEC-006 Delete Section (sidebar)
Test should be called "user can delete a section from the sidebar"

### Variables
- `WORKFLOW_URL`=http://localhost:8001/course-flow/workflow/11/workflow
- `SECTION_WRAP_LOCATOR`=[data-week-id="62"] attribute selector
- `SECTION_HEADER_LOCATOR`={SECTION_WRAP_LOCATOR} > header (child element)
- `SIDEBAR_LOCATOR`=[data-test-id="sidebar"] attribute selector
- `SIDEBAR_DELETE_BUTTON_LOCATOR`="Delete" button within the {SIDEBAR_LOCATOR}
- `SECTION_DELETE_BUTTON_CONFIRM_LOCATOR`="Delete section" button within the dialog

### Test steps:
- user visits the {WORKFLOW_URL} page
- user clicks the section header locator element - {SECTION_HEADER_LOCATOR}
- {SIDEBAR_LOCATOR] sidebar element appears titled "Edit section"
- user clicks the {SIDEBAR_DELETE_BUTTON_LOCATOR} button
- a dialog appears where the user clicks the {SECTION_DELETE_BUTTON_CONFIRM_LOCATOR} button
- the original section - {SECTION_WRAP_LOCATOR} element doesn't exist anymore on the page.

---

## TEST - Moving a node
Test should be called "user can move a node"

### Variables
- `WORKFLOW_URL`=http://localhost:8001/course-flow/workflow/11/workflow
- `SECTION_WRAP_LOCATOR`= data-week-id="62" attribute selector
- `SECTION_FIRST_ROW_LOCATOR`= data-drop-target-for-element="true" attribute selector within the {SECTION_WRAP_LOCATOR}
- `SECTION_NODE_LOCATOR`= draggable="true" attribute selector within the {SECTION_FIRST_ROW_LOCATOR}
- `SECTION_NODE_DROPZONES`= data-drop-target-for-element="true" attribute selector within the {SECTION_FIRST_ROW_LOCATOR}
- `SECTION_NODE_DESTINATION`=first sibling element found to the right of the {SECTION_NODE_LOCATOR}, within the {SECTION_FIRST_ROW_LOCATOR}

### Test steps:
- user visits the {WORKFLOW_URL} page
- verify that within the {SECTION_FIRST_ROW_LOCATOR} (first row) element, there is one {SECTION_NODE_LOCATOR} element and 4 {SECTION_NODE_DROPZONES} in total
- within the {SECTION_WRAP_LOCATOR} element, the user clicks and drags the first {SECTION_NODE_LOCATOR} element found
- user drops the dragged element on top of the {SECTION_NODE_DESTINATION} element
- verify that the first {SECTION_NODE_DROPZONES} dropzone is not draggable anymore
- verify that the second {SECTION_NODE_DROPZONES} dropzone is now draggable and that hte draggable element was indeed moved to a new location
