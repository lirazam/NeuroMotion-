import { useNavigate } from "react-router-dom";

export default function B() {
  let navigate = useNavigate();

  return (
    <div>
      <h1>B</h1>

      <input
        type="button"
        value={"go to home"}
        onClick={() => {
          alert("bye bye");
          navigate("../");
        }}
      /> 
    </div>
  );
}
