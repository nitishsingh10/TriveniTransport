import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['cjs'],
  clean: true,
  noExternal: [
    '@triveni/shared-validation',
    '@triveni/shared-types',
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
  ],
});


