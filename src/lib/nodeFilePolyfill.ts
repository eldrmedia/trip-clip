// src/lib/nodeFilePolyfill.ts

/**
 * Installs a minimal `File` constructor on Node runtimes that don't provide one.
 * This is enough for basic usages (name + lastModified + Blob methods).
 */
type GlobalWithFile = typeof globalThis & { File?: typeof File };

export function installNodeFilePolyfill(): void {
  const g = globalThis as GlobalWithFile;
  if (typeof g.File !== "undefined") return;

  class NodeFile extends Blob {
    name: string;
    lastModified: number;

    constructor(bits: BlobPart[], name: string, options: FilePropertyBag = {}) {
      super(bits, options);
      this.name = name;
      this.lastModified = options.lastModified ?? Date.now();
    }
  }

  // Cast to the DOM `File` constructor type for consumer compatibility
  g.File = NodeFile as unknown as typeof File;
}
