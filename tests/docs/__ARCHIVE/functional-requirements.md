CourseFlow Functional Requirements
Main Navigation
To fill.
My Library Section
The [My Library] section contains Projects which:

Have been created by the user (user has the Owner role)
The user is a Contributor on (user has the Editor, the Commenter or the Viewer role)
Sorting, Filtering and Searching
The section provides the following sorting, filtering and searching capabilities which are similar to the Project’s [Workflows] view. Here are the options offered in both views: 



“My library”
Project “Workflows” view
Comment
Sort
Recent
X
X
Default for both
For Projects, the update can have been made to the Project itself OR at the child Workflow level
Alphabetical (A-Z)
X
X


Creation date
X
X


Workflow type


X
Ordered by Workflow types, in this specific order: Activities, Courses, Programs
Filter
Owned
X
X
Displays items for which the user has the Owner role
Shared
X
X
Displays items for which the user has the Editor, Commenter or Viewer role
Favourites
X
X
Displays items which the user has added as favourite
In [My library], filtering by “Favourites” has the same results as navigating to this link: /en/course-flow/myfavourites/
Archived
X
X
Displays archived items
Search
X
X
“My library”: searches through Projects and workflow titles only
“Workflows” view: searches through Workflow titles only

Explore Section
The [Explore] section contains all published Projects and Workflows.
The section offers the following visibility options:



Comment
Sort


Creation date
Default state
Alphabetical (A-Z)


Filter


Discipline
A multi-select list for which the options are the disciplines available in the “Discipline” field of the [Create project] form. 
Type
A multi-select list for which the options are types of objects: Project, Program, Course or Activity.
Template
This is a boolean button. 
If the button is active, the list will include only Projects and workflows which are templates
If the button is inactive, the list will include all Projects and workflows, whether they are templates or not
Search
Searches through Projects and workflow titles only

Commenting
Comments can be added to the following objects:

Nodes
Channels
Sections
Outcomes
Permissions
Within a given workflow and as reflected in the permission matrix, comments can only be added and viewed by the following user roles:

Owner
Editor
Commentor

Although all roles can delete their own comments, only Owners can delete other user’s comments. 
Comments Content
Comments contain plain text only.
Notifications
Email Notifications
Users can receive two email confirmation:

Signup: users receive this email after signing up to the platform, to confirm their email?
Forgot password: users receive this email when attempting to reset their password
Project
Projects can be thought of as a type of folder. Projects can contain any number of Workflows (Course, Activities and Programs).
Project Metadata
The project fields details can be found here: https://docs.google.com/spreadsheets/d/1uKIHm44yq3Bv_z84dpdhYb0v7w5r1tDIz8TYRWynHw0/edit?gid=1723538841#gid=1723538841
Contributors
A user can add Contributors (other CourseFlow users) to a Project via the [Add contributor] modal. By default, the child Workflows of a Project will inherit the Contributors added at the Project. Contributors and their corresponding roles cannot be modified at the Workflow level.

Adding a user as a Contributor triggers the following actions: 

The project is automatically added to the user’s [My library] section (en/course-flow/mylibrary/)
The user will have the permissions found in the PROJECT tab of the permissions matrix. 
Tags
Tags can be created at the Project level, for any type of Workflow. Tags are added directly on the Overview view. The purpose of tags is to filter Nodes and Outcomes in the following views: 

Workflow view: the user can hide Nodes from view by navigating to View settings and toggling off tags. 
Outcomes view: the user can hide Outcomes from view by navigating to View settings and toggling off tags.
Published Projects
Visibility options (published / unpublished) are set at the Project level. The child Workflows will inherit the Project’s visibility options. For example, it is not possible to publish a Project but set some of the child Workflows as unpublished. 

Published: the Project and its child workflows are visible (but not editable) to any logged in user, through the [Explore] section.
Unpublished: the Project and its child workflows are not visible to logged in users which have not been added to the Project’s Contributors.
Views
Overview
Displays the following:

