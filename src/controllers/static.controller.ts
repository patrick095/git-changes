import { Request, Response, Router } from "express";
import { ControllerInterface } from "../interfaces/controller.interface";
import { join } from "path";
import { TaskRepository } from "../repositories/task.repository";
import { HttpStatusCode } from "axios";
import { TaskInterface } from "../interfaces/tasks.interface";

class StaticController implements ControllerInterface {
    private _router: Router;

    constructor(private taskRepository: TaskRepository) {
        this._router = Router();
        this._registerRouters();
    }

    public getRouter(): Router {
        return this._router;
    }

    private home(req: Request, res: Response) {
        return res.sendFile(join(__dirname + '/../views/index.html'));
    }

    private saveTasks(req: Request, res: Response) {
        const tasks = req.body.tasks as Array<TaskInterface>;
        if (tasks && tasks.length) {
            this.taskRepository.save(tasks);
            return res.status(HttpStatusCode.Ok).json({ status: HttpStatusCode.Ok, message: 'Tasks salvas com sucesso!' });
        }
        return res.status(HttpStatusCode.BadRequest).json({ status: HttpStatusCode.BadRequest, message: "Erro ao salvar tasks" });
    }

    private _registerRouters(): void {
        this._router.get("/", this.home.bind(this));
        this._router.post('/tasks', this.saveTasks.bind(this));
    }
}

export const staticController = new StaticController(new TaskRepository());