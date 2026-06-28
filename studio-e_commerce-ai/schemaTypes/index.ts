import { type SchemaTypeDefinition } from 'sanity'
import { customerType } from './customerType'
import { orderType } from './orderType'
import { productType } from './productType'
import { categoryType } from './categoryType.ts'

export const schemaTypes: SchemaTypeDefinition[] = [customerType, categoryType, productType, orderType]