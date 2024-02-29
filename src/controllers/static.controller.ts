import { Request, Response, Router } from "express";
import { ControllerInterface } from "../interfaces/controller.interface";
import { join } from "path";

class StaticController implements ControllerInterface {
    private _router: Router;

    constructor() {
        this._router = Router();
        this._registerRouters();
    }

    public getRouter(): Router {
        return this._router;
    }

    private home(req: Request, res: Response) {
        return res.sendFile(join(__dirname + '/../views/index.html'));
    }

    private _registerRouters(): void {
        this._router.get("/", this.home.bind(this));
    }
}

export const staticController = new StaticController();