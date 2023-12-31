import { Task } from "./task";
import { CancelFn, RejectFn } from "./types";

export type Motif<T> = Generator<Action, T, T>;

type Action = Task<any>;

export function* callWithAbortFn<Args extends any[], T>(proc: (...args: Args) => [ Promise<T>, CancelFn ], ...args: Args): Motif<T> {
  const [promise, cancel] = proc(...args);
  return yield new Task<T>(promise, cancel);
}

export function* call<Args extends any[], T>(proc: (...args: Args) => Promise<T>, ...args: Args): Motif<T> {
  const promise = proc(...args);
  return yield new Task<T>(promise, noop);
}

export function* promised<T>(promise: Promise<T>): Motif<T> {
  return yield new Task(promise, noop);
}

const nativeFetch = (typeof window !== 'undefined' ? window : globalThis).fetch;

export class AbortError extends Error {}

export function fetch(input: RequestInfo | URL, init?: RequestInit): Motif<Response> {
  return callWithAbortFn(() => {
    const controller = new AbortController();
    return [
      nativeFetch(input, { ...init, signal: controller.signal }),
      () => { controller.abort(new AbortError) },
    ];
  });
}

export function sleep(ms: number): Motif<void> {
  return callWithAbortFn(
    () => {
      let timer: any;
      let rejectFn: RejectFn;
      return [
        new Promise((accept, reject) => {
          rejectFn = reject;
          timer = setTimeout(accept, ms);
        }),
        () => {
          clearTimeout(timer);
          rejectFn(new AbortError);
        },
      ];
    }
  );
}

const noop = () => {};

export function run<T, Args extends any[]>(proc: (...args: Args) => Motif<T>, ...args: Args): Task<T> {
  const iterator = proc(...args);
  let cancelled = false;
  let cancelFn: CancelFn = noop;
  const visit = (result: IteratorResult<Action>): any => {
    if (result.done) {
      return result.value;
    }
    const task = result.value;
    cancelFn = task.cancel.bind(task);
    return task.promise
      .then(toYield => {
        if (cancelled) {
          return;
        }
        return visit(iterator.next(toYield));
      });
  }
  const promise = visit(iterator.next());
  const cancel = () => { cancelled = true; cancelFn(); }
  return new Task(promise, cancel);
}

