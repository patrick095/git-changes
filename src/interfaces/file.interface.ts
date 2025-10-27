import { CommitsInterface } from "./commits.interface";

export interface GithubCommitFileInterface {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    previous_filename?: string;
    patch?: string;
}

export interface FileForPlataformaInterface {
    extension: string;
    file: string;
    commit: CommitsInterface;
    new_file: boolean;
    deleted_file: boolean;
    project: string;
}

export interface FileFinalPtBrInterface {
    categoria: FileCategoryInterface;
    arquivo_com_hash: string;
    projeto: string;
    branch: string;
    titulo_commit: string;
    hash_commit: string;
    fileName: string;
}

export interface FileCategoryInterface {
    code: string;
    description: string;
}

export interface FileGroupByCommitAndCategory {
    titulo_commit: string;
    categorias: Array<FileGroupByCategory>
}

export interface FileGroupByCategory {
    categoria: string;
    arquivos: Array<string>;
    descricao: string;
    pontuacao?: number;
}

export interface GithubCommitDetailInterface {
    sha: string;
    html_url: string;
    commit: {
        message: string;
        author?: {
            name: string;
            email: string;
            date: string;
        } | null;
        committer?: {
            name: string;
            email: string;
            date: string;
        } | null;
    };
    parents: Array<{ sha: string }>;
    files: Array<GithubCommitFileInterface>;
}
