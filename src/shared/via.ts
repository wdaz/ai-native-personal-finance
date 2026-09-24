/**
 * SPEC-webmcp-tools §2.5 and §2.8: the marker every API request a WebMCP tool makes carries.
 * One definition for the client that sends it and the server that records it. HTTP header
 * names are case-insensitive; this is the spelling the SPEC uses.
 */
export const VIA_HEADER = "X-Via";
export const VIA_WEBMCP = "webmcp";
