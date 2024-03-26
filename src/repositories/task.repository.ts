import { readFileSync, writeFile, writeFileSync } from "fs";
import { TaskInterface } from "../interfaces/tasks.interface";
import { join } from "path";

export class TaskRepository {
    private _fileName = 'tasks-data.json';
    private _filePath = join(__dirname, this._fileName);

    constructor() {
        this.save([])
    }

    public save(tasks: Array<TaskInterface>) {
        return writeFile(this._filePath, JSON.stringify(tasks, null, 4), (err) => {
            if (err) console.error(err)
        })
    }

    public getAll(): Array<TaskInterface> {
        try {
            const allFromMonth: Array<TaskInterface> = [];
            const now = new Date();
            const month = now.getMonth();
            const year = now.getFullYear();
            const startMonth = new Date(year, month, 1);
            const json = readFileSync(this._filePath, { encoding: 'utf-8' });
            const all = JSON.parse(json) as Array<TaskInterface>;
            all.forEach((task) => {
                const [ taskStart, taskEnd ] = task.period.split(' - ');
                if (new Date(taskEnd) >= startMonth) {
                    allFromMonth.push(task);
                }
            });
            return allFromMonth;
        } catch {
            return []
        }
    }

    public getOneBy(date: Date, project?: string, branch?: string): TaskInterface | undefined {
        const all = this.getAll();
        const task =  all.filter((task) => {
            const [ taskStart, taskEnd ] = task.period.split(' - ');
            return date >= new Date(taskStart)
                && date <= new Date(taskEnd)
                && (!task.project || (task.project && project === task.project))
                && (!task.branch || (task.branch && branch === task.branch))
        })
        task.sort((p, n) => Object.keys(p).length - Object.keys(n).length);
        return task[0];
    }
}