// import type { ConfigFile } from '@rtk-query/codegen-openapi'
//
// const config: ConfigFile = {
//   schemaFile: 'http://127.0.0.1:8000/api/openapi.json',
//   apiFile: './src/api/store/emptyApi.ts',
//   apiImport: 'emptyApi',
//   outputFile: './src/api/store/cfApi.ts',
//   outputFiles: {
//     './src/api/store/project.ts': {
//       filterEndpoints: [/project/i]
//     },
//     './src/api/store/workflow.ts': {
//       filterEndpoints: [/workflow/i]
//     },
//     './src/api/store/node.ts': {
//       filterEndpoints: [/node/i]
//     }
//   },
//   exportName: 'cf',
//   hooks: true
// }
//
// export default config

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
