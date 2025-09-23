export type Message = {
  id: number
  author: {
    id: number
    name: string
  }
  date: string
  text: string
}

export type Comments = Message[]
