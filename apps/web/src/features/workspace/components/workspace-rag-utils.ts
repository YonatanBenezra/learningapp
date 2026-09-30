export function isRagSandboxSchema(schema: unknown) {
  if (!schema || typeof schema !== "object") {
    return false;
  }
  const properties = (schema as { properties?: Record<string, unknown> }).properties;
  if (!properties) {
    return false;
  }
  const keys = Object.keys(properties);
  return keys.length === 1 && keys[0] === "source";
}

export function useRagFigmaWorkspace(
  exercise: { simulator?: string; submissionSchema?: unknown } | null,
  onboarding: boolean,
) {
  return (
    exercise?.simulator === "rag" &&
    !isRagSandboxSchema(exercise.submissionSchema) &&
    !onboarding
  );
}

export function ragEditorTitle(schema: unknown) {
  const keys = Object.keys(
    ((schema as { properties?: Record<string, unknown> })?.properties ?? {}) as Record<
      string,
      unknown
    >,
  );
  if (keys.includes("generationPrompt")) {
    return "Generation prompt";
  }
  if (keys.includes("reranker")) {
    return "Reranker config";
  }
  if (keys.includes("topK")) {
    return "Retriever budget";
  }
  return "Chunking config";
}
