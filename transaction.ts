type StatusCode = 0 | 1 | 2 | 3 | 4;

class Transaction {
    store: object;
    logs: Array<logTemplate>;
    status: StatusCode;
    static scenario: symbol = Symbol('Scenario');
    constructor() {
        this.store = null;
        this.logs = [];
        this.status = 0;
    }

    get statusText(): string {
        switch( this.status ) {
            case 0:
                return 'Not Started';
            case 1:
                return 'SUCCEED';
            case 2:
                return 'FAILED: restored without error';
            case 3:
                return 'FAILED: restored with error';
            case 4:
                return 'Running';
            default:
                return 'Unknown';
        }
    }

    @this.validateScenario
    async dispatch( @Validator.define(Transaction.scenario) scenario: Array<stepTemplate> ): Promise<void> {
        this.status = 0;

        const sortedSteps: Map<number, stepTemplate> = new Map();
        scenario.forEach(step => sortedSteps.set(step.index, step));

        if( scenario.length && sortedSteps.get(scenario.length).restore !== undefined ) {
            throw new TypeError("Last step of the scenario mustnt't have a restore function");
        }

        this.status = 4;
        this.store = {};
        this.logs = [];

        await this.call( sortedSteps );
    }

    async call( steps: Map<number, stepTemplate> ): Promise<void> {
        for( let index = 1; index <= steps.size; ++index ) {
            const step: stepTemplate = steps.get(index);

            const log: logTemplate = await this.getLog(step, 'call');
            this.logs.push(log);
            if( log.error ) {
                await this.rollback(steps, index);
                this.store = null;
                return;
            }
        }
        this.status = 1;
    }

    async rollback( steps: Map<number, stepTemplate>, index: number ): Promise<void> {
        while( --index ) {
            const step: stepTemplate = steps.get(index);
            if( step.restore === undefined ) {
                if( step.crucial ) {
                    this.status = 3;
                    throw new CustomError(`Crucial step has no restore`, {
                        logs: this.logs
                    });
                } else {
                    continue;
                }
            }

            const log = await this.getLog(step, 'restore');
            if( log.error ) {
                this.status = 3;
                throw new CustomError(log.error.message, {
                    log,
                    logs: this.logs
                });
            }
        }
        this.status = 2;
    }

    async getLog(step: stepTemplate, functionName: 'call' | 'restore'): Promise<logTemplate> {
        let log: logTemplate = {
            index: step.index,
            meta: {...step.meta},
            error: null
        };
        try{
            const storeBefore: object = Copy.deepCopy(this.store);
            await step[functionName](this.store);
            const storeAfter: object = Copy.deepCopy(this.store);
            const error: null = null;
            log = {
                ...log,
                storeBefore,
                storeAfter,
                error
            };
        } catch(error) {
            const {name, message, stack}:
            {name: string, message: string, stack: string} = error;
            log.error = {
                name,
                message,
                stack
            };
        }
        return log;
    }

    validateScenario(
        target: object,
        propertyName: string,
        descriptor: TypedPropertyDescriptor<Function>
    ): void {
        const method = descriptor.value;
        
        descriptor.value = function() {
            if( !(Transaction.scenario in target) ) {
                throw new ReferenceError("Scenario is not found");
            }
            const scenario: Array<stepTemplate> = arguments[target[Transaction.scenario]];
            if( scenario.length === 0 ) return method.apply(this, arguments);
    
            let minIndex: number = Infinity,
                maxIndex: number = -Infinity,
                indexes: Set<number> = new Set();
            scenario.forEach(step => {
                minIndex = Math.min(minIndex, step.index);
                maxIndex = Math.max(maxIndex, step.index);
                if( indexes.has(step.index) ) {
                    throw RangeError(`Scenario mustn't have two identical indexes (${step.index})`);
                }
                indexes.add(step.index);
            });
            if( minIndex !== 1 || maxIndex !== scenario.length ) {
                throw new RangeError(`MinIndex (${minIndex}) must be 1 and MaxIndex (${maxIndex}) must be ${scenario.length}`);
            }

            return method.apply(this, arguments);
        }
    }
}