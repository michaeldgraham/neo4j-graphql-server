import { parse, print, printSchema } from 'graphql';
import { ApolloServer, makeExecutableSchema, mergeSchemas } from 'apollo-server';
import {
  neo4jIDL,
  neo4jAssertConstraints,
  neo4jGraphQLBinding,
  buildNeo4jTypeDefs,
  buildNeo4jResolvers
} from 'neo4j-graphql-binding';

export const Neo4jGraphQLServer = ({
  bindingKey="neo4j",
  typeDefs,
  context={},
  driver,
  mocks={},
  resolvers={},
  schemaDirectives={},
  validationRules=false,
  subscriptions={},
  introspection=true,
  cacheControl=false,
  tracing=false,
  debug=false,
  log=false,
  engine=false,
  indexConfig={
    use: "cuid"
  },
  calls={
    assert: true,
    idl: true
  },
  augment={},
  formatError=false,
  formatResponse=false,
  formatParams=false,
  readOnly=false,
  bindings={}
}) => {
  if(bindings[bindingKey]) {
    throw Error(`Neo4jGraphQLServer: The key '${bindingKey}' is reserved for your local binding.`);
  }
  // Set local binding configuration into bindings
  bindings[bindingKey] = {
    typeDefs: typeDefs,
    resolvers: resolvers,
    driver: driver,
    calls: calls,
    augment: augment,
    indexConfig: indexConfig,
    readOnly: readOnly,
    log: log
  };
  // Process all bindings
  const bindingsInfo = processBindings({
    bindings: bindings,
    resolvers: resolvers
  });
  // Merge all schemas
  const merged = mergeSchemas({
    schemas: bindingsInfo.schemas
  });
  // Add all bindings to context
  context = setBindingsIntoRequestContext({
    bindings: bindingsInfo.created,
    context: context
  });
  // Setup Apollo Server
  return new ApolloServer({
    typeDefs: printSchema(merged),
    resolvers: bindingsInfo.resolvers,
    context: context,
    mocks: mocks,
    schemaDirectives: schemaDirectives,
    introspection: introspection,
    debug: debug,
    validationRules: validationRules,
    tracing: tracing,
    cacheControl: cacheControl,
    subscriptions: subscriptions,
    engine: engine,
    formatError: formatError,
    formatResponse: formatResponse,
    formatParams: formatParams
  });
}

const processBindings = ({
  bindings,
  resolvers
}) => {
  let schemas = [];
  let created = {};
  let schema = {};
  let bindingConfig = {};
  let processedBinding = {};
  let allResolvers = resolvers;
  Object.keys(bindings).forEach(bindingKey => {
    bindingConfig = bindings[bindingKey];
    // Set resolvers and bindingKey parameters for processBinding
    bindingConfig.resolvers = allResolvers;
    bindingConfig.bindingKey = bindingKey;
    processedBinding = processBinding(bindingConfig);
    // Place the binding in the object of all created bindings
    created[bindingKey] = processedBinding.binding;
    // Merge resolvers
    allResolvers.Query = Object.assign(allResolvers.Query, processedBinding.resolvers.Query);
    allResolvers.Mutation = Object.assign(allResolvers.Mutation, processedBinding.resolvers.Mutation);
    // Make schema, all schemas merged later
    schema = makeExecutableSchema({
      typeDefs: processedBinding.typeDefs
    });
    schemas.push(schema);
  });
  return {
    schemas: schemas,
    resolvers: allResolvers,
    created: created
  };
}
const processBinding = ({
  typeDefs,
  resolvers={},
  indexConfig={
    use: "cuid"
  },
  calls={
    assert: true,
    idl: true
  },
  augment={},
  driver,
  log,
  bindingKey,
  readOnly
}) => {
  if(typeDefs === undefined) { throw Error(`Neo4jGraphQLServer: typeDefs are undefined.`); }
  if(driver === undefined) { throw Error(`Neo4jGraphQLServer: driver is undefined.`); }
  if(typeof readOnly !== 'boolean') { throw Error(`Neo4jGraphQLServer: readOnly must be a Boolean.`); }
  if(!augment.typeDefs) augment.typeDefs = {};
  if(!augment.resolvers) augment.resolvers = {};
  if(!resolvers.Query) resolvers.Query = {};
  if(!resolvers.Mutation) resolvers.Mutation = {};
  if(readOnly !== true) {
    // IDL
    if(calls === undefined || calls.idl === undefined || calls.idl) {
      neo4jIDL({
        driver: driver,
        typeDefs: typeDefs,
        log: log
      });
    }
    // ASSERT CONSTRAINTS
    if(calls === undefined || calls.assert === undefined || calls.assert) {
      neo4jAssertConstraints({
        driver: driver,
        typeDefs: typeDefs,
        log: log
      });
    }
  }
  // AUGMENT SCHEMA
  const buildQueryTypes = augment.typeDefs && typeof augment.typeDefs.query == "boolean" ? augment.typeDefs.query : true;
  let buildMutationTypes = augment.typeDefs && typeof augment.typeDefs.mutation == "boolean" ? augment.typeDefs.mutation : true;
  let idFields = true;
  // Do not generate mutation types or inject id fields if readOnly
  if(readOnly === true) {
    buildMutationTypes = false;
    idFields = false;
  }
  typeDefs = buildNeo4jTypeDefs({
    typeDefs: typeDefs,
    query: buildQueryTypes,
    mutation: buildMutationTypes,
    idFields: idFields,
    isForRemote: false
  });
  if(readOnly === true) indexConfig = false;
  // CREATE BINDING
  const binding = neo4jGraphQLBinding({
    typeDefs: typeDefs,
    driver: driver,
    log: log,
    indexConfig: indexConfig
  });
  const buildQueryResolvers= augment.resolvers && typeof augment.resolvers.query == "boolean" ? augment.resolvers.query : true;
  let buildMutationResolvers = augment.resolvers && typeof augment.resolvers.mutation == "boolean" ? augment.resolvers.mutation : true;
  // Do not generate mutation resolvers if readOnly
  if(readOnly === true) buildMutationResolvers = false;
  if(buildQueryResolvers || buildMutationResolvers) {
    resolvers = buildNeo4jResolvers({
      bindingKey: bindingKey,
      typeDefs: typeDefs,
      resolvers: resolvers,
      query: buildQueryResolvers,
      mutation: buildMutationResolvers,
      bindingKey: bindingKey
    });
  }
  return {
    typeDefs: typeDefs,
    resolvers: resolvers,
    binding: binding
  };
}
const setBindingsIntoRequestContext = ({
  context,
  bindings
}) => {
  Object.keys(bindings).forEach(name => {
    context[name] = bindings[name];
  });
  return context;
}
