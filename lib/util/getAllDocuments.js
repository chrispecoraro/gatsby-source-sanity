"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDocuments = void 0;
const split2_1 = __importDefault(require("split2"));
const rejectOnApiError_1 = require("./rejectOnApiError");
const getDocumentStream_1 = require("./getDocumentStream");
const handleDrafts_1 = require("./handleDrafts");
const through = __importStar(require("through2"));
const removeSystemDocuments_1 = require("./removeSystemDocuments");
const pumpify_1 = __importDefault(require("pumpify"));
async function getAllDocuments(url, token, options = {}) {
    return pumpify_1.default.obj(await (0, getDocumentStream_1.getDocumentStream)(url, token), (0, split2_1.default)(JSON.parse), options.includeDrafts ? through.obj() : (0, handleDrafts_1.removeDrafts)(), (0, removeSystemDocuments_1.removeSystemDocuments)(), (0, rejectOnApiError_1.rejectOnApiError)());
}
exports.getAllDocuments = getAllDocuments;
//# sourceMappingURL=getAllDocuments.js.map