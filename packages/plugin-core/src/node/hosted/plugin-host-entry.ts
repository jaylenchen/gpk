import "reflect-metadata";
import { Container } from "@gpk/core/common/instantiation";
import pluginHostModule from "@gpk/plugin-core/node/hosted/plugin-host-module"
import { PLUGIN_HOST_RPC } from "@gpk/plugin-core/node/hosted/plugin-host-rpc"

process.on('uncaughtException', (err: Error) => {
  console.error(err);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  unhandledPromises.push(promise);
  setTimeout(() => {
    const index = unhandledPromises.indexOf(promise);
    if (index >= 0) {
      promise.catch(err => {
        unhandledPromises.splice(index, 1);

        console.error(`Promise rejection not handled in one second: ${err} , reason: ${reason}`);
        if (err && err.stack) {
          console.error(`With stack trace: ${err.stack}`);
        }
      });
    }
  }, 1000);
});

process.exit = function (code?: number): void {
  const err = new Error('An plugin call process.exit() and it was prevented.');
  console.warn(err.stack);
} as (code?: number) => never;

let terminating = false;
const unhandledPromises: Promise<any>[] = [];

process.on('rejectionHandled', (promise: Promise<any>) => {
  const index = unhandledPromises.indexOf(promise);
  if (index >= 0) {
    unhandledPromises.splice(index, 1);
  }
});


const container = new Container();

container.load(pluginHostModule);

const pluginHostRPC = container.get(PLUGIN_HOST_RPC);
console.log("🚀 ~ pluginHostRPC:", pluginHostRPC)


process.on('message', async (message: string) => {
  if (terminating) {
    return;
  }
  try {
    const msg = JSON.parse(message);
    console.log("🚀 ~ process.on ~ msg:", msg)
    // if (ProcessTerminateMessage.is(msg)) {
    //   terminating = true;
    //   if (msg.stopTimeout) {
    //     await Promise.race([
    //       pluginHostRPC.terminate(),
    //       new Promise(resolve => setTimeout(resolve, msg.stopTimeout))
    //     ]);
    //   } else {
    //     await pluginHostRPC.terminate();
    //   }
    //   rpc.dispose();
    //   if (process.send) {
    //     process.send(JSON.stringify({ type: ProcessTerminatedMessage.TYPE }));
    //   }

    // }
  } catch (e) {
    console.error(e);
  }
});
