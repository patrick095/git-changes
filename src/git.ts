import { writeFile } from "fs";
import { join } from "path";
import dotenv from "dotenv";
dotenv.config();

import {
    FileForPlataformaInterface,
    FileGitlabInterface,
    GitInfoInterface,
} from "./interfaces/file.interface";
import { BaseService } from "./service/base.service";
import { CommitsInterface } from "./interfaces/commits.interface";
import { PlataformaService } from "./service/plataforma.service";
import { GitRepository } from "./repositories/git.repository";
import { RequestCache } from "./utils/request-cache.util";

export class Git {
    constructor(
        private service: BaseService,
        private plataformaService: PlataformaService
    ) {
        this.saveFile([], 'git-data-commits.json');
        this.saveFile([], 'git-all-commits.json');
        this.saveFile([], 'git-all-category.json');
        this.saveFile([], 'git-data-projects.json');
    }

    public async getAllData() {
        return new Promise(async (resolve, reject) => {
            console.info('[INFO]: iniciando Bot para pegar suas alterações do mês no Git');
            const user = await this.getUser()
                .catch((err) => {
                    console.error("[ERROR] - Failed to connect to Git!");
                    console.error(err)
                    reject();
                    return {
                        id: 0
                    }
                });
            const userId = user.id;
    
            const commits = await this.getUserCommitsIds(userId)
                .catch((err) => {
                    console.error("[ERROR] - Failed to connect to Git!");
                    reject();
                    return [];
                });
            console.info(
                `[INFO]: O usuário realizou ${
                    commits?.length ?? 0
                } Commits esse mês.\nBuscando histórico de arquivos.`
            );
            const files = await this.getFilesInfo(commits)
                .catch((err) => {
                    console.error("[ERROR] - Failed to connect to Git!");
                    reject();
                    return [];
                });
            const formatedFiles =
                this.plataformaService.splitFilesByTypeForSendToPlataform(files);
            const finalFormatedFiles =
                this.plataformaService.splitFilesForUploadInfo(formatedFiles);
    
            this.saveFile(finalFormatedFiles, 'git-data-commits.json');
            this.saveFile(commits, 'git-all-commits.json');
            this.saveFile(this.plataformaService.splitFilesByCategory(formatedFiles), 'git-all-category.json');
            this.saveFile(this.plataformaService.listFilesByProjectByCategories(finalFormatedFiles), 'git-data-projects.json');
            resolve(true);
        });
    }

    private saveFile(finalFormatedFiles: Array<any>, filename: string): void {
        const path = join(
            __dirname,
            '/repositories',
            `${filename}`
        );
        writeFile(
            path,
            JSON.stringify(finalFormatedFiles, null, 4),
            (err) => {
                if (err) return console.log(err);
                console.info(`[INFO]: Arquivo salvo com sucesso em: ${filename}`);
            }
        );
    }

    private async getFilesInfo(
        commits: Array<CommitsInterface>
    ): Promise<Array<FileForPlataformaInterface>> {
        if (commits && commits.length) {
            let files: Array<FileForPlataformaInterface> = [];
            for (let index = 0; index < commits.length; index++) {
                if (commits[index]?.project_id && commits[index]?.sha) {
                    console.info(
                        `[INFO]: Verificando commit ${index + 1} de ${
                            commits.length
                        }`
                    );
                    const projectName = await this.getProjectName(
                        commits[index].project_id
                    );
                    const commitInfo = await this.getCommitInfo(
                        commits[index].project_id,
                        commits[index].sha
                    );

                    if (commitInfo.parent_ids.length > 1) {
                        continue;
                    }

                    await this.getCommitDiff(
                        commits[index].project_id,
                        commits[index].sha
                    )
                        .then((diffs) => {
                            diffs.forEach((file) => {
                                files.push({
                                    extension: file.new_path.includes("Test") || file.new_path.includes("spec")
                                        ? "spec"
                                        : file.new_path.split(".").length > 0
                                        ? file.new_path.split(".").pop() as string
                                        : file.new_path,
                                    file: `${file.new_path}`,
                                    commit: commits[index],
                                    new_file: file.new_file,
                                    deleted_file: file.deleted_file,
                                    project: projectName,
                                });
                            });
                        })
                        .catch((reason) => console.error('[ERROR]: getCommitDiff', reason));
                } else {
                    console.log("commit incompleto", commits[index]);
                }
            }
            return files;
        }
        return [];
    }

    private getUser() {
        return this.service.get<{ id: number; commit_email: string; name: string; username: string }>(`/user`);
    }

    private getCommitDiff(project_id: number, sha: string) {
        return this.service.get<Array<FileGitlabInterface>>(
            `/projects/${project_id}/repository/commits/${sha}/diff`
        );
    }

    private getCommitInfo(project_id: number, sha: string) {
        return this.service.get<GitInfoInterface>(
            `/projects/${project_id}/repository/commits/${sha}`
        );
    }

    private getProjectName(project_id: number): Promise<string> {
        return this.service
            .get<any>(`/projects/${project_id}`)
            .then((res) => res.name as string);
    }

    private getUserCommitsIds(id: number): Promise<Array<CommitsInterface>> {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const startMonth = new Date(year, month, 1).toLocaleDateString();
        console.info('[INFO]: Consultando commits a partir de '+ startMonth);
        return this.service
            .get<Array<any>>(
                `/users/${id}/events?action=pushed&after=${startMonth}`
            )
            .then((res) => {
                const commits: Array<CommitsInterface> = []
                res.forEach((commit) => {
                    // @TODO para pegar somente commit para master colocar no if abaixo '&& commit?.push_data?.ref === 'master''
                    if (commit?.project_id && commit?.push_data?.commit_to) {
                        commits.push({
                            id: commit?.id,
                            project_id: commit?.project_id,
                            branch: commit?.push_data?.ref,
                            title: commit?.push_data?.commit_title,
                            sha: commit?.push_data?.commit_to,
                            created_at: commit?.created_at,
                        });
                    }
                });
                return commits;
            });
    }
}


