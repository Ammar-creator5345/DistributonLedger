import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getCreditBook } from "@/lib/credit-book-service";
import { CreditBookClient } from "@/components/credit-book/credit-book-client";

export const metadata: Metadata = {
  title: "Credit Book",
};

export default async function CreditBookPage() {
  await connectToDatabase();
  const [settings, people] = await Promise.all([getSettings(), getCreditBook()]);

  return <CreditBookClient currency={settings.currency} initialPeople={people} />;
}
