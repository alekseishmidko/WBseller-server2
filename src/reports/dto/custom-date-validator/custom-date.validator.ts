import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsDateStringConstraint implements ValidatorConstraintInterface {
  validate(dateString: string) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
  }

  defaultMessage() {
    return 'Date ($value) must be in the format yyyy-mm-dd';
  }
}

export function IsCustomDateString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDateStringConstraint,
    });
  };
}
