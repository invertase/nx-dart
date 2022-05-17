import { GeneratorCallback } from '@nrwl/devkit';

export function runAllTasks(
  tasks: (GeneratorCallback | undefined)[]
): GeneratorCallback | undefined {
  const runnableTasks = tasks.filter((task) => task !== undefined);
  if (runnableTasks.length === 0) {
    return undefined;
  }
  return () => {
    for (const task of runnableTasks) {
      task();
    }
  };
}
