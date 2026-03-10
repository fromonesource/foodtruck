import SessionProvider from "@/components/SessionProvider";

export const metadata = {
  title: "TruckSpot - Operator Dashboard",
  description: "Manage your food truck, track GPS, and log sales",
};

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