Description
Disciplines:
Organized alphabetically, from A - Z
Separated by commas
Creation date, with format: MMM DD, YYYY (ex: June 20, 2024)
Permissions
Tags, ordered by most recently added
Workflows
The Workflows view of a Project lists all child workflows (Activities, Courses or Programs) of the Project. The sorting, filtering and searching capabilities are the same as the My library section.

If the Project is unpublished, the Workflows view will allow a user to view child Workflows for which he has the Owner, Editor, Commenter or Viewer role.
If the Project is published, the Workflows view will allow any CourseFlow user to view all child Workflows.
Archiving a Project
A Project can only be archived by its Owner. Archiving a Project moves the Project and its workflows to the [Archived] section of the owner’s [My library] section, which can be accessed via the filter. If the Project was published at the moment of archiving, it becomes automatically unpublished when archived, and cannot be found in the [Explore] section. 

The archived Project cannot be accessed or browsed, it can only be restored by clicking the [Restore project] button on the Workflow thumbnail.

Only the Project Owner can restore the Project
Project Contributors can see the archived Project by selecting the [Archived] filter but they cannot restore it. 
Restoring a Project
A Project can only be restored by its Owner. Once a Project is restored: 

Its child Workflows will be restored
Users and permissions will be restored
Project will be unpublished, even if it was published at the time of archiving
Permanently Deleting a Project
A Project cannot be permanently deleted.
Copying a Project
When a Project is copied: 

The Project and and Workflows metadata is copied
Users are not copied
User who copies the Project, regardless of his role, is made the Owner of the copied Project
The new Project is always unpublished, regardless of the status of the Project from which it was copied
All Workflows are copied
Workflows users are not copied
User who copied the Project is made Owner of the Workflows

When a Project is copied, the [Copy project] modal is shown to the user, allowing the user to update the [Title] of the copied Project (default: “Project name (copy)”). 
Templates



OBJECT TYPE












Project
Program
Course
Activity
Parent project required
Generated by
Can be published
Can be marked “template”
Marked as “Strategy” in backend
SALTISE templates
X
X
X
X
Yes
User of SALTISE_Staff group
Yes
Yes
No
SALTISE strategies






X *
No
SALTISE office user?
Yes


Yes
PERSONAL templates






X *
No
Any user
No


Yes


* With limited functionality, see permissions matrix. 
SALTISE templates
Templates are Projects (and child workflows) created by a user part of the “SALTISE_Staff” group. The Template Project contains pre-structured / pre-populated Activities, Courses and Programs, which are also categorized as “Templates”. 
Templates can be accessed in 3 ways:

They can be found in the "Explore" if they have been Published by the SALTISE user
A user could choose to activate the “Templates” filter to view only Templates
When creating a workflow within a Project, users get prompted to start from a template instead of starting from scratch
Starting from a template copies the selected template within the user’s selected Project. Once copied, the user is free to edit the template as he would any other workflow. 
Users can view templates from their dashboard screen
Strategies (Current: SALTISE strategies)
Strategies are only available to Activities. A Strategy is a pre-formatted Part which includes nodes, node categories and node links. A Strategy can be added to an Activity by dragging and dropping the Strategy item from the Add tab of the right sidebar into the workspace. Once added to the workspace, the Strategy acts like any other Parts created by the user, it can be fully modified. 
Personal Templates (Current: My strategies)
Personal templates apply to Courses and Activities. They are an Activity or a Course with just one section (Part or Week), which can be saved by the user and added to other workflows of the same type, in any Project. 

Part (Activity) personal templates are available to any Activity of any Project for which the user has the Edit or Owner role
Week (Course) personal templates are available to any Courses of any Project for which the user has the Edit or Owner role
Saving as a Personal Templates
The “Save as personal template” form is available via the “Edit part” (Activities) and “Edit week” (Courses) forms, It contains the following fields: 







Design
Design
Field
Type
Mandatory
Activity
Course
Template name
Text
X
X
X


Saving a Part (Activity) or Week (Course) as a personal template has the following effects:

