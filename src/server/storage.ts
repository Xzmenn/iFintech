import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export interface StorageDriver {
  save(file: Buffer, fileName: string): Promise<string>;
  read(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}

class LocalStorageDriver implements StorageDriver {
  private readonly directory = path.resolve(process.env.STORAGE_DIR || "./storage");

  async save(file: Buffer, fileName: string) {
    await mkdir(this.directory, { recursive: true });
    const extension = path.extname(fileName).slice(0, 12);
    const key = `${randomUUID()}${extension}`;
    await writeFile(path.join(this.directory, key), file, { flag: "wx" });
    return key;
  }

  async read(key: string) {
    return readFile(this.resolveKey(key));
  }

  async remove(key: string) {
    await rm(this.resolveKey(key), { force: true });
  }

  private resolveKey(key: string) {
    if (path.basename(key) !== key || key.includes("..")) {
      throw new Error("Kunci penyimpanan tidak valid");
    }
    return path.join(this.directory, key);
  }
}

export const storage: StorageDriver = new LocalStorageDriver();
