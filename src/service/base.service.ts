import axios, { AxiosHeaders } from 'axios';
import https from 'https';
import { GitRepository } from '../repositories/git.repository';
import { GitRepositoryInterface } from '../interfaces/repository.interface';
import { RequestCache } from '../utils/request-cache.util';

export class BaseService {
    constructor(private config: GitRepository, private _cache: RequestCache) {}

    private httpsAgent = new https.Agent({
        rejectUnauthorized: false, // (NOTE: this will disable client verification)
      })

    public async get<T>(url: string, customBaseUrl = '') {
        const config = await this.gitConfig(); 
        return this.sendRequest<T>(`${customBaseUrl !== '' ? customBaseUrl : config.gitUrl}${url}`, 'GET');
    }

    private gitConfig(): Promise<GitRepositoryInterface> {
        return this.config.getConfig();
    }

    private sendRequest<T>(url: string, method: string): Promise<T> {
        return new Promise(async (resolve, reject) => {

            if (this._cache.hasCache((res: T) => {
                resolve(res);
            }, url, method)) return;

            const instance = await this.instance();
            let data: Array<T> = [];
            instance.request({
                method,
                url
            }).then(async (res) => {
                const headers = (res.headers as unknown as Map<string, string>);
                const totalPages = parseInt(headers.get('x-total-pages') as string);
                if (totalPages > 1) {
                    let page = parseInt(headers.get('x-page') as string);
                    for (let index = page; page <= totalPages; page++) {
                        const res = (await instance.request({
                            method,
                            url: `${url}${url.includes('?') ? '' : '?'}&per_page=100&page=${page}`
                        }));
                        data = data.concat(res.data as Array<T>);
                    }
                    this._cache.set(url, method, data);
                    return resolve(data as T);
                } else {
                    this._cache.set(url, method, res.data);
                    return resolve(res.data);
                }
            }).catch((reason) => {
                reject(reason)
            });
        })
    }

    private async instance() {
        const config = await this.gitConfig();
        return axios.create({
            httpsAgent: this.httpsAgent,
            headers: new AxiosHeaders({ 'PRIVATE-TOKEN': config.accessToken })
        })
    }
}