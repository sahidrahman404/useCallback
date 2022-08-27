import {
  fetchPokemon,
  PokemonForm,
  PokemonDataView,
  PokemonInfoFallback,
  PokemonErrorBoundary,
  Pokemon,
} from "./pokemon";
import { useCallback, useEffect, useReducer, useState } from "react";

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

// 🐨 this is going to be our generic asyncReducer
function asyncReducer(_state: State, action: Partial<Action>) {
  switch (action.type) {
    case "pending": {
      // 🐨 replace "pokemon" with "data"
      return { status: "pending", data: null, error: null };
    }
    case "resolved": {
      // 🐨 replace "pokemon" with "data" (in the action too!)
      return { status: "resolved", data: action.data, error: null };
    }
    case "rejected": {
      // 🐨 replace "pokemon" with "data"
      return { status: "rejected", data: null, error: action.error };
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

function useAsync(
  asyncCallback: () => Promise<Pokemon> | undefined,
  initialState: { status: Options }
) {
  const [state, dispatch] = useReducer(asyncReducer, {
    // 🐨 this will need to be "data" instead of "pokemon"
    data: null,
    error: null,
    ...initialState,
  });

  useEffect(() => {
    // 💰 this first early-exit bit is a little tricky, so let me give you a hint:
    // const promise = asyncCallback()
    // if (!promise) {
    //   return
    // }
    // then you can dispatch and handle the promise etc...
    const promise = asyncCallback();
    if (!promise) {
      return;
    }
    dispatch({ type: "pending" });
    promise.then(
      (data: Pokemon) => {
        dispatch({ type: "resolved", data });
      },
      (error: Error) => {
        dispatch({ type: "rejected", error });
      }
    );
    // 🐨 you'll accept dependencies as an array and pass that here.
    // 🐨 because of limitations with ESLint, you'll need to ignore
    // the react-hooks/exhaustive-deps rule. We'll fix this in an extra credit.
  }, [asyncCallback]);
  return state;
}

function PokemonInfo({ pokemonName }: { pokemonName: string }) {
  // 🐨 move all the code between the lines into a new useAsync function.
  // 💰 look below to see how the useAsync hook is supposed to be called
  // 💰 If you want some help, here's the function signature (or delete this
  // comment really quick if you don't want the spoiler)!
  // function useAsync(asyncCallback, dependencies) {/* code in here */}

  // -------------------------- start --------------------------

  // --------------------------- end ---------------------------

  // 🐨 here's how you'll use the new useAsync hook you're writing:
  const asyncCallback = useCallback(() => {
    if (!pokemonName) {
      return;
    }
    return fetchPokemon(pokemonName);
  }, [pokemonName]);

  const state = useAsync(asyncCallback, {
    status: pokemonName ? "pending" : "idle",
  });
  // 🐨 this will change from "pokemon" to "data"
  const { data, status, error } = state;

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
