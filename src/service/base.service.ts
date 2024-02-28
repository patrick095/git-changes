import axios, { AxiosHeaders } from 'axios';
import https from 'https';
import dotenv from "dotenv";

export class BaseService {
    constructor() {
        dotenv.config();
    }
    private gitUrl = process.env.GIT_API_URL as string;
    private AccessToken = process.env.ACCESS_TOKEN as string;
    private httpsAgent = new https.Agent({
        rejectUnauthorized: false, // (NOTE: this will disable client verification)
      })

    public get<T>(url: string) {
        return this.sendRequest<T>(`${this.gitUrl}${url}`, 'GET');
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
            }).catch((reason) => reject(reason));
        })
    }

    private get instance() {
        return axios.create({
            httpsAgent: this.httpsAgent,
            headers: new AxiosHeaders({ 'PRIVATE-TOKEN': this.AccessToken,
        }) })
    }
}