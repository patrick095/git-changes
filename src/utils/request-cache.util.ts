import { writeFile } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";

export class RequestCache {
    private _cache = new Map<string, Record<string, unknown>>();
    private _dir = join(__dirname + "../../../tmp/cache.tmp");
    private _expires = 24 * 60 * 60 * 1000; // 1 dia

    constructor() {
        readFile(this._dir, { encoding: "utf-8" })
            .then((savedCache) => {
                if (savedCache) {
                    this._cache = new Map(JSON.parse(savedCache));
                }
            })
            .catch(() => writeFile(this._dir, "", (err) => console.error(err)));
    }

    public set(url: string, method: string, response: unknown) {
        this._cache.set(url, { [method]: response, criated_at: Date.now() });
        this.setOnFile();
    }

    public hasCache<T>(
        execute: (res: T) => void,
        url: string,
        method: string
    ): boolean {
        const cached = this.get<T>(url, method);
        if (!cached) return false;

        execute(cached);
        return true;
    }

    public get<T>(url: string, method: string): T | null {
        const cachedUrl = this._cache.get(url);
        if (!cachedUrl || (cachedUrl.criated_at as number) + this._expires < Date.now() ) return null;
        const cachedMethod = cachedUrl[method];
        return (cachedMethod as T) ?? null;
    }

    private setOnFile() {
        writeFile(
            this._dir,
            JSON.stringify(this._cache, (key, value) =>
                value instanceof Map ? [...value] : value
            ),
            (err) => {
                if (err) {
                    console.error('[ERROR] setOnFile', err)
                }
            }
        );
    }
}
