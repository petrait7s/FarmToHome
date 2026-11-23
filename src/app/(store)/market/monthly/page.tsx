import { MarketPage } from "../load";

export const metadata = { title: "Monthly Stock" };

export default function Page() {
  return <MarketPage mode="MONTHLY" />;
}
