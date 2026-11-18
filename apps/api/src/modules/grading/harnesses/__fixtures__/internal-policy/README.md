# Engine test fixtures: the shared policy corpus

Question sets that the RAG engine unit tests (`r2`, `r3`, `r4` and sandbox
grader specs) run against `content/corpora/internal-policy.json`. They are the
hidden and public sets of the original clone exercises (`rag-002`,
`rag-003-the-citation-contract`, `rag-004`, `rag-009`) before those were
rebuilt on their own corpora, kept here so the engine tests do not change
when exercise content does. They are never served to learners.
