export class Deferred<T = void> {
  state: 'resolved' | 'rejected' | 'unresolved' = 'unresolved';
  resolve!: (value: T | PromiseLike<T>) => void;
  reject!: (err?: unknown) => void;

  promise = new Promise<T>((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  }).then(
    res => (this.setState('resolved'), res),
    err => (this.setState('rejected'), Promise.reject(err)),
  );

  protected setState(state: 'resolved' | 'rejected'): void {
    if (this.state === 'unresolved') {
      this.state = state;
    }
  }
}
