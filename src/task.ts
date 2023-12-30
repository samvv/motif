import { CancelFn } from "./types";

export const enum TaskState {
  Loading,
  Cancelled,
  Done,
  Error,
}

export class Task<T = any> {

  public done: boolean = false;

  public value?: T;
  public error?: Error;

  public constructor(
    public promise: Promise<T>,
    public cancel: CancelFn,
  ) {
    promise
      .then(value => { this.done = true; this.value = value })
      .catch(error => { this.done = true; this.error = error; });
  }

}

