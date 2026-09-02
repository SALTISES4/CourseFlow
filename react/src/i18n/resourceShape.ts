export type LocaleResourceShape<T> = {
  [Key in keyof T]: T[Key] extends string
    ? string
    : LocaleResourceShape<T[Key]>
}
