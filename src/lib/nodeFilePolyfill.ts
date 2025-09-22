// src/lib/nodeFilePolyfill.ts
// Ensures `globalThis.File` exists in Node runtimes that lack it.
export function installNodeFilePolyfill() {
  if (typeof (globalThis as any).File !== "undefined") return;

  try {
    // Node 18/20 may expose File via node:buffer
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { File } = require("node:buffer");
    (globalThis as any).File = File;
    return;
  } catch {
    // Minimal fallback
    class NodeFile extends Blob {
      name: string;
      lastModified: number;
      constructor(bits: BlobPart[], name: string, options: FilePropertyBag = {}) {
        super(bits, options);
        this.name = name;
        this.lastModified = options.lastModified ?? Date.now();
      }
    }
    (globalThis as any).File = NodeFile;
  }
}
