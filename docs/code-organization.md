# 代码组织

代码完全用 [TypeScript](https://github.com/microsoft/typescript) 实现。在顶层文件夹中，按功能包组织代码，我们区分以下平台：

- `common/*`: 仅需基本 JavaScript API 并在所有目标环境中运行的源代码。
- `browser/*`: 需要 `browser` API（如访问 DOM）的源代码。
  - 可以使用来自：`common` 的代码。
- `node/*`: 需要 [`nodejs`](https://nodejs.org) API 的源代码。
  - 可以使用来自：`common` 的代码。
- `electron-node/*`: 需要 [`nodejs`](https://nodejs.org) API 的 Electron 特定源代码。
  - 可以使用来自：`common`，`node` 的代码。
- `electron-browser/*`: 需要 [Electron 渲染进程](https://github.com/atom/electron/tree/master/docs#modules-for-the-renderer-process-web-page) API 的源代码。
  - 可以使用来自：`common`，`browser` 的代码。
- `electron-main/*`: 需要 [Electron 主进程](https://github.com/atom/electron/tree/master/docs#modules-for-the-main-process) API 的源代码。
  - 可以使用来自：`electron-node`，`common`，`node` 的代码。
