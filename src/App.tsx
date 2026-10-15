import {
  useState,
} from "react";

import Landing from "./components/Landing";
import Trainer from "./components/Trainer";

type AppView =
  | "landing"
  | "practice";

export default function App() {
  const [view, setView] =
    useState<AppView>("landing");

  if (view === "landing") {
    return (
      <Landing
        onStart={() =>
          setView("practice")
        }
      />
    );
  }

  return (
    <Trainer
      onBack={() =>
        setView("landing")
      }
    />
  );
}