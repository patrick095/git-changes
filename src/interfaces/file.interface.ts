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
    descricao: string;
    pontuacao?: number;
}

export interface GitInfoInterface {
    id: string
    short_id: string
    created_at: string
    parent_ids: string[]
    title: string
    message: string
    author_name: string
    author_email: string
    authored_date: string
    committer_name: string
    committer_email: string
    committed_date: string
    trailers: any
    web_url: string
    stats: {
        additions: number
        deletions: number
        total: number
      }
    status: any
    project_id: number
    last_pipeline: any
  }