In Activities and Courses, the saved personal templates become available in the Add tab of the right sidebar, under the “Personal templates” section
The personal template is added to the user’s “My library” section
Use a Personal Template

When added to a Course or an Activity, the personal template displays with the “Template name” which it has been created with as the label. However, once added to the workflow, the “Template name” can be overwritten via the “Label” field of the “Edit part” and “Edit week” forms. 
If a user had already named a week or a part through the “Edit part” / “Edit week” forms and then elects to save the part or week as a personal template under another name, it does not affect the label which had been already given to the part or week through the “Edit part” / “Edit week” forms. 
Editing Personal Templates
The user can edit his personal template by finding it in his “My library” section. Any modifications on a personal template will not impact the workflows on which the personal template was previously added.
Deleting Personal Templates
The user can archive his personal template by finding it in his “My library” section. Archiving a personal template will not affect the workflows in which it’s been added.
Workflows
Workflow is a term used to designate an Activity, a Course or a Program. 

The Activity is the lowest level Workflow unit
The Course is the mid-level Workflow unit
The Program is the larger level Workflow unit
Workflow Metadata

Field
Type
Mandatory
Default
Activity
Course
Program
Comments
Title
Text
X


X
X
X


Description
Rich text editor




X
X
X


Code
Text






X




Condensed view
Boolean
X
False
X
X
X


Outcome style
Toggle
X
Switch off
X
X
X
OOS for phase I
Is template
Boolean




X






Time














     Calculate time automatically
Switch


Switch off
X
X
X
Users have the option to input Time manually or calculate it automatically.
     Time
Duration




X
X
X
- Field is enabled only if “Calculate time automatically” is OFF
- Field is disabled if “Calculate time automatically” is ON. In that case, the time displayed in the field is sum of Time fields of all Workflow nodes
Ponderation














     Calculate ponderation automatically
Switch


Switch off




X
On Programs only, users have the option to add Ponderation values manually or calculate automatically. 
     Individual Time
Duration






X
X
- On Courses, field is always available to fill
- On Programs, field is only available to fill if “Calculate ponderation automatically” is OFF. If “Calculate ponderation automatically” is ON, the value is calculated based on the “Individual time” added to each of the Workflow Nodes (or indirectly, from the linked Courses).
     Practical Time
Duration






X
X
- On Courses, field is always available to fill
- On Programs, field is only available to fill if “Calculate ponderation automatically” is OFF. If “Calculate ponderation automatically” is ON, the value is calculated based on the “Practical time” added to each of the Workflow Nodes (or indirectly, from the linked Courses).
     Theory Time
Duration






X
X
- On Courses, field is always available to fill
- On Programs, field is only available to fill if “Calculate ponderation automatically” is OFF. If “Calculate ponderation automatically” is ON, the value is calculated based on the “Theory time” added to each of the Workflow Nodes (or indirectly, from the linked Courses).
Credits














     Calculate credits automatically
Switch


Switch off




X
On Programs only, users have the option to input Credits manually or calculate them automatically.
     Credits
Number






X
X
- On Courses, field is always available to fill
- On Programs, field is only available to fill if “Calculate credits automatically” is OFF. If “Calculate ponderation automatically” is ON, the value is calculated based on the Credits added to each of the Workflow Nodes (or indirectly, from the linked Courses)
Classification














     Calculate classification automatically
Switch








X
Users have the option to fill Classification fields manually or calculate the values automatically, based on the Time and Classification combo attached to each of the Program Nodes.
- General time: sum of all Time for nodes which have been classified as “General”
- Specific time: sum of all Time for nodes which have been classified as “Specific”
     General time
Duration








X
Field is only available to fill if “Calculate classification automatically” is FALSE
     Specific time
Duration








X
Field is only available to fill if “Calculate classification automatically” is FALSE

Contributors
The child workflows of a Project will inherit the Contributors added at the Project. The detail of actions which each type of Contributor can perform can be found in the WORKFLOW tab of the permission matrix.
Views
A workflow can contain different views (ViewType):



