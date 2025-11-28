import { useParams } from "react-router-dom";

const FinalBillTest = () => {
  const { visitId } = useParams<{ visitId: string }>();

  return (
    <div className="p-4">
      <h1>Final Bill Test Page</h1>
      <p>Visit ID: {visitId}</p>
      <p>This is a test page to check if routing works.</p>
    </div>
  );
};

export default FinalBillTest;
