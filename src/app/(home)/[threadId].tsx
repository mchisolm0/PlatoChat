import { Redirect, useLocalSearchParams } from "expo-router"

import { Screen } from "@/components/Screen"
import { ThreadView } from "@/components/ThreadView"

export default function ChatScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>()
  if (!threadId || threadId === "chat" || threadId.length < 10) {
    return <Redirect href={"/"} />
  }

  return (
    <Screen preset="fixed" contentContainerStyle={{ flex: 1 }}>
      <ThreadView threadId={threadId} />
    </Screen>
  )
}
