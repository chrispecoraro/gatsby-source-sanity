"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConflictFreeFieldName = exports.getTypeName = exports.toGatsbyNode = exports.RESTRICTED_NODE_FIELDS = void 0;
var mutator_1 = require("@sanity/mutator");
var graphql_1 = require("gatsby/graphql");
var lodash_1 = require("lodash");
var documentIds_1 = require("./documentIds");
var image_url_1 = __importDefault(require("@sanity/image-url"));
var scalarTypeNames = graphql_1.specifiedScalarTypes.map(function (def) { return def.name; }).concat(['JSON', 'Date']);
// Movie => SanityMovie
var typePrefix = 'Sanity';
// Node fields used internally by Gatsby.
exports.RESTRICTED_NODE_FIELDS = ['id', 'children', 'parent', 'fields', 'internal'];
// Transform a Sanity document into a Gatsby node
function toGatsbyNode(doc, options) {
    var _a, _b, _c, _d, _e, _f;
    var createNodeId = options.createNodeId, createContentDigest = options.createContentDigest, overlayDrafts = options.overlayDrafts;
    var rawAliases = getRawAliases(doc, options);
    var safe = prefixConflictingKeys(doc);
    var withRefs = rewriteNodeReferences(safe, options);
    var type = getTypeName(doc._type);
    var urlBuilder = (0, image_url_1.default)(options.client);
    var gatsbyImageCdnFields = ["SanityImageAsset", "SanityFileAsset"].includes(type)
        ? {
            filename: withRefs.originalFilename,
            width: (_b = (_a = withRefs === null || withRefs === void 0 ? void 0 : withRefs.metadata) === null || _a === void 0 ? void 0 : _a.dimensions) === null || _b === void 0 ? void 0 : _b.width,
            height: (_d = (_c = withRefs === null || withRefs === void 0 ? void 0 : withRefs.metadata) === null || _c === void 0 ? void 0 : _c.dimensions) === null || _d === void 0 ? void 0 : _d.height,
            url: withRefs === null || withRefs === void 0 ? void 0 : withRefs.url,
            placeholderUrl: type === "SanityImageAsset"
                ? (_f = (_e = urlBuilder
                    .image(withRefs.url)
                    .width(20)
                    .height(30)
                    .quality(80)
                    .url()) === null || _e === void 0 ? void 0 : _e.replace("w=20", "w=%width%")) === null || _f === void 0 ? void 0 : _f.replace("h=30", "h=%height%")
                : null,
        }
        : {};
    return __assign(__assign(__assign(__assign({}, withRefs), rawAliases), gatsbyImageCdnFields), { id: (0, documentIds_1.safeId)(overlayDrafts ? (0, documentIds_1.unprefixId)(doc._id) : doc._id, createNodeId), children: [], internal: {
            type: type,
            contentDigest: createContentDigest(JSON.stringify(withRefs)),
        } });
}
exports.toGatsbyNode = toGatsbyNode;
// movie => SanityMovie
// blog_post => SanityBlogPost
// sanity.imageAsset => SanityImageAsset
function getTypeName(type) {
    if (!type) {
        return type;
    }
    var typeName = (0, lodash_1.startCase)(type);
    if (scalarTypeNames.includes(typeName)) {
        return typeName;
    }
    return "".concat(typePrefix).concat(typeName.replace(/\s+/g, '').replace(/^Sanity/, ''));
}
exports.getTypeName = getTypeName;
// {foo: 'bar', children: []} => {foo: 'bar', sanityChildren: []}
function prefixConflictingKeys(obj) {
    // Will be overwritten, but initialize for type safety
    var initial = { _id: '', _type: '', _rev: '', _createdAt: '', _updatedAt: '' };
    return Object.keys(obj).reduce(function (target, key) {
        var targetKey = getConflictFreeFieldName(key);
        target[targetKey] = obj[key];
        return target;
    }, initial);
}
function getConflictFreeFieldName(fieldName) {
    return exports.RESTRICTED_NODE_FIELDS.includes(fieldName)
        ? "".concat((0, lodash_1.camelCase)(typePrefix)).concat((0, lodash_1.upperFirst)(fieldName))
        : fieldName;
}
exports.getConflictFreeFieldName = getConflictFreeFieldName;
function getRawAliases(doc, options) {
    var typeMap = options.typeMap;
    var typeName = getTypeName(doc._type);
    var type = typeMap.objects[typeName];
    if (!type) {
        return {};
    }
    var initial = {};
    return Object.keys(type.fields).reduce(function (acc, fieldName) {
        var field = type.fields[fieldName];
        var namedType = field.namedType.name.value;
        if (field.aliasFor) {
            var aliasName_1 = '_' + (0, lodash_1.camelCase)("raw_data_".concat(field.aliasFor));
            acc[aliasName_1] = doc[field.aliasFor];
            return acc;
        }
        if (typeMap.scalars.includes(namedType)) {
            return acc;
        }
        var aliasName = '_' + (0, lodash_1.camelCase)("raw_data_".concat(fieldName));
        acc[aliasName] = doc[fieldName];
        return acc;
    }, initial);
}
// Tranform Sanity refs ({_ref: 'foo'}) to Gatsby refs ({_ref: 'someOtherId'})
function rewriteNodeReferences(doc, options) {
    var createNodeId = options.createNodeId;
    var refs = (0, mutator_1.extractWithPath)('..[_ref]', doc);
    if (refs.length === 0) {
        return doc;
    }
    var newDoc = (0, lodash_1.cloneDeep)(doc);
    refs.forEach(function (match) {
        (0, lodash_1.set)(newDoc, match.path, (0, documentIds_1.safeId)(match.value, createNodeId));
    });
    return newDoc;
}
