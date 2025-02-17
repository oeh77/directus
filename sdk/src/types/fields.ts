import type { ExtractItem } from './query.js';
import type { ItemType, RelationalFields, RemoveRelationships } from './schema.js';
import type { UnpackList } from './utils.js';

/**
 * Fields querying, including nested relational fields
 */
export type QueryFields<Schema extends object, Item> = WrapQueryFields<
	Item,
	QueryFieldsRelational<Schema, UnpackList<Item>>
>;

/**
 * Wrap array of fields
 */
export type WrapQueryFields<Item, NestedFields> = readonly ('*' | keyof UnpackList<Item> | NestedFields)[];

/**
 * Object of nested relational fields in a given Item with it's own fields available for selection
 */
export type QueryFieldsRelational<Schema extends object, Item> = {
	[Key in RelationalFields<Schema, Item>]?: Extract<Item[Key], ItemType<Schema>> extends infer RelatedCollection
		? RelatedCollection extends any[]
			? HasManyToAnyRelation<RelatedCollection> extends never
				? QueryFields<Schema, RelatedCollection> // many-to-many or one-to-many
				: ManyToAnyFields<Schema, RelatedCollection> // many to any
			: QueryFields<Schema, RelatedCollection> // many-to-one
		: never;
};

/**
 * Deal with many-to-any relational fields
 */
export type ManyToAnyFields<Schema extends object, Item> = ExtractItem<Schema, Item> extends infer TItem
	? TItem extends object
		? 'collection' extends keyof TItem
			? 'item' extends keyof TItem
				? WrapQueryFields<
						TItem,
						Omit<QueryFieldsRelational<Schema, UnpackList<Item>>, 'item'> & {
							item?: {
								[Collection in keyof Schema as Collection extends TItem['collection']
									? Collection
									: never]?: QueryFields<Schema, Schema[Collection]>;
							};
						}
				  >
				: never
			: never
		: never
	: never;

/**
 * Determine whether a field definition has a many-to-any relation
 * TODO try making this dynamic somehow instead of relying on "item" as key
 */
export type HasManyToAnyRelation<Item> = UnpackList<Item> extends infer TItem
	? TItem extends object
		? 'collection' extends keyof TItem
			? 'item' extends keyof TItem
				? true
				: never
			: never
		: never
	: never;

/**
 * Returns true if the Fields has any nested field
 */
export type HasNestedFields<Fields> = UnpackList<Fields> extends infer Field
	? Field extends object
		? true
		: never
	: never;

/**
 * Return all keys if Fields is undefined or contains '*'
 */
export type FieldsWildcard<Item extends object, Fields> = UnpackList<Fields> extends infer Field
	? Field extends undefined
		? keyof Item
		: Field extends '*'
		? keyof Item
		: Field extends string
		? Field
		: never
	: never;

/**
 * Returns the relational fields from the fields list
 */
export type PickRelationalFields<Fields> = UnpackList<Fields> extends infer Field
	? Field extends object
		? Field
		: never
	: never;

export type RelationalQueryFields<Fields> = PickRelationalFields<Fields>;

/**
 * Extract the required fields from an item
 */
export type PickFlatFields<Schema extends object, Item, Fields> = Extract<Fields, keyof Item> extends never
	? never
	: Pick<RemoveRelationships<Schema, Item>, Extract<Fields, keyof Item>>;
