interface Property {
  name: string;
  description: string | null;
  data_type: string;
  index_filterable: boolean;
  index_range_filters: boolean;
  index_searchable: boolean;
  nested_properties: null;
  tokenization: string | null;
  vectorizer_config: null;
  vectorizer: string;
}

interface VectorizerConfig {
  vectorizer: string;
  model: {
    poolingStrategy: string;
    vectorizeClassName: boolean;
  };
  source_properties: null;
}

interface VectorIndexConfig {
  quantizer: null;
  cleanup_interval_seconds: number;
  distance_metric: string;
  dynamic_ef_min: number;
  dynamic_ef_max: number;
  dynamic_ef_factor: number;
  ef: number;
  ef_construction: number;
  filter_strategy: string;
  flat_search_cutoff: number;
  max_connections: number;
  skip: boolean;
  vector_cache_max_objects: number;
}

interface VectorConfig {
  [key: string]: {
    vectorizer: VectorizerConfig;
    vector_index_config: VectorIndexConfig;
  };
}

interface Collection {
  name: string;
  description: string | null;
  generative_config: null;
  properties: Property[];
  references: any[];
  reranker_config: null;
  vectorizer_config: null;
  vectorizer: null;
  vector_config: VectorConfig;
  last_update_time_unix?: number;
}

interface Collections {
  [key: string]: Collection;
}

export type {
  Property,
  VectorizerConfig,
  VectorIndexConfig,
  VectorConfig,
  Collection,
  Collections,
};
