# Motif

Motif is a library for defining tasks that should be cancellable at any point
in time. Think async/await, but with an additional `.cancel()` method on the
promise object.

```ts
import { run, fetch, sleep } from "@accelera/motif"

function* fetchLength(url: string) {

    // Wait for 1s before continuing
    yield* sleep(1000);

    // Start fetching a webpage and maybe cancel it
    const reponse = yield* fetch(url);

    if (response.status !== 200) {
        // Throwing exceptions will just cancel the task
        throw new Error(`Wrong status code`);
    }

    // Suspend computation until the promise resolves
    // Kind of like `await`
    const text = yield* promised(response.text());

    // Just for the sake of the example
    return text.length;
}

const task = run(fetchLength, 'https://google.com');

// Cancel the task if it hasn't already been
task.cancel();
```

## Quick Start

First, install the package:

```bash
npm i @accelera/motif
```

Then, decide what you're going to compute asynchronously that has to be
cancellable. If it's just one, add them to a call of `run()`. If it's multiple
items, put them in a generator and replace native function calls to the ones in
this library.

```ts
import { run, fetch } from "@accelera/motif"

run(fetch, url)
```

## License

This project is generously licensed under the MIT license.

