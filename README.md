# Oktoberfest Trip Gallery

גלריה סטטית לטיול הקבוצתי. המדיה מגיעה דרך וואטסאפ, וג'ארוויס מעדכן את קבצי האתר והמטא־דאטה.

## מה יש כרגע

- עמוד גלריה בעברית ו־RTL.
- אלבומים לפי נושא.
- חיפוש צף דרך FAB.
- פילטרים לפי אלבום, שולח ומצולם.
- מודל נתונים ב־`data/gallery.json`.
- מתאים לפריסה ב־Cloudflare Pages בלי build step.

## Cloudflare Pages

הגדרות מומלצות:

- Framework preset: `None`
- Build command: להשאיר ריק
- Output directory: `/`

## זרימת עבודה למדיה

1. שולחים תמונות/וידאו בקבוצת הוואטסאפ.
2. ג'ארוויס שומר קבצים, יוצר thumbnails וגרסאות web.
3. ג'ארוויס מעדכן את `data/gallery.json`.
4. ג'ארוויס עושה commit ו־push ל־`main`.
5. Cloudflare Pages פורס את האתר.

## פורמט מדיה

```json
{
  "id": "media_20261002_091500_001",
  "type": "image",
  "title": "כותרת קצרה",
  "description": "תיאור קצר לחיפוש",
  "sender": { "displayName": "NadavS" },
  "albumIds": ["album-first-day"],
  "people": ["נדב", "עדן"],
  "tags": ["מינכן", "אוכל"],
  "createdAt": "2026-10-02T09:15:00+03:00",
  "files": {
    "original": "media/original/2026/10/02/file.jpg",
    "web": "media/web/2026/10/02/file.jpg",
    "thumb": "media/thumb/2026/10/02/file.jpg"
  }
}
```

## הערות פרטיות

- לא לשים מספרי טלפון באתר הציבורי.
- תיוג אנשים צריך להיות ידני או מאושר.
- אם עוברים להרבה וידאו, עדיף להעביר מדיה ל־Cloudflare R2 ולהשאיר בגיט רק metadata.
