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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocumentStream = void 0;
const axios_1 = __importDefault(require("axios"));
const get_stream_1 = __importDefault(require("get-stream"));
const index_1 = require("../index");
function getDocumentStream(url, token) {
    const headers = Object.assign({ 'User-Agent': `${index_1.pkgName}` }, (token ? { Authorization: `Bearer ${token}` } : {}));
    return (0, axios_1.default)({
        method: 'get',
        responseType: 'stream',
        url,
        headers,
    })
        .then((res) => res.data)
        .catch((err) => __awaiter(this, void 0, void 0, function* () {
        if (!err.response || !err.response.data) {
            throw err;
        }
        let error = err;
        try {
            // Try to lift error message out of JSON payload ({error, message, statusCode})
            const data = yield (0, get_stream_1.default)(err.response.data);
            error = new Error(JSON.parse(data).message);
        }
        catch (jsonErr) {
            // Do nothing, throw regular error
        }
        throw error;
    }));
}
exports.getDocumentStream = getDocumentStream;
