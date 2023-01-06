import { SanityClient } from '@sanity/client';
import { SourceNodesArgs } from 'gatsby';
import { SyncWithGatsby } from './getSyncWithGatsby';
export declare const sleep: (ms: number) => Promise<unknown>;
/**
 * Queries all documents changed since last build & adds them to Gatsby's store
 */
export default function handleDeltaChanges({ args, lastBuildTime, client, syncWithGatsby, }: {
    args: SourceNodesArgs;
    lastBuildTime: Date;
    client: SanityClient;
    syncWithGatsby: SyncWithGatsby;
}): Promise<boolean>;
