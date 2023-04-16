/* eslint-disable import/no-relative-parent-imports -- JSII project rewrites tsconfig thus always overriding introduced aliases */
import {execSync} from 'child_process'
import * as path from 'path'
import * as projen from 'projen'
import {SampleFile} from 'projen'
import {NodePackageManager} from 'projen/lib/javascript'
import {NextJsTypeScriptProject, NextJsTypeScriptProjectOptions} from 'projen/lib/web'
import {CodegenConfigYaml} from '../common/codegen'
import {AssetFile} from '../common/files/AssetFile'
import {PullRequestTest, WithDefaultWorkflow} from '../common/github'
import {extendGitignore} from '../common/gitignore'
import {addLinters, WithCustomLintPaths} from '../common/lint'
import {VsCodeSettings, WithVSCode} from '../common/vscode-settings'
import {codegenConfig} from './codegen-config'
import {eslintConfigTailwind} from './eslint-config-tailwind'
import {setupJest} from './jest'
import {sampleCode} from './sample-code'
import {setupUIPackages} from './setup-ui-packages'

const GENERATED_BY_PROJEN = '# ~~ Generated by projen. To modify, edit .projenrc.ts and run "npx projen".'

export interface OttofellerNextjsProjectOptions
  extends NextJsTypeScriptProjectOptions,
    WithDefaultWorkflow,
    WithCustomLintPaths,
    WithVSCode {
  /**
   * Set up GraphQL dependencies and supplementary script.
   *
   * @default true
   */
  readonly isGraphqlEnabled?: boolean

  /**
   * Setup ui packages. E.g. tailwindcss, postcss, @next/font, @headlessui/react.
   * Include basic styles into sample code.
   *
   * @default true
   */
  readonly isUiConfigEnabled?: boolean
}

/**
 * Nextjs template with TypeScript support.
 *
 * @pjid ottofeller-nextjs
 */
export class OttofellerNextjsProject extends NextJsTypeScriptProject {
  public codegenConfigYaml?: CodegenConfigYaml

  constructor(options: OttofellerNextjsProjectOptions) {
    super({
      ...options,
      bundlerOptions: {},
      projenrcTs: true,
      projenrcJs: false,
      defaultReleaseBranch: 'main',
      name: 'nextjs',
      packageManager: NodePackageManager.NPM,
      srcdir: options.srcdir ?? '.',

      tsconfig: {
        compilerOptions: {
          baseUrl: './',
          target: 'es6',
        },
      },
      sampleCode: false,
      tailwind: false, // Tailwind has to be configured manually.
      jest: false, // Default jest config created by projen does not utilize the nextjs helper and poorly works with react.
      dependabot: (options.github ?? true) && (options.dependabot ?? true),
      dependabotOptions: {scheduleInterval: projen.github.DependabotScheduleInterval.WEEKLY},

      // In case Github is enabled remove all default stuff.
      githubOptions: {mergify: false, pullRequestLint: false},
      buildWorkflow: false,
      release: false,
      depsUpgrade: false,
      pullRequestTemplate: false,
    })

    // ANCHOR Add required dependencies
    this.addDevDeps('yaml') // REVIEW Required during "npx projen new", fails without this dependency

    // ANCHOR Source code
    const assetsDir = path.join(__dirname, '..', '..', 'src/nextjs/assets')
    sampleCode(this, options, assetsDir)

    // ANCHOR NextJS config
    new AssetFile(this, 'next.config.defaults.js', {sourcePath: path.join(assetsDir, 'next.config.defaults.js')})
    new SampleFile(this, 'next.config.js', {sourcePath: path.join(assetsDir, 'next.config.js')})

    // ANCHOR NextJS type declarations
    new SampleFile(this, 'next-env.d.ts', {sourcePath: path.join(assetsDir, 'next-env.d.ts.sample')})

    // ANCHOR ESLint and prettier setup
    const lintPaths = options.lintPaths ?? ['.projenrc.ts', 'pages', 'src']
    const extraEslintConfigs = options.isUiConfigEnabled === false ? undefined : [eslintConfigTailwind]
    addLinters({project: this, lintPaths, extraEslintConfigs})

    // ANCHOR Github workflow
    PullRequestTest.addToProject(this, options)

    // ANCHOR Set up GraphQL
    const isGraphqlEnabled = options.isGraphqlEnabled ?? true

    if (isGraphqlEnabled) {
      this.addDeps(
        '@apollo/client',
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
      )

      // ANCHOR Codegen
      this.codegenConfigYaml = new CodegenConfigYaml(this, codegenConfig)
      this.addTask('generate-graphql-schema', {exec: 'npx apollo schema:download'})
      this.addTask('gql-to-ts', {exec: 'graphql-codegen -r dotenv/config --config codegen.yml'})
    }

    // ANCHOR Jest
    setupJest(this, options, assetsDir)

    // ANCHOR Tailwind
    setupUIPackages(this, options, assetsDir)

    // ANCHOR Docker setup
    new projen.TextFile(this, '.dockerignore', {lines: [GENERATED_BY_PROJEN, 'node_modules', '.next']})
    new AssetFile(this, 'Dockerfile.dev', {sourcePath: path.join(assetsDir, 'Dockerfile.dev')})
    new AssetFile(this, 'Dockerfile.production', {sourcePath: path.join(assetsDir, 'Dockerfile.production')})

    // ANCHOR VSCode settings
    VsCodeSettings.addToProject(this, options)

    VsCodeSettings.of(this)?.add({
      'eslint.useESLintClass': true,
      'eslint.options': {cache: true, reportUnusedDisableDirectives: 'error'},
    })

    // ANCHOR gitignore
    extendGitignore(this)
    extendGitignore(this, ['.next/', '.idea/', 'debug/', '.vscode/tasks.json', 'build/'])

    // ANCHOR Codemod
    this.addDevDeps('jscodeshift')
    const addSrcTransform = '-t ./node_modules/@ottofeller/templates/lib/nextjs/add-src-reference-codemode.js'
    const extensions = '--extensions=js,jsx,ts,tsx'
    const foldersToProcess = 'src pages'

    this.addScripts({
      'codemod:add-src-to-imports': `jscodeshift ${addSrcTransform} ${extensions} ${foldersToProcess}`,
    })
  }

  postSynthesize(): void {
    /*
     * NOTE: The `.projenrc.ts` file is created by projen and its formatting is not controlled.
     * Therefore an additional formatting step is required after project initialization.
     *
     * The pages/_app.tsx file has optional content which is easier to format after the synthesis,
     * instead of trying to arrange the file lines programmatically.
     */
    execSync('prettier --write .projenrc.ts')
    execSync('eslint --fix .projenrc.ts')
  }
}
