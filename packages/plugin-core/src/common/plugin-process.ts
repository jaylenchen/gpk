import { createServiceIdentifier } from '@gpk/core/lib/common/instantiation';

export const PLUGIN_PROCESS_CONFIGURATIOIN = Symbol.for("PluginProcessConfiguration");
export const IPluginProcessConfiguration = createServiceIdentifier<IPluginProcessConfiguration>(PLUGIN_PROCESS_CONFIGURATIOIN);
export interface IPluginProcessConfiguration {
  path: string;
}

export const PLUGIN_PROCESS = Symbol.for("PluginProcess");
export const IPluginProcess = createServiceIdentifier<IPluginProcess>(PLUGIN_PROCESS);
export interface IPluginProcess {
  runPluginServer(serverName?: string): void
}
