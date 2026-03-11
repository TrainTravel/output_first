

# Image-to-Task: Upload a picture to add tasks

## How it works

1. User taps a **camera icon** button next to the text input in the Todo List screen
2. File picker opens (accepts images: jpg, png, webp, heic)
3. Image is converted to base64 and sent to a new edge function
4. AI (Gemini 2.5 Flash — supports vision) analyzes the image and either:
   - **Clear case**: Returns extracted task(s) directly → added to the list with AI triage
   - **Unclear case**: Returns a clarifying question → shown in a simple dialog where user types a short answer → re-sent to AI → task extracted

## Changes

### 1. New edge function: `supabase/functions/todo-from-image/index.ts`

- Accepts `{ imageBase64, mimeType, lang, clarification? }` 
- Sends image to Lovable AI Gateway using Gemini 2.5 Flash (vision-capable) with a system prompt:
  - "Extract actionable tasks from this image. If unclear, ask ONE short clarifying question."
- Uses tool-calling to return structured output: `{ tasks: string[] }` or `{ question: string }`
- On clarification follow-up (when `clarification` is provided), re-sends with context to extract the task

### 2. Update `supabase/config.toml`

- Add `[functions.todo-from-image]` with `verify_jwt = false`
- Also add missing `[functions.todo-triage]` entry

### 3. Update `TodoListScreen.tsx`

- Add a camera/image button (using Lucide `Camera` icon) next to the submit button
- Hidden `<input type="file" accept="image/*">` triggered by the button
- New state: `imageProcessing` (boolean), `clarificationQuestion` (string | null), `pendingImageBase64` (string | null)
- On file select: read as base64, show loading state, call `todo-from-image`
- If AI returns tasks → add each via `addItem()` + fire triage for priority
- If AI returns a question → show a small inline dialog below the input with the question and a text field
- On clarification answer → re-call edge function with the answer → extract task

### 4. Clarification UI

Simple inline card below the input area (not a modal — low friction, PDA-safe):
- Shows the AI question in muted text
- Small text input for the answer
- "Add" button to submit, "Skip" to dismiss
- Dismissing clears the pending image state

