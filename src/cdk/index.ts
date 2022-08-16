/* eslint-disable import/no-relative-parent-imports -- JSII project rewrites tsconfig thus always overriding introduced aliases */
import * as projen from 'projen'
import {AwsCdkTypeScriptApp, AwsCdkTypeScriptAppOptions} from 'projen/lib/awscdk'
import {NodePackageManager} from 'projen/lib/javascript'
import {PullRequestTest, ReleaseWorkflow} from '../common/github'
import {VsCodeSettings} from '../common/vscode-settings'

export interface OttofellerCDKProjectOptions extends AwsCdkTypeScriptAppOptions {
  /**
   * The base version of the very first release.
   *
   * @default 0.0.1
   */
  readonly initialReleaseVersion?: string
}

/**
 * AWS CDK template.
 *
 * @pjid ottofeller-cdk
 */
export class OttofellerCDKProject extends AwsCdkTypeScriptApp {
  public readonly initialReleaseVersion: string = '0.0.1'

  constructor(options: OttofellerCDKProjectOptions) {
    super({
      // Default options
      packageManager: NodePackageManager.NPM,
      tsconfig: {compilerOptions: {paths: {'*': ['./src/*']}, target: 'es6'}},
      sampleCode: false,
      eslint: false,
      jest: false,
      dependabot: true,
      dependabotOptions: {scheduleInterval: projen.github.DependabotScheduleInterval.WEEKLY},

      // Enable Github but remove all default stuff.
      github: true,

      githubOptions: {mergify: false, pullRequestLint: false},
      buildWorkflow: false,
      release: false,
      depsUpgrade: false,
      pullRequestTemplate: false,

      // Allow changing default options
      ...options,

      // Non-changeable options
      defaultReleaseBranch: 'main',
      name: 'cdk',
      projenrcTs: true,
      projenrcJs: false,
    })

    this.initialReleaseVersion = options.initialReleaseVersion || this.initialReleaseVersion

    // ANCHOR Scripts
    this.setScript('format', 'ofmt .projenrc.ts && ofmt src')
    this.setScript('lint', 'ofmt --lint .projenrc.ts && ofmt --lint src && olint src .projenrc.ts')
    this.setScript('typecheck', 'tsc --noEmit --project tsconfig.dev.json')

    // ANCHOR Install ofmt
    this.addDevDeps(
      '@ottofeller/eslint-config-ofmt@1.3.6',
      '@ottofeller/ofmt@1.3.6',
      '@ottofeller/prettier-config-ofmt@1.3.6',
    )
    
    // ANCHOR Install dependencies
    this.addDeps(
      'cdk-nag@2.15.45'
    )

    // ANCHOR Github
    if (this.github) {
      new ReleaseWorkflow(this.github, {initlaReleaseVersion: this.initialReleaseVersion})
      new PullRequestTest(this.github)
    }

    // ANCHOR VSCode settings
    VsCodeSettings.addToProject(this)

    VsCodeSettings.of(this)?.add({
      'editor.codeActionsOnSave': {'source.fixAll': true},
      'eslint.useESLintClass': true,
      'eslint.options': {cache: true, reportUnusedDisableDirectives: 'error'},
    })

    VsCodeSettings.of(this)?.add({
      'editor.codeActionsOnSave': {'source.organizeImports': true},
      'editor.formatOnSave': true,
      '[json]': {'editor.defaultFormatter': 'esbenp.prettier-vscode'},
      '[jsonc]': {'editor.defaultFormatter': 'esbenp.prettier-vscode'},
      '[yaml]': {'editor.defaultFormatter': 'esbenp.prettier-vscode'},
      '[typescript]': {'editor.defaultFormatter': 'esbenp.prettier-vscode'},
      '[javascript]': {'editor.defaultFormatter': 'esbenp.prettier-vscode'},
      '[svg]': {'editor.defaultFormatter': 'esbenp.prettier-vscode'},
      '[xml]': {'editor.defaultFormatter': 'esbenp.prettier-vscode'},
      'prettier.documentSelectors': ['**/*.svg'],
    })
  }
}
