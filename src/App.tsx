import {
  fetchPokemon,
  PokemonForm,
  PokemonDataView,
  PokemonInfoFallback,
  PokemonErrorBoundary,
  Pokemon,
} from "./pokemon";
import {
  Dispatch,
  Reducer,
  ReducerAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";

type Options = "pending" | "resolved" | "rejected" | "idle";
type State = {
  status: Options | string;
  data: null | Pokemon | undefined;
  error: null | Error | undefined;
};
type Action = {
  type: Options;
  data: null | Pokemon;
  error: null | Error;
};

function useSafeDispatch(dispatch: Dispatch<ReducerAction<Reducer<any, any>>>) {
  const mountedRef = useRef(false);

  useLayoutEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return useCallback(
    ({ ...args }: Partial<Action>) => {
      if (mountedRef.current) dispatch({ ...args });
    },
    [dispatch]
  );
}

function asyncReducer(_state: State, action: Partial<Action>) {
  switch (action.type) {
    case "pending": {
      return { status: "pending", data: null, error: null };
    }
    case "resolved": {
      return { status: "resolved", data: action.data, error: null };
    }
    case "rejected": {
      return { status: "rejected", data: null, error: action.error };
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

function useAsync(initialState: { status: Options }) {
  const [state, unsafeDispatch] = useReducer(asyncReducer, {
    data: null,
    error: null,
    ...initialState,
  });

  const dispatch = useSafeDispatch(unsafeDispatch);

  const run = useCallback((promise: Promise<Pokemon>) => {
    dispatch({ type: "pending" });
    promise.then(
      (data: Pokemon) => {
        dispatch({ type: "resolved", data });
      },
      (error: Error) => {
        dispatch({ type: "rejected", error });
      }
    );
  }, []);

  return { ...state, run };
}

function PokemonInfo({ pokemonName }: { pokemonName: string }) {
  const { data, status, error, run } = useAsync({
    status: pokemonName ? "pending" : "idle",
  });

  useEffect(() => {
    if (!pokemonName) {
      return;
    }

    const pokemonPromise = fetchPokemon(pokemonName);
    run(pokemonPromise);
  }, [pokemonName, run]);

  switch (status) {
    case "idle":
      return <span>Submit a pokemon</span>;
    case "pending":
      return <PokemonInfoFallback name={pokemonName} />;
    case "rejected":
      throw error;
    case "resolved":
      return <PokemonDataView pokemon={data!} />;
    default:
      throw new Error("This should be impossible");
  }
}

function App() {
  const [pokemonName, setPokemonName] = useState("");

  function handleSubmit(newPokemonName: string) {
    setPokemonName(newPokemonName);
  }

  function handleReset() {
    setPokemonName("");
  }

  return (
    <div className="pokemon-info-app">
      <PokemonForm pokemonName={pokemonName} onSubmit={handleSubmit} />
      <hr />
      <div className="pokemon-info">
        <PokemonErrorBoundary onReset={handleReset} resetKeys={[pokemonName]}>
          <PokemonInfo pokemonName={pokemonName} />
        </PokemonErrorBoundary>
      </div>
    </div>
  );
}

function AppWithUnmountCheckbox() {
  const [mountApp, setMountApp] = useState(true);
  return (
    <div>
      <label className="center">
        <input
          type="checkbox"
          checked={mountApp}
          onChange={(e) => setMountApp(e.target.checked)}
        />{" "}
        Mount Component
      </label>
      <hr />
      {mountApp ? <App /> : null}
    </div>
  );
}

export default AppWithUnmountCheckbox;
