import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: 'http://127.0.0.1:8000/api/openapi.json',
  output: 'src/api/gen',
  plugins: [
    '@hey-api/client-fetch',
    {
      name: '@hey-api/typescript',
      enums: 'typescript'
    },
    {
      name: '@hey-api/sdk',
      validator: 'zod'
    },
    {
      name: 'zod',
      responses: true
      // optional:
      // types: { infer: false },
      // responses: { types: { infer: true } },
    },
    {
      name: '@tanstack/react-query',
      queryOptions: true,
      queryKeys: true,
      mutationOptions: true
      // optional later:
      // infiniteQueryOptions: true,
      // infiniteQueryKeys: true,
    }
  ]
})
