import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export interface StorageDriver {
  save(file: Buffer, fileName: string, key?: string): Promise<string>;
  read(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}

class LocalStorageDriver implements StorageDriver {
  private readonly directory = path.resolve(process.env.STORAGE_DIR || "./storage");

  async save(file: Buffer, fileName: string, key?: string) {
    const extension = path.extname(fileName).slice(0, 12);
    const storageKey = key || `${randomUUID()}${extension}`;
    const fullPath = this.resolveKey(storageKey);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file, { flag: "wx" });
    return storageKey;
  }

  async read(key: string) {
    return readFile(this.resolveKey(key));
  }

  async remove(key: string) {
    await rm(this.resolveKey(key), { force: true });
  }

  private resolveKey(key: string) {
    const segments = key.split("/");
    if (!key || key.includes("\\") || segments.some((segment) => !segment || segment === "." || segment === "..")) {
      throw new Error("Kunci penyimpanan tidak valid");
    }
    const resolved = path.resolve(this.directory, key);
    if (!resolved.startsWith(`${this.directory}${path.sep}`)) throw new Error("Kunci penyimpanan tidak valid");
    return resolved;
  }
}

export const storage: StorageDriver = new LocalStorageDriver();
