namespace Validator {
    export function define( key: symbol ): ParameterDecorator{
        return function(
            target: Object,
            propertyKey: string | symbol,
            parameterIndex: number
            ) {
            target[key] = parameterIndex;
        }
    }
}