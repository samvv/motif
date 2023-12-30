
import test from "ava"
import { Motif, delay, runEffect, fetch, run } from ".";

test("can cancel a Promise-based effect", t => {
  return new Promise(accept => {
    function* foo() {
      yield* delay(5000);
      t.fail();
    }
    const iter = foo();
    const task = runEffect(iter.next().value!)
    task.cancel();
    t.pass();
    accept();
  });
});

test("can evaluate a Promise-based effect", async (t) => {
  function* foo() {
    yield* delay(5000);
  }
  const iter = foo();
  const task = runEffect(iter.next().value!)
  t.pass();
});

test("can fetch from a web resource", t => {
  function* foo(): Motif<any> {
    const response = yield* fetch('https://google.com');
    t.assert(response!.status === 200);
  }
  return run(foo()).promise;
});

test("can cancel fetching from a web resource", t => {
  function* foo(): Motif<any> {
    const response = yield* fetch('https://google.com');
    t.fail();
  }
  const task = run(foo());
  task.cancel();
  t.assert(task.value === undefined);
  t.pass();
});

