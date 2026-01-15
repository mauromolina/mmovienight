export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The new auth page handles its own layout
  return <>{children}</>
}
