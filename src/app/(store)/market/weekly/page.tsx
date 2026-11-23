import { MarketPage } from "../load";

export const metadata = { title: "Weekly Market" };

export default function Page() {
  return <MarketPage mode="WEEKLY" />;
}
