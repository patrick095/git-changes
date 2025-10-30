import { writeFile } from "fs";
import { join } from "path";
import dotenv from "dotenv";
dotenv.config();

import {
    FileForPlataformaInterface,
    GithubCommitDetailInterface,
    GithubCommitFileInterface,
} from "./interfaces/file.interface";
import { BaseService } from "./service/base.service";
import { CommitsInterface } from "./interfaces/commits.interface";
import { PlataformaService } from "./service/plataforma.service";
import { GitRepository } from "./repositories/git.repository";

interface GithubRepositoryInterface {
    name: string;
    full_name: string;
    default_branch: string;
}

interface GithubCommitSummaryInterface {
    sha: string;
    commit: {
        message: string;
        author?: {
            date: string;
        } | null;
        committer?: {
            date: string;
        } | null;
    };
    html_url: string;
}

export class Git {
    private repository = new GitRepository();

    constructor(
        private service: BaseService,
        private plataformaService: PlataformaService
    ) {
        this.saveFile({}, 'git.json'); 
        this.saveFile([], 'tasks-data.json');
        this.saveFile([], 'git-data-commits.json');
        this.saveFile([], 'git-all-commits.json');
        this.saveFile([], 'git-all-category.json');
        this.saveFile([], 'git-data-projects.json');
    }

    public async getAllData() {
        console.info('[INFO]: iniciando Bot para pegar suas alterações do mês no GitHub');
        try {
            const user = await this.getUser();
            console.log(user);
            const username = user?.login ?? user?.name ?? user?.username;
            if (!username) {
                throw new Error('Não foi possível identificar o usuário no GitHub.');
            }

            const commits = await this.getUserCommits(username);
            console.info(
                `[INFO]: O usuário realizou ${commits?.length ?? 0} commits nesse período.\nBuscando histórico de arquivos.`
            );

            const files = await this.getFilesInfo(commits);
            const formatedFiles =
                this.plataformaService.splitFilesByTypeForSendToPlataform(files);
            const finalFormatedFiles =
                this.plataformaService.splitFilesForUploadInfo(formatedFiles);

            this.saveFile(finalFormatedFiles, 'git-data-commits.json');
            this.saveFile(commits, 'git-all-commits.json');
            this.saveFile(
                this.plataformaService.splitFilesByCategory(formatedFiles),
                'git-all-category.json'
            );
            this.saveFile(
                this.plataformaService.listFilesByProjectByCategories(finalFormatedFiles),
                'git-data-projects.json'
            );
            return true;
        } catch (error) {
            console.error("[ERROR] - Failed to connect to Git!", error);
            throw error;
        }
    }

    private saveFile(finalFormatedFiles: Array<any> | object, filename: string): void {
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
        if (!commits || !commits.length) return [];

        const files: Array<FileForPlataformaInterface> = [];
        for (let index = 0; index < commits.length; index++) {
            const commit = commits[index];
            console.info(
                `[INFO]: Verificando commit ${index + 1} de ${commits.length}`
            );

            try {
                const commitDetail = await this.getCommitDetail(
                    commit.organization,
                    commit.repository,
                    commit.sha
                );

                if (!commitDetail) {
                    console.warn("[WARN]: Detalhes do commit não encontrados.", commit.sha);
                    continue;
                }

                if ((commitDetail.parents?.length ?? 0) > 1) {
                    continue;
                }

                if (!commit.title) {
                    commit.title =
                        commitDetail.commit?.message?.split("\n")[0] ?? "";
                }

                if (!commit.created_at) {
                    commit.created_at =
                        commitDetail.commit?.author?.date ??
                        commitDetail.commit?.committer?.date ??
                        "";
                }

                const commitFiles = commitDetail.files ?? [];
                commitFiles.forEach((file) => {
                    files.push({
                        extension: this.getExtensionFromFile(file),
                        file: file.filename,
                        commit,
                        new_file: file.status === "added",
                        deleted_file: file.status === "removed",
                        project: commit.repository,
                    });
                });
            } catch (error) {
                console.error("[ERROR]: getCommitDetail", error);
            }
        }

        return files;
    }

    private getUser() {
        return this.service.get<{ login: string; name?: string; username?: string }>(`/user`);
    }

    private async getUserCommits(username: string): Promise<Array<CommitsInterface>> {
        const { since, until, readableSince } = this.getCurrentMonthRange();
        console.info('[INFO]: Consultando commits a partir de ' + readableSince);

        const config = await this.repository.getConfig();
        const organizations = config.organizations ?? [];
        if (!organizations.length) {
            console.warn('[WARN]: Nenhuma organização configurada. Configure pelo menos uma organização para continuar.');
            return [];
        }

        const commits: Array<CommitsInterface> = [];

        for (const organization of organizations) {
            console.info(`[INFO]: Buscando repositórios da organização ${organization}`);
            const repositories = await this.getRepositoriesForOrganization(organization);

            for (const repository of repositories) {
                const encodedOrganization = encodeURIComponent(organization);
                const encodedRepository = encodeURIComponent(repository.name);
                console.info(`[INFO]: Buscando commits do repositório ${repository.full_name}`);
                const query = `/repos/${encodedOrganization}/${encodedRepository}/commits?author=${encodeURIComponent(
                    username
                )}&per_page=100&since=${encodeURIComponent(
                    since
                )}&until=${encodeURIComponent(until)}`;

                try {
                    const repositoryCommits = await this.service.get<Array<GithubCommitSummaryInterface>>(query);
                    repositoryCommits.forEach((commit) => {
                        if (!commit?.sha) return;
                        commits.push({
                            sha: commit.sha,
                            repository: repository.name,
                            organization,
                            branch: repository.default_branch,
                            title: commit.commit?.message?.split("\n")[0] ?? "",
                            created_at:
                                commit.commit?.author?.date ??
                                commit.commit?.committer?.date ??
                                "",
                            html_url: commit.html_url,
                        });
                    });
                } catch (error) {
                    console.error('[ERROR]: Falha ao buscar commits do repositório', repository.name, error);
                }
            }
        }

        return commits;
    }

    private getRepositoriesForOrganization(
        organization: string
    ): Promise<Array<GithubRepositoryInterface>> {
        const encodedOrganization = encodeURIComponent(organization);
        return this.service.get<Array<GithubRepositoryInterface>>(
            `/orgs/${encodedOrganization}/repos?type=all&per_page=100`
        );
    }

    private getCommitDetail(
        organization: string,
        repository: string,
        sha: string
    ) {
        const encodedOrganization = encodeURIComponent(organization);
        const encodedRepository = encodeURIComponent(repository);
        const encodedSha = encodeURIComponent(sha);
        return this.service.get<GithubCommitDetailInterface>(
            `/repos/${encodedOrganization}/${encodedRepository}/commits/${encodedSha}`
        );
    }

    private getExtensionFromFile(file: GithubCommitFileInterface): string {
        if (file.filename.includes("Test") || file.filename.includes("spec")) {
            return "spec";
        }

        const fileSegments = file.filename.split(".");
        if (fileSegments.length > 1) {
            return fileSegments.pop() as string;
        }

        return file.filename;
    }

    private getCurrentMonthRange() {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const start = new Date(year, month, 1, 0, 0, 0);
        const end = new Date(year, month + 1, 1, 0, 0, 0);
        return {
            since: start.toISOString(),
            until: end.toISOString(),
            readableSince: start.toLocaleDateString(),
        };
    }
}
