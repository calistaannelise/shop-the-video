"use client";
import Link from "next/link";
import CartDrawer from "@/components/CartDrawer";
import ItemCard from "@/components/ItemCard";
import { useStore } from "@/lib/store";

export default function ResultsPage() {
  const { extraction } = useStore();

  if (!extraction) {
    return (
      <main className="p-8">
        <Link href="/" className="underline">Upload a screenshot first</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 grid gap-8 md:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-10">
        {extraction.items.map((item) => (
          <ItemCard key={item.id} item={item} imageId={extraction.image_id} />
        ))}
      </div>
      <div className="md:sticky md:top-8 h-fit">
        <CartDrawer />
      </div>
    </main>
  );
}
