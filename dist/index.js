'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Neo4jGraphQLServer = undefined;

var _graphql = require('graphql');

var _apolloServer = require('apollo-server');

var _neo4jGraphqlBinding = require('neo4j-graphql-binding');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Neo4jGraphQLServer = exports.Neo4jGraphQLServer = function Neo4jGraphQLServer(_ref) {
  var _ref$bindingKey = _ref.bindingKey,
      bindingKey = _ref$bindingKey === undefined ? "neo4j" : _ref$bindingKey,
      typeDefs = _ref.typeDefs,
      _ref$context = _ref.context,
      context = _ref$context === undefined ? {} : _ref$context,
      driver = _ref.driver,
      _ref$mocks = _ref.mocks,
      mocks = _ref$mocks === undefined ? {} : _ref$mocks,
      _ref$resolvers = _ref.resolvers,
      resolvers = _ref$resolvers === undefined ? {} : _ref$resolvers,
      _ref$schemaDirectives = _ref.schemaDirectives,
      schemaDirectives = _ref$schemaDirectives === undefined ? {} : _ref$schemaDirectives,
      _ref$validationRules = _ref.validationRules,
      validationRules = _ref$validationRules === undefined ? false : _ref$validationRules,
      _ref$subscriptions = _ref.subscriptions,
      subscriptions = _ref$subscriptions === undefined ? {} : _ref$subscriptions,
      _ref$introspection = _ref.introspection,
      introspection = _ref$introspection === undefined ? true : _ref$introspection,
      _ref$cacheControl = _ref.cacheControl,
      cacheControl = _ref$cacheControl === undefined ? false : _ref$cacheControl,
      _ref$tracing = _ref.tracing,
      tracing = _ref$tracing === undefined ? false : _ref$tracing,
      _ref$debug = _ref.debug,
      debug = _ref$debug === undefined ? false : _ref$debug,
      _ref$log = _ref.log,
      log = _ref$log === undefined ? false : _ref$log,
      _ref$engine = _ref.engine,
      engine = _ref$engine === undefined ? false : _ref$engine,
      _ref$indexConfig = _ref.indexConfig,
      indexConfig = _ref$indexConfig === undefined ? {
    use: "cuid"
  } : _ref$indexConfig,
      _ref$calls = _ref.calls,
      calls = _ref$calls === undefined ? {
    assert: true,
    idl: true
  } : _ref$calls,
      _ref$augment = _ref.augment,
      augment = _ref$augment === undefined ? {} : _ref$augment,
      _ref$formatError = _ref.formatError,
      formatError = _ref$formatError === undefined ? false : _ref$formatError,
      _ref$formatResponse = _ref.formatResponse,
      formatResponse = _ref$formatResponse === undefined ? false : _ref$formatResponse,
      _ref$formatParams = _ref.formatParams,
      formatParams = _ref$formatParams === undefined ? false : _ref$formatParams,
      _ref$readOnly = _ref.readOnly,
      readOnly = _ref$readOnly === undefined ? false : _ref$readOnly,
      _ref$bindings = _ref.bindings,
      bindings = _ref$bindings === undefined ? {} : _ref$bindings;

  if (bindings[bindingKey]) {
    throw Error('Neo4jGraphQLServer: The key \'' + bindingKey + '\' is reserved for your local binding.');
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
  var bindingsInfo = processBindings({
    bindings: bindings,
    resolvers: resolvers
  });
  // Merge all schemas
  var merged = (0, _apolloServer.mergeSchemas)({
    schemas: bindingsInfo.schemas
  });
  // Add all bindings to context
  context = setBindingsIntoRequestContext({
    bindings: bindingsInfo.created,
    context: context
  });
  // Setup Apollo Server
  return new _apolloServer.ApolloServer({
    typeDefs: (0, _graphql.printSchema)(merged),
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
};

var processBindings = function processBindings(_ref2) {
  var bindings = _ref2.bindings,
      resolvers = _ref2.resolvers;

  var schemas = [];
  var created = {};
  var schema = {};
  var bindingConfig = {};
  var processedBinding = {};
  var allResolvers = resolvers;
  Object.keys(bindings).forEach(function (bindingKey) {
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
    schema = (0, _apolloServer.makeExecutableSchema)({
      typeDefs: processedBinding.typeDefs
    });
    schemas.push(schema);
  });
  return {
    schemas: schemas,
    resolvers: allResolvers,
    created: created
  };
};
var processBinding = function processBinding(_ref3) {
  var typeDefs = _ref3.typeDefs,
      _ref3$resolvers = _ref3.resolvers,
      resolvers = _ref3$resolvers === undefined ? {} : _ref3$resolvers,
      _ref3$indexConfig = _ref3.indexConfig,
      indexConfig = _ref3$indexConfig === undefined ? {
    use: "cuid"
  } : _ref3$indexConfig,
      _ref3$calls = _ref3.calls,
      calls = _ref3$calls === undefined ? {
    assert: true,
    idl: true
  } : _ref3$calls,
      _ref3$augment = _ref3.augment,
      augment = _ref3$augment === undefined ? {} : _ref3$augment,
      driver = _ref3.driver,
      log = _ref3.log,
      bindingKey = _ref3.bindingKey,
      readOnly = _ref3.readOnly;

  if (typeDefs === undefined) {
    throw Error('Neo4jGraphQLServer: typeDefs are undefined.');
  }
  if (driver === undefined) {
    throw Error('Neo4jGraphQLServer: driver is undefined.');
  }
  if (typeof readOnly !== 'boolean') {
    throw Error('Neo4jGraphQLServer: readOnly must be a Boolean.');
  }
  if (!augment.typeDefs) augment.typeDefs = {};
  if (!augment.resolvers) augment.resolvers = {};
  if (!resolvers.Query) resolvers.Query = {};
  if (!resolvers.Mutation) resolvers.Mutation = {};
  if (readOnly !== true) {
    // IDL
    if (calls === undefined || calls.idl === undefined || calls.idl) {
      (0, _neo4jGraphqlBinding.neo4jIDL)({
        driver: driver,
        typeDefs: typeDefs,
        log: log
      });
    }
    // ASSERT CONSTRAINTS
    if (calls === undefined || calls.assert === undefined || calls.assert) {
      (0, _neo4jGraphqlBinding.neo4jAssertConstraints)({
        driver: driver,
        typeDefs: typeDefs,
        log: log
      });
    }
  }
  // AUGMENT SCHEMA
  var buildQueryTypes = augment.typeDefs && typeof augment.typeDefs.query == "boolean" ? augment.typeDefs.query : true;
  var buildMutationTypes = augment.typeDefs && typeof augment.typeDefs.mutation == "boolean" ? augment.typeDefs.mutation : true;
  var idFields = true;
  // Do not generate mutation types or inject id fields if readOnly
  if (readOnly === true) {
    buildMutationTypes = false;
    idFields = false;
  }
  typeDefs = (0, _neo4jGraphqlBinding.buildNeo4jTypeDefs)({
    typeDefs: typeDefs,
    query: buildQueryTypes,
    mutation: buildMutationTypes,
    idFields: idFields,
    isForRemote: false
  });
  // if(log) logTypeDefsResult(typeDefs);
  if (readOnly === true) indexConfig = false;
  // CREATE BINDING
  var binding = (0, _neo4jGraphqlBinding.neo4jGraphQLBinding)({
    typeDefs: typeDefs,
    driver: driver,
    log: log,
    indexConfig: indexConfig
  });
  var buildQueryResolvers = augment.resolvers && typeof augment.resolvers.query == "boolean" ? augment.resolvers.query : true;
  var buildMutationResolvers = augment.resolvers && typeof augment.resolvers.mutation == "boolean" ? augment.resolvers.mutation : true;
  // Do not generate mutation resolvers if readOnly
  if (readOnly === true) buildMutationResolvers = false;
  if (buildQueryResolvers || buildMutationResolvers) {
    resolvers = (0, _neo4jGraphqlBinding.buildNeo4jResolvers)(_defineProperty({
      bindingKey: bindingKey,
      typeDefs: typeDefs,
      resolvers: resolvers,
      query: buildQueryResolvers,
      mutation: buildMutationResolvers
    }, 'bindingKey', bindingKey));
  }
  return {
    typeDefs: typeDefs,
    resolvers: resolvers,
    binding: binding
  };
};
var setBindingsIntoRequestContext = function setBindingsIntoRequestContext(_ref4) {
  var context = _ref4.context,
      bindings = _ref4.bindings;

  Object.keys(bindings).forEach(function (name) {
    context[name] = bindings[name];
  });
  return context;
};
