import { createServiceIdentifier } from '@gpk/core/lib/common/instantiation';

export const PLUGIN_SERVER = Symbol.for("PluginServer");
export const IPluginServer = createServiceIdentifier<IPluginServer>(PLUGIN_SERVER);
export interface IPluginServer {
  getDeployedPluginIds(): Promise<string[]>;

  getUninstalledPluginIds(): Promise<string[]>;

  getDeployedPlugins(pluginIds: string[]): Promise<string[]>

  runPluginServer(serverName?: string): void
}