Workflow type (ViewType)
View
Activity
Course
Program
Overview
VISIBLE
VISIBLE
VISIBLE
Workflow
VISIBLE
VISIBLE
VISIBLE
Outcomes
VISIBLE
VISIBLE
VISIBLE


Overview
The [Overview] view allows users to:

View and edit some of the Workflow’s metadata
Manage Workflow permissions
Workflow
The [Workflow] view is where users build the bulk of their Workflows: by adding Nodes, Edges and Channels.
Outcomes
The [Outcomes] view is where users add, edit, remove and order Outcomes.
Visibility Settings
View Settings
The content and structure of each view can be managed via the [View settings] dropdown, in the action bar. The content of the dropdown varies based on view: 

View
Status of [View settings]
Dropdown items
Action
Designs
Overview
Hidden from this view
NA
NA


Workflow
VISIBLE
Expand all sections
Expands all Sections within the Workflow view

Design
Collapse all sections
Collapses all Sections within the Workflow view
Expand all nodes
Expands all Nodes within the Workflow view
Collapse all nodes
Collapses all nNodes within the Workflow view
Tags
Lists tags and allows to turn them on/off
Outcomes
VISIBLE
Expand all outcomes
Expands all Outcomes drawers in the Outcomes view
Design
Collapse all outcomes
Collapses all Outcomes drawers in the Outcomes view
Tags
Lists tags and allows to turn them on/off

Jump to
Visible only in the [Workflow] view. It lists the Workflow’s Section and scrolls the user down to the selected Section.
Nodes
Node Metadata
In the [Workflow] view, a node is a box / container, which serves as a visual representation of the information added through the [Edit node] form, visible when the user clicks on a node. The [Edit node] form fields differ between the 3 types of Workflows.










WORKFLOW TYPE


Field
Type
Mandatory
Default
Conditional
Activity
Course
Program
Comments
Title
Text
X
Untitled


X
X
X


Description
Rich text editor






X
X
X


Context
Dropdown






X
X


“Context” values are not the same for Activity and Course. Values can be found here: Figma
Type of task
Dropdown






X
X


“Type of task” values are not the same for Activity and Course. Values can be found here: Figma
Time
Duration






X
X
X
Value is used to calculate the time automatically when the “Calculate time automatically” option is TRUE.
Credits
Number










X
Value is used to calculate the time automatically when the “Calculate credits automatically” option is TRUE.
Tags
Autocomplete




To the project having outcomes Object sets
X
X
X


Linked workflow
Relationship




To the workflow being a Course or an Program


X
X
- When Course Nodes have “Linked workflow”: the Node’s time is automatically taken from the linked workflow.
- When Program Nodes have “Linked workflow”: the Node’s time, Credits and Ponderation is automatically taken from the linked workflow.
Ponderation
















     Hours theory
Number










X
Value is used to calculate the time automatically when the “Calculate ponderation automatically” option is TRUE.
     Hours practice
Number










X
Value is used to calculate the time automatically when the “Calculate ponderation automatically” option is TRUE.
     Hours individual
Number










X
Value is used to calculate the time automatically when the “Calculate ponderation automatically” option is TRUE.
Classification
Select list










X
Value is used to calculate the time automatically when the “Calculate classification automatically” option is TRUE.

Node Actions
Add New Node to Workflow
New Nodes can be added to a Workflow by drag and dropping the Node from the right sidebar to a Section. There are 3 different methods for inserting Nodes: 

Column: with this mode, Nodes can be inserted into a Channel (column), and automatically force Nodes of the same Channel to be pushed down, without affecting Nodes from other Channels. For example, in the screenshot below, if a new “Lesson” Node is dragged and dropped between “Lesson - Node 2” and “Lesson - Node 3”: 



The “Lesson - Node 3” and “Lesson - Node 4” Nodes would be pushed down, while the “Preparation” Channel would be unchanged: 



Row: with this mode, Nodes can be inserted into a Channel (column), and automatically force all Nodes of any Channel to be pushed down. For example, in the screenshot below, if a new “Project/Artifact” Node is dragged and dropped between “Node 2” and “Node 3”: 



