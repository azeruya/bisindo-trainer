import Trainer from "./components/Trainer";
import ReferenceRecorder from "./components/ReferenceRecorder";

function App() {
  const isReferenceMode =
    window.location.search.includes(
      "reference"
    );

  return isReferenceMode
    ? <ReferenceRecorder />
    : <Trainer />;
}

export default App;