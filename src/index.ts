import { Server } from "./server";

class App {
    constructor() {
        this.init();
    }
    
    public init() {
        new Server().start();
    }
}

new App();