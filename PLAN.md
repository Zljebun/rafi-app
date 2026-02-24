# RAFI - AI Licni Asistent | Plan Projekta

## Kontekst
Gradimo RAFI - AI asistenta za Android (zatim iOS) koji organizuje obaveze, uci korisnicke rutine, daje savjete i optimizuje vrijeme.

## Tech Stack
- **Frontend:** React Native + Expo (TypeScript)
- **AI:** Claude API (Anthropic) sa tool use
- **Storage:** SQLite (lokalno) + opcioni cloud backup
- **Voice:** Expo Speech / React Native Voice
- **Dev Environment:** GitHub Codespaces

---

## Faza 1: Inicijalizacija projekta (DONE)
- GitHub repo, Expo projekat, folder struktura

## Faza 2: Core UI (MVP)
- Chat interfejs (tekst + voice input)
- MessageBubble, ChatInput komponente
- Tab navigacija: Chat, Obaveze, Uvidi

## Faza 3: AI Agent Backend
- Claude API sa tool use
- System prompt za RAFI licnog asistenta
- Agent Tools: create_task, list_tasks, set_reminder, read_calendar, create_event, read_contacts, get_routine_info, suggest_optimization

## Faza 4: Phone Integracije
- Kalendar (expo-calendar)
- Notifikacije (expo-notifications)
- Kontakti (opciono)

## Faza 5: Ucenje rutina i optimizacija
- Routine Learning - prepoznavanje obrazaca
- Time Optimization - analiza rasporeda
- Proaktivni prijedlozi

## Faza 6: Cloud Backup + Polish
- Cloud sync (Supabase/Firebase)
- Onboarding, postavke, offline rezim

---

## Redoslijed implementacije

| Korak | Opis                                   | Prioritet | Status |
|-------|----------------------------------------|-----------|--------|
| 1     | GitHub repo + Expo init                | P0        | DONE   |
| 2     | Chat UI (tekst input + prikaz poruka)  | P0        | DONE   |
| 3     | Claude API integracija (basic chat)    | P0        | DONE   |
| 4     | Voice input (speech-to-text)           | P0        | DONE   |
| 5     | SQLite + task management               | P0        | DONE   |
| 6     | Agent tools (create/list tasks)        | P1        | DONE   |
| 7     | Kalendar integracija                   | P1        | DONE   |
| 8     | Notifikacije/podsjetnici               | P1        | DONE   |
| 9     | Routine learning                       | P2        | DONE   |
| 10    | Time optimization                      | P2        | DONE   |
| 11    | Cloud backup                           | P3        | TODO   |
| 12    | iOS build + testiranje                 | P3        | TODO   |

## Verifikacija
- E2E: Reci "RAFI, podsjeti me sutra u 9 da pozovem Marka" -> task kreiran + notifikacija zakazana
