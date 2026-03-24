

# Blocker: Redeploy `french-chat` Edge Function

## Issue
The `french-chat` edge function is still returning a 500 error (`Cannot access 'userContextBlock' before initialization`). The code on disk is correct, but the **deployed version is stale** — the previous fix was not deployed.

## Fix
Redeploy the `french-chat` edge function. No code changes needed — just a deployment.

## After deployment — manual test plan for Expressive Writing flow

1. Home → More tools → **Free Write**
2. Verify `FreeWriteChoiceScreen` shows two options
3. Choose **Expressive Writing**
4. Verify the safety intro appears for ~5 seconds
5. Write some text, then tap **Finish early**
6. Verify the **self-care card** appears with session counter and 10-second delay
7. Tap **Continue** → verify the **AI Feedback screen** loads (this is the step currently blocked by the 500)
8. Continue through Emotions → Reflection → Gratitude → Complete

