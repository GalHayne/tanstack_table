import mockNetworkBank from "./mockNetworkBank";
import { NetworkBankTable } from "./NetworkBankTable";

export default function App() {
  return (
    <div style={{ padding: 16 }}>
      <NetworkBankTable data={mockNetworkBank} dense />
    </div>
  );
}