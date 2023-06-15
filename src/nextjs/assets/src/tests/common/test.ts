import {test as base} from '@playwright/test'
import {ProductsPage, SignInPage} from '../pages'

type Fixtures = {
  signInPage: SignInPage
  productsPage: ProductsPage
}

export const test = base.extend<Fixtures>({
  signInPage: async ({page}, use) => {
    const signInPage = new SignInPage(page)
    await use(signInPage)
  },

  productsPage: async ({page}, use) => {
    const productsPage = new ProductsPage(page)
    await use(productsPage)
  },
})

export {expect} from '@playwright/test'