All Nodes below ( “Node 3” and “Node 4”) would be pushed down: 



Manual: with this mode, a dialog is triggered every time the user drags and drops a Node in the Workspace, as soon as the user let’s go of the Node: 




Insert Below
This action is available to the user when the Node is hovered. It inserts an empty Node, right below the Node from which the [Insert below] icon was clicked. The new empty Node will be in the same Channel as the Node from which it was inserted. 
Duplicate
This action duplicates the Node from which the [Duplicate] icon was clicked on, and inserts it right below. The action copies all original meta information from the Node, including the linked Workflows and assigned Outcomes. If the [Title] field of the original Node was filled, the duplicated Node will have the “(copy)” string appended at the end of its title.

Duplicating the Node does not automatically add a link in between the original Node and the new Node, nor does it break established links between any existing Nodes. 
Delete
This action deletes the Node as well as Edges which were going to and from the node. 

If there were Edges going to AND from the node, a new Edge is automatically formed between the Node which preceded the deleted Node and the Node which followed the deleted Node.
If there was only one Edge attached to the Node (either coming in or out of the Node), it would be automatically deleted. 
Comment
Comments on Nodes follow the same rules as elsewhere in the application, see Commenting section.
Link a Workflow
Workflows can be linked with each other through a given Node. A Node can only be linked to one Workflow. Only a lower level Workflow can be linked via a Node of a higher level Workflow: 

Activity Nodes cannot be linked to any type of Workflow (as they are the lowest level)
Course Nodes can only be linked to Activity Workflows
Program Nodes can only be linked to Course Workflows

Linking a Workflow to a Node has the following effects: 

Allows for some of the child Node information to be displayed in the parent’s Node: 
Title
Description
Time
Credit (for Courses linked to Program Nodes)
Ponderation information (for Courses linked to Program Nodes)
Allows for Outcomes of the child to be associated with Outcomes of the parent node via the “Related” tab
Channels
In the Workflow view, Channels are represented by columns:
 


The default Channels which are automatically included when creating a Workflow are different based on the Workflow type:

Activity:
Out of class (instructor) 
Channel [Color] field value:  #0B118A
Out of class (students)
Channel [Color] field value:  #114BD4
In class (instructor)
Channel [Color] field value:  #268AE5
In class (students)
Channel [Color] field value:  #8BC8FF
Course: 
Preparation
Channel [Color] field value:  #F7B92A
Lesson
Channel [Color] field value: #ED8934
Artifact
Channel [Color] field value: #ED4A28
Assessment
Channel [Color] field value: #AD1D35
Program: no predefined Channels
Channel default [Color] field value: #00695C

For all types of Workflows, the user can add, edit or delete any Channel.
Editing
The user can edit a Channel by clicking on the Channel, through the [Edit node category] form, which displays in the right sidebar. The Channel fields are the same for all 3 types of Workflows.











Design
Field
Type
Mandatory
Default 
Conditional
Activity
Course
Program
Title
Text
X
Untitled
NA
X
X
X
Color
Color picker
X
#CFD8DC
NA
X
X
X

Actions
When hovering on a Channels, the user can access 4 actions.
Add
Represented by a [Plus] icon, this action inserts a new Channel to the right of the current Channel. 
Duplicate
Represented by a [Copy] icon, this action duplicates the Channel to the right of the original Channel (Channel from which the [Duplicate] icon was clicked). Only the Channel’s [Title] and [Color] fields are copied from the original Channel, the Nodes which were assigned to the original Channel are not duplicated. If the [Title] field of the original Channel had been filled, the duplicated Channel will have the “(copy)” string appended at the end of its title. 
Delete
Represented by a [Trash] icon, this action deletes the Channel as well as all Nodes which were associated with the Channel. This action should trigger a warning message.
Comment
Comments on Channels follow the same rules as elsewhere in the application, see Commenting section.
Edges
Edges are the lines / links which connect Nodes.
Edges Metadata
The [Edit node link] form fields are the same for all 3 types of workflows.









