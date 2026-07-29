/*<$
For the graph programming framework Stratimux and File System Concept, generate a quality that will add all Directories and Files from that target location to ActionStrategy data.
$>*/
/*<#*/
import {
  muxiumConclude,
  createAsyncMethod,
  createQualityCardWithPayload,
  nullReducer,
  strategyData_appendFailure,
  strategyData_muxifyData,
  strategyFailed,
  strategySuccess,
} from 'stratimux';
import fs from 'fs/promises';
import { Dirent } from 'fs';
import path from 'path';
import { FileDirent } from '../fileSystem.model';
import { FileSystemState } from '../fileSystem.concept';
import type { ReadDirectoryPayload } from './types';

async function walk(target: string): Promise<({ path: string } & Dirent)[]> {
  const entries = await fs.readdir(target, {
    withFileTypes: true,
  });
  let ret: ({ path: string } & Dirent)[] = [];
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== '.git') {
      ret = [...ret, ...(await walk(path.join((entry as { path: string } & Dirent).path) + '/' + entry.name))];
    } else {
      ret = [...ret, entry as { path: string } & Dirent];
    }
  }
  return ret;
}

export type ReadDirectoryField = {
  filesAndDirectories: FileDirent[];
};

export const fileSystemReadDirectory = createQualityCardWithPayload<FileSystemState, ReadDirectoryPayload>({
  type: 'File System Read Directory',
  reducer: nullReducer,
  methodCreator: () =>
    createAsyncMethod(({ controller, action }) => {
      const { path } = action.payload;
      if (action.strategy) {
        const strategy = action.strategy;
        walk(path)
          .then((data) => {
            controller.fire(
              strategySuccess(
                strategy,
                strategyData_muxifyData(strategy, {
                  filesAndDirectories: data,
                })
              )
            );
          })
          .catch((error) => {
            console.error('CHECK ERROR', error, action);
            controller.fire(strategyFailed(strategy, strategyData_appendFailure(strategy, error)));
          });
      } else {
        controller.fire(muxiumConclude());
      }
    }),
});
/*#>*/
