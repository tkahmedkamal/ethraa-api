import { registerDecorator, ValidationOptions } from 'class-validator';
import { ObjectId } from 'bson';

export const IsMongoIdObject = (validationOptions?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsMongoIdObject',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return ObjectId.isValid(value);
        },
      },
    });
  };
};
