"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeId = exports.unprefixId = exports.prefixId = exports.isDraftId = void 0;
function isDraftId(id) {
    return id.startsWith('drafts.');
}
exports.isDraftId = isDraftId;
const prefixId = (id) => (id.startsWith('drafts.') ? id : `drafts.${id}`);
exports.prefixId = prefixId;
const unprefixId = (id) => id.replace(/^drafts\./, '');
exports.unprefixId = unprefixId;
const safeId = (id, makeSafe) => {
    return /^(image|file)-[a-z0-9]{32,}-/.test(id)
        ? // Use raw IDs for assets as we might use these with asset tooling
            id
        : // Prefix Gatsbyfied IDs with a dash as it's not allowed in Sanity,
            // thus enabling easy checks for Gatsby vs Sanity IDs
            `-${makeSafe(id)}`;
};
exports.safeId = safeId;
