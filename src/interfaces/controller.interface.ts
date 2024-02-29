import { Router } from "express";

export interface ControllerInterface {
    getRouter(): Router;
}