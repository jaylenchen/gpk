/**
 * https://www.reddit.com/r/typescript/comments/1b87o96/esm_on_nodejs_file_extension_mandatory/
 * 当设置package.json中的"type": "module"时，import必须带上文件后缀名
 * 但是，这个不是我们想要的结果，因为我们想要的是在不带后缀名的情况下也能正常导入，
 * 现在不带js后缀，执行出错node esm必须强制指定，需要想办法解决这个问题：
 * 
 * `import { browser } from "@ts/p2/lib/browser/frontend-application.js"`
 * 改成
 * `import { browser } from "@ts/p2/lib/browser/frontend-application"`
 */

import { browser } from "@ts/p2/lib/browser/frontend-application";
console.log("🚀 ~ browser:", browser)
