import { Request, Response, Router } from "express";
import axios, { AxiosHeaders } from "axios";
import https from 'https';

import { ControllerInterface } from "../interfaces/controller.interface";
import { GitRepository } from "../repositories/git.repository";
import { GitInstance } from "../git";

class GitController implements ControllerInterface {
    private _router: Router;
    private _repository: GitRepository;

    constructor() {
        this._router = Router();
        this._registerRouters();
        this._repository = new GitRepository();
    }

    public getRouter(): Router {
        return this._router;
    }

    private getUserId(req: Request, res: Response) {
        try {
            const { accessToken, gitUrl } = req.query;

            if (!accessToken || !gitUrl) return res.status(500).json({ status: 500, message: "Dados inválidos" });

            axios.get<{ id: number }>(`${gitUrl}/user`, {
                headers: new AxiosHeaders({ 'PRIVATE-TOKEN': accessToken as string }),
                httpsAgent: new https.Agent({ rejectUnauthorized: false })
            })
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

    private getGitInfo(req: Request, res: Response) {
        try {
            const gitData = this._repository.getConfig();
            return res.status(200).json(gitData);
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
            GitInstance.getAllData()
            .then(() => {
                return res.status(200).json({ message: 'Dados atualizados com sucesso!'})
            })
            .catch((error) => {
                return res.status(500).json({ status: 500, message: "Erro ao consultar dados no Git, verificar configuração do Git"});
            });
    }

    private _registerRouters(): void {
        this._router.post("/git-info", this.saveGitInfo.bind(this));
        this._router.get("/git-info", this.getGitInfo.bind(this));
        this._router.get('/git-data-commit', this.getGitDataByCommits.bind(this));
        this._router.get('/git-data-project', this.getGitDataByProjects.bind(this));
        this._router.get('/git-commits', this.getGitCommitsNumber.bind(this));
        this._router.post('/git-update', this.getGitAllData.bind(this));
        this._router.get("/git-connection", this.getUserId.bind(this));
    }
}

export const gitController = new GitController();