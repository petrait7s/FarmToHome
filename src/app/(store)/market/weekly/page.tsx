import { MarketPage } from "../load";

export const metadata = { title: "Weekly Market" };

export default async function Page({ searchParams }: { searchParams: Promise<{ people?: string }> }) {
  const { people } = await searchParams;
  return <MarketPage mode="WEEKLY" people={people} />;
}
