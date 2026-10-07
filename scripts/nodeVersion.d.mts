export const REQUIRED_NODE_DESCRIPTION: string;
export function parseNodeVersion(version: string): { major: number; minor: number; patch: number } | null;
export function isSupportedNode(version: string): boolean;
export function unsupportedNodeMessage(version: string): string;
