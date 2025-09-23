const data = {
  dragging: null,
  highlighted: [],
  outcomeOrder: [1, 2, 4, 3, 5],
  outcomeData: {
    '1': {
      id: 1,
      title: 'Outcome group label',
      parent: null,
      children: [2, 4],
      level: 0
    },
    '2': {
      id: 2,
      title: 'Parent',
      description: '',
      code: '',
      children: [3],
      parent: 1,
      level: 1
    },
    '3': {
      id: 3,
      title: 'Child',
      description: '',
      code: '',
      children: [5],
      parent: 2,
      level: 2
    },
    '4': {
      id: 4,
      title: 'Another',
      description: '',
      code: '',
      children: [],
      parent: 1,
      level: 1
    },
    '5': {
      id: 5,
      title: 'Grandchild',
      description: '',
      code: '',
      children: [],
      parent: 3,
      level: 3
    }
  }
}

export default data
