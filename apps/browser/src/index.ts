/**
 * https://www.reddit.com/r/typescript/comments/1b87o96/esm_on_nodejs_file_extension_mandatory/
 * 当设置package.json中的"type": "module"时，import必须带上文件后缀名
 * 但是，这个不是我们想要的结果，因为我们想要的是在不带后缀名的情况下也能正常导入，
 * 现在不带js后缀，执行出错node esm必须强制指定，需要想办法解决这个问题：
 * 
 * `import { browser } from "@gpk/p2/lib/browser/frontend-application.js"`
 * 改成
 * `import { browser } from "@gpk/p2/lib/browser/frontend-application"`
 * 
 * 为了解决上面的问题，我们先让tsc build构建相关项目，然后再使用vite二次构建dist内容，最后就可以运行dist内容了
 * 
 */
import 'reflect-metadata'
import { IFrontendApplication } from '@gpk/core/lib/browser/frontend-application/frontend-application';

async function startFrontendApplication() {
  const { Container } = await import("@gpk/core/lib/common/instantiation")
  const frontendApplicationModule = (await import("@gpk/core/lib/browser/frontend-application/frontend-application-module")).default
  const { _IFrontendApplication } = await import('@gpk/core/lib/browser/frontend-application/frontend-application')

  const container = new Container();

  container.load(frontendApplicationModule)

  const frontendApplication = container.get<IFrontendApplication>(_IFrontendApplication)

  frontendApplication.start()
}


startFrontendApplication()
