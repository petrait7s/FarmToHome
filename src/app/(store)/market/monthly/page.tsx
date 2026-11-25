import { MarketPage } from "../load";

export const metadata = { title: "Monthly Stock" };

export default async function Page({ searchParams }: { searchParams: Promise<{ people?: string }> }) {
  const { people } = await searchParams;
  return <MarketPage mode="MONTHLY" people={people} />;
}
