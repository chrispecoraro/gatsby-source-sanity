import { Node, NodeInput } from 'gatsby';
import { GraphQLFieldResolver } from 'gatsby/graphql';
export interface SanityNode extends Node {
    _id: string;
}
export interface SanityInputNode extends NodeInput {
    _id: string;
}
export type GatsbyNodeModel = {
    getNodeById: (args: {
        id: string;
    }) => SanityNode;
};
export type GatsbyGraphQLContext = {
    nodeModel: GatsbyNodeModel;
};
export type GatsbyResolverMap = {
    [typeName: string]: {
        [fieldName: string]: {
            type?: string;
            resolve: GraphQLFieldResolver<{
                [key: string]: any;
            }, GatsbyGraphQLContext>;
        };
    };
};
