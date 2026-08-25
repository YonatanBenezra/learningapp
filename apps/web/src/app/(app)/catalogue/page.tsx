import { CatalogueGrid } from "@/features/catalogue/components/catalogue-grid";

export default function CataloguePage() {
  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Catalogue</h1>
      <CatalogueGrid />
    </main>
  );
}
