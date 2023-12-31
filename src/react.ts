
import { useEffect, useMemo, useState } from "react";
import { Task, TaskState } from "./task";
import { Motif } from ".";

export function useMotif<T>(proc: () => Motif<T>): [TaskState, T | undefined] {

  const iter = useMemo(() => proc(), []);

  const [status, setStatus] = useState(TaskState.Loading);
  const [result, setResult] = useState<T | undefined>(undefined);

  useEffect(() => {
    let curr: Task | undefined;
    let input: any;
    (async () => {
      for (;;) {
        const { done, value } = iter.next(input);
        if (done) {
          setStatus(TaskState.Done);
          setResult(value);
          return;
        }
        curr = value;
        input = await curr.promise;
      }
    })();
    return () => {
      if (curr) {
        curr.cancel();
        setStatus(TaskState.Cancelled);
        curr = undefined;
      }
    }
  }, [ iter ]);

  return [status, result];
}

