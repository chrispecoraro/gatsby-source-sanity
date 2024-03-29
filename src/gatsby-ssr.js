"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onRenderBody = void 0;
const react_1 = require("react");
const onRenderBody = ({ setHeadComponents, }) => {
    setHeadComponents([
        (0, react_1.createElement)('link', {
            rel: 'preconnect',
            key: 'sanity-cdn-preconnect',
            href: 'https://cdn.sanity.io',
        }),
    ]);
};
exports.onRenderBody = onRenderBody;
