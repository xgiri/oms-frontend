export const environment = {
  production: true,
  apiUrl: 'http://localhost:8090/api/v1', // TODO: swap for your real prod URL later
  // Gateway's /graphql route (oms-gateway -> oms-bff) — not under /api/v1,
  // so this can't just be derived from apiUrl by appending a path.
  graphqlUrl: 'http://localhost:8090/graphql', // TODO: swap for your real prod URL later
};