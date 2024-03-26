import { readFile, writeFile } from "fs";
import { GitRepositoryInterface } from "../interfaces/repository.interface";
import { join } from "path";
import { CommitsInterface } from "../interfaces/commits.interface";

export class GitRepository {
    private _config!: GitRepositoryInterface;

    constructor() {
        readFile(join(__dirname + '/git.json'), 'utf-8', (err, data) => {
            if (err) {
                return console.error('[ERROR] - coldn\'t read git.json');
            }
            this._config = data ? JSON.parse(data) as GitRepositoryInterface : { accessToken: '', gitUrl: '' };
        });
    }

    public getConfig(): GitRepositoryInterface {
        return this._config;
    }

    public setConfig({ accessToken, gitUrl }: GitRepositoryInterface): void {
        if (typeof accessToken === "string" && typeof gitUrl === "string") {
            this._config = { accessToken, gitUrl };

            writeFile(join(__dirname + '/git.json'), JSON.stringify(this._config, null, 4), (err) => {
                if (err) {
                    console.error('[ERROR] - Failed to save git.json');
                }
            })
        }
    }

    public getFilesByCommits() {
        return new Promise((resolve, reject) => {
            readFile(join(__dirname + '/git-data-commits.json'), 'utf-8', (err, data) =>{
                if (err) return reject('[ERROR] - Failed to read git-data-commits.json');
                resolve(JSON.parse(data))
            }); 
        });
    }

    public getFilesByProjects() {
        return new Promise((resolve, reject) => {
            readFile(join(__dirname + '/git-data-projects.json'), 'utf-8', (err, data) =>{
                if (err) return reject('[ERROR] - Failed to read git-data-commits.json');
                resolve(JSON.parse(data))
            }); 
        });
    }

    public getFilesByCategories() {
        return new Promise((resolve, reject) => {
            readFile(join(__dirname + '/git-all-category.json'), 'utf-8', (err, data) =>{
                if (err) return reject('[ERROR] - Failed to read git-data-commits.json');
                resolve(JSON.parse(data))
            }); 
        });
    }

    public getCommitsNumber() {
        return new Promise((resolve, reject) => {
            readFile(join(__dirname + '/git-all-commits.json'), 'utf-8', (err, data) =>{
                if (err) return reject('[ERROR] - Failed to read git-data-commits.json');
                resolve((JSON.parse(data) as Array<CommitsInterface>).length)
            }); 
        });
    }
}