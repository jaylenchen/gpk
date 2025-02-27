import { createServiceIdentifier, postConstruct } from '@gpk/core/lib/common/instantiation';

export const PLUGIN_HOST_RPC = Symbol.for("PluginHostRpc");
export const IPluginHostRpc = createServiceIdentifier<IPluginHostRpc>(PLUGIN_HOST_RPC)
export interface IPluginHostRpc {
  createPluginHost(): any
}

export class PluginHostRpc implements IPluginHostRpc {

  @postConstruct()
  initialize(): void {
    const pluginHost = this.createPluginHost();

  }
  createPluginHost(): any {

  }

  createAPIFactory(): any {

  }
}
