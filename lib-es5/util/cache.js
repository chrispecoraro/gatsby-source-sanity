"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCacheKey = exports.CACHE_KEYS = void 0;
var CACHE_KEYS;
(function (CACHE_KEYS) {
    CACHE_KEYS["TYPE_MAP"] = "typeMap";
    CACHE_KEYS["GRAPHQL_SDL"] = "graphqlSdl";
    CACHE_KEYS["IMAGE_EXTENSIONS"] = "imageExt";
})(CACHE_KEYS = exports.CACHE_KEYS || (exports.CACHE_KEYS = {}));
function getCacheKey(config, suffix) {
    return "".concat(config.projectId, "-").concat(config.dataset, "-").concat(suffix);
}
exports.getCacheKey = getCacheKey;
