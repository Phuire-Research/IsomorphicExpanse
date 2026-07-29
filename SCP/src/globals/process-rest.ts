declare global {
  namespace NodeJS {
    interface Process {
      rest(): void;
    }
  }
}

// M2-Final R7 fix: process.kill signature requires pid as first arg
process.rest = () => process.kill(process.pid, 'SIGINT');

export {};
