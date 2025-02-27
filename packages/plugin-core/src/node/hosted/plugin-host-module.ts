import { defineContainerModule, ServiceImplementationType } from '@gpk/core/lib/common/instantiation';
import { PLUGIN_HOST_RPC, PluginHostRpc } from "@gpk/plugin-core/node/hosted/plugin-host-rpc"

export default defineContainerModule([
  {
    type: ServiceImplementationType.Class,
    id: PLUGIN_HOST_RPC,
    implementation: PluginHostRpc
  }
])
 