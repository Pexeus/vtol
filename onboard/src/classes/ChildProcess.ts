import { spawn, ChildProcessByStdio } from "node:child_process";
import { Readable } from "node:stream";

export interface ChildProcessHandlerOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  log?: boolean;
  shell?: boolean;
}

export class ChildProcess {
  private command: string;
  private args: string[];
  private options: ChildProcessHandlerOptions;
  private proc?: ChildProcessByStdio<null, Readable, Readable>;

  constructor(command: string, args: string[] = [], options: ChildProcessHandlerOptions = {}) {
    this.command = command;
    this.args = args;
    this.options = { log: false, ...options };
  }

  run(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.proc = spawn(this.command, this.args, {
        cwd: this.options.cwd,
        env: this.options.env,
        shell: this.options.shell ?? false,
        stdio: ["ignore", "pipe", "pipe"]
      });

      this.proc.stdout.on("data", (d: Buffer) => {
        if (this.options.log) process.stdout.write(d);
      });

      this.proc.stderr.on("data", (d: Buffer) => {
        if (this.options.log) process.stderr.write(d);
      });

      this.proc.on("error", reject);
      this.proc.on("close", (code) => resolve(code ?? 0));
    });
  }

  kill(signal: NodeJS.Signals = "SIGTERM") {
    this.proc?.kill(signal);
  }

  get pid() {
    return this.proc?.pid;
  }
}