import { CommitsInterface } from "./commits.interface";

export interface FileGitlabInterface {
    old_path: string;
    new_path: string;
    a_mode: string;
    b_mode: string;
    new_file: boolean;
    renamed_file: boolean;
    deleted_file: boolean;
    diff: string;
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
}