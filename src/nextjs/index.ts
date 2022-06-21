import * as projen from 'projen'
import {PullRequestTest} from './pull-request-test-workflow'
import {indexPage} from './sampleCode'

const GENERATED_BY_PROJEN = '# ~~ Generated by projen. To modify, edit .projenrc.ts and run "npx projen".'

export class OttofellerNextjsProject extends projen.web.NextJsTypeScriptProject {
  constructor(options: projen.typescript.TypeScriptProjectOptions) {
    super({
      ...options,
      projenrcTs: true,
      projenrcJs: false,
      defaultReleaseBranch: 'main',
      name: 'nextjs',
      packageManager: projen.javascript.NodePackageManager.NPM,
      tsconfig: {compilerOptions: {target: 'es6'}},
      sampleCode: false,
      deps: ['@apollo/client'],
      devDeps: [
        '@ottofeller/eslint-config-ofmt',
        '@ottofeller/ofmt',
        '@ottofeller/prettier-config-ofmt',
        'eslint@>=8',
        '@graphql-codegen/add',
        '@graphql-codegen/cli',
        '@graphql-codegen/import-types-preset',
        '@graphql-codegen/introspection',
        '@graphql-codegen/named-operations-object',
        '@graphql-codegen/typescript',
        '@graphql-codegen/typescript-graphql-request',
        '@graphql-codegen/typescript-operations',
        '@graphql-codegen/typescript-react-apollo',
        'graphql',
      ],

      scripts: {
        format: 'npx ofmt .projenrc.ts && npx ofmt pages',
        lint: 'npx ofmt --lint .projenrc.ts && npx ofmt --lint pages && npx olint pages .projenrc.ts',
        typecheck: 'tsc --noEmit --project tsconfig.dev.json',
        'generate-graphql-schema': 'npx apollo schema:download',
        'gql-to-ts': 'graphql-codegen -r dotenv/config --config codegen.yml',
      },

      // Enable Github but remove all default stuff.
      github: true,
      githubOptions: {mergify: false, pullRequestLint: false},
      buildWorkflow: false,
      release: false,
      depsUpgrade: false,
      pullRequestTemplate: false,
    })

    // Github workflow
    if (this.github) {
      new PullRequestTest(this.github)
    }

    // Codegen
    new projen.YamlFile(this, 'codegen.yml', {
      marker: true,

      obj: {
        overwrite: true,
        schema: './schema.json',

        generates: {
          'generated/types.ts': {
            documents: ['pages/**/graphql/*.{ts,tsx}'],
            plugins: ['typescript', 'typescript-operations'],
          },

          'generated/frontend.ts': {
            documents: ['pages/**/graphql/*.tsx'],
            preset: 'import-types',
            presetConfig: {typesPath: './types'},
            plugins: ['typescript-react-apollo'],
          },

          'generated/api.ts': {
            documents: ['pages/**/graphql/*.ts'],
            preset: 'import-types',
            presetConfig: {typesPath: './types'},
            plugins: [
              // 'typescript-operations' plugin is needed here because of buggy behavior of 'typescript-graphql-request'.
              // The latter does not work properly with 'import-types' preset and does not import operation types.
              // There is an open issue:
              // https://github.com/dotansimha/graphql-code-generator/issues/5285
              // In this setup the types generated here are duplicates of 'types.ts' and thus preferable to be imported from there.
              'typescript-operations',
              'typescript-graphql-request',
            ],
          },

          './schema.json': {plugins: ['introspection']},
        },
      },
    })

    // Docker setup
    new projen.TextFile(this, '.dockerignore', {
      lines: [GENERATED_BY_PROJEN, 'node_modules', '.next'],
    })

    new projen.TextFile(this, 'Dockerfile.dev', {
      lines: [
        GENERATED_BY_PROJEN,
        'FROM node:16-buster-slim',
        '',
        'WORKDIR /app',
        '',
        'COPY package*.json ./',
        'RUN npm install',
        'COPY . .',
        'EXPOSE 3000',
        'CMD ["npm", "run", "dev"]',
      ],
    })

    new projen.TextFile(this, 'Dockerfile.production', {
      lines: [
        GENERATED_BY_PROJEN,
        '# 1. Install dependencies only when needed',
        'FROM node:16-buster-slim AS deps',
        'WORKDIR /app',
        'COPY package.json package-lock.json ./ ',
        'RUN npm ci',
        '',
        '# 2. Rebuild the source code only when needed',
        'FROM node:16-buster-slim AS builder',
        'WORKDIR /app',
        'COPY --from=deps /app/node_modules ./node_modules',
        'COPY . .',
        'RUN npm run build',
        '',
        '# 3. Production image, copy all the files and run next',
        'FROM node:16-buster-slim AS runner',
        'WORKDIR /app',
        '',
        'RUN addgroup --system --gid 1007 nodejs',
        'RUN adduser --system --uid 1007 nextjs',
        '',
        'COPY --from=builder /app/next.config.js ./',
        'COPY --from=builder /app/package.json ./package.json',
        'COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./',
        '# Copy "public" and "static" content. However these should ideally be handled by a CDN.',
        'COPY --from=builder /app/public ./public',
        'COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static',
        '',
        'USER nextjs',
        'EXPOSE 3000',
        'ENV PORT 3000',
        'CMD ["npm", "start"]',
      ],
    })

    // Source code
    new projen.SampleDir(this, this.srcdir, {files: {'index.tsx': indexPage}})
  }
}