Design


Field
Type
Mandatory
Conditional
Activity
Course
Program
Form location
Title
Text




X
X
X
Edit node link
Text position
Slider




X
X
X
Edit node link
Dashed line
Toggle




X
X
X
Edit node link


The Edge creation actions are follow these rules:

A user can create an Edge from source Node to a target Node which displays lower (after the source Node) in the Workflow.
A user can create an Edge from source Node to a target Node which displays above (before the source Node) in the Workflow.
A user can create an Edge from a source Node to a target Node which displays in a different Section.
Multiple Edges can originate from the same source Node (maximum 50).
Multiple Edges can have the same target Node as a destination (maximum 50). 
There can only be one Edge going from a source Node to a target Node.
A user can create a departing or arriving Edge on all four Node handles.
A user can change the target or source Node of an Edge, directionality must be preserved (only available when the Edge is selected).
When Nodes are moved, the Edges follow these rules: 
If a Node is moved to another Channel, the Edges which were arriving and departing from the Node are preserved.
If Channels are moved laterally, the existing Edges between Nodes are preserved
If a source Node from a given Section has an Edge to a target Node from a different Section, and a new Section is added in between, the Edge is preserved.
If Nodes are moved up or down, the original Edges are preserved.
If a Node is dragged in between two Nodes which are related by an Edge, the Edge is preserved.
When Nodes are deleted: 
If a Node is deleted, all its Edges (arriving at the Node or departing from the Node) are deleted.

Basic Edge display rules:

Edges can be selected.
Edges should not overlap Nodes (they should be visible in the back only), unless the Edge is selected.
When two or more Edges are going to the same target Node, the user needs to select the edge at an earlier level, where the line is seen by itself, to highlight it.
There should be a larger box around the Node magnet to allow the user to attach Edges more easily to the handle.
Dragging down an Edge should automatically scroll down the workspace.
Section
Sections represent a group of Nodes displayed within a container within the [Workflow] view. Sections are numbered, from top to bottom (starting at 1). The Section number displays at all times.

When Sections are moved, inserted or deleted, the Section’s numbers are adjusted to reflect the new order. For example, if a user has 3 Sections:

Section 1 (at the very top)
Section 2 (in the middle)
Section 3 (at the bottom)

And a new Section is inserted between “Section 2” and “Section 3”, the final numbering will be: 

Section 1 (same as before)
Section 2 (same as before)
Section 3 (new inserted Section)
Section 4 (what was previously Section 3)

Sections also have an optional [Title] field:

When the [Title] field is filled, the text display to the right of the Section number
When the [Title] field is left empty, only the Section number displays

Design: https://www.figma.com/design/ibrUG0Rc5B2lpUW4Tflbum/CourseFlow---V2?node-id=3372-18313&t=oed4gEPCVni9Hwy0-1

Field details: https://docs.google.com/spreadsheets/d/1uKIHm44yq3Bv_z84dpdhYb0v7w5r1tDIz8TYRWynHw0/edit?gid=1635193441#gid=1635193441
Actions
Insert Below

The action is available while hovering over an existing Section. The action inserts an empty Section below the Section on which the [Plus] icon has been clicked. The newly added Section has an empty title (no placeholder). 
Duplicate
The [Duplicate] action is available while hovering over an existing Section as well as from the [Edit section] form in the right sidebar. 

Duplicating a Section duplicates:

The Section’s Nodes, including:
The Node’s metas
The associated Outcomes
The linked Workflows
The Edges
The Section’s [Title], to which it appends the string “(copy)”.  For example, if the Section of an Activity was named “Part 4”, the duplicate will be named “Part 4 (copy)”.

And does not duplicate:

Comments

The duplicated Section is added below the original Section from which it was duplicated.
Delete
Deleting a Section deletes:

