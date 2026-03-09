import CustomerCardClient from "./ui";

export default async function Page({
  params,
}: {
  params: Promise<{ phone: string }> | { phone: string };
}) {
  const p: any = await Promise.resolve(params as any);
  const phone = decodeURIComponent(p?.phone || "");
  return <CustomerCardClient phone={phone} />;
}