import axios, { AxiosHeaders } from 'axios';
import https from 'https';
import { GitRepository } from '../repositories/git.repository';
import { GitRepositoryInterface } from '../interfaces/repository.interface';

export class BaseService {
    constructor() {}
    private httpsAgent = new https.Agent({
        rejectUnauthorized: false, // (NOTE: this will disable client verification)
      })

    public get<T>(url: string) {
        return this.sendRequest<T>(`${this.gitConfig.gitUrl}${url}`, 'GET');
    }

    private get gitConfig(): GitRepositoryInterface {
        const config = new GitRepository().getConfig();
        return config;
    }

    private sendRequest<T>(url: string, method: string): Promise<T> {
        return new Promise((resolve, reject) => {
            let data: Array<T> = [];
            this.instance.request({
                method,
                url
            }).then(async (res) => {
                const headers = (res.headers as unknown as Map<string, string>);
                const totalPages = parseInt(headers.get('x-total-pages') as string);
                if (totalPages > 1) {
                    let page = parseInt(headers.get('x-page') as string);
                    for (let index = page; page <= totalPages; page++) {
                        const res = (await this.instance.request({
                            method,
                            url: `${url}${url.includes('?') ? '' : '?'}&per_page=100&page=${page}`
                        }));
                        data = data.concat(res.data as Array<T>);
                    }
                    return resolve(data as T);
                } else {
                    return resolve(res.data);
                }
            }).catch((reason) => {
                console.log(reason);
                reject(reason)
            });
        })
    }

    private get instance() {
        return axios.create({
            httpsAgent: this.httpsAgent,
            headers: new AxiosHeaders({ 'PRIVATE-TOKEN': this.gitConfig.accessToken })
        })
    }
}