import {
    FileCategoryInterface,
    FileFinalPtBrInterface,
    FileForPlataformaInterface,
    FileGroupByCommitAndCategory,
} from "../interfaces/file.interface";
import { TaskRepository } from "../repositories/task.repository";

export class PlataformaService {
    private _taskRepository = new TaskRepository();

    public splitFilesByTypeForSendToPlataform(
        files: Array<FileForPlataformaInterface>
    ): Array<FileFinalPtBrInterface> {
        const filesWithoutDeletedFiles: Array<FileFinalPtBrInterface> = [];
        const onlyOnePerTask = process.env.ONLY_ONE_PER_TASK === 'true';
        files.forEach((file) => {
            const taskId = this._taskRepository.getOneBy(
                new Date(file.commit.created_at.split("T")[0]),
                file.project,
                file.commit.branch
            )?.id;
            if (
                !file.deleted_file &&
                (!onlyOnePerTask || filesWithoutDeletedFiles.findIndex(
                    (fileW) =>
                        fileW.arquivo_com_hash.split(";")[1] ===
                            taskId?.toString() && fileW.fileName === file.file
                ) < 0)
            ) {
                filesWithoutDeletedFiles.push({
                    categoria: this.getCategoryByTypeAndNewFile(
                        file.extension,
                        file.new_file
                    ),
                    arquivo_com_hash: `${file.project}/${
                        file.file
                    }#${file.commit.sha.slice(0, 10)};${taskId ?? "SEM TASK"}`,
                    projeto: file.project,
                    branch: file.commit.branch,
                    titulo_commit: file.commit.title,
                    hash_commit: file.commit.sha,
                    fileName: file.file,
                });
            }
        });
        return filesWithoutDeletedFiles;
    }

    public splitFilesForUploadInfo(
        files: Array<FileFinalPtBrInterface>
    ): Array<FileGroupByCommitAndCategory> {
        const groupByCommit: Array<any> = [];
        files.forEach((file) => {
            const groupIndex = groupByCommit.findIndex(
                (group) => group.hash_commit === file.hash_commit
            );

            if (groupIndex >= 0) {
                const categoryIndex = (
                    groupByCommit[groupIndex].categorias as Array<any>
                ).findIndex(
                    (category) => category.categoria === file.categoria.code
                );
                if (categoryIndex >= 0) {
                    groupByCommit[groupIndex].categorias[
                        categoryIndex
                    ].arquivos.push(file.arquivo_com_hash);
                } else {
                    groupByCommit[groupIndex].categorias.push({
                        categoria: file.categoria.code,
                        arquivos: [file.arquivo_com_hash],
                    });
                }
                return;
            }

            groupByCommit.push({
                titulo_commit: file.titulo_commit,
                hash_commit: file.hash_commit,
                categorias: [
                    {
                        categoria: file.categoria.code,
                        arquivos: [file.arquivo_com_hash],
                    },
                ],
            });
        });
        return groupByCommit.map((group) => {
            delete group.hash_commit;
            return group;
        });
    }

    public listFilesByProjectByCategories(
        files: Array<FileGroupByCommitAndCategory>
    ) {
        const filesByProject: Array<any> = [];
        files.forEach((group) => {
            group.categorias.forEach((category) => {
                category.arquivos.forEach((file) => {
                    const projectName = file.split("/")[0];
                    const projectIndex = filesByProject.findIndex(
                        (project) => project.nome_projeto === projectName
                    );

                    if (projectIndex >= 0) {
                        const categoryIndex = (
                            filesByProject[projectIndex]
                                .categorias as Array<any>
                        ).findIndex((c) => c.categoria === category.categoria);
                        if (categoryIndex >= 0)
                            return filesByProject[projectIndex].categorias[
                                categoryIndex
                            ].arquivos.push(file);

                        return filesByProject[projectIndex].categorias.push({
                            categoria: category.categoria,
                            arquivos: [file],
                        });
                    }

                    filesByProject.push({
                        nome_projeto: projectName,
                        categorias: [
                            {
                                categoria: category.categoria,
                                arquivos: [file],
                            },
                        ],
                    });
                });
            });
        });
        return filesByProject;
    }

    private getCategoryByTypeAndNewFile(
        extension: string,
        isNewFile: boolean
    ): FileCategoryInterface {
        switch (extension) {
            case "js":
                return isNewFile
                    ? { code: "5.10.5", description: "Criação JavaScript" }
                    : { code: "5.10.6", description: "Alteração JavaScript" };
            case "ts":
                return isNewFile
                    ? { code: "5.10.5", description: "Criação JavaScript" }
                    : { code: "5.10.6", description: "Alteração JavaScript" };
            case "json":
                return isNewFile
                    ? {
                          code: "5.10.7",
                          description: "Criação de arquivo chave/valor",
                      }
                    : {
                          code: "5.10.8",
                          description: "Alteração de arquivo chave/valor",
                      };
            case "spec":
                return isNewFile
                    ? { code: "5.10.18", description: "Criação de teste" }
                    : { code: "5.10.21", description: "Alteração de teste" };
            case "sql":
                return isNewFile
                    ? { code: "5.10.18", description: "Criação de teste" }
                    : { code: "5.10.21", description: "Alteração de teste" };
            case "html":
                return isNewFile
                    ? { code: "5.10.1", description: "Criação de tela HTML" }
                    : { code: "5.10.2", description: "Alteração de tela HTML" };
            case "java":
                return isNewFile
                    ? {
                          code: "5.10.9",
                          description: "Criação de arquivos Java",
                      }
                    : {
                          code: "5.10.10",
                          description: "Alteração de arquivos Java",
                      };
            case "css":
                return isNewFile
                    ? { code: "5.10.3", description: "Criação CSS ou SCSS" }
                    : { code: "5.10.4", description: "Alteração CSS ou SCSS" };
            case "scss":
                return isNewFile
                    ? { code: "5.10.3", description: "Criação CSS ou SCSS" }
                    : { code: "5.10.4", description: "Alteração CSS ou SCSS" };
            case "Dockerfile":
                return isNewFile
                    ? { code: "5.10.7", description: "Criação Dockerfile" }
                    : { code: "5.10.8", description: "Alteração Dockerfile" };
            case "yml":
                return isNewFile
                    ? { code: "5.15.9", description: "Criação Docker Compose" }
                    : {
                          code: "5.15.10",
                          description: "Alteração Docker Compose",
                      };
            case "yaml":
                return isNewFile
                    ? {
                          code: "5.10.7",
                          description: "Criação de arquivo chave/valor",
                      }
                    : {
                          code: "5.10.8",
                          description: "Alteração de arquivo chave/valor",
                      };
            case "xml":
                return isNewFile
                    ? {
                          code: "5.10.7",
                          description: "Criação de arquivo chave/valor",
                      }
                    : {
                          code: "5.10.8",
                          description: "Alteração de arquivo chave/valor",
                      };
            case "sh":
                return isNewFile
                    ? {
                          code: "5.15.1",
                          description: "Criação scripts (.sh ou outros)",
                      }
                    : {
                          code: "5.15.2",
                          description: "Alteração scripts (.sh ou outros)",
                      };
            case "md":
                return {
                    code: "5.26.2",
                    description:
                        "Construção/Alteração README e CHANGELOG e documentos auxiliares da aplicação",
                };
            default:
                return {
                    code: "0.0.0",
                    description: "Arquivo não Mapeado ainda.",
                };
        }
    }
}