The Section’s Nodes, including:
The Node’s metas
The associated Outcomes
The linked Workflows
The Edges
Comments
Save as Personal Template
Please see this section for details. 
Commenting
Comments on Sections follow the same rules as elsewhere in the application, see Commenting section.
Outcomes
Outcomes Metadata
Outcomes can be added to any type of Workflow (Activity, Course, Program) through the [Outcomes] view of the Workflow. They can be edited through the [Edit outcome] form which displays in the right sidebar. Outcomes are organized through parent / child relationships, with a maximum of 3 levels.

Field
Type
Mandatory
Default
Conditional
Activity
Course
Program
Form location
Title
Text
X
Untitled


X
X
X
Edit outcome
Description
Rich text editor






X
X
X
Edit outcome
Code
Text






X
X
X
Edit outcome
Tags
Autocomplete






X
X
X
Edit outcome


Once Outcomes have been added to a Workflow, they can be assigned to Nodes, via the right sidebar.

Outcomes are automatically numbered. For example, for the first Outcome of Workflow: 

First Level 1 Outcome
First Level 2 Outcome 
Second Level 2 Outcome
Third Level 2 Outcome
First Level 3 Outcome
Second Level 3 Outcome
Third Level 3 Outcome
…

Users also have the opportunity to add a Code (via the [Code]  field in the [Edit outcome] form). If added, the [Code] field content will display in between the number and the Outcome title, preceded and followed by a dash. For example: 1 - CODE123 - Title of the Outcome

Where: 
“1” is the number automatically generated
“CODE123” is the content of the [Code] field
“Title of the Outcome” is the content of the [Title] field
Outcomes-to-Nodes Relationships
Outcomes can be associated with Nodes from the right sidebar, in the [Workflow] view. 
Outcomes to Node relationship behaviour:

Assigning a Level 1 Outcome to a Node automatically assigns its Level 2 and Level 3 children to the Node.
If all children of an Outcome are individually added to a Node, the parent Outcome will automatically be added to the Node.
If a parent Outcome has been added to a Node, and then one of its children is removed, the parent Outcome will also be removed, though other child Outcomes will remain
Outcomes-to-Outcomes Relationships
When a lower level Workflow has been associated with a Node of a higher level Workflow, its Outcomes can become visible in the lower level (child) Workflow, if they’ve been assigned to the Node. 

The parent’s Outcomes are visible in the [Related] tab of the right sidebar, in the [Outcomes] view of the child Workflow.



This functionality allows users to assign Outcomes of lower level Workflows to Outcomes of higher level Workflows:

If an Activity workflow has been linked to a Course workflow via a Node, the Outcomes of the Course Workflow will be displayed in the [Related] tab of the Activity Workflow
Users will be able to assign Outcomes from Courses to Outcomes from the Activity
The Outcomes of the Activity Workflow will NOT be displayed in the [Related] tab of the Course Workflow
If a Course Workflow has been linked to a Program Workflow via a Node, the Outcomes of the Program Workflow will be displayed in the [Related] tab of the Course Workflow
The Outcomes of the Course Workflow will NOT be displayed in the [Related] tab of the Program Workflow (there can be no [Related] tab in Programs as there is no higher level Workflow type). 
Archiving a Workflow
A Workflow can only be archived by its Owner. Archiving a Workflow moves the Workflow to the [Archived] section of the Project’s Workflows view, which can be accessed via the filter. If the Workflow was published at the moment of archiving, it becomes automatically unpublished when archived. 

The archived Workflow cannot be accessed or browsed, it can only be restored by clicking the [Restore] button on the Workflow thumbnail.

Only the Workflow owner can restore the Workflow
Workflow Contributors can see the archived Workflow via the [Archived] filter, but they cannot restore it. 
Right Sidebar
Sidebar Visibility
The right sidebar is only visible in Workflows (Activities, Courses and Programs), within specific views. Currently, there are 4 versions of the sidebar. Each version contains a specific set of tabs.



Workflow type (WorkflowType)
View type (ViewType)
Activity
Course
Program
Overview
HIDDEN
HIDDEN
HIDDEN
Workflow
VISIBLE (V1)
VISIBLE (V1)
VISIBLE (V1)
Outcomes
VISIBLE (V2) *
VISIBLE (V3) *
VISIBLE (V3) *


