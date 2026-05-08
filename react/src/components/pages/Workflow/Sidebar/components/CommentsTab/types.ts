export type Message = {
  uuid: string
  author: {
    uuid: string
    name: string
  }
  date: string
  text: string
}

export type Comments = Message[]
