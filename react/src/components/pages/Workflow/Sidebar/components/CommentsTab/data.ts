import { type Comments } from './types'

const data: Comments = [
  {
    uuid: 1,
    author: {
      uuid: 1,
      name: 'Me bruh'
    },
    date: '8 hours ago',
    text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Sunt, quaerat! Ratione explicabo expedita blanditiis, ducimus tenetur ipsam dolorem nulla dicta reiciendis non maxime modi cupiditate quidem, odit cum? Odit, maxime.'
  },
  {
    uuid: 2,
    author: {
      uuid: 3,
      name: 'Alice Smith'
    },
    date: '7 hours ago',
    text: 'I completely agree with you, John! The way you described the situation really resonates with me. It’s important to address these issues head-on.'
  },
  {
    uuid: 3,
    author: {
      uuid: 1,
      name: 'Me bruh'
    },
    date: '6 hours ago',
    text: 'Interesting perspective, John. I think there are multiple angles to consider here. Have you thought about how this might affect the community in the long run?'
  },
  {
    uuid: 4,
    author: {
      uuid: 5,
      name: 'Emily Davis'
    },
    date: '5 hours ago',
    text: 'Great points made! It’s crucial to have these discussions. I’d love to hear more about your thoughts on potential solutions to these problems.'
  }
]

export default data
