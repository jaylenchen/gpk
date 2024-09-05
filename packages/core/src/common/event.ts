import { LinkedList } from '@gpk/core/common/linked-list';
import { DisposableStore } from '@gpk/core/common/lifecycle';
import type { IDisposable } from '@gpk/core/common/lifecycle';

/**
 *  [(e: T) => any, any] 就是 [listener, thisArgs]
 * 所以下面的类型定义就是说有this指向，那么就是listener+thisArgs数组，否则就是listener

 */
export type ListenerWithThis<T> = [listener: (e: T) => any, thisArgs: any];

/**
 * 一个Event代表一个事件，它是一个函数，接受三个参数，返回一个IDisposable对象
 */
export type Event<T> = (listener: (e: T) => any, thisArgs?: any, disposables?: any) => IDisposable;

export class Emitter<T> {
  private static _noop = () => { };

  private _disposed: boolean;

  private _event: Event<T>;
  protected _listeners?: LinkedList<ListenerWithThis<T>>;
  private _deliveryQueue?: LinkedList<[ListenerWithThis<T>, T]>;

  /**
   * 一个emitter都有一个配套的this._event（它是一个getter函数），外部可以通过调用这个event getter并传递处理函数的方式来监听这个this._event。
   * 而event getter的实现逻辑十分简单，就是如果初始化过了，直接返回this._event，否则创建this._event
   *
   * 至于this._event，在外部被调用后的执行逻辑是：
   * 1. 每调用一次该event，将监听器listener保存起来，以便在事件触发时调。
   * 2. 每调用一次该event，产生并返回一个IDisposable对象，以便将来可以通过调用dispose方法来取消监听，
   *    而dispose的实现主逻辑就是将当次监听的listener移除。
   *    比如 const result = onDidChange(fn1)，调用result.dispose()就可以取消fn1的监听。
   */
  get event(): Event<T> {
    this._event ??= (
      listener: (e: T) => any,
      thisArgs?: any,
      disposables?: any,
    ) => {
      // 当在外界订阅了当前的event之后，将listener保存到this._listeners中
      this._listeners ??= new LinkedList();

      const removeListener = this._listeners.push(
        !thisArgs ? [listener, undefined] : [listener, thisArgs],
      );

      let result: IDisposable;

      // eslint-disable-next-line prefer-const
      result = {
        dispose: () => {
          // 调用一次dispose之后，再次重复调用都不会有任何效果了
          result.dispose = Emitter._noop;

          // 如果当前的Emitter没被销毁
          if (!this._disposed) {
            // 将外部监听当前事件的listener从this._listeners中移除
            removeListener();
          }
        },
      };

      if (disposables instanceof DisposableStore) {
        disposables.add(result);
      }
      else if (Array.isArray(disposables)) {
        disposables.push(result);
      }

      return result;
    };

    return this._event;
  }

  fire(event: T): void {
    if (this._listeners) {
      this._deliveryQueue ??= new LinkedList();

      for (const listener of this._listeners) {
        this._deliveryQueue.push([listener, event]);
      }

      while (this._deliveryQueue.size > 0) {
        const [[listener, thisArgs], event]
          = this._deliveryQueue.shift()!;
        try {
          listener.call(thisArgs, event);
        }
        catch (e) {
          console.error('fire error: ', (e as Error).stack);
        }
      }
    }
  }

  // 调用了dispose，表明销毁当前的emitter
  // 销毁当前的emitter的内部逻辑的主要一个内容就是将所有的event listener全部清空
  dispose(): void {
    if (!this._disposed) {
      // 备注当前的emitter被销毁了
      this._disposed = true;

      this._listeners?.clear();
      this._deliveryQueue?.clear();
    }
  }
}
