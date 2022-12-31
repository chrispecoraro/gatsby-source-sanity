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
exports.registerBuildTime = exports.getLastBuildTime = void 0;
function getPluginStatus(args) {
    var _a;
    return (_a = args.store.getState().status.plugins) === null || _a === void 0 ? void 0 : _a[`gatsby-source-sanity`];
}
exports.default = getPluginStatus;
const LAST_BUILD_KEY = 'lastBuildTime';
function getLastBuildTime(args) {
    try {
        return new Date(getPluginStatus(args)[LAST_BUILD_KEY]);
    }
    catch (error) {
        // Not a date, return undefined
        return;
    }
}
exports.getLastBuildTime = getLastBuildTime;
function registerBuildTime(args) {
    return __awaiter(this, void 0, void 0, function* () {
        args.actions.setPluginStatus(Object.assign(Object.assign({}, (getPluginStatus(args) || {})), { [LAST_BUILD_KEY]: new Date().toISOString() }));
    });
}
exports.registerBuildTime = registerBuildTime;
