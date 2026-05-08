export type MaybeWithId<T> = T & { id?: any }

export function hasId<T>(obj: MaybeWithId<T>): obj is T & { uuid: any } {
  return obj && typeof obj === 'object' && 'uuid' in obj
}
