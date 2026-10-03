import { SimulationsView } from "@/features/simulations/components/simulations-view";
import "@/features/simulations/simulations.css";

export const metadata = {
  title: "Simulators",
  description: "Guardrails and RAG practice simulators — graded, level-based, contest-ready.",
};

export default function SimulationsPage() {
  return (
    <div className="lp-page lp-page-simulations">
      <SimulationsView />
    </div>
  );
}
