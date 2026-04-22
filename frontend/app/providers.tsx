"use client";

import { Amplify } from "aws-amplify";

Amplify.configure(
  {
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
        userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
      },
    },
  },
  {
    ssr: true, // enables server-side rendering support for Amplify Auth. This is important for Next.js apps to ensure that authentication state is properly handled during server-side rendering and hydration on the client side. With ssr: true, Amplify will correctly manage authentication state across both server and client environments, preventing issues with mismatched states during the initial render.
  },
);

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
