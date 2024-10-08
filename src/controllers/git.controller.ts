import { Request, Response, Router } from "express";
import https from 'https';

import { ControllerInterface } from "../interfaces/controller.interface";
import { GitRepository } from "../repositories/git.repository";
import { TaskRepository } from "../repositories/task.repository";
import { BaseService } from "../service/base.service";
import { Git } from "../git";
import { PlataformaService } from "../service/plataforma.service";
import { readFile } from "fs";
import { join } from "path";
import { FileGroupByCategory } from "../interfaces/file.interface";

export class GitController implements ControllerInterface {
    private _router: Router;
    private _repository: GitRepository;
    private _taskRepository: TaskRepository;
    private _gitInstance: Git;

    constructor(private service: BaseService) {
        this._router = Router();
        this._registerRouters();
        this._repository = new GitRepository();
        this._taskRepository = new TaskRepository();
        this._gitInstance = new Git(this.service, new PlataformaService())
    }

    public getRouter(): Router {
        return this._router;
    }

    private getUserId(req: Request, res: Response) {
        try {
            const { accessToken, gitUrl } = req.query;

            if (!accessToken || !gitUrl) return res.status(500).json({ status: 500, message: "Dados inválidos" });
            
            this._repository.setConfig({ accessToken: accessToken as string, gitUrl: gitUrl as string });

            this.service.get('/user', gitUrl as string)
            .then(() => {
                return res.status(200).json({ status: 200, message: "Sucesso ao se conectar com o Git" });
            })
            .catch(() => {
                return res.status(500).json({ status: 500, message: "Falha ao se conectar com o Git" });
            });
        } catch (error) {
            return res.status(500).json({ status: 500, message: "Falha ao se conectar com o Git" });
        }
    }

    private saveGitInfo(req: Request, res: Response) {
        try {
            const body = req.body;
            this._repository.setConfig(body);
            return res.status(200).json({ status: 200, message: "Dados salvos com sucesso!" })
        } catch (error) {
            return res.status(500).json({ status: 500, message: "Erro ao salvar os dados do Git" })
        }
    }

    private async getGitInfo(req: Request, res: Response) {
        try {
            const gitData = await this._repository.getConfig();
            const taskData = this._taskRepository.getAll();
            return res.status(200).json({ git: gitData, task: taskData });
        } catch (error) {
            return res.status(500).json({ status: 500, message: "Erro ao consultar dados do Git" });
        }
    }

    private async getGitDataByCommits(req: Request, res: Response) {
        try {
            const gitData = await this._repository.getFilesByCommits();
            if (!gitData) throw new Error();
            return res.status(200).json(gitData);
        } catch (error) {
            return res.status(500).json({ status: 500, message: "Erro ao consultar dados, verificar se já atualizou os dados com o git."});
        }
    }

    private async getGitDataByProjects(req: Request, res: Response) {
        try {
            const gitData = await this._repository.getFilesByProjects();
            if (!gitData) throw new Error();
            return res.status(200).json(gitData);
        } catch (error) {
            return res.status(500).json({ status: 500, message: "Erro ao consultar dados, verificar se já atualizou os dados com o git."});
        }
    }

    private async getGitDataByCategory(req: Request, res: Response) {
        try {
            const gitData = await this._repository.getFilesByCategories();
            if (!gitData) throw new Error();
            return res.status(200).json(gitData);
        } catch (error) {
            return res.status(500).json({ status: 500, message: "Erro ao consultar dados, verificar se já atualizou os dados com o git."});
        }
    }

    private async getGitCommitsNumber(req: Request, res: Response) {
        try {
            const commitNumbers = await this._repository.getCommitsNumber();
            if (commitNumbers === null || commitNumbers === undefined) throw new Error();
            return res.status(200).json({ commits: commitNumbers});
        } catch (error) {
            return res.status(500).json({ status: 500, message: "Erro ao consultar dados, verificar se já atualizou os dados com o git."});
        }
    }

    private async getGitAllData(req: Request, res: Response) {
            this._gitInstance.getAllData()
            .then(() => {
                return res.status(200).json({ message: 'Dados atualizados com sucesso!'})
            })
            .catch((error) => {
                return res.status(500).json({ status: 500, message: "Erro ao consultar dados no Git, verificar configuração do Git"});
            });
    }

    private async getJsonDownload(req: Request, res: Response) {
        let valorTotal = 0;
        readFile(join(__dirname + '/../repositories/git-all-category.json'), { encoding: 'utf-8' } , async (err, data) => {
            if (err) {
                res.status(500).json({ status: 500, message: 'Erro ao gerar json para download' });
            }
            const jsonData = JSON.parse(data) as Array<FileGroupByCategory>;
            const entregas = jsonData.map((category) => {
                valorTotal += category.pontuacao as number;
                return {
                    itemGuia: category.categoria,
                    complexidade: 'Padrão',
                    itens: category.arquivos.map((file) => {
                        const [ caminho, descricao ] = file.split(';');
                        return {
                            caminho,
                            descricao
                        }
                    })
                }
            })

            const user = await this.service.get<{ username: string }>('/user');

            const finalData = {
                chave: user.username,
                numeroOF: 0,
                numeroOrdemContratacao: 0,
                valorOF: valorTotal,
                entregas
            }
            res.status(200).json(finalData);
        })
    }

    private _registerRouters(): void {
        this._router.post("/git-info", this.saveGitInfo.bind(this));
        this._router.get("/git-info", this.getGitInfo.bind(this));
        this._router.get('/git-data-commit', this.getGitDataByCommits.bind(this));
        this._router.get('/git-data-project', this.getGitDataByProjects.bind(this));
        this._router.get('/git-data-category', this.getGitDataByCategory.bind(this));
        this._router.get('/git-commits', this.getGitCommitsNumber.bind(this));
        this._router.post('/git-update', this.getGitAllData.bind(this));
        this._router.get("/git-connection", this.getUserId.bind(this));
        this._router.get("/git-json-download", this.getJsonDownload.bind(this));
    }
}
