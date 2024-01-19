export type MaybeWithId<T> = T & { id?: any }

export function hasId<T>(obj: MaybeWithId<T>): obj is T & { id: any } {
  return obj && typeof obj === 'object' && 'id' in obj
}
