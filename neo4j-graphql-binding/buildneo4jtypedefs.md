---
description: Augments your typeDefs to support an auto-generated API.
---

# buildNeo4jTypeDefs

## API Reference

* `typeDefs` \(required\): Your GraphQL type definitions in [SDL format](https://www.prisma.io/blog/graphql-sdl-schema-definition-language-6755bcb9ce51/). 
* `query` \(default: `true`\): A Boolean controlling whether to generate query types. 
* `mutation` \(default: `true`\): A Boolean controlling whether to generate mutation types.

## Example

```javascript
import { buildNeo4jTypeDefs } from 'neo4j-graphql-binding';

const typeDefs = `
  type Technology @model {
    name: String! @unique
    integration: [Technology] @relation(name: "HAPPINESS", direction: OUT)
    integrationCount: Int @cypher(statement: """ 
      MATCH (this)-[:HAPPINESS]->(t:Technology)
      RETURN count(t)
    """)
  }
  type Query {
    Technology: [Technology] @cypher(statement: """
      MATCH (t:Technology) RETURN t
    """)
  }
  type Mutation {
    deleteTechnology(id: ID!): Boolean @cypher(statement: """
      MATCH (t: Technology {id: $id})
      DETACH DELETE t
      RETURN TRUE
    """)
  }
  schema {
    query: Query
    mutation: Mutation
  }
`;

const augmented = buildNeo4jTypeDefs({
  typeDefs: typeDefs
});
```

The resulting augmented schema would contain the following types, including input types used to support various features.

```graphql
type Technology @model {
  _id: Int
  id: ID! @unique
  name: String! @unique
  integration(
    id: ID, 
    ids: [ID], 
    name: String, 
    names: [String], 
    integrationCount: Int, 
    integrationCounts: [Int], 
    filter: [_TechnologyFilter], 
    orderBy: [_TechnologyOrdering], 
    _id: Int, 
    _ids: [Int], 
    first: Int, 
    offset: Int
  ): [Technology] @relation(name: "HAPPINESS", direction: OUT)
  integrationCount: Int @cypher(statement: """
    MATCH (this)-[:HAPPINESS]->(t:Technology)
    RETURN count(t)
  """)
}

type Query {
  Technology: [Technology] @cypher(statement: """
    MATCH (t:Technology) RETURN t
  """)
}

type Mutation {
  deleteTechnology(id: ID!): Boolean @cypher(statement: """
    MATCH (t: Technology {id: $id})
    DETACH DELETE t
    RETURN TRUE
  """)
  # Generated query and mutation types currently recieve a 
  # Neo4jGraphQLBinding directive
  createTechnology(data: TechnologyCreateInput!): Technology @Neo4jGraphQLBinding
}

schema {
  query: Query
  mutation: Mutation
}
```

