import { Task } from "./task";
import { CancelFn, RejectFn } from "./types";
import { assertNever } from "./util";

export type Motif<T> = Generator<Effect, T, T>;

interface EffectBase {
  type: string;
}

interface PromiseEffect extends EffectBase {
  type: 'promise';
  run: () => [ Promise<any>, CancelFn ],
}

export type Effect
  = PromiseEffect

export function* callWithAbortFn<Args extends any[], T>(proc: (...args: Args) => [ Promise<T>, CancelFn ], ...args: Args): Motif<T> {
  return yield {
    type: 'promise',
    run: () => proc(...args),
  };
}

export function* call<Args extends any[], T>(proc: (...args: Args) => Promise<T>, ...args: Args): Motif<T> {
  return yield {
    type: 'promise',
    run: () => [ proc(...args), () => {} ],
  };
}

const nativeFetch = (typeof window !== 'undefined' ? window : globalThis).fetch;

export class AbortError extends Error {}

export function fetch(input: RequestInfo | URL, init?: RequestInit): Motif<Response | void> {
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

export function run<T>(generator: Motif<T>): Task<T> {
  let cancelled = false;
  let cancelFn: CancelFn = noop;
  const visit = (result: IteratorResult<any>): any => {
    if (result.done) {
      return result.value;
    }
    const task = runEffect(result.value);
    cancelFn = task.cancel.bind(task);
    return task.promise
      .then(toYield => {
        if (cancelled) {
          return;
        }
        return visit(generator.next(toYield));
      });
  }
  const promise = visit(generator.next());
  const cancel = () => { cancelled = true; cancelFn(); }
  return new Task(promise, cancel);
}

export function runEffect(effect: Effect): Task {

  switch (effect.type) {

    case 'promise':
      const [promise, cancel] = effect.run();
      return new Task(promise, cancel);

    default:
      assertNever(effect.type);

  }

}

