"use client"

import { ConvexProvider, ConvexReactClient } from "convex/react"

const convex = new ConvexReactClient("http://127.0.0.1:3210")

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  )
}