import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['cjs'],
  clean: true,
  noExternal: ['@triveni/shared-validation', '@triveni/shared-types'],
});

