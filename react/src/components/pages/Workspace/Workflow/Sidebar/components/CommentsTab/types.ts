export type Message = {
  id: string
  author: {
    id: string
    name: string
  }
  date: string
  text: string
}

export type Comments = Message[]
