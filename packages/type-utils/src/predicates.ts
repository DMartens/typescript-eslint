import debug from 'debug';
import * as tsutils from 'ts-api-utils';
import * as ts from 'typescript';

import { isTypeFlagSet } from './typeFlagUtils';

const log = debug('typescript-eslint:type-utils:predicates');

/**
 * Checks if the given type is (or accepts) nullable
 */
export function isNullableType(type: ts.Type): boolean {
  return isTypeFlagSet(
    type,
    ts.TypeFlags.Any |
      ts.TypeFlags.Unknown |
      ts.TypeFlags.Null |
      ts.TypeFlags.Undefined |
      ts.TypeFlags.Void,
  );
}

/**
 * Checks if the given type is either an array type,
 * or a union made up solely of array types.
 */
export function isTypeArrayTypeOrUnionOfArrayTypes(
  type: ts.Type,
  checker: ts.TypeChecker,
): boolean {
  for (const t of tsutils.unionTypeParts(type)) {
    if (!checker.isArrayType(t)) {
      return false;
    }
  }

  return true;
}

/**
 * @returns true if the type is `never`
 */
export function isTypeNeverType(type: ts.Type): boolean {
  return isTypeFlagSet(type, ts.TypeFlags.Never);
}

/**
 * @returns true if the type is `unknown`
 */
export function isTypeUnknownType(type: ts.Type): boolean {
  return isTypeFlagSet(type, ts.TypeFlags.Unknown);
}

// https://github.com/microsoft/TypeScript/blob/42aa18bf442c4df147e30deaf27261a41cbdc617/src/compiler/types.ts#L5157
const Nullable = ts.TypeFlags.Undefined | ts.TypeFlags.Null;
// https://github.com/microsoft/TypeScript/blob/42aa18bf442c4df147e30deaf27261a41cbdc617/src/compiler/types.ts#L5187
const ObjectFlagsType =
  ts.TypeFlags.Any |
  Nullable |
  ts.TypeFlags.Never |
  ts.TypeFlags.Object |
  ts.TypeFlags.Union |
  ts.TypeFlags.Intersection;
export function isTypeReferenceType(type: ts.Type): type is ts.TypeReference {
  if ((type.flags & ObjectFlagsType) === 0) {
    return false;
  }
  const objectTypeFlags = (type as ts.ObjectType).objectFlags;
  return (objectTypeFlags & ts.ObjectFlags.Reference) !== 0;
}

/**
 * @returns true if the type is `any`
 */
export function isTypeAnyType(type: ts.Type): boolean {
  if (isTypeFlagSet(type, ts.TypeFlags.Any)) {
    if (type.intrinsicName === 'error') {
      log('Found an "error" any type');
    }
    return true;
  }
  return false;
}

/**
 * @returns true if the type is `any[]`
 */
export function isTypeAnyArrayType(
  type: ts.Type,
  checker: ts.TypeChecker,
): boolean {
  return (
    checker.isArrayType(type) &&
    isTypeAnyType(checker.getTypeArguments(type)[0])
  );
}

/**
 * @returns true if the type is `unknown[]`
 */
export function isTypeUnknownArrayType(
  type: ts.Type,
  checker: ts.TypeChecker,
): boolean {
  return (
    checker.isArrayType(type) &&
    isTypeUnknownType(checker.getTypeArguments(type)[0])
  );
}

/**
 * @returns Whether a type is an instance of the parent type, including for the parent's base types.
 */
export function typeIsOrHasBaseType(
  type: ts.Type,
  parentType: ts.Type,
): boolean {
  const parentSymbol = parentType.getSymbol();
  if (!type.getSymbol() || !parentSymbol) {
    return false;
  }

  const typeAndBaseTypes = [type];
  const ancestorTypes = type.getBaseTypes();

  if (ancestorTypes) {
    typeAndBaseTypes.push(...ancestorTypes);
  }

  for (const baseType of typeAndBaseTypes) {
    const baseSymbol = baseType.getSymbol();
    if (baseSymbol && baseSymbol.name === parentSymbol.name) {
      return true;
    }
  }

  return false;
}

export function isTypeBigIntLiteralType(
  type: ts.Type,
): type is ts.BigIntLiteralType {
  return isTypeFlagSet(type, ts.TypeFlags.BigIntLiteral);
}

export function isTypeTemplateLiteralType(
  type: ts.Type,
): type is ts.TemplateLiteralType {
  return isTypeFlagSet(type, ts.TypeFlags.TemplateLiteral);
}
