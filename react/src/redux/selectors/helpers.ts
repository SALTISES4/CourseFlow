export const getNextLargestNumber = (haystack: number[]): number => {
  const largest = haystack.reduce((acc, curr) => {
    return acc > curr ? acc : curr
  }, 0)

  return largest + 1
}
