---
description: Updates your Neo4j-GraphQL schema by calling the graphql.idl procedure.
---

# neo4jIDL

In order to update your Neo4j-GraphQL schema, you can use the `neo4jIDL`export, which sends a request to Neo4j to call the [graphql.idl](https://github.com/neo4j-graphql/neo4j-graphql/tree/3.3#uploading-a-graphql-schema) procedure using the `typeDefs` you provide.

Block strings in `@cypher` directives are supported by turning them into single line statements before sending the call to `graphql.idl`.

## API Reference

* `typeDefs` \(required\): Your GraphQL type definitions in [SDL format](https://www.prisma.io/blog/graphql-sdl-schema-definition-language-6755bcb9ce51/).  
* `driver`\(required\): Your Neo4j driver instance \(More info [here](https://www.npmjs.com/package/neo4j-driver)\).  
* `log` \(default: `false`\): Logs result from operation.

## Example

`typeDefs`

```graphql
type Movie @model {
  title: String!
  released: Int
  actors: [Person] @relation(name:"ACTED_IN",direction:IN)
  # computed field
  directors: [Person] @cypher(statement: """
    MATCH (this)<-[:DIRECTED]-(d) RETURN d
  """)
}
type Person @model {
  name: String!
  born: Int
  movies: [Movie] @relation(name:"ACTED_IN")
}
type Query {
  coActors(name:ID!): [Person] @cypher(statement:"""
    MATCH (p:Person {name:$name})-[:ACTED_IN]->()<-[:ACTED_IN]-(co) 
    RETURN distinct co
  """)
}
type Mutation {
  rateMovie(user:ID!, movie:ID!, rating:Int!): Int @cypher(statement: """
    MATCH (p:Person {name:$user}),(m:Movie {title:$movie}) 
    MERGE (p)-[r:RATED]->(m) SET r.rating=$rating 
    RETURN r.rating
  """)
}
schema {
   query: Query
   mutation: Mutation
}
```

```javascript
import { neo4jIDL } from 'neo4j-graphql-binding';

neo4jIDL({
  typeDefs: typeDefs,
  driver: driver,
  log: true
});
```

