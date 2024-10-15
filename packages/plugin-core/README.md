<div align='center'>

<br />

<img src='https://raw.githubusercontent.com/jaylenchan/gpk/main/logo/gepick.svg?sanitize=true' alt='gepick-logo' width='160px' />

<h1>@gpk/plugin-core</h1>

<hr />

</div>

# 描述

@gpk/plugin-core为应用提供插件核心系统功能支持

一个端使用HostedPluginServer的proxy来与另一个端的HostedPluginServer的proxy进行通讯。
其中作为服务端的proxy则会转发实际的请求给真实的HostedPluginServer实例进行处理。

- 主进程和插件进程通信：通过hosted-plugin-manager实现通信功能
- 何时创建出插件进程：启动electron客户端的时候，hosted-plugin-manager会创建出插件进程
- 插件进程的管控层：
  - 建立和销毁消息通道
  - 转发和接收主进程发送过来的消息
  - 初始化插件调度层：`new PluginHostRPC(rpc)`
- 插件调度层：
  - 调用插件部署层
  - 调用插件管理层
- 插件部署层：`PluginDeployer`
  - 扫描指定目录下的插件：`PluginScanner`
  - 读取插件元信息
  - 封装插件基础信息
- 插件管理层：
  - 加载插件
  - 初始化插件
  - 启动插件
  - 卸载插件
  - 封装插件需要接收的context

## 插件加载流程

- 插件发现和部署：主进程扫描插件目录或从插件市场下载插件包，发现新的插件。
- 动态加载插件代码：插件加载器使用 require 或 import 动态加载插件代码。
- 调用激活函数：插件代码被加载后，插件加载器调用插件的激活函数进行初始化。
- 插件主机和 IPC：插件在独立的插件主机中运行，通过 IPC 与主进程通信，确保隔离性和安全性。
- 加载插件贡献：插件的contribution（如命令、视图、语言支持等）会被加载并注册到编辑器中

## 部分逻辑解释

loadContributions 方法负责加载插件的贡献，这意味着它会处理和初始化插件所提供的功能扩展（如命令、视图、语言支持等），并将这些扩展注册到编辑器中。以下是一个详细的解释和示例：

### 解释

- 插件贡献（Contributions）： 插件贡献是指插件提供的功能扩展，这些扩展可以是命令、视图、语言支持、调试配置等。每个插件可以有多个贡献，这些贡献定义在插件的元数据中。

- 加载插件贡献： loadContributions 方法遍历所有插件的贡献，根据插件的状态进行相应的处理和初始化。它会将插件的贡献从“初始化”状态变为“加载”状态，然后变为“启动”状态，并将这些贡献注册到编辑器中。

## 调试plugin模块

- 启动browser backend，vscode调试按钮点击“Launch Browser Backend”，启动browser应用后端。

  ```shell
  /Users/work/.nvm/versions/node/v20.15.0/bin/node ./lib/backend/main.js --hostname=0.0.0.0 --port=3000 --no-cluster --app-project-path=/Users/work/Third-Projects/theia/examples/browser --plugins=local-dir:../../plugins --hosted-plugin-inspect=9339 --ovsx-router-config=/Users/work/Third-Projects/theia/examples/ovsx-router-config.json
  ```
