
import test from "ava"
import { Motif, sleep, fetch, run, AbortError } from ".";

test("can evaluate a delay effect", async (t) => {
  function* foo() {
    yield* sleep(1000);
  }
  const task = run(foo());
  t.pass();
  return task.promise;
});

test("can cancel a delay effect", async (t) => {
  function* foo() {
    yield* sleep(1000);
    t.fail();
  }
  const task = run(foo());
  t.plan(2);
  const promise = task.promise.catch(error => {
    console.log('error');
    t.assert(error instanceof AbortError);
  })
  task.cancel();
  await promise;
  t.pass();
});

test("can fetch from a web resource", t => {
  function* foo(): Motif<any> {
    const response = yield* fetch('https://google.com');
    t.assert(response!.status === 200);
  }
  return run(foo()).promise;
});

test("can cancel fetching from a web resource", async (t) => {
  function* foo(): Motif<any> {
    const response = yield* fetch('https://google.com');
    t.fail();
  }
  const task = run(foo());
  t.plan(2);
  // task.promise.catch(error => {
  // })
  try {
    task.cancel();
    await task.promise;
  } catch (error) {
    t.assert(error instanceof AbortError);
  }
  t.pass();
});

