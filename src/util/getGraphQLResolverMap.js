"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGraphQLResolverMap = void 0;
const lodash_1 = require("lodash");
const normalize_1 = require("./normalize");
const resolveReferences_1 = require("./resolveReferences");
function getGraphQLResolverMap(typeMap, pluginConfig, context) {
    const resolvers = {};
    Object.keys(typeMap.objects).forEach((typeName) => {
        const objectType = typeMap.objects[typeName];
        const fieldNames = Object.keys(objectType.fields);
        // Add raw resolvers
        resolvers[objectType.name] = fieldNames
            .map((fieldName) => (Object.assign({ fieldName }, objectType.fields[fieldName])))
            .filter((field) => field.aliasFor)
            .reduce((fields, field) => {
            fields[field.fieldName] = { resolve: getRawResolver(field, pluginConfig, context) };
            return fields;
        }, resolvers[objectType.name] || {});
        // Add resolvers for lists, referenes and unions
        resolvers[objectType.name] = fieldNames
            .map((fieldName) => (Object.assign({ fieldName }, objectType.fields[fieldName])))
            .filter((field) => field.isList ||
            field.isReference ||
            typeMap.unions[(0, normalize_1.getTypeName)(field.namedType.name.value)])
            .reduce((fields, field) => {
            const targetField = objectType.isDocument
                ? (0, normalize_1.getConflictFreeFieldName)(field.fieldName)
                : field.fieldName;
            fields[targetField] = { resolve: getResolver(field) };
            return fields;
        }, resolvers[objectType.name] || {});
    });
    return resolvers;
}
exports.getGraphQLResolverMap = getGraphQLResolverMap;
function getRawResolver(field, pluginConfig, context) {
    const { fieldName } = field;
    const aliasName = '_' + (0, lodash_1.camelCase)(`raw ${fieldName}`);
    return (obj, args) => {
        const raw = `_${(0, lodash_1.camelCase)(`raw_data_${field.aliasFor || fieldName}`)}`;
        const value = obj[raw] || obj[aliasName] || obj[field.aliasFor || fieldName] || obj[fieldName];
        return args.resolveReferences
            ? (0, resolveReferences_1.resolveReferences)(value, context, {
                maxDepth: args.resolveReferences.maxDepth,
                overlayDrafts: pluginConfig.overlayDrafts,
            })
            : value;
    };
}
function getResolver(field) {
    return (source, args, context) => {
        if (field.isList) {
            const items = source[field.fieldName] || [];
            return items && Array.isArray(items)
                ? items.map((item) => maybeResolveReference(item, context.nodeModel))
                : [];
        }
        const item = source[field.fieldName];
        return maybeResolveReference(item, context.nodeModel);
    };
}
function maybeResolveReference(item, nodeModel) {
    if (item && typeof item._ref === 'string') {
        return nodeModel.getNodeById({ id: item._ref });
    }
    if (item && typeof item._type === 'string' && !item.internal) {
        return Object.assign(Object.assign({}, item), { internal: { type: (0, normalize_1.getTypeName)(item._type) } });
    }
    return item;
}
