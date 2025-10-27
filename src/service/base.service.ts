import axios, { AxiosHeaders, AxiosResponse } from 'axios';
import https from 'https';
import { GitRepository } from '../repositories/git.repository';
import { GitRepositoryInterface } from '../interfaces/repository.interface';
import { RequestCache } from '../utils/request-cache.util';

export class BaseService {
    constructor(private config: GitRepository, private _cache: RequestCache) {}

    private httpsAgent = new https.Agent({
        rejectUnauthorized: false, // (NOTE: this will disable client verification)
      })

    public async get<T>(url: string, customBaseUrl = ''): Promise<T> {
        const config = await this.gitConfig(); 
        const baseUrl = customBaseUrl !== '' ? customBaseUrl : config.gitUrl;
        return this.sendRequest<T>(`${baseUrl}${url}`, 'GET');
    }

    private gitConfig(): Promise<GitRepositoryInterface> {
        return this.config.getConfig();
    }

    private async sendRequest<T>(url: string, method: string): Promise<T> {
        const cached = this._cache.get<T>(url, method);
        if (cached) return cached;

        const instance = await this.instance();
        let nextUrl: string | null = url;
        let aggregated: any[] | null = null;
        let lastResponse: AxiosResponse<T> | null = null;

        while (nextUrl) {
            const response = await instance.request<T>({
                method,
                url: nextUrl,
            });
            lastResponse = response;

            const responseData = response.data as unknown;
            if (Array.isArray(responseData)) {
                if (!aggregated) {
                    aggregated = [];
                }
                aggregated.push(...responseData);
                const nextLink = this.extractNextLink(
                    (response.headers?.link as string) ||
                        (response.headers?.Link as unknown as string)
                );
                nextUrl = nextLink;
                continue;
            }

            nextUrl = null;
        }

        if (!lastResponse) {
            throw new Error('Request failed without response');
        }

        const finalData = (aggregated ?? lastResponse.data) as T;
        this._cache.set(url, method, finalData);
        return finalData;
    }

    private extractNextLink(linkHeader?: string | null): string | null {
        if (!linkHeader) return null;
        const parts = linkHeader.split(',');
        for (const part of parts) {
            const section = part.trim();
            const match = section.match(/<([^>]+)>;\s*rel="([^"]+)"/);
            if (match && match[2] === 'next') {
                return match[1];
            }
        }
        return null;
    }

    private async instance() {
        const config = await this.gitConfig();
        return axios.create({
            httpsAgent: this.httpsAgent,
            headers: new AxiosHeaders({
                Authorization: `Bearer ${config.accessToken}`,
            }),
        });
    }
}
