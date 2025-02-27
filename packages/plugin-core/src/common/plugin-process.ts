import { createServiceIdentifier } from '@gpk/core/lib/common/instantiation';

export const PLUGIN_PROCESS_CONFIGURATIOIN = Symbol.for("PluginProcessConfiguration");
export const IPluginProcessConfiguration = createServiceIdentifier<IPluginProcessConfiguration>(PLUGIN_PROCESS_CONFIGURATIOIN);
export interface IPluginProcessConfiguration {
  puginHostMain: string;
}

export const PLUGIN_PROCESS_MANAGER = Symbol.for("PluginProcessManager");
export const IPluginProcessManager = createServiceIdentifier<IPluginProcessManager>(PLUGIN_PROCESS_MANAGER);
export interface IPluginProcessManager {
  runPluginServer(serverName?: string): void
}
