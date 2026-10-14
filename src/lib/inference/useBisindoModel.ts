import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  BisindoModel,
  Prediction,
} from "./types";

import {
  loadBisindoModel,
} from "./loadModel";

import {
  predictBisindo,
} from "./mlp";

export function useBisindoModel() {
  const modelRef =
    useRef<BisindoModel | null>(null);

  const [isReady, setIsReady] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        console.log("Starting model load...");

        const model =
          await loadBisindoModel();

        if (cancelled) {
          return;
        }

        modelRef.current = model;

        console.log("Model ready");

        setIsReady(true);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "MODEL LOAD ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load model"
        );
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const predict = useCallback(
    (
      features: number[]
    ): Prediction | null => {
      const model =
        modelRef.current;

      if (!model) {
        return null;
      }

      return predictBisindo(
        features,
        model
      );
    },
    []
  );

  return {
    isReady,
    error,
    predict,
  };
}