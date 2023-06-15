import {Locator, Page} from '@playwright/test'
import {BasePage} from './base'

export class SignInPage extends BasePage {
  readonly input: {
    username: Locator
    password: Locator
  }

  readonly button: {
    login: Locator
  }

  readonly error: {
    message: Locator
  }

  constructor(page: Page) {
    super(page)

    this.input = {
      username: this.page.locator('[data-test="username"]'),
      password: this.page.locator('[data-test="password"]'),
    }

    this.button = {
      login: this.page.locator('[data-test="login-button"]'),
    }

    this.error = {
      message: this.page.locator('[data-test="error"]'),
    }
  }

  async open() {
    return super.open('https://www.saucedemo.com/')
  }
}
