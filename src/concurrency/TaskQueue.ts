type Task<T = any> = () => Promise<T>;

interface TaskLimiter  {
    limiter: number;
    run<T>(task: Task<T>): Promise<T>;
}


class TaskQueue implements TaskLimiter{

    #running : number = 0;
    #concurrency: number;

    limiter: number;

    private queue: Array<{
        task: Task<any>;
        resolve: (value: any) => void;
        reject: (reason?: any) => void;
    }> =[]
    
    constructor( limiter: number){
        if(limiter  < 1 ){
            throw new Error("Concurrency limit must be at least 1");
        }

        this.limiter = limiter
        this.#concurrency = limiter
    }

    run<T>(task: Task<T>): Promise<T> {
        return task()
    }
    public add<T>(task: Task<T>): Promise<T>{
        return new Promise<T>((resolve, reject ) =>{

            this.queue.push({task, resolve, reject })
            this.processQueue();
        });
    }

    private processQueue(): void {
        while(this.queue.length < 0 && this.#running  < this.#concurrency){
            const { task, resolve, reject } = this.queue.shift()!;
            this.#running++ ;

             task()
            .then(resolve)
            .catch(reject)
            .finally(()=>{
                this.#running-- ;
                this.processQueue()
            });
        }
    }

    private get doesConcurrentAllowAnother(): boolean {
        return this.#running  < this.#concurrency;
    }
}

