/**
 * SPEC-app-shell §2.1: `<meta http-equiv="origin-trial">` only when a token is configured
 * (T-07 plan D15). React 19 hoists a `<meta>` rendered in the body into `<head>`, where Chrome
 * reads it.
 */
export function OriginTrialMeta({ token }: { token: string | null }) {
  return token ? <meta httpEquiv="origin-trial" content={token} /> : null;
}
