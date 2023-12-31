
import test from "ava"
import { Motif, sleep, fetch, run, AbortError, promised } from ".";

test("can evaluate a delay effect", async (t) => {
  function* foo() {
    yield* sleep(1000);
  }
  const task = run(foo);
  t.pass();
  return task.promise;
});

test("can cancel a delay effect", async (t) => {
  function* foo() {
    yield* sleep(1000);
    t.fail();
  }
  const task = run(foo);
  t.plan(3);
  const promise = task.promise.catch(error => {
    console.log('error');
    t.assert(error instanceof AbortError);
  })
  task.cancel();
  const val = await promise;
  t.assert(val === undefined);
  t.pass();
});

test("can fetch from a web resource", t => {
  function* foo(): Motif<any> {
    const response = yield* fetch('https://google.com');
    t.assert(response!.status === 200);
  }
  return run(foo).promise;
});

test("can cancel fetching from a web resource", async (t) => {
  function* foo(): Motif<any> {
    const response = yield* fetch('https://google.com');
    t.fail();
  }
  const task = run(foo);
  try {
    task.cancel();
    await task.promise;
  } catch (error) {
    t.assert(error instanceof AbortError);
    t.pass();
    return;
  }
  t.fail();
});

test('can run the sleep effect directly', async (t) => {
  const task = run(sleep, 100);
  t.assert(await task.promise === undefined);
  t.pass()
});

test("the example in the README works", async (t) => {
  function* fetchLength(url: string) {
    yield* sleep(1000);
    const response = yield* fetch(url);
    if (response.status !== 200) {
      throw new Error(`Wrong status code`);
    }
    const text = yield* promised(response.text());
    return text.length;
  }
  const task = run(fetchLength, 'https://google.com');
  const len = await task.promise;
  t.assert(typeof(len) === 'number');
  task.cancel();
  t.pass();
});

