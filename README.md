# OttoFeller Projen Templates
## 📀 User guide
In order to install a certain project (template) from `@ottofeller/templates` call `npx projen new` in the dir of the new project in the following way:
```sh
# This will synthesize NextJS project in the current dir
npx projen new --from @ottofeller/templates ottofeller-nextjs
```

## 🛠 Development guide
### Install
Simply install dependencies:
```sh
npm install
```

### Synthesize
The app itself is projen template, so it can be synthesized (a code generated out of projen's TS files). Modify the app's template in `.projenrc.ts` and run the following command:
```sh
npx projen
```

> :warning: Normally you should never modify anything other than templates in `src/` dir and `.projenrc.ts`.

### Build
The build is the process of creating [JSII](https://github.com/aws/jsii) artefacts. These are the files required to run `npx projen new --from ...` (JSII is much more powerful technology, but it is out of the scope of this project). The build creates/updates the `.jsii` file (JSII config):
```sh
npx projen build
```

### Publish

## 🧩 Templates

### NextJS
```sh
npx projen new --from @ottofeller/templates ottofeller-nextjs
```

#### Tailwind
The template uses tailwind for CSS. The main config used by tailwind is `tailwind.config.js`. The file is not editable. It configures plugins which are dynamic and thus can not to be defined statically. The static part of the config resides in `tailwind.config.json`. This file can be edited via `.projenrc.ts`, e.g.:
```typescript
const tailwindConfig = project.tryFindObjectFile('tailwind.config.json')
tailwindConfig?.addOverride('theme.colors.aaaaaa', '#aaaaaa')
tailwindConfig?.addOverride('theme.fontSize.18', 'calc(18 * 1rem / 16)')
```

### Apollo Server
```sh
npx projen new --from @ottofeller/templates ottofeller-apollo-server
```

### CDK
```sh
npx projen new --from @ottofeller/templates ottofeller-cdk
```
