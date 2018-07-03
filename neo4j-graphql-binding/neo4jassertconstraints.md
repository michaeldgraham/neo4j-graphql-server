---
description: >-
  Uses the APOC extension to keep Neo4j property constraints in sync with
  @unique fields.
---

# neo4jAssertConstraints

In order to support the use of a `@unique` field directive, `neo4jAssertConstraints` can be used to send a Cypher query to your Neo4j instance that executes the `apoc.schema.assert` procedure. For each type with a `@model` directive, constraints are created and kept for any fields on that type with a `@unique` directive, in addition to all generated `id` fields.

## API Reference

* `typeDefs` \(required\): Your GraphQL type definitions in [SDL format](https://www.prisma.io/blog/graphql-sdl-schema-definition-language-6755bcb9ce51/). 
* `driver`\(required\): Your Neo4j driver instance \(More info [here](https://www.npmjs.com/package/neo4j-driver)\). 
* `log` \(default: `false`\): Logs result from operation.

## Example

The following would result in the creation of an index and constraint on the `name` property of `Technology` nodes in your Neo4j instance.

```javascript
import { neo4jAssertConstraints } from 'neo4j-graphql-binding';

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "neo4j"
  )
);

const typeDefs = /* GraphQL */`
  type Technology @model {
    name: String! @unique
  }
`;

neo4jAssertConstraints({
  typeDefs: typeDefs,
  driver: driver,
  log: true
});
```

## Resources

* APOC: An Introduction to User-Defined Procedures and APOC [https://neo4j.com/blog/intro-user-defined-procedures-apoc/](https://neo4j.com/blog/intro-user-defined-procedures-apoc/)  
* Neo4j Constraints [https://neo4j.com/docs/developer-manual/current/get-started/cypher/labels-constraints-and-indexes/](https://neo4j.com/docs/developer-manual/current/get-started/cypher/labels-constraints-and-indexes/)

