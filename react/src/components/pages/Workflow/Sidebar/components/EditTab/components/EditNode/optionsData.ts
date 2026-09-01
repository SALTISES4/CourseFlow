const choices = COURSEFLOW_APP.globalContextData.workflowChoices

const toOption = (choice: { type: number | string; name: string }) => ({
  value: choice.type,
  label: choice.name
})

const activityContexts = choices.contextChoices
  .filter((choice) => Number(choice.type) <= 3)
  .map(toOption)

const courseContexts = choices.contextChoices
  .filter((choice) => choice.type === 0 || Number(choice.type) >= 100)
  .map(toOption)

const activityTaskTypes = choices.taskChoices
  .filter((choice) => Number(choice.type) <= 18)
  .map(toOption)

// Outcome editing still consumes this legacy local option seam. Edit-node tags
// are loaded from the parent project's persisted catalog instead.
const tags = [
  { uuid: 1, label: 'Tag 1' },
  { uuid: 2, label: 'Tag 2' },
  { uuid: 3, label: 'Tag 3' },
  { uuid: 4, label: 'Tag 4' },
  { uuid: 5, label: 'Tag 5' }
]

export default {
  activityContexts,
  courseContexts,
  activityTaskTypes,
  tags
}
