/**
 * Every "log your food" nudge the app can send. The planner deals these out
 * like a shuffled deck, so a message doesn't come back until the rest of its
 * pile has had a turn.
 *
 * `when` says which part of the day a line fits: "any" lines can go anywhere,
 * the rest only land in their own window. `{name}` is swapped for the user's
 * first name; lines that use it are skipped when there's no name.
 */

export type ReminderMoment = 'any' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'comeback';

export interface ReminderMessage {
  id: string;
  when: ReminderMoment;
  title: string;
  body: string;
}

export const REMINDER_MESSAGES: readonly ReminderMessage[] = [
  // Any time of day.
  { id: 'snack-audit', when: 'any', title: '🚨 Snack audit', body: 'Anything gone in your mouth lately? Log it before the evidence disappears.' },
  { id: 'we-saw-that', when: 'any', title: '👀 We saw that', body: 'We didn’t, actually. That’s why you have to log it.' },
  { id: 'one-slice', when: 'any', title: '🍕 Be honest', body: 'Was it one slice or “one slice”? Either way, write it down.' },
  { id: 'clingy-diary', when: 'any', title: '📝 Your food log misses you', body: 'It’s been 90 minutes. It’s getting clingy.' },
  { id: 'detective', when: 'any', title: '🕵️ Calorie detective here', body: 'Just checking in. Any bites, sips or “just a taste” to report?' },
  { id: 'log-oclock', when: 'any', title: '⏰ Ding ding ding', body: 'It’s log o’clock. Ten seconds, then back to your life.' },
  { id: 'drinks-count', when: 'any', title: '🥤 Drinks count too', body: 'That iced coffee was not zero calories. Nice try.' },
  { id: 'receipts', when: 'any', title: '🧾 Future you wants receipts', body: 'Log what you ate so tonight’s number isn’t a wild guess.' },
  { id: 'cookie', when: 'any', title: '🍪 The cookie talked', body: 'It said you’d deny everything. Prove it wrong and log it.' },
  { id: 'brain-dump', when: 'any', title: '🧠 Quick brain dump', body: 'What did you eat? Type it like a text and we’ll do the math.' },
  { id: 'pics', when: 'any', title: '📸 Pics or it didn’t happen', body: 'Snap your plate. We’ll count so you don’t have to.' },
  { id: 'mission', when: 'any', title: '🚀 10-second mission', body: 'Open app. Log food. Feel smug. Go.' },
  { id: 'still-count', when: 'any', title: '🫣 Unlogged calories still count', body: 'Sadly. Might as well know the number.' },
  { id: 'squirrel', when: 'any', title: '🐿️ Squirrel check', body: 'Stashing snacks in your cheeks? Log ’em.' },
  { id: 'main-character', when: 'any', title: '💅 Main character energy', body: 'Main characters track their macros. Probably.' },
  { id: 'lonely-rings', when: 'any', title: '📊 Your rings are lonely', body: 'Feed them some data.' },
  { id: 'deal', when: 'any', title: '🤝 Deal?', body: 'You log it now, we stop nagging for 90 whole minutes.' },
  { id: 'fries', when: 'any', title: '🍟 Fries don’t log themselves', body: 'We asked. They refused.' },
  { id: 'speed-round', when: 'any', title: '⚡ Speed round', body: 'Eaten anything since we last talked? Yes: log it. No: carry on, legend.' },
  { id: 'owl', when: 'any', title: '🦉 Wise owl says', body: 'Those who log now don’t guess later.' },
  { id: 'duty', when: 'any', title: '🫡 Reporting for duty', body: 'Your calorie tracker, checking in. Anything to declare?' },
  { id: 'confession', when: 'any', title: '😇 Confession booth is open', body: 'No judgment. Just macros.' },
  { id: 'urgent', when: 'any', title: '🚨 URGENT (not really)', body: 'But also kind of. Log your last meal before you forget what it was.' },
  { id: 'code-red', when: 'any', title: '🆘 Code red', body: 'Unlogged food detected in the area. Prime suspect: you.' },
  { id: 'crumbs', when: 'any', title: '🔍 We found crumbs', body: 'They lead straight to you. Log it and we’ll call it even.' },
  { id: 'name-hey', when: 'any', title: '👋 Hey {name}', body: 'Whatcha eating? Asking for a friend. The friend is your food log.' },
  { id: 'name-psst', when: 'any', title: '🤫 Psst, {name}', body: 'Your macros called. They’d like an update.' },

  // Mornings.
  { id: 'rise', when: 'morning', title: '🌅 Rise and log', body: 'Breakfast happened? Tell us everything.' },
  { id: 'coffee', when: 'morning', title: '☕ Coffee counts', body: 'Especially the one with four pumps of vanilla.' },
  { id: 'rooster', when: 'morning', title: '🐓 Cock-a-doodle-log', body: 'The early bird logs the breakfast.' },
  { id: 'breakfast-check', when: 'morning', title: '🥣 Breakfast check', body: 'Most important log of the day. Allegedly.' },
  { id: 'name-morning', when: 'morning', title: '🍳 Morning, {name}', body: 'First meal of the day goes in the log. Start strong.' },

  // Around lunch.
  { id: 'lunch-oclock', when: 'midday', title: '🥪 Lunch o’clock', body: 'Whatever’s on that plate, get it in the log.' },
  { id: 'burrito', when: 'midday', title: '🌯 Is that a burrito?', body: 'Build it in the app. Guac is extra here too. Calories, not dollars.' },
  { id: 'half-day', when: 'midday', title: '🍜 Halftime report', body: 'Half the day down. How are those macros looking?' },
  { id: 'salad', when: 'midday', title: '🥗 Lunch report', body: 'Salad or “salad”? Log it.' },

  // The afternoon slump.
  { id: 'three-pm', when: 'afternoon', title: '🍫 Snack attack', body: 'The vending machine saw you. Log it.' },
  { id: 'slump', when: 'afternoon', title: '😴 Afternoon slump?', body: 'Snacks help. Logging them helps more.' },
  { id: 'little-something', when: 'afternoon', title: '🧃 Snack o’clock', body: 'Had a little something? Log a little something.' },
  { id: 'free-sample', when: 'afternoon', title: '🧀 Free samples count', body: 'Free for your wallet. Not for your macros.' },

  // Dinner and after.
  { id: 'dinner-bell', when: 'evening', title: '🍝 Dinner bell', body: 'Log it before the food coma hits.' },
  { id: 'last-call', when: 'evening', title: '🌙 Last call', body: 'Close out today’s log so tomorrow starts clean.' },
  { id: 'dessert', when: 'evening', title: '🍦 Dessert counts', body: 'We know. We’re sorry. Log it anyway.' },
  { id: 'couch', when: 'evening', title: '🛋️ Couch snacks are still snacks', body: 'Log ’em from the couch. We won’t tell.' },
  { id: 'dinner-served', when: 'evening', title: '🍽️ Dinner’s served', body: 'And so is your reminder to log it.' },

  // After a few days away. These are the last ones scheduled, so they only arrive if the app stays closed.
  { id: 'ghosted', when: 'comeback', title: '👻 Did you ghost us?', body: 'Your log’s been empty for days. Come back and we’ll pretend nothing happened.' },
  { id: 'been-a-while', when: 'comeback', title: '🥺 It’s been a while', body: 'No guilt. Open the app, log one thing, and we’re good.' },
];

/** Which window an hour of the day (0 to 23.99) falls in. */
export function momentFor(hour: number): Exclude<ReminderMoment, 'any' | 'comeback'> {
  if (hour < 11) return 'morning';
  if (hour < 14) return 'midday';
  if (hour < 17.5) return 'afternoon';
  return 'evening';
}

/** Fills in `{name}`. Returns null for a line that needs a name when there isn't one. */
export function personalize(message: ReminderMessage, firstName: string | null): { title: string; body: string } | null {
  const needsName = message.title.includes('{name}') || message.body.includes('{name}');
  if (needsName && !firstName) return null;
  const fill = (text: string) => text.replace(/\{name\}/g, firstName ?? '');
  return { title: fill(message.title), body: fill(message.body) };
}
