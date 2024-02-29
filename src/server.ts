import express, { Application } from 'express';
import { ControllerInterface } from './interfaces/controller.interface';
import { staticController } from './controllers/static.controller';
import { gitController } from './controllers/git.controller';
import bodyParser from 'body-parser';

export class Server {
    private _server: Application;
    private _port: number;
    private _controllers: Array<ControllerInterface>;
    constructor() {
        this._server = express();
        this._server.use(bodyParser.json());
        this._port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        this._controllers = [
            staticController,
            gitController
        ];
    }

    public start(): void {
        this.initControllers();
        this._server.listen(this._port);
        console.info(`[INFO] Servidor iniciado em http://localhost:${this._port}`);
    }

    private initControllers(): void {
        this._controllers.forEach((controller) => {
            this._server.use("/", controller.getRouter())
        })
    }
}