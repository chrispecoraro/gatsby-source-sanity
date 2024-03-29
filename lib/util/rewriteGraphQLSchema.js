"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewriteGraphQLSchema = void 0;
const graphql_1 = require("gatsby/graphql");
const lodash_1 = require("lodash");
const normalize_1 = require("./normalize");
const builtins = ['ID', 'String', 'Boolean', 'Int', 'Float', 'JSON', 'DateTime', 'Date'];
const wantedNodeTypes = ['ObjectTypeDefinition', 'UnionTypeDefinition', 'InterfaceTypeDefinition'];
const rewriteGraphQLSchema = (schemaSdl, context) => {
    const ast = (0, graphql_1.parse)(schemaSdl);
    const transformedAst = transformAst(ast, context);
    const transformed = (0, graphql_1.print)(transformedAst);
    return transformed;
};
exports.rewriteGraphQLSchema = rewriteGraphQLSchema;
function transformAst(ast, context) {
    return Object.assign(Object.assign({}, ast), { definitions: ast.definitions
            .filter(isWantedAstNode)
            .map((node) => transformDefinitionNode(node, context, ast))
            .concat(getResolveReferencesConfigType()) });
}
function isWantedAstNode(astNode) {
    const node = astNode;
    return wantedNodeTypes.includes(node.kind) && node.name.value !== 'RootQuery';
}
function transformDefinitionNode(node, context, ast) {
    switch (node.kind) {
        case 'ObjectTypeDefinition':
            return transformObjectTypeDefinition(node, context, ast);
        case 'UnionTypeDefinition':
            return transformUnionTypeDefinition(node, context);
        case 'InterfaceTypeDefinition':
            return transformInterfaceTypeDefinition(node, context);
        default:
            return node;
    }
}
function transformObjectTypeDefinition(node, context, ast) {
    const scalars = ast.definitions
        .filter((def) => def.kind === 'ScalarTypeDefinition')
        .map((scalar) => scalar.name.value)
        .concat(graphql_1.specifiedScalarTypes.map((scalar) => scalar.name));
    const fields = node.fields || [];
    const jsonTargets = fields
        .map(getJsonAliasTarget)
        .filter((target) => target !== null);
    const blockFields = jsonTargets.map(makeBlockField);
    const interfaces = (node.interfaces || []).map(maybeRewriteType);
    const rawFields = getRawFields(fields, scalars);
    // Implement Gatsby node interface if it is a document
    if (isDocumentType(node)) {
        interfaces.push({ kind: 'NamedType', name: { kind: 'Name', value: 'Node' } });
    }
    return Object.assign(Object.assign({}, node), { name: Object.assign(Object.assign({}, node.name), { value: getTypeName(node.name.value) }), interfaces, directives: [{ kind: 'Directive', name: { kind: 'Name', value: 'dontInfer' } }], fields: [
            ...fields
                .filter((field) => !isJsonAlias(field))
                .map((field) => transformFieldNodeAst(field, node, context)),
            ...blockFields,
            ...rawFields,
        ] });
}
function getRawFields(fields, scalars) {
    return fields
        .filter((field) => isJsonAlias(field) || !isScalar(field, scalars))
        .reduce((acc, field) => {
        const jsonAlias = getJsonAliasTarget(field);
        const name = jsonAlias || field.name.value;
        acc.push({
            kind: field.kind,
            name: { kind: 'Name', value: '_' + (0, lodash_1.camelCase)(`raw ${name}`) },
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'JSON' } },
            arguments: [
                {
                    kind: 'InputValueDefinition',
                    name: { kind: 'Name', value: 'resolveReferences' },
                    type: {
                        kind: 'NamedType',
                        name: { kind: 'Name', value: 'SanityResolveReferencesConfiguration' },
                    },
                },
            ],
        });
        return acc;
    }, []);
}
function isScalar(field, scalars) {
    return scalars.includes(unwrapType(field.type).name.value);
}
function transformUnionTypeDefinition(node, context) {
    return Object.assign(Object.assign({}, node), { types: (node.types || []).map(maybeRewriteType), name: Object.assign(Object.assign({}, node.name), { value: getTypeName(node.name.value) }) });
}
function transformInterfaceTypeDefinition(node, context) {
    const fields = node.fields || [];
    return Object.assign(Object.assign({}, node), { fields: fields.map((field) => transformFieldNodeAst(field, node, context)), name: Object.assign(Object.assign({}, node.name), { value: getTypeName(node.name.value) }) });
}
function unwrapType(typeNode) {
    if (['NonNullType', 'ListType'].includes(typeNode.kind)) {
        const wrappedType = typeNode;
        return unwrapType(wrappedType.type);
    }
    return typeNode;
}
function getJsonAliasTarget(field) {
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
function isJsonAlias(field) {
    return getJsonAliasTarget(field) !== null;
}
function makeBlockField(name) {
    return {
        kind: 'FieldDefinition',
        name: {
            kind: 'Name',
            value: name,
        },
        arguments: [],
        directives: [],
        type: {
            kind: 'ListType',
            type: {
                kind: 'NamedType',
                name: {
                    kind: 'Name',
                    value: 'SanityBlock',
                },
            },
        },
    };
}
function makeNullable(nodeType) {
    if (nodeType.kind === 'NamedType') {
        return maybeRewriteType(nodeType);
    }
    if (nodeType.kind === 'ListType') {
        const unwrapped = maybeRewriteType(unwrapType(nodeType));
        return {
            kind: 'ListType',
            type: makeNullable(unwrapped),
        };
    }
    return maybeRewriteType(nodeType.type);
}
function transformFieldNodeAst(node, parent, context) {
    const field = Object.assign(Object.assign({}, node), { name: maybeRewriteFieldName(node, parent, context), type: rewireIdType(makeNullable(node.type)), description: undefined, directives: [] });
    if (field.type.kind === 'NamedType' && field.type.name.value === 'Date') {
        field.directives.push({
            kind: 'Directive',
            name: { kind: 'Name', value: 'dateformat' },
        });
    }
    return field;
}
function rewireIdType(nodeType) {
    if (nodeType.kind === 'NamedType' && nodeType.name.value === 'ID') {
        return Object.assign(Object.assign({}, nodeType), { name: { kind: 'Name', value: 'String' } });
    }
    return nodeType;
}
function maybeRewriteType(nodeType) {
    const type = nodeType;
    if (typeof type.name === 'undefined') {
        return nodeType;
    }
    // Gatsby has a date type, but not a datetime, so rewire it
    if (type.name.value === 'DateTime') {
        return Object.assign(Object.assign({}, type), { name: { kind: 'Name', value: 'Date' } });
    }
    if (builtins.includes(type.name.value)) {
        return type;
    }
    return Object.assign(Object.assign({}, type), { name: { kind: 'Name', value: getTypeName(type.name.value) } });
}
function maybeRewriteFieldName(field, parent, context) {
    if (!normalize_1.RESTRICTED_NODE_FIELDS.includes(field.name.value)) {
        return field.name;
    }
    if (parent.kind === 'ObjectTypeDefinition' && !isDocumentType(parent)) {
        return field.name;
    }
    const parentTypeName = parent.name.value;
    const newFieldName = (0, normalize_1.getConflictFreeFieldName)(field.name.value);
    context.reporter.warn(`[sanity] Type \`${parentTypeName}\` has field with name \`${field.name.value}\`, which conflicts with Gatsby's internal properties. Renaming to \`${newFieldName}\``);
    return Object.assign(Object.assign({}, field.name), { value: newFieldName });
}
function isDocumentType(node) {
    return (node.interfaces || []).some((iface) => iface.kind === 'NamedType' &&
        (iface.name.value === 'SanityDocument' || iface.name.value === 'Document'));
}
function getTypeName(name) {
    return name.startsWith('Sanity') ? name : `Sanity${name}`;
}
function getResolveReferencesConfigType() {
    return {
        kind: 'InputObjectTypeDefinition',
        name: { kind: 'Name', value: 'SanityResolveReferencesConfiguration' },
        fields: [
            {
                kind: 'InputValueDefinition',
                name: { kind: 'Name', value: 'maxDepth' },
                type: {
                    kind: 'NonNullType',
                    type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
                },
                description: { kind: 'StringValue', value: 'Max depth to resolve references to' },
            },
        ],
    };
}
//# sourceMappingURL=rewriteGraphQLSchema.js.map