// minimal stub for "algoliasearch" default export
export default function algoliasearch(..._args: any[]) {
  return {
    // what <InstantSearch> expects on the client
    search: async (_requests?: any) => ({ results: [] }),

    // what server-side indexers sometimes call
    initIndex: (_indexName?: string) => ({
      search: async (_query?: string, _opts?: any) => ({ hits: [] }),
      saveObjects: async (_objects?: any[]) => ({ objectIDs: [] }),
    }),
  } as any;
}


