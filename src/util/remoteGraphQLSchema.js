"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypeMapFromGraphQLSchema = exports.getRemoteGraphQLSchema = exports.defaultTypeMap = void 0;
const lodash_1 = require("lodash");
const graphql_1 = require("gatsby/graphql");
const normalize_1 = require("./normalize");
const errors_1 = require("./errors");
exports.defaultTypeMap = {
    scalars: [],
    objects: {},
    unions: {},
};
function getRemoteGraphQLSchema(client, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const { graphqlTag } = config;
        const { dataset } = client.config();
        try {
            const api = yield client.request({
                url: `/apis/graphql/${dataset}/${graphqlTag}?tag=sanity.gatsby.get-schema`,
                headers: { Accept: 'application/graphql' },
            });
            return api;
        }
        catch (err) {
            const statusCode = (0, lodash_1.get)(err, 'response.statusCode');
            const errorCode = (0, lodash_1.get)(err, 'response.body.errorCode');
            const message = (0, lodash_1.get)(err, 'response.body.message') || (0, lodash_1.get)(err, 'response.statusMessage') || err.message;
            const is404 = statusCode === 404 || /schema not found/i.test(message);
            const error = new errors_1.ErrorWithCode(is404
                ? `GraphQL API not deployed - see https://github.com/sanity-io/gatsby-source-sanity#graphql-api for more info\n\n`
                : `${message}`, errorCode || statusCode);
            throw error;
        }
    });
}
exports.getRemoteGraphQLSchema = getRemoteGraphQLSchema;
function getTypeMapFromGraphQLSchema(sdl) {
    const typeMap = { objects: {}, scalars: [], unions: {} };
    const remoteSchema = (0, graphql_1.parse)(sdl);
    const groups = Object.assign({ ObjectTypeDefinition: [], ScalarTypeDefinition: [], UnionTypeDefinition: [] }, (0, lodash_1.groupBy)(remoteSchema.definitions, 'kind'));
    typeMap.scalars = graphql_1.specifiedScalarTypes
        .map((scalar) => scalar.name)
        .concat(groups.ScalarTypeDefinition.map((typeDef) => typeDef.name.value));
    const objects = {};
    typeMap.objects = groups.ObjectTypeDefinition.reduce((acc, typeDef) => {
        if (typeDef.name.value === 'RootQuery') {
            return acc;
        }
        const name = (0, normalize_1.getTypeName)(typeDef.name.value);
        acc[name] = {
            name,
            kind: 'Object',
            isDocument: Boolean((typeDef.interfaces || []).find((iface) => iface.name.value === 'Document')),
            fields: (typeDef.fields || []).reduce((fields, fieldDef) => {
                if (isAlias(fieldDef)) {
                    const aliasFor = getAliasDirective(fieldDef) || '';
                    fields[aliasFor] = {
                        type: fieldDef.type,
                        namedType: { kind: 'NamedType', name: { kind: 'Name', value: 'JSON' } },
                        isList: false,
                        aliasFor: null,
                        isReference: false,
                    };
                    const aliasName = '_' + (0, lodash_1.camelCase)(`raw ${aliasFor}`);
                    fields[aliasName] = {
                        type: { kind: 'NamedType', name: { kind: 'Name', value: 'JSON' } },
                        namedType: { kind: 'NamedType', name: { kind: 'Name', value: 'JSON' } },
                        aliasFor,
                        isList: false,
                        isReference: false,
                    };
                    return fields;
                }
                const namedType = unwrapType(fieldDef.type);
                fields[fieldDef.name.value] = {
                    type: fieldDef.type,
                    namedType,
                    isList: isListType(fieldDef.type),
                    aliasFor: null,
                    isReference: Boolean(getReferenceDirective(fieldDef)),
                };
                // Add raw alias if not scalar
                if (!typeMap.scalars.includes(namedType.name.value)) {
                    const aliasName = '_' + (0, lodash_1.camelCase)(`raw ${fieldDef.name.value}`);
                    fields[aliasName] = {
                        type: { kind: 'NamedType', name: { kind: 'Name', value: 'JSON' } },
                        namedType: { kind: 'NamedType', name: { kind: 'Name', value: 'JSON' } },
                        aliasFor: fieldDef.name.value,
                        isList: false,
                        isReference: false,
                    };
                }
                return fields;
            }, {}),
        };
        return acc;
    }, objects);
    const unions = {};
    typeMap.unions = groups.UnionTypeDefinition.reduce((acc, typeDef) => {
        const name = (0, normalize_1.getTypeName)(typeDef.name.value);
        acc[name] = {
            name,
            types: (typeDef.types || []).map((type) => (0, normalize_1.getTypeName)(type.name.value)),
        };
        return acc;
    }, unions);
    return typeMap;
}
exports.getTypeMapFromGraphQLSchema = getTypeMapFromGraphQLSchema;
function isAlias(field) {
    return getAliasDirective(field) !== null;
}
function unwrapType(typeNode) {
    if (['NonNullType', 'ListType'].includes(typeNode.kind)) {
        const wrappedType = typeNode;
        return unwrapType(wrappedType.type);
    }
    return typeNode;
}
function isListType(typeNode) {
    if (typeNode.kind === 'ListType') {
        return true;
    }
    if (typeNode.kind === 'NonNullType') {
        const node = typeNode;
        return isListType(node.type);
    }
    return false;
}
function getAliasDirective(field) {
    const alias = (field.directives || []).find((dir) => dir.name.value === 'jsonAlias');
    if (!alias) {
        return null;
    }
    const forArg = (alias.arguments || []).find((arg) => arg.name.value === 'for');
    if (!forArg) {
        return null;
    }
    return (0, graphql_1.valueFromAST)(forArg.value, graphql_1.GraphQLString, {});
}
function getReferenceDirective(field) {
    return (field.directives || []).find((dir) => dir.name.value === 'reference');
}