* In the Outcomes view, the sidebar is visible only when the Workflow has at least one Outcome.
Sidebar Tabs Visibility
Each of the 4 versions of the sidebar can include the following tabs, in this specific order: 



Versions
Sidebar Tabs
V1
V2
V3
Edit (pencil icon)
VISIBLE
VISIBLE
VISIBLE
Related (link icon)
HIDDEN
HIDDEN
VISIBLE *
Add (plus icon)
VISIBLE
HIDDEN
HIDDEN
Outcomes (trophy icon)
VISIBLE
HIDDEN
HIDDEN
Comment (comment icon)
VISIBLE
VISIBLE
VISIBLE


Another visual representation of the same information:



Workflow type (WorkflowType)


Activity
Course
Program
View type (ViewType)
Edit
Related
Add
Outcomes
Comment
Edit
Related
Add
Outcomes
Comment
Edit
Related
Add
Outcomes
Comment
Overview






























Workflow
VISIBLE
HIDDEN
VISIBLE
VISIBLE
VISIBLE
VISIBLE
HIDDEN
VISIBLE
VISIBLE
VISIBLE
VISIBLE
HIDDEN
VISIBLE
VISIBLE
VISIBLE
Outcomes
VISIBLE
VISIBLE *
HIDDEN
HIDDEN
VISIBLE
VISIBLE
VISIBLE *
HIDDEN
HIDDEN
VISIBLE
VISIBLE
HIDDEN
HIDDEN
HIDDEN
VISIBLE
Outcome table






























Outcome analytics










VISIBLE
HIDDEN
HIDDEN
HIDDEN
VISIBLE
VISIBLE
HIDDEN
HIDDEN
HIDDEN
VISIBLE
Grid view




















VISIBLE
HIDDEN
HIDDEN
HIDDEN
VISIBLE


* The [Related] tab is only visible when there are linked workflows in which outcomes have been added. Otherwise the tab is hidden from view.

Some visible tab can either be ACTIVE or DISABLED: 

Sidebar Tabs
Conditions
Edit (pencil icon)
ACTIVE when an editable item has been clicked on by the user. Otherwise INACTIVE.
Related (link icon)
Always ACTIVE when visible
Add (plus icon)
Always ACTIVE when visible
Outcomes (trophy icon)
Always ACTIVE when visible
Comment (comment icon)
ACTIVE when an editable item has been clicked on by the user. Otherwise INACTIVE.

Content of Tabs
The content of tabs can vary based on view, active objects and Workflow type. 
Edit Tab
The content of the [Edit] tab varies based on view and active elements. The [edit] form of a specific element (Node, Edge, Section, Channel or Outcome) can be accessed by clicking the element within the workspace. 



Activity
Course
Program
FORM TITLE
Workflow
Outcomes
Workflow
Outcomes
Workflow
Outcomes
Edit node
X


X


X


Edit node link
X


X


X


Edit section
X


X


X


Edit node category
X


X


X


Edit outcome


X


X


X

Add Tab
The content of the [Add] ([Plus] icon) tab varies based only on the type of workflow.
Designs: Figma

It can contain up to 3 sections of items which can be dragged and dropped in the workspace:



Activity
Course
Program
Node categories
X
X
X
Personal templates
X
X


Strategies
X






Outcomes Tab
The [Outcomes] tab displays the Workflow’s Outcomes, organized by Tags, and allows the user:

Drag and drop (assign) Outcomes to Nodes
Highlight Nodes to which a specific Outcome has been associated.

The Outcomes tab never contains Outcomes from linked Workflows. 
Related Tab
The [Related] tab displays Outcomes of higher level related workflows (parent workflows), when applicable. It allows the user to:

Drag and drop (assign) lower level Outcomes to the Workflow Outcomes:
Activity Outcomes can be assigned to Course Outcomes
Course Outcomes can be assigned to Program Outcomes
Highlight Outcomes on which a specific lower level Outcome has been applied


