# gpk

![img](./architecture.png)

针对[Theia](https://github.com/eclipse-theia/theia)中基于`references`等tsconfig配置去进行的相关extension包的构建和源码维护的探索。
（ps：探究的背景是为了我正在开发的gepick上升一个纬度，朝着成为类似于theia的二次开发的平台方向演进）

## 操作

在项目根目录下分别执行以下操作并观察现象

- `yarn build`：观察build之后的产物和产物之间的关系，到`apps/browser/src/index.ts`观察导入的`import { main } from "@gpk/p2/lib/browser/frontend-application";`，点击你会发现跳转到的地方是源代码而不是构建产物js的.d.ts文件里头了。同时你会发现产物是按照依赖关系构建的。
- `yarn start`
- `yarn clean`：你会发现相关一连串有关的库的产物会被清理。

## ts references作用

tsconfig当中可以配置一个字段references，有啥用举个例子来说明：
在monorepo项目当中，你写了多个包，需要构建成js的dist才能用。此时你在主项目引入这些包，如果没有这个references配置，你点击相关包导出变量，你去到的地方就是该包dist的.d.ts的声明文件，此时你想我希望点击的时候跳转到ts源码可以吗？可以的，配置这个字段，将path指向你的包的tsconfig所在路径就能实现这一点，因此如果你使用了多个包，你就的写多个指向。
当然这个字段的本来作用其实是依赖顺序构建，类似于NX提供的依赖构建顺序问题的解决方案，你可以尝试下这个项目的`yarn build`，你会发现相关联的包都会被构建起来，nx也可以实现同样的功能。因此，对于仅包含 TypeScript 项目并且主要关注增量构建和依赖关系管理的情况，你可以只使用 tsc -b 来处理这些问题，而不需要使用 Nx。tsc -b 可以有效地处理 TypeScript 项目中的依赖关系，并提供增量构建功能。在这部分功能上，Nx和tsc -b的效果都是一样的，都可以进行依赖产物构建，保证主项目正确执行。
在Theia当中，你可以在整个项目很多地方看到这种用法。

## 导入package包和使用package包

在Theia项目中，你经常能看到这种类似的用法`import { CommandContribution, MenuContribution } from '@theia/core/lib/common'`。当你点击对应路径的时候，跳转到的地方是`@theia/core/src/common/index.ts`。这样的效果其实就是通过[ts references作用](#ts-references作用)实现的。在Theia中，具体是这么做的：

- 第一步：注册包 - 在使用`@theia/core`的包`package.json`注册为该包依赖`"@theia/core": "1.53.0"`。
- 第二步：使用包 - 在具体的地方使用`@theia/core`，导入的lib是`@theia/core`构建后的产物：`import { CommandContribution, MenuContribution } from '@theia/core/lib/common'`。
- 第三步：支持点击构建产物路径跳转回源代码：在具体使用的包的`tsconfig.json`中对`references`配置`@theia/core`的包路径，类似于`{ "path": "../core"}`。

在本项目`gpk`中，我们为了更好的路径引用，对于包内部的路径也配置成了绝对路径的方式，比如`core`内部的文件相互引用的时候，是这么用的`import { createServiceIdentifier } from '@gpk/core/common/instantiation';`。具体的绝对路径的引用是通过`tsconfig.base.json`配置的`paths`：`"@gpk/core/*": ["./packages/core/src/*"]`。
因此，如果你在使用`core`包的地方，比如`console`，在里头你会看到两种类似的路径：

- 引用其他包，如`@gpk/core`：`import { IFrontendApplicationContribution } from '@gpk/core/lib/browser/frontend-application/frontend-application-contribution-point';`，注意这里的前缀是`@gpk/core/lib`，这就是`Theia`当中你经常能看到的路径引用方式。
- 引用本包文件：`import { ConsoleContribution, _IConsoleContribution } from '@gpk/console/browser/console-contribution';`，注意这里的前缀是`@gpk/console`。
通过上面引用本包文件的引入方式，你就以避免使用多个相对路径引入本地宝文件，看起来十分直观。但是这里会出现一个问题：构建tsc是不会帮你转换这个绝对路径的，那么最终在构建的js文件如果还是使用`import { ConsoleContribution, _IConsoleContribution } from '@gpk/console/browser/console-contribution';`没有进行相对路径转换，由于压根没有`'@gpk/console/browser/console-contribution'`这个路径的js文件就会导致执行出错。为了解决这一点，我们引入`tsc-alias`这个包来解决这个问题，在`tsc`构建后使用`tsc-alias`将绝对路径转化成相对路径。

## tsc -b + vite 二次构建

为啥使用tsc -b还需要vite进行二次构建呢？当设置package.json中的"type": "module"时，import必须带上文件后缀名，否则node执行会报错。但是，这个不是我们想要的结果，因为我们想要的是在不带后缀名的情况下也能正常导入。我们希望`import { browser } from "@gpk/p2/lib/browser/frontend-application.js"`改成直接使用的是`import { browser } from "@gpk/p2/lib/browser/frontend-application"`。为了解决上面的问题，我们先让tsc build构建相关项目，然后再使用vite二次构建dist内容，最后就可以运行dist内容了。相关讨论：<https://www.reddit.com/r/typescript/comments/1b87o96/esm_on_nodejs_file_extension_mandatory/>。在Theia当中，你会发现创建一个新的IDE项目的时候，Theia会给你搞一堆webpack config，我猜实际上也是为了解决这个问题。

## extension机制

Theia整个架构的核心是围绕inversify开展的。在Theia当中将一个个npm包作为extension的外壳，实际上每个extension的核心是ContainerModule，对于一个extension包根据不同的运行环境可以有多个ContainerModule，他们是Theia加载一个extension的入口。每个extension包可能提供以下部分：

- contribution扩展点
- 完全由内部实现的提供给外部使用的service服务
- 由外部提供的contribution + 内部实现的功能组合而成的service服务

这里我实现了一个console extension，它实现了IFrontendApplicationContribution这个contribution扩展点，IFrontendApplicationContribution是由core extension提供的，在这个示例就是由console extension来实现。
最终的console extension在`apps/browser/src/index.ts`可以看到其实就是container.load暴露的console ContainerModule就OK了。你可以尝试在项目根目录尝试运行`yarn build + yarn start`来查看加载一个`console extension`到主应用的效果。

## contribution机制

Theia的contribution机制技术上实际就是一个extension包提供给外部一些interface 接口，让其他extension包帮忙实现对应的contribution，然后在extension的ContainerModule中绑定到由提供contribution扩展点的extension包提供的contribution service id上。
而提供contribution扩展点的extension包内部怎么获取contribution呢？在Theia当中，你会发现eclipse团队会实现一个contribution provider的玩意，这个玩意装着一组外部实现的contribution，theia里头就是通过contribution provider拿的。这个探索项目并没有按照Theia官方实现那样也实现contribution provider，因为我看了下确实没必要，实现contribution provider的原因我猜他们想解决的就是同一个id多服务实现注入的问题，按照目前最新版本的inversify早就实现了这个功能就是@multiInject这个装饰器，估计当时老版本没有这个东西，所以他么自己实现了类似功能。contribution provider的实现也很简单，代码实现可以自行查看：<https://github.com/eclipse-theia/theia/blob/master/packages/core/src/common/contribution-provider.ts>

## JSON-RPC

![img](./json-rpc.png)

## plugin机制

![img](./plugin-design.png)

在Theia中支持了运行时动态加载的plugin。用户可以在插件市场点击下载自己希望使用的插件，等待插件下载完毕之后就能够使用该插件的功能了。动态加载plugin的关键技术点就是利用了require()或者是import()，它允许你运行时加载某一个模块。

Theia通过提供Plugin API的方式允许用户插件使用这些Plugin API来做事情。

### App应用生成

`examples/browser`是`Theia`项目中提供的展示项目，用来展示`cloud ide`的。相比较于你平时写的app需要自己创建相关源代码搭建项目结构，基于`Theia`的应用，其主要源代码都是通过`@theia/cli`自动生成的。生成后的主要目录如下：

```shell
├── gen-webpack.config.js
├── gen-webpack.node.config.js
├── node_modules
├── package.json
├── src-gen
│   ├── backend
│   │   ├── main.js
│   │   └── server.js
│   └── frontend
│       ├── index.html
│       ├── index.js
│       ├── secondary-index.js
│       └── secondary-window.html
├── tsconfig.json
└── webpack.config.js
```

其中`src-gen`就是你的app的源码所在目录。`gen`前缀或者后缀代表的是这些东西都是通过`@theia/cli`（`cli`主要文件位置在`dev-packages/cli/src/theia.ts`）`build`命令生成的。

> [!NOTE]
>
> 如果你对`@theia/cli`是如何利用`build`命令生成`app`的源代码以及`webpack`配置内容感兴趣，可以阅读文件夹`dev-packages/application-manager/src/generator`中的内容，这里头就是相关源码的模板。
>
> `dev-packages/application-manager/src/generator`目录如下：
>
> ```shell
> ├── abstract-generator.ts # 源码模板抽象类，提供通用功能
> ├── backend-generator.ts # 后端源码模板
> ├── frontend-generator.ts # 前端源码模板
> └── webpack-generator.ts # webpack配置模板
> ```

我们直接看`cloud ide`的前后端部分的主要部分

### 后端中的插件部分

在文件`examples/browser/src-gen/backend/server.js`中，有一段后端服务启动的代码：

```ts
async function start(port, host, argv = process.argv) {
    if (!container.isBound(BackendApplicationServer)) {
        container.bind(BackendApplicationServer).toConstantValue({ configure: defaultServeStatic });
    }
    let result = undefined;
    await container.get(CliManager).initializeCli(argv.slice(2), 
        () => container.get(BackendApplication).configured,
        async () => {
            result = container.get(BackendApplication).start(port, host);
        });
    if (result) {
        return result;
    } else {
        return Promise.reject(0);
    }
}
```

在`start`函数逻辑运行时，最终可以看到运行的是` container.get(BackendApplication).start(port, host)`。实际上也就是利用`ioc container`创建并获取文件`packages/core/src/node/backend-application.ts`中`BackendApplication`类的实例。在这里由于`BackendApplication`类定义对于`init`方法使用了`postConstruct`装饰器，它的作用是在`ioc container`创建出类实例后调用起来。因此，我们应该将` container.get(BackendApplication).start(port, host)`拆分成两部分来看`const app = container.get(BackendApplication)`和`app.start(port,host)`。前半部分`const app = container.get(BackendApplication)`将创建`BackendApplication`实例，并调用`BackendApplication`实例的`init`方法，后半部分会调用`BackendApplication`实例的`start`方法。

一个`BackendApplication`会有很多`Contribution`。在目前我所调试的版本中，总共有下面这些`Contribution`：

| (index) | `BackendApplication Contribution`       | `File`                                                       | `Method`               |
| ------- | --------------------------------------- | ------------------------------------------------------------ | ---------------------- |
| 0       | `DefaultMessagingService`               | `packages/core/src/node/messaging/default-messaging-service.ts` | `initialize`           |
| 1       | `MyLogger`                              | `packages/core/src/node/logger-backend-module.ts`            | `initialize`           |
| 2       | `PluginLocalizationServer`              | `packages/plugin-ext/src/main/node/plugin-localization-server.ts` | `initialize`           |
| 3       | `PluginDeployerContribution`            | `packages/plugin-ext/src/main/node/plugin-deployer-contribution.ts` | `initialize`           |
| 4       | `WebviewBackendSecurityWarnings`        | `packages/plugin-ext/src/main/node/webview-backend-security-warnings.ts` | `initialize`           |
| 5       | `HostedPluginLocalizationService`       | `packages/plugin-ext/src/hosted/node/hosted-plugin-localization-service.ts` | `initialize`           |
| 6       | `MiniBrowserBackendSecurityWarnings`    | `packages/mini-browser/src/node/mini-browser-backend-security-warnings.ts` | `initialize`           |
| 7       | `HostedPluginReader`                    | `packages/plugin-dev/src/node/hosted-plugin-reader.ts`       | `initialize`           |
| 8       | `NodeFileUploadService`                 | `packages/filesystem/src/node/node-file-upload-service.ts`   | `configure`            |
| 9       | `FileDownloadEndpoint`                  | `packages/filesystem/src/node/download/file-download-endpoint.ts` | `configure`            |
| 10      | `PluginApiContribution`                 | `packages/plugin-ext/src/main/node/plugin-service.ts`        | `configure`            |
| 11      | `HostedPluginReader`                    | `packages/plugin-ext/src/hosted/node/plugin-reader.ts`       | `configure`            |
| 12      | `SampleMockOpenVsxServer`               | `packages/api-samples/src/node/sample-mock-open-vsx-server.ts` | `configure \| onStart` |
| 13      | `MiniBrowserEndpoint`                   | `packages/mini-browser/src/node/mini-browser-endpoint.ts`    | `configure \| onStart` |
| 14      | `MetricsBackendApplicationContribution` | `packages/metrics/src/node/metrics-backend-application-contribution.ts` | `configure \| onStart` |
| 15      | `WebsocketEndpoint`                     | `packages/core/src/node/messaging/websocket-endpoint.ts`     | `onStart`              |
| 16      | `DefaultWorkspaceServer`                | `packages/workspace/src/node/default-workspace-server.ts`    | `onStart`              |
| 17      | `TaskBackendApplicationContribution`    | `packages/task/src/node/task-backend-application-contribution.ts` | `onStart`              |
| 18      | `MyHeadlessHostedPluginSupport`         | `packages/plugin-ext-headless/src/hosted/node/plugin-ext-headless-hosted-module.ts` | `onStart`              |
| 19      | `SampleBackendAppInfo`                  | `packages/api-samples/src/node/sample-backend-app-info.ts`   | `onStart`              |
| 20      | `Object`                                | `undefined`                                                  | ``                     |
| 21      | `ProcessManager`                        | `packages/process/src/node/process-manager.ts`               | ``                     |
| 22      | `TaskManager`                           | `packages/task/src/node/task-manager.ts`                     | ``                     |
#### BackendApplication 初始化阶段

在执行`BackendApplication`的`init`方法时，内部的关键一段逻辑是:

```ts
const contributions = this.contributionsProvider.getContributions()

await Promise.all(contributions.map(async contribution => {
 	if (contribution.initialize) {
    try {
       contribution.initialize!()
     } catch (error) {
       console.error('Could not initialize contribution', error);
     }   
  }
}));
```

这将会调用下面的这些`Contribution`的`initialize`方法：

| (index) | `BackendApplication Contribution`       | `File`                                                                                       | `Method`     |
|---------|-----------------------------------------|----------------------------------------------------------------------------------------------|--------------|
| 0       | `DefaultMessagingService`               | `packages/core/src/node/messaging/default-messaging-service.ts`                              | `initialize` |
| 1       | `MyLogger`                              | `packages/core/src/node/logger-backend-module.ts`                                            | `initialize` |
| 2       | `PluginLocalizationServer`              | `packages/plugin-ext/src/main/node/plugin-localization-server.ts`                            | `initialize` |
| 3       | `PluginDeployerContribution`            | `packages/plugin-ext/src/main/node/plugin-deployer-contribution.ts`                          | `initialize` |
| 4       | `WebviewBackendSecurityWarnings`        | `packages/plugin-ext/src/main/node/webview-backend-security-warnings.ts`                     | `initialize` |
| 5       | `HostedPluginLocalizationService`       | `packages/plugin-ext/src/hosted/node/hosted-plugin-localization-service.ts`                  | `initialize` |
| 6       | `MiniBrowserBackendSecurityWarnings`    | `packages/mini-browser/src/node/mini-browser-backend-security-warnings.ts`                   | `initialize` |
| 7       | `HostedPluginReader`                    | `packages/plugin-dev/src/node/hosted-plugin-reader.ts`                                       | `initialize` |

这个阶段，对于`Plugin`机制，我们主要关注`PluginDeployerContribution`的`initialize`过程。它位于`packages/plugin-ext/src/main/node/plugin-deployer-contribution.ts`文件中，我们看看它的`initialize`方法的关键部分：

```ts
initialize(): Promise<void> {
	// 这里注入的是packages/plugin-ext/src/main/node/plugin-deployer-impl.ts
  this.pluginDeployer.start().catch(error => this.logger.error('Initializing plugin deployer failed.', error));
  return Promise.resolve();
}
```

实际上最关键的内容是`this.pluginDeployer.start()`。而`pluginDepolyer`是通过依赖注入的方式提供给`PluginDeployerContribution`使用的，它的实际实现位置在`packages/plugin-ext/src/main/node/plugin-deployer-impl.ts`。进入该文件，我们看下`pluginDeployer`的实现定义，即`PluginDeployerImpl`类，找到该类的`start`方法定义，实际上只是做了一层转发，调用的是该类的`doStart`方法。我们看看`doStart`的关键内容：

```typescript
protected async doStart(): Promise<void> {
    // ====================初始化所有插件解析器（vscode、theia有几种解析器）====================
    await this.initResolvers();

    // check THEIA_DEFAULT_PLUGINS or THEIA_PLUGINS env var
    const defaultPluginsValue = process.env.THEIA_DEFAULT_PLUGINS || undefined;
    const pluginsValue = process.env.THEIA_PLUGINS || undefined;
    // 拿到插件目录，比如这里就是整个根目录中的plugins目录
    // 这个插件目录可以在命令后启动后端app的时候，通过--plugins参数指定
		// 比如：yarn theia start --plugins=/Users/work/Third-Projects/theia/plugins
    const defaultPluginsValueViaCli = this.cliContribution.localDir();
    const defaultPluginIdList = defaultPluginsValue ? defaultPluginsValue.split(',') : [];
    const pluginIdList = pluginsValue ? pluginsValue.split(',') : [];
    const systemEntries = defaultPluginIdList.concat(pluginIdList).concat(defaultPluginsValueViaCli ? defaultPluginsValueViaCli.split(',') : []);
    const userEntries: string[] = [];
    const context: PluginDeployerStartContext = { userEntries, systemEntries };

    // 获取各种插件解析器读取的插件目录入口
    const contributions = this.participants.getContributions();

    for (const contribution of contributions) {
        if (contribution.onWillStart) {
            await contribution.onWillStart(context);
        }
    }

    // ====================解析插件=================
    const unresolvedUserEntries = context.userEntries.map(id => ({
        id,
        type: PluginType.User
    }));

    const unresolvedSystemEntries = context.systemEntries.map(id => ({
        id,
        type: PluginType.System
    }));

    // 利用图的bfs解析所有插件入口。往往我们给定一个插件，但是这个插件又依赖其他插件，所以我们需要解析所有插件及其依赖插件
    // 只有这样才能真正的部署所有插件
    const plugins = await this.resolvePlugins([...unresolvedUserEntries, ...unresolvedSystemEntries]);

    // ====================部署插件=================
    await this.deployPlugins(plugins);
}
````

由此可见，`PluginDeployerContribution`在初始化的时候完成的事情是：解析插件和部署插件。即利用各种种类的插件解析器去解析自订插件目录下的插件，然后部署这些插件。

> [!NOTE]
>
> 对于插件部署这件事，实际上就是读取插件的相关元信息，以及类型。一个已部署的插件是这么做的，定义一个变量并设置到`deployedPlugins`中而已：`const deployed: DeployedPlugin = { metadata, type }; deployedPlugins.set(id, deployed);`，这些逻辑都放在`HostedPluginDeployerHandler`类中，该类位于`packages/plugin-ext/src/hosted/node/hosted-plugin-deployer-handler.ts`文件中。



#### BackendApplication 启动阶段

在执行`BackendApplication`的`start`方法时，内部的关键一段逻辑是:

```ts
 const contributions = this.contributionsProvider.getContributions()
 
 for (const contribution of contributions) {
   if (contribution.onStart) {
      try {
            await this.measure(contribution.constructor.name + '.onStart',
            	() => contribution.onStart!(server)
            );
          } catch (error) {
            console.error('Could not start contribution', error);
       } 
   }
}
```

这将会调用下面的`Contribution`的`onStart`方法：

| (index) | `BackendApplication Contribution`       | `File`                                                       | `Method`  |
| ------- | --------------------------------------- | ------------------------------------------------------------ | --------- |
| 0       | `SampleMockOpenVsxServer`               | `packages/api-samples/src/node/sample-mock-open-vsx-server.ts` | `onStart` |
| 1       | `MiniBrowserEndpoint`                   | `packages/mini-browser/src/node/mini-browser-endpoint.ts`    | `onStart` |
| 2       | `MetricsBackendApplicationContribution` | `packages/metrics/src/node/metrics-backend-application-contribution.ts` | `onStart` |
| 3       | `WebsocketEndpoint`                     | `packages/core/src/node/messaging/websocket-endpoint.ts`     | `onStart` |
| 4       | `DefaultWorkspaceServer`                | `packages/workspace/src/node/default-workspace-server.ts`    | `onStart` |
| 5       | `TaskBackendApplicationContribution`    | `packages/task/src/node/task-backend-application-contribution.ts` | `onStart` |
| 6       | `MyHeadlessHostedPluginSupport`         | `packages/plugin-ext-headless/src/hosted/node/plugin-ext-headless-hosted-module.ts` | `onStart` |
| 7       | `SampleBackendAppInfo`                  | `packages/api-samples/src/node/sample-backend-app-info.ts`   | `onStart` |

这个阶段，对于`Plugin`机制，我们主要关注`MyHeadlessHostedPluginSupport`的`onStart`过程。它位于`packages/plugin-ext-headless/src/hosted/node/plugin-ext-headless-hosted-module.ts`文件中，我们看看它的`onStart`关键内容：

```ts
bind(BackendApplicationContribution).toDynamicValue(({ container }) => {
    let hostedPluginSupport: HeadlessHostedPluginSupport | undefined;

    class MyHeadlessHostedPluginSupport {
        onStart(): MaybePromise<void> {
            // Create a child container to isolate the Headless Plugin hosting stack
            // from all connection-scoped frontend/backend plugin hosts and
            // also to avoid leaking it into the global container scope
            const headlessPluginsContainer = container.createChild();
            const modules = container.getAll<ContainerModule>(HeadlessPluginContainerModule);

            headlessPluginsContainer.load(...modules);

            hostedPluginSupport = headlessPluginsContainer.get(HeadlessHostedPluginSupport);

            // plugin-ext-headless依赖于plugin-ext包的packages/plugin-ext/src/hosted/common/hosted-plugin.ts
            hostedPluginSupport.onStart(headlessPluginsContainer);
        }

        onStop(): void {
            hostedPluginSupport?.shutDown();
        }
    }
    return new MyHeadlessHostedPluginSupport();
});
```

这里边最关键的部分是` hostedPluginSupport.onStart(headlessPluginsContainer)`，`hostedPluginSupport`是`HeadlessHostedPluginSupport`创建的实例，而`HeadlessHostedPluginSupport`位于`packages/plugin-ext-headless/src/hosted/node/headless-hosted-plugin.ts`文件中。而`HeadlessHostedPluginSupport`又是继承自`AbstractHostedPluginSupport`，它位于`packages/plugin-ext/src/hosted/common/hosted-plugin.ts`文件中。`onStart`方法正是定义在它身上的：

```ts
 onStart(container: interfaces.Container): void {
   this.container = container;
   this.load();
   this.afterStart();
}
```

关键的部分是`this.load()`，而在`load`方法中最核心的内容就是`this.doLoad()`，我们继续看下`doLoad`的关键定义：

```ts
protected async doLoad(): Promise<void> {

    // ==============同步所有插件 start============
    await this.syncPlugins();
    // ==============同步所有插件 end============

    // ==============加载所有插件贡献 start============
    // 实际上就是将每个plugin的contributions分类注册
    // 比如contribute的地方有command、theme等地方，意思是写的plugin是对这些地方的扩展
    // 所以你会看到contributions.command，contributions.theme等 类似这样的内容，将plugin里头这些内容一个个注册
    // 这个部分简而言之，就是将一个theia向插件暴露的可contribute的地方，一个个处理，如果有就调用相关处理逻辑，没有就跳过
    const contributionsByHost = this.loadContributions(toDisconnect);
    // ==============加载所有插件贡献 end============

    // ==============等待Theia App（前端App或者后端App）启动完成 start=============
    await this.theiaReadyPromise;
    // ==============等待Theia App（前端App或者后端App）启动完成 end=============

    // ==============启动所有插件 start============
    // 启动所有需要加载的插件
    await this.startPlugins(contributionsByHost, toDisconnect);
    // ==============启动所有插件 end============
}
```

由此可见，`MyHeadlessHostedPluginSupport`这个`Contribution`做的事情是针对`Headless Plugin`的相关操作：同步插件、加载插件`Contribution`、启动插件。

### 前端中的插件部分

在`examples/browser/src-gen/frontend/index.js`文件中，有一段关于启动前端应用的代码：

```ts
function start() {

   (window['theia'] = window['theia'] || {}).container = container;

		return container.get(FrontendApplication).start();

}
```

这其中关键的部分是`container.get(FrontendApplication).start()`。我们按照之前的方式，同样的分成`const app = container.get(FrontendApplication)` 和 `app.start()`两部分，从这两部分分析`app`可能经历的两个阶段：初始化阶段和启动阶段。`FrontendApplication`位于`packages/core/src/browser/frontend-application.ts`文件中，我们观察发现并没有使用`postConstruct`的地方，所以`FrontendApplication`的初始化阶段可忽略。我们直接看启动阶段，找到`start`方法中关于`Contribution`有关的内容，这里为了更清晰表达，我改造了下：

```ts
async start(): Promise<void> {
  await this.initializeContributions()
  await this.configureContributions()
  await this.startContributions()
}

protected async initializeContributions(): Promise<void> {
    for (const contribution of this.contributions.getContributions()) {
        if (contribution.initialize) {
            contribution.initialize!()
        }
    }
}

protected async configureContributions(): Promise<void> {
    for (const contribution of this.contributions.getContributions()) {
        if (contribution.configure) {
            await contribution.configure!(this)
        }
    }
}

protected async startContributions(): Promise<void> {
    this.commands.onStart()
    this.keybindings.onStart()
    this.menus.onStart()

    for (const contribution of this.contributions.getContributions()) {
        if (contribution.onStart) {
           await contribution.onStart!(this)
        }
    }
}
```

一个`FrontendApplication`会有很多`Contribution`。在目前我所调试的版本中，总共有下面这些`Contribution`：

| (index) | `FrontendApplication Contribution`        | `File`                                                       | `Method`                |
| ------- | ----------------------------------------- | ------------------------------------------------------------ | ----------------------- |
| 0       | `TabBarDecoratorService`                  | `packages/core/src/browser/shell/tab-bar-decorator.ts`       | `initialize`            |
| 1       | `LabelProvider`                           | `packages/core/src/browser/label-provider.ts`                | `initialize`            |
| 2       | `ApplicationConnectionStatusContribution` | `packages/core/src/browser/connection-status-service.ts`     | `initialize`            |
| 3       | `DialogOverlayService`                    | `packages/core/src/browser/dialogs.ts`                       | `initialize`            |
| 4       | `MyLogger`                                | `packages/core/src/browser/logger-frontend-module.ts`        | `initialize`            |
| 5       | `FileSystemFrontendContribution`          | `packages/filesystem/src/browser/filesystem-frontend-contribution.ts` | `initialize \| onStart` |
| 6       | `ProblemDecorationContribution`           | `packages/markers/src/browser/problem/problem-decorations-provider.ts` | `initialize`            |
| 7       | `MonacoFrontendApplicationContribution`   | `packages/monaco/src/browser/monaco-frontend-application-contribution.ts` | `initialize \| onStart` |
| 8       | `MonacoFormattingConflictsContribution`   | `packages/monaco/src/browser/monaco-formatting-conflicts.ts` | `initialize`            |
| 9       | `MonacoTextmateService`                   | `packages/monaco/src/browser/textmate/monaco-textmate-service.ts` | `initialize`            |
| 10      | `ConsoleContribution`                     | `packages/console/src/browser/console-contribution.ts`       | `initialize`            |
| 11      | `WebviewFrontendSecurityWarnings`         | `packages/plugin-ext/src/main/browser/webview/webview-frontend-security-warnings.ts` | `initialize`            |
| 12      | `MiniBrowserFrontendSecurityWarnings`     | `packages/mini-browser/src/browser/mini-browser-frontend-security-warnings.ts` | `initialize`            |
| 13      | `MetricsFrontendApplicationContribution`  | `packages/metrics/src/browser/metrics-frontend-application-contribution.ts` | `initialize`            |
| 14      | `HostedPluginInformer`                    | `packages/plugin-dev/src/browser/hosted-plugin-informer.ts`  | `initialize`            |
| 15      | `HostedPluginController`                  | `packages/plugin-dev/src/browser/hosted-plugin-controller.ts` | `initialize`            |
| 16      | `CommonFrontendContribution`              | `packages/core/src/browser/common-frontend-contribution.ts`  | `configure \| onStart`  |
| 17      | `WorkspaceUserWorkingDirectoryProvider`   | `packages/workspace/src/browser/workspace-user-working-directory-provider.ts` | `configure`             |
| 18      | `WorkspaceFrontendContribution`           | `packages/workspace/src/browser/workspace-frontend-contribution.ts` | `configure`             |
| 19      | `IconThemeApplicationContribution`        | `packages/core/src/browser/icon-theme-contribution.ts`       | `onStart`               |
| 20      | `ColorApplicationContribution`            | `packages/core/src/browser/color-application-contribution.ts` | `onStart`               |
| 21      | `TabBarToolbarRegistry`                   | `packages/core/src/browser/shell/tab-bar-toolbar/tab-bar-toolbar-registry.ts` | `onStart`               |
| 22      | `QuickInputFrontendContribution`          | `packages/core/src/browser/quick-input/quick-input-frontend-contribution.ts` | `onStart`               |
| 23      | `JsonSchemaStore`                         | `packages/core/src/browser/json-schema-store.ts`             | `onStart`               |
| 24      | `ApplicationShellMouseTracker`            | `packages/core/src/browser/shell/application-shell-mouse-tracker.ts` | `onStart`               |
| 25      | `WorkspaceWindowTitleUpdater`             | `packages/workspace/src/browser/workspace-window-title-updater.ts` | `onStart`               |
| 26      | `StylingService`                          | `packages/core/src/browser/styling-service.ts`               | `onStart`               |
| 27      | `BrowserMenuBarContribution`              | `packages/core/src/browser/menu/browser-menu-plugin.ts`      | `onStart`               |
| 28      | `DefaultWindowService`                    | `packages/core/src/browser/window/default-window-service.ts` | `onStart`               |
| 29      | `VariableResolverFrontendContribution`    | `packages/variable-resolver/src/browser/variable-resolver-frontend-contribution.ts` | `onStart`               |
| 30      | `EditorContribution`                      | `packages/editor/src/browser/editor-contribution.ts`         | `onStart`               |
| 31      | `EditorLineNumberContribution`            | `packages/editor/src/browser/editor-linenumber-contribution.ts` | `onStart`               |
| 32      | `EditorNavigationContribution`            | `packages/editor/src/browser/editor-navigation-contribution.ts` | `onStart`               |
| 33      | `ProblemContribution`                     | `packages/markers/src/browser/problem/problem-contribution.ts` | `onStart`               |
| 34      | `MonacoOutlineContribution`               | `packages/monaco/src/browser/monaco-outline-contribution.ts` | `onStart`               |
| 35      | `MonacoStatusBarContribution`             | `packages/monaco/src/browser/monaco-status-bar-contribution.ts` | `onStart`               |
| 36      | `TerminalFrontendContribution`            | `packages/terminal/src/browser/terminal-frontend-contribution.ts` | `onStart`               |
| 37      | `TaskFrontendContribution`                | `packages/task/src/browser/task-frontend-contribution.ts`    | `onStart`               |
| 38      | `NavigatorTabBarDecorator`                | `packages/navigator/src/browser/navigator-tab-bar-decorator.ts` | `onStart`               |
| 39      | `DebugInlineValueDecorator`               | `packages/debug/src/browser/editor/debug-inline-value-decorator.ts` | `onStart`               |
| 40      | `DebugFrontendApplicationContribution`    | `packages/debug/src/browser/debug-frontend-application-contribution.ts` | `onStart`               |
| 41      | `NotificationsContribution`               | `packages/messages/src/browser/notifications-contribution.ts` | `onStart`               |
| 42      | `NotebookOutlineContribution`             | `packages/notebook/src/browser/contributions/notebook-outline-contribution.ts` | `onStart`               |
| 43      | `NotebookStatusBarContribution`           | `packages/notebook/src/browser/contributions/notebook-status-bar-contribution.ts` | `onStart`               |
| 44      | `PreferenceFrontendContribution`          | `packages/preferences/src/browser/preference-frontend-contribution.ts` | `onStart`               |
| 45      | `ScmContribution`                         | `packages/scm/src/browser/scm-contribution.ts`               | `onStart`               |
| 46      | `MyBrowserHostedPluginSupport`            | `packages/plugin-ext/src/main/browser/plugin-ext-frontend-module.ts` | `onStart`               |
| 47      | `WebviewSecondaryWindowSupport`           | `packages/plugin-ext/src/main/browser/webview/webview-secondary-window-support.ts` | `onStart`               |
| 48      | `SampleOutputChannelWithSeverity`         | `examples/api-samples/src/browser/output/sample-output-channel-with-severity.ts` | `onStart`               |
| 49      | `SampleFileWatchingContribution`          | `examples/api-samples/src/browser/file-watching/sample-file-watching-contribution.ts` | `onStart`               |
| 50      | `MiniBrowserOpenHandler`                  | `packages/mini-browser/src/browser/mini-browser-open-handler.ts` | `onStart`               |
| 51      | `MiniBrowserEnvironment`                  | `packages/mini-browser/src/browser/environment/mini-browser-environment.ts` | `onStart`               |
| 52      | `PreviewContribution`                     | `packages/preview/src/browser/preview-contribution.ts`       | `onStart`               |
| 53      | `GettingStartedContribution`              | `packages/getting-started/src/browser/getting-started-contribution.ts` | `onStart`               |
| 54      | `PreferenceServiceImpl`                   | `packages/core/src/browser/preferences/preference-service.ts` | ``                      |
| 55      | `FilesystemSaveableService`               | `packages/filesystem/src/browser/filesystem-saveable-service.ts` | ``                      |
| 56      | `CollaborationWorkspaceService`           | `packages/collaboration/src/browser/collaboration-workspace-service.ts` | ``                      |
| 57      | `OutlineViewContribution`                 | `packages/outline-view/src/browser/outline-view-contribution.ts` | ``                      |
| 58      | `BulkEditContribution`                    | `packages/bulk-edit/src/browser/bulk-edit-contribution.ts`   | ``                      |
| 59      | `FileNavigatorContribution`               | `packages/navigator/src/browser/navigator-contribution.ts`   | ``                      |
| 60      | `TestViewContribution`                    | `packages/test/src/browser/view/test-view-contribution.ts`   | ``                      |
| 61      | `EditorPreviewTreeDecorator`              | `packages/editor-preview/src/browser/editor-preview-tree-decorator.ts` | ``                      |
| 62      | `SearchInWorkspaceFrontendContribution`   | `packages/search-in-workspace/src/browser/search-in-workspace-frontend-contribution.ts` | ``                      |
| 63      | `WebviewContextKeys`                      | `packages/plugin-ext/src/main/browser/webview/webview-context-keys.ts` | ``                      |
| 64      | `PluginViewRegistry`                      | `packages/plugin-ext/src/main/browser/view/plugin-view-registry.ts` | ``                      |
| 65      | `PluginIconService`                       | `packages/plugin-ext/src/main/browser/plugin-icon-service.ts` | ``                      |
| 66      | `VSXExtensionsContribution`               | `packages/vsx-registry/src/browser/vsx-extensions-contribution.ts` | ``                      |
| 67      | `DebugFrontendContribution`               | `packages/memory-inspector/src/browser/memory-inspector-frontend-contribution.ts` | ``                      |
#### FrontendApplication 启动阶段

和后端服务不同，在前端应用启动的时候，才会一次性将`Contribution`的`initialize`、`configure`、`onStart`方法分别调用起来。

能够调用`initialize`方法的`Contribution`有：

| (index) | `FrontendApplication Contribution`                | `File`                                                                                       | `Method`     |
|---------|---------------------------------------------------|----------------------------------------------------------------------------------------------|--------------|
| 0       | `TabBarDecoratorService`                          | `packages/core/src/browser/shell/tab-bar-decorator.ts`                                       | `initialize` |
| 1       | `LabelProvider`                                   | `packages/core/src/browser/label-provider.ts`                                                | `initialize` |
| 2       | `ApplicationConnectionStatusContribution`         | `packages/core/src/browser/connection-status-service.ts`                                     | `initialize` |
| 3       | `DialogOverlayService`                            | `packages/core/src/browser/dialogs.ts`                                                       | `initialize` |
| 4       | `MyLogger`                                        | `packages/core/src/browser/logger-frontend-module.ts`                                        | `initialize` |
| 5       | `FileSystemFrontendContribution`                  | `packages/filesystem/src/browser/filesystem-frontend-contribution.ts`                        | `initialize \| onStart` |
| 6       | `ProblemDecorationContribution`                   | `packages/markers/src/browser/problem/problem-decorations-provider.ts`                       | `initialize` |
| 7       | `MonacoFrontendApplicationContribution`           | `packages/monaco/src/browser/monaco-frontend-application-contribution.ts`                    | `initialize \| onStart` |
| 8       | `MonacoFormattingConflictsContribution`           | `packages/monaco/src/browser/monaco-formatting-conflicts.ts`                                 | `initialize` |
| 9       | `MonacoTextmateService`                           | `packages/monaco/src/browser/textmate/monaco-textmate-service.ts`                            | `initialize` |
| 10      | `ConsoleContribution`                             | `packages/console/src/browser/console-contribution.ts`                                       | `initialize` |
| 11      | `WebviewFrontendSecurityWarnings`                 | `packages/plugin-ext/src/main/browser/webview/webview-frontend-security-warnings.ts`         | `initialize` |
| 12      | `MiniBrowserFrontendSecurityWarnings`             | `packages/mini-browser/src/browser/mini-browser-frontend-security-warnings.ts`               | `initialize` |
| 13      | `MetricsFrontendApplicationContribution`          | `packages/metrics/src/browser/metrics-frontend-application-contribution.ts`                  | `initialize` |
| 14      | `HostedPluginInformer`                            | `packages/plugin-dev/src/browser/hosted-plugin-informer.ts`                                  | `initialize` |
| 15      | `HostedPluginController`                          | `packages/plugin-dev/src/browser/hosted-plugin-controller.ts`                                | `initialize` |

能调用`configure`方法的`Contribution`有：

| (index) | `FrontendApplication Contribution`                | `File`                                                                                       | `Method`     |
|---------|---------------------------------------------------|----------------------------------------------------------------------------------------------|--------------|
| 0       | `CommonFrontendContribution`                      | `packages/core/src/browser/common-frontend-contribution.ts`                                  | `configure` |
| 1       | `WorkspaceUserWorkingDirectoryProvider`           | `packages/workspace/src/browser/workspace-user-working-directory-provider.ts`                | `configure`  |
| 2       | `WorkspaceFrontendContribution`                   | `packages/workspace/src/browser/workspace-frontend-contribution.ts`                          | `configure`  |

能调用`onStart`方法的`Contribution`有:

| (index) | `FrontendApplication Contribution`                | `File`                                                                                       | `Method`     |
|---------|---------------------------------------------------|----------------------------------------------------------------------------------------------|--------------|
| 0       | `FileSystemFrontendContribution`                  | `packages/filesystem/src/browser/filesystem-frontend-contribution.ts`                        | `onStart`    |
| 1       | `MonacoFrontendApplicationContribution`           | `packages/monaco/src/browser/monaco-frontend-application-contribution.ts`                    | `onStart`    |
| 2       | `CommonFrontendContribution`                      | `packages/core/src/browser/common-frontend-contribution.ts`                                  | `onStart`    |
| 3       | `IconThemeApplicationContribution`                | `packages/core/src/browser/icon-theme-contribution.ts`                                       | `onStart`    |
| 4       | `ColorApplicationContribution`                    | `packages/core/src/browser/color-application-contribution.ts`                                | `onStart`    |
| 5       | `TabBarToolbarRegistry`                           | `packages/core/src/browser/shell/tab-bar-toolbar/tab-bar-toolbar-registry.ts`                | `onStart`    |
| 6       | `QuickInputFrontendContribution`                  | `packages/core/src/browser/quick-input/quick-input-frontend-contribution.ts`                 | `onStart`    |
| 7       | `JsonSchemaStore`                                 | `packages/core/src/browser/json-schema-store.ts`                                             | `onStart`    |
| 8       | `ApplicationShellMouseTracker`                    | `packages/core/src/browser/shell/application-shell-mouse-tracker.ts`                         | `onStart`    |
| 9       | `WorkspaceWindowTitleUpdater`                     | `packages/workspace/src/browser/workspace-window-title-updater.ts`                           | `onStart`    |
| 10      | `StylingService`                                  | `packages/core/src/browser/styling-service.ts`                                               | `onStart`    |
| 11      | `BrowserMenuBarContribution`                      | `packages/core/src/browser/menu/browser-menu-plugin.ts`                                      | `onStart`    |
| 12      | `DefaultWindowService`                            | `packages/core/src/browser/window/default-window-service.ts`                                 | `onStart`    |
| 13      | `VariableResolverFrontendContribution`            | `packages/variable-resolver/src/browser/variable-resolver-frontend-contribution.ts`          | `onStart`    |
| 14      | `EditorContribution`                              | `packages/editor/src/browser/editor-contribution.ts`                                         | `onStart`    |
| 15      | `EditorLineNumberContribution`                    | `packages/editor/src/browser/editor-linenumber-contribution.ts`                              | `onStart`    |
| 16      | `EditorNavigationContribution`                    | `packages/editor/src/browser/editor-navigation-contribution.ts`                              | `onStart`    |
| 17      | `ProblemContribution`                             | `packages/markers/src/browser/problem/problem-contribution.ts`                               | `onStart`    |
| 18      | `MonacoOutlineContribution`                       | `packages/monaco/src/browser/monaco-outline-contribution.ts`                                 | `onStart`    |
| 19      | `MonacoStatusBarContribution`                     | `packages/monaco/src/browser/monaco-status-bar-contribution.ts`                              | `onStart`    |
| 20      | `TerminalFrontendContribution`                    | `packages/terminal/src/browser/terminal-frontend-contribution.ts`                            | `onStart`    |
| 21      | `TaskFrontendContribution`                        | `packages/task/src/browser/task-frontend-contribution.ts`                                    | `onStart`    |
| 22      | `NavigatorTabBarDecorator`                        | `packages/navigator/src/browser/navigator-tab-bar-decorator.ts`                              | `onStart`    |
| 23      | `DebugInlineValueDecorator`                       | `packages/debug/src/browser/editor/debug-inline-value-decorator.ts`                          | `onStart`    |
| 24      | `DebugFrontendApplicationContribution`            | `packages/debug/src/browser/debug-frontend-application-contribution.ts`                      | `onStart`    |
| 25      | `NotificationsContribution`                       | `packages/messages/src/browser/notifications-contribution.ts`                                | `onStart`    |
| 26      | `NotebookOutlineContribution`                     | `packages/notebook/src/browser/contributions/notebook-outline-contribution.ts`               | `onStart`    |
| 27      | `NotebookStatusBarContribution`                   | `packages/notebook/src/browser/contributions/notebook-status-bar-contribution.ts`            | `onStart`    |
| 28      | `PreferenceFrontendContribution`                  | `packages/preferences/src/browser/preference-frontend-contribution.ts`                       | `onStart`    |
| 29      | `ScmContribution`                                 | `packages/scm/src/browser/scm-contribution.ts`                                               | `onStart`    |
| 30      | `MyBrowserHostedPluginSupport`                    | `packages/plugin-ext/src/main/browser/plugin-ext-frontend-module.ts`                         | `onStart`    |
| 31      | `WebviewSecondaryWindowSupport`                   | `packages/plugin-ext/src/main/browser/webview/webview-secondary-window-support.ts`           | `onStart`    |
| 32      | `SampleOutputChannelWithSeverity`                 | `examples/api-samples/src/browser/output/sample-output-channel-with-severity.ts`             | `onStart`    |
| 33      | `SampleFileWatchingContribution`                  | `examples/api-samples/src/browser/file-watching/sample-file-watching-contribution.ts`        | `onStart`    |
| 34      | `MiniBrowserOpenHandler`                          | `packages/mini-browser/src/browser/mini-browser-open-handler.ts`                             | `onStart`    |
| 35      | `MiniBrowserEnvironment`                          | `packages/mini-browser/src/browser/environment/mini-browser-environment.ts`                  | `onStart`    |
| 36      | `PreviewContribution`                             | `packages/preview/src/browser/preview-contribution.ts`                                       | `onStart`    |
| 37      | `GettingStartedContribution`                      | `packages/getting-started/src/browser/getting-started-contribution.ts`                       | `onStart`    |

在这几个`Contribution`生命周期中，我们着重关注`onStart`阶段，在前端应用启动的时候会依次调用所有contribution `onStart`方法，因此会将`packages/plugin-ext/src/main/browser/plugin-ext-frontend-module.ts`文件中定义的`FrontendApplicationContribution`实现的对象身上`onStart`方法调用起来。该段代码关键内容如下：

```typescript
  bind(FrontendApplicationContribution).toDynamicValue(ctx => {
      class MyBrowserHostedPluginSupport {
          onStart(): MaybePromise<void> {
              ctx.container.get(HostedPluginSupport).onStart(ctx.container);
          }
      }

      return new MyBrowserHostedPluginSupport()
  });
```

关键的逻辑就是将类`HostedPluginSupport`的实例获取，并调用其`onStart`方法启动插件功能。我们进入`HostedPluginSupport`类所在的`packages/plugin-ext/src/hosted/browser/hosted-plugin.ts`文件中。而在`HostedPluginSupport`类定义的地方我们发现它是继承自`AbstractHostedPluginSupport`类，它位于`packages/plugin-ext/src/hosted/common/hosted-plugin.ts`文件中。

`onStart`方法正是定义在`AbstractHostedPluginSupport`身上的：

```ts
 onStart(container: interfaces.Container): void {
   this.container = container;
   this.load();
   this.afterStart();
}
```

关键的部分是`this.load()`，而在`load`方法中最核心的内容就是`this.doLoad()`，我们继续看下`doLoad`的关键定义：

```ts
protected async doLoad(): Promise<void> {

    // ==============同步所有插件 start============
    await this.syncPlugins();
    // ==============同步所有插件 end============

    // ==============加载所有插件贡献 start============
    // 实际上就是将每个plugin的contributions分类注册
    // 比如contribute的地方有command、theme等地方，意思是写的plugin是对这些地方的扩展
    // 所以你会看到contributions.command，contributions.theme等 类似这样的内容，将plugin里头这些内容一个个注册
    // 这个部分简而言之，就是将一个theia向插件暴露的可contribute的地方，一个个处理，如果有就调用相关处理逻辑，没有就跳过
    const contributionsByHost = this.loadContributions(toDisconnect);
    // ==============加载所有插件贡献 end============

    // ==============等待Theia App（前端App或者后端App）启动完成 start=============
    await this.theiaReadyPromise;
    // ==============等待Theia App（前端App或者后端App）启动完成 end=============

    // ==============启动所有插件 start============
    // 启动所有需要加载的插件
    await this.startPlugins(contributionsByHost, toDisconnect);
    // ==============启动所有插件 end============
}
```

由此可见，`MyBrowserHostedPluginSupport`这个`Contribution`做的事情是针对`Plugin`的相关操作：同步插件、加载插件`Contribution`、启动插件。

#### plugin host插件进程

上面可以看到，在前端`MyBrowserHostedPluginSupport`这个`Contribution`做的事情是针对`Plugin`的相关操作：同步插件、加载插件`Contribution`、启动插件。但是我们debug启动整个项目后，会发现调用栈中可以看到至少两个不同的进程，一个是后端服务`main`主进程，一个是叫做`plugin-host`的子进程。`main`主进程是后端服务启动的时候出现的，那么`plugin-host`子进程是咋来的呢？

事实上，通过`debug`前端`MyBrowserHostedPluginSupport`这个`Contribution`的时候，我们发现在同步插件这一环节里头会让后端主进程`fork`出一个子进程，名字就叫做`plugin-host`。因此，我们有必要看下同步插件这个环节是如何做到让后端主进程`fork`出`plugin-host`子进程的。

...未完待续

> [!WARNING]
>
> 以下为旧的分析内容，后边会将其持续分解成更详细部分解析：

- 对于同步插件`syncPlugins`这件事，内部会fork出plugin host子进程（这里启动了一个plugin host子进程后端）。

- 对于fork出子进程，执行入口是`packages/plugin-ext/src/hosted/node/plugin-host.ts`。同样也是创建一个ioc container，load pluginHostModule加载plugin host模块。在`plugin-host`内容里头会获取`PluginHostRPC`，在获取的时候触发继承`AbstractPluginHostRPC`类的`initialize`方法（因为它用了inversify的postConstruct装饰器）。

- 对于启动插件`startPlugins`这件事，实际上是通过plugin manager这个部分来实现的。而在前端其实拿到的plugin manager是一个rpc代理对象，它可以调用实际上位于`packages/plugin-ext/src/plugin/plugin-manager.ts`这个模块中的`PluginManagerExtImpl`的相关方法。相关方法的接口定义是位于`packages/plugin-ext/src/common/plugin-api-rpc.ts`的`AbstractPluginManagerExt`：

  ```typescript
    export interface AbstractPluginManagerExt<P extends Record<string, any>> {
      /** initialize the manager, should be called only once */
      $init(params: P): Promise<void>;
  
      /** load and activate plugins */
      $start(params: PluginManagerStartParams): Promise<void>;
  
      /** deactivate the plugin */
      $stop(pluginId: string): Promise<void>;
  
      /** deactivate all plugins */
      $stop(): Promise<void>;
  
      $updateStoragePath(path: string | undefined): Promise<void>;
  
      $activateByEvent(event: string): Promise<void>;
  
      $activatePlugin(id: string): Promise<void>;
  
  }
  ```

  而实际上在`startPlugins`有段关键逻辑是`this.handlePluginStarted(manager, plugin);`，其实际上调用的是位于`packages/plugin-ext/src/hosted/browser/hosted-plugin.ts`的`HostedPluginSupport`类的`activateByWorkspaceContains`方法。在`activateByWorkspaceContains`方法中关键的逻辑是：

  ```typescript
    const activatePlugin = () => {
          return manager.$activateByEvent(`onPlugin:${plugin.metadata.model.id}`)
  };
  ```

  接着其实`manager.$activateByEvent`内部其实是寻找event对应的所有activation，而activation的定义其实就是调用了`manager.$activatePlugin`方法。
  我们进去看`manager.$activatePlugin`方法的定义：

  ```typescript
   async $activatePlugin(id: string): Promise<void> {
      const plugin = this.registry.get(id);
      if (plugin && this.configStorage) {
          await this.loadPlugin(plugin, this.configStorage);
      }
  }
  ```

  继续深挖`this.loadPlugin`方法，会找到很关键的一段逻辑:

  ```typescript
    let pluginMain = this.host.loadPlugin(plugin);
    pluginMain = pluginMain || {};
    await this.startPlugin(plugin, configStorage, pluginMain);
  ```

  在这里头`this.host`就是我们之前提到的位于`packages/plugin-ext/src/hosted/node/plugin-host-rpc.ts`的`AbstractPluginHostRPC`的`createPluginHost`方法创建出来的host对象。我们看看`loadPlugin`方法

  ```typescript
  loadPlugin(plugin: Plugin): any {
      removeFromCache(mod => mod.id.startsWith(plugin.pluginFolder));
      if (plugin.pluginPath) {
            return dynamicRequire(plugin.pluginPath);
      }
  },
  ```

  这里我们发现关键的部分就是`dynamicRequire(plugin.pluginPath)`，这个就是整个动态加载plugin的核心地方。它会将一个plugin模块导入，结果就是上面的`pluginMain`，这个对象实际上就是对应用户plugin模块向外导出的`activate`和`deactivate`方法的模块对象。
  激活插件的逻辑如下

  ```typescript
  if (typeof pluginMain[plugin.lifecycle.startMethod] === 'function') {
          await this.localization.initializeLocalizedMessages(plugin, this.envExt.language);
          const pluginExport = await pluginMain[plugin.lifecycle.startMethod].apply(getGlobal(), [pluginContext]);
          this.activatedPlugins.set(plugin.model.id, new ActivatedPlugin(pluginContext, pluginExport, stopFn));
  }
  ```

  这里的`plugin.lifecycle.startMethod`其实就是`activate`。通过这种方式，我们将用户开发的Plugin和Theia连接起来了，相关pluginContext上下文会在这个地方传递给用户Plugin。
  简而言之，在`startPlugins`中一次性将manager的$init，$start，$activateByEvent，$activatePlugin方法一次性调用了。


#### 插件市场设计

- 前端提供一个插件市场，让用户能够浏览不同的插件，选择自己希望的插件下载。
- 用户点击插件下载后，拉取对应的插件包，将其部署到本地，以提供使用。
- 使用动态加载机制将插件包主模块加载到应用当中。
- 执行起插件包主模块，调用插件的激活方法activate激活该插件。

#### @theia/plugin

@theia/plugin 扩展在 Theia 插件机制中起到了关键作用，主要提供了插件 API，使得插件能够与 Theia 应用进行交互。以下是其主要功能和作用：

1. 插件 API 提供：
   @theia/plugin 扩展贡献了插件 API，使得插件开发者可以通过这些 API 与 Theia 应用进行交互。例如，插件可以注册各种提供者（如定义提供者、声明提供者、实现提供者等），以扩展 Theia 的功能。
2. 插件管理：
   该扩展还负责管理插件的生命周期，包括插件的加载、激活和停止。插件可以通过 start 方法导出其 API，其他插件可以通过 theia.plugins.getPlugin 方法获取并使用这些 API。
3. 文档和符号处理：
   @theia/plugin 扩展提供了多种文档和符号处理的提供者接口，如定义提供者、声明提供者、实现提供者、类型定义提供者、引用提供者、文档链接提供者、代码镜头提供者、文档符号提供者和工作区符号提供者等。这些提供者接口允许插件开发者为特定语言或文件类型添加自定义的处理逻辑。
4. 注册和调用提供者：
   插件可以通过 theia.languages 模块注册各种提供者，这些提供者会在用户执行相应命令时被调用。例如，当用户执行“转到定义”命令时，定义提供者会被调用以提供符号的定义位置。
   以下是一些相关代码片段，展示了如何注册和使用这些提供者

> 

