import {NodePackageManager} from 'projen/lib/javascript'
import {TypeScriptProject, TypeScriptProjectOptions} from 'projen/lib/typescript'
import {IWithTelemetryReportUrl} from '../common'

export interface OttofellerBackendTestProjectOptions extends TypeScriptProjectOptions {}

export class OttofellerBackendTestProject extends TypeScriptProject implements IWithTelemetryReportUrl {
  readonly reportTargetUrl?: string
  readonly reportTargetAuthHeaderName?: string

  constructor(options: OttofellerBackendTestProjectOptions) {
    super({
      ...options,
      bundlerOptions: {},
      jest: true,
      eslint: false,
      projenrcTs: true,
      projenrcJs: false,
      name: 'backend-test',
      packageManager: options.packageManager ?? NodePackageManager.NPM,
      srcdir: options.srcdir ?? '.',

      tsconfig: {
        compilerOptions: {
          target: 'esnext',
          module: 'esnext',
          noEmit: true,
          isolatedModules: false,
          strict: true,
          noImplicitAny: true,
          strictNullChecks: true,
          strictPropertyInitialization: true,
          noImplicitThis: true,
          alwaysStrict: true,
          noUnusedParameters: true,
          noImplicitReturns: true,
          noFallthroughCasesInSwitch: true,
          noUncheckedIndexedAccess: true,
          baseUrl: './',
          paths: {
            '*': ['./*'],
          },
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
        },
      },

      // In case Github is enabled remove all default stuff.
      githubOptions: {mergify: false, pullRequestLint: false},
      buildWorkflow: false,
      release: false,
      depsUpgrade: false,
      pullRequestTemplate: false,
    })
  }
}
