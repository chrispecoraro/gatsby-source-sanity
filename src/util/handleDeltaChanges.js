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
exports.sleep = void 0;
const debug_1 = __importDefault(require("../debug"));
const getPluginStatus_1 = require("./getPluginStatus");
const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
exports.sleep = sleep;
// Ensures document changes are persisted to the query engine.
const SLEEP_DURATION = 500;
/**
 * Queries all documents changed since last build & adds them to Gatsby's store
 */
function handleDeltaChanges({ args, lastBuildTime, client, syncWithGatsby, }) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, exports.sleep)(SLEEP_DURATION);
        try {
            const changedDocs = yield client.fetch('*[!(_type match "system.**") && _updatedAt > $timestamp]', {
                timestamp: lastBuildTime.toISOString(),
            });
            changedDocs.forEach((doc) => {
                syncWithGatsby(doc._id, doc);
            });
            (0, getPluginStatus_1.registerBuildTime)(args);
            args.reporter.info(`[sanity] ${changedDocs.length} documents updated.`);
            return true;
        }
        catch (error) {
            (0, debug_1.default)(`[sanity] failed to handleDeltaChanges`, error);
            return false;
        }
    });
}
exports.default = handleDeltaChanges;
