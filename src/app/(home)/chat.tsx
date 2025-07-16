
import { useState } from 'react';
import { Screen } from '@/components/Screen';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { ThreadView } from '@/components/ThreadView';

export default function ChatScreen() {
  const createThread = useMutation(api.chat.createThread)
  const [threadId, setThreadId] = useState<string | null>(null)

  return (
    <Screen preset="fixed" contentContainerStyle={{ flex: 1, justifyContent: "space-between" }} safeAreaEdges={["top"]}>
      {threadId ? (
        <ThreadView threadId={threadId} />
      ) : (
        <Button onPress={() => createThread().then((threadId) => setThreadId(threadId))}>
          Create Thread
        </Button>
      )}
    </Screen>
  );
}

