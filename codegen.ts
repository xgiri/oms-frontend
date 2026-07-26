import type { CodegenConfig } from '@graphql-codegen/cli';

// Points at oms-bff's schema *file* directly, not its live /graphql endpoint —
// that endpoint requires a valid bearer token to introspect (see oms-bff's
// SecurityConfig), which would make codegen depend on a running, logged-in
// stack. A sibling checkout on disk (same layout oms-main's
// docker-compose.yml already assumes: dev/oms-main, dev/oms-bff side by
// side) keeps this a static, CI-friendly step.
//
// Scoped to just the order-detail view for now (Step 3: migrate one Angular
// view) — `documents` only picks up .graphql files under that one feature
// folder. Widen this glob as more views move over to GraphQL.
const config: CodegenConfig = {
  schema: '../oms-bff/src/main/resources/graphql/schema.graphqls',
  documents: 'src/app/features/orders/order-detail/**/*.graphql',
  generates: {
    'src/app/features/orders/order-detail/order-detail.generated.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
    },
  },
};

export default config;
