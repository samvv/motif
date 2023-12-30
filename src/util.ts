
export function assertNever(value: never): never {
  throw new Error(`Code that should have been unreachable was executed`);
}